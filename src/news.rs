use poise::serenity_prelude as serenity;
use serde::Deserialize;
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing::{error, info};
use chrono::{DateTime, Utc};

#[derive(Debug, Deserialize, Clone)]
struct NewsArticle {
    title: String,
    url: String,
    description: Option<String>,
    #[serde(rename = "publishedDate")]
    published_date: DateTime<Utc>,
    tags: Vec<String>,
    tickers: Vec<String>,
    source: String,
}

#[derive(Debug, Deserialize)]
struct NewsResponse(Vec<NewsArticle>);

pub async fn monitor_news(
    http: Arc<serenity::Http>, 
    api_key: String, 
    channel_id: u64,
    tickers: Option<Vec<String>>
) {
    let mut last_seen_time = Utc::now() - chrono::Duration::hours(1); // Start checking from 1 hour ago
    let channel = serenity::ChannelId::new(channel_id);
    let client = reqwest::Client::new();

    let ticker_log = tickers.clone().map(|t| t.join(", ")).unwrap_or_else(|| "All".to_string());
    info!("Starting news monitor for channel {} (Tickers: {})...", channel_id, ticker_log);

    loop {
        match fetch_news(&client, &api_key, &tickers).await {
            Ok(articles) => {
                // Filter for new articles and sort them by date (oldest first) to send in order
                let mut new_articles: Vec<NewsArticle> = articles
                    .into_iter()
                    .filter(|a| a.published_date > last_seen_time)
                    .collect();
                
                // Sort by date ascending so we post in chronological order
                new_articles.sort_by_key(|a| a.published_date);

                for article in new_articles {
                    if let Err(e) = send_news_to_discord(&http, channel, &article).await {
                        error!("Failed to send news to Discord: {:?}", e);
                    } else {
                        // Update last_seen_time to this article's time
                        if article.published_date > last_seen_time {
                            last_seen_time = article.published_date;
                        }
                    }
                    // Small delay to avoid rate limits if there are many articles
                    time::sleep(Duration::from_millis(500)).await;
                }
            }
            Err(e) => {
                error!("Error fetching news from Tiingo: {:?}", e);
            }
        }

        // Wait for 60 seconds before next check
        time::sleep(Duration::from_secs(60)).await;
    }
}

async fn fetch_news(
    client: &reqwest::Client, 
    api_key: &str, 
    tickers: &Option<Vec<String>>
) -> Result<Vec<NewsArticle>, Box<dyn std::error::Error + Send + Sync>> {
    let mut url = format!("https://api.tiingo.com/tiingo/news?token={}&limit=50", api_key);
    
    if let Some(t) = tickers {
        if !t.is_empty() {
            url.push_str(&format!("&tickers={}", t.join(",")));
        }
    }

    let response = client
        .get(&url)
        .header("Content-Type", "application/json")
        .send()
        .await?;

    let response_text = response.text().await?;
    
    // Attempt to parse as a list of articles
    match serde_json::from_str::<Vec<NewsArticle>>(&response_text) {
        Ok(articles) => Ok(articles),
        Err(e) => {
            // If parsing as array fails, it might be an error object or empty
            error!("Failed to parse Tiingo response: {}. Raw response: {}", e, response_text);
            
            if let Ok(error_map) = serde_json::from_str::<serde_json::Value>(&response_text) {
                if let Some(detail) = error_map.get("detail") {
                    error!("Tiingo API Error Detail: {}", detail);
                }
            }
            Err(Box::new(e))
        }
    }
}

async fn send_news_to_discord(
    http: &Arc<serenity::Http>,
    channel: serenity::ChannelId,
    article: &NewsArticle,
) -> Result<(), serenity::Error> {
    let tickers_str = if !article.tickers.is_empty() {
        article.tickers.join(", ")
    } else {
        "General".to_string()
    };

    let description = article.description.clone().unwrap_or_else(|| "No description available.".to_string());
    
    // Create a rich embed
    let embed = serenity::CreateEmbed::new()
        .title(&article.title)
        .url(&article.url)
        .description(description)
        .color(0x00ff00) // Green
        .field("Tickers", tickers_str, true)
        .field("Source", &article.source, true)
        .footer(serenity::CreateEmbedFooter::new(
            format!("Published: {}", article.published_date.format("%Y-%m-%d %H:%M:%S UTC"))
        ));

    let message = serenity::CreateMessage::new().embed(embed);

    channel.send_message(http, message).await?;
    info!("Sent news: {}", article.title);
    Ok(())
}
