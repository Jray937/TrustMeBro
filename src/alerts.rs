use poise::serenity_prelude as serenity;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time;
use tracing::{error, info};
use crate::market;

#[derive(Debug, Clone)]
pub struct Alert {
    pub user_id: serenity::UserId,
    pub channel_id: serenity::ChannelId,
    pub ticker: String,
    pub target_price: f64,
    pub condition: AlertCondition, // "above" or "below"
}

#[derive(Debug, Clone, PartialEq)]
pub enum AlertCondition {
    Above,
    Below,
}

pub async fn monitor_alerts(
    http: Arc<serenity::Http>,
    api_key: String,
    alerts: Arc<Mutex<Vec<Alert>>>,
) {
    let client = reqwest::Client::new();
    info!("Starting price alert monitor...");

    loop {
        // Clone alerts to release lock quickly
        let current_alerts: Vec<Alert> = {
            let guard = alerts.lock().unwrap();
            guard.clone()
        };

        if current_alerts.is_empty() {
            time::sleep(Duration::from_secs(60)).await;
            continue;
        }

        let mut alerts_to_remove: Vec<usize> = Vec::new();

        // Check each alert
        for (index, alert) in current_alerts.iter().enumerate() {
            match market::get_price(&client, &api_key, &alert.ticker).await {
                Ok(asset) => {
                    let triggered = match alert.condition {
                        AlertCondition::Above => asset.price >= alert.target_price,
                        AlertCondition::Below => asset.price <= alert.target_price,
                    };

                    if triggered {
                        let direction = match alert.condition {
                            AlertCondition::Above => "rose above",
                            AlertCondition::Below => "dropped below",
                        };

                        let msg = format!(
                            "🚨 **Price Alert!** <@{}>\n**{}** has {} **${:.2}**!\nCurrent Price: **${:.2}**",
                            alert.user_id,
                            alert.ticker.to_uppercase(),
                            direction,
                            alert.target_price,
                            asset.price
                        );

                        if let Err(e) = alert.channel_id.say(&http, msg).await {
                            error!("Failed to send alert to user: {:?}", e);
                        } else {
                            info!("Alert triggered for {} at {}", alert.ticker, asset.price);
                            alerts_to_remove.push(index);
                        }
                    }
                }
                Err(e) => {
                    error!("Error checking price for alert ({}): {}", alert.ticker, e);
                }
            }
            // Avoid rate limits
            time::sleep(Duration::from_millis(200)).await;
        }

        // Remove triggered alerts
        if !alerts_to_remove.is_empty() {
            let mut guard = alerts.lock().unwrap();
            // Remove in reverse order to keep indices valid
            alerts_to_remove.sort_unstable_by(|a, b| b.cmp(a));
            for i in alerts_to_remove {
                if i < guard.len() {
                    guard.remove(i);
                }
            }
        }

        // Check every 60 seconds
        time::sleep(Duration::from_secs(60)).await;
    }
}
