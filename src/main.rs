use poise::serenity_prelude as serenity;
use rand::Rng;
use tracing::{info, error};

pub struct Data {} // User data, which is stored and accessible in all command invocations
type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

/// 顯示關於 TrustMeBro 的信息
#[poise::command(slash_command, prefix_command)]
async fn help(ctx: Context<'_>) -> Result<(), Error> {
    ctx.say("TrustMeBro Capital: Financial advice not included. Refund not available.").await?;
    Ok(())
}

/// 獲取一個極其專業的（隨機）交易信號
#[poise::command(slash_command, prefix_command)]
async fn signal(
    ctx: Context<'_>, 
    #[description = "The asset to analyze (e.g. BTC, TSLA)"] asset: String
) -> Result<(), Error> {
    // Generate random values in a block to ensure rng is dropped before await
    let (choice, leverage) = {
        let directions = ["LONG 🚀", "SHORT 📉", "HODL 💎", "PANIC SELL 🔥"];
        let mut rng = rand::thread_rng();
        (
            directions[rng.gen_range(0..directions.len())],
            rng.gen_range(1..=125)
        )
    };
    
    let response = format!(
        "**Analyst Report for ${}**\n\
        Source: *Trust Me Bro*\n\
        Signal: **{}**\n\
        Recommended Leverage: **{}x**\n\
        Confidence: **100%** (Margin of error: +/- 100%)",
        asset.to_uppercase(), choice, leverage
    );
    
    ctx.say(response).await?;
    Ok(())
}

/// 驗證我們的內幕消息來源
#[poise::command(slash_command, prefix_command)]
async fn verify(ctx: Context<'_>) -> Result<(), Error> {
    let excuse = {
        let excuses = [
            "My uncle works at Bitcoin.",
            "I saw it in a dream.",
            "The tea leaves said so.",
            "An Uber driver told me.",
            "ChatGPT hallucinated it."
        ];
        let mut rng = rand::thread_rng();
        excuses[rng.gen_range(0..excuses.len())]
    };
    
    ctx.say(format!("✅ Source Verified: *{}*", excuse)).await?;
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
    let intents = serenity::GatewayIntents::non_privileged();

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![help(), signal(), verify()],
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                info!("TrustMeBro Bot is online and ready to lose money!");
                Ok(Data {})
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
