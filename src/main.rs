mod news;
mod market;
mod charts;
mod alerts;

use poise::serenity_prelude as serenity;
use tracing::{info, error};
use std::sync::{Arc, Mutex};
use alerts::{Alert, AlertCondition};

pub struct Data {
    tiingo_key: String,
    alerts: Arc<Mutex<Vec<Alert>>>,
}

type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

/// Get the current price of an asset
#[poise::command(slash_command, prefix_command)]
async fn price(
    ctx: Context<'_>,
    #[description = "Ticker symbol (e.g. AAPL, btcusd)"] ticker: String,
) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let api_key = &ctx.data().tiingo_key;
    
    ctx.defer().await?;

    match market::get_price(&client, api_key, &ticker).await {
        Ok(asset) => {
            let color = if let Some(prev) = asset.prev_close {
                if asset.price >= prev { 0x00ff00 } else { 0xff0000 }
            } else {
                0x7289da 
            };

            let percent_str = if let Some(prev) = asset.prev_close {
                let change = ((asset.price - prev) / prev) * 100.0;
                format!("{:.2}%", change)
            } else {
                "N/A".to_string()
            };

            let embed = serenity::CreateEmbed::new()
                .title(format!("Price of {}", asset.ticker.to_uppercase()))
                .color(color)
                .field("Price", format!("${:.2}", asset.price), true)
                .field("24h Change", percent_str, true)
                .footer(serenity::CreateEmbedFooter::new("Data provided by Tiingo"));
            
            ctx.send(poise::CreateReply::default().embed(embed)).await?;
        },
        Err(e) => {
            ctx.say(format!("Error fetching price for {}: {}", ticker, e)).await?;
        }
    }
    Ok(())
}

/// Generate a price chart for an asset
#[poise::command(slash_command, prefix_command)]
async fn chart(
    ctx: Context<'_>,
    #[description = "Ticker symbol (e.g. AAPL, btcusd)"] ticker: String,
) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let api_key = &ctx.data().tiingo_key;
    
    ctx.defer().await?;

    match market::get_historical_data(&client, api_key, &ticker).await {
        Ok(data) => {
             match charts::generate_chart(&ticker, &data) {
                 Ok(path) => {
                     let attachment = serenity::CreateAttachment::path(&path).await?;
                     ctx.send(poise::CreateReply::default().attachment(attachment)).await?;
                 },
                 Err(e) => {
                     ctx.say(format!("Failed to generate chart: {}", e)).await?;
                 }
             }
        },
        Err(e) => {
            ctx.say(format!("Could not fetch history for {}: {}", ticker, e)).await?;
        }
    }
    Ok(())
}

/// Set a price alert
#[poise::command(slash_command, prefix_command)]
async fn alert(
    ctx: Context<'_>,
    #[description = "Ticker symbol (e.g. AAPL)"] ticker: String,
    #[description = "Target price"] price: f64,
) -> Result<(), Error> {
    let client = reqwest::Client::new();
    let api_key = &ctx.data().tiingo_key;
    
    // Check current price to determine condition (Above/Below)
    let current_price = match market::get_price(&client, api_key, &ticker).await {
        Ok(asset) => asset.price,
        Err(_) => {
            ctx.say(format!("Could not find ticker '{}' to set alert.", ticker)).await?;
            return Ok(());
        }
    };

    let condition = if price > current_price {
        AlertCondition::Above
    } else {
        AlertCondition::Below
    };

    let new_alert = Alert {
        user_id: ctx.author().id,
        channel_id: ctx.channel_id(),
        ticker: ticker.clone(),
        target_price: price,
        condition: condition.clone(),
    };

    {
        let mut alerts = ctx.data().alerts.lock().unwrap();
        alerts.push(new_alert);
    }

    let direction = match condition {
        AlertCondition::Above => "rises above",
        AlertCondition::Below => "drops below",
    };

    ctx.say(format!(
        "🔔 Alert set for **{}**. I'll ping you when it {} **${:.2}** (Current: ${:.2})", 
        ticker.to_uppercase(), direction, price, current_price
    )).await?;

    Ok(())
}

/// 顯示關於 TrustMeBro 的信息
#[poise::command(slash_command, prefix_command)]
async fn help(ctx: Context<'_>) -> Result<(), Error> {
    ctx.say(
        "TrustMeBro Bot commands:\n\
        - /price <ticker>: current price via Tiingo\n\
        - /chart <ticker>: latest price chart\n\
        - /alert <ticker> <price>: set a price alert\n\
        News updates are posted automatically to the configured channel.",
    )
    .await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    // 初始化日誌
    tracing_subscriber::fmt::init();
    
    // 加載環境變量
    if let Err(e) = dotenv::dotenv() {
        info!("No .env file found, using environment variables directly. ({})", e);
    }

    let token = std::env::var("DISCORD_TOKEN").expect("missing DISCORD_TOKEN");
    let tiingo_key = std::env::var("TIINGO_API_KEY").expect("missing TIINGO_API_KEY");
    let news_channel_id = std::env::var("NEWS_CHANNEL_ID")
        .expect("missing NEWS_CHANNEL_ID")
        .parse::<u64>()
        .expect("NEWS_CHANNEL_ID must be a valid number");

    // Initialize alerts storage
    let alerts = Arc::new(Mutex::new(Vec::<Alert>::new()));

    let intents = serenity::GatewayIntents::non_privileged();

    // Clone for the closure
    let alerts_for_setup = alerts.clone();
        let tiingo_key_for_setup = tiingo_key.clone();

        let framework = poise::Framework::builder()
            .options(poise::FrameworkOptions {
                commands: vec![help(), price(), chart(), alert()],
            ..Default::default()
        })
        .setup(move |ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                info!("TrustMeBro Bot is online and ready to lose money!");
                
                // Spawn the background news monitor
                let http = ctx.http.clone();
                let key_for_news = tiingo_key.clone();
                
                // Monitor specific tags for broad market coverage
                // Covers: Precious Metals, US Bonds, US Stocks, Japan, Korea, Emerging Markets, Crypto
                let tags = Some(vec![
                    "minerals".to_string(), "metals".to_string(), "gold".to_string(), "silver".to_string(), // Precious Metals
                    "bonds".to_string(), "treasury".to_string(), "interest rates".to_string(), // US Bonds/Rates
                    "US".to_string(), "equity".to_string(), "stocks".to_string(), // US Stocks/General Equities
                    "Japan".to_string(), "South Korea".to_string(), // Specific Countries
                    "emerging markets".to_string(), // Emerging Markets
                    "crypto".to_string(), "cryptocurrency".to_string(), "bitcoin".to_string() // Crypto
                ]);
                let tickers = None; // Don't filter by specific tickers to get broader news based on tags

                tokio::spawn(async move {
                    news::monitor_news(http, key_for_news, news_channel_id, tickers, tags).await;
                });

                // Spawn the background alert monitor
                let http_for_alerts = ctx.http.clone();
                let key_for_alerts = tiingo_key.clone();
                let alerts_for_monitor = alerts.clone();
                tokio::spawn(async move {
                    alerts::monitor_alerts(http_for_alerts, key_for_alerts, alerts_for_monitor).await;
                });

                Ok(Data { 
                    tiingo_key: tiingo_key_for_setup,
                    alerts: alerts_for_setup
                })
            })
        })
        .build();

    let client = serenity::ClientBuilder::new(token, intents)
        .framework(framework)
        .await;

    match client {
        Ok(mut client) => {
            if let Err(e) = client.start().await {
                error!("Client error: {:?}", e);
            }
        }
        Err(e) => {
            error!("Error creating client: {:?}", e);
        }
    }
}
