use serde::Deserialize;
use reqwest::Client;
use std::error::Error;

use tracing::{error, warn};

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)] // Tiingo API fields
#[allow(dead_code)]      // Fields used for deserialization mapping but not logic
pub struct StockPrice {
    pub ticker: String,
    pub last: Option<f64>, 
    pub tms: Option<String>, 
    pub open: Option<f64>,
    pub high: Option<f64>,
    pub low: Option<f64>,
    pub prevClose: Option<f64>,
    // Extended Hours Fields
    pub askPrice: Option<f64>,  // Real-time ask (extended hours)
    pub bidPrice: Option<f64>,  // Real-time bid (extended hours)
    pub mid: Option<f64>,       // Mid price (often good proxy if last is stale)
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)] // Tiingo API fields
#[allow(dead_code)]      // Fields used for deserialization mapping but not logic
pub struct CryptoPrice {
    pub ticker: String,
    pub lastPrice: Option<f64>, // Changed to Option
    pub quoteTimestamp: Option<String>,
}

// Unified struct for our bot to use
#[derive(Debug)]
#[allow(dead_code)] // Fields populated but not all are strictly read in current commands
pub struct AssetPrice {
    pub ticker: String,
    pub price: f64,
    pub prev_close: Option<f64>, // For calculating % change
    pub is_crypto: bool,
}

pub async fn get_price(client: &Client, api_key: &str, ticker: &str) -> Result<AssetPrice, Box<dyn Error + Send + Sync>> {
    // Attempt IEX (Stock) first as it's common
    let iex_url = format!("https://api.tiingo.com/iex/?tickers={}&token={}", ticker, api_key);
    let iex_res = client.get(&iex_url).send().await?;
    
    if iex_res.status().is_success() {
        let text = iex_res.text().await?;
        match serde_json::from_str::<Vec<StockPrice>>(&text) {
            Ok(prices) => {
                if let Some(p) = prices.first() {
                    // Prefer 'last', fallback to 'mid', 'askPrice' (if reasonable), 'prevClose', then 'open'
                    // In extended hours, last might be stale, so mid/ask/bid are useful.
                    let mut price = p.last;
                    
                    // If last is missing, try mid
                    if price.is_none() {
                        price = p.mid;
                    }
                    
                    // If still missing, try ask (often indicates current liquidity)
                    if price.is_none() {
                        price = p.askPrice;
                    }

                    // Fallback to previous close or open
                    if price.is_none() {
                        price = p.prevClose.or(p.open);
                    }
                    
                    if let Some(current_price) = price {
                        return Ok(AssetPrice {
                            ticker: p.ticker.clone(),
                            price: current_price,
                            prev_close: p.prevClose,
                            is_crypto: false,
                        });
                    } else {
                        warn!("IEX response for {} had no valid price fields. Data: {:?}", ticker, p);
                    }
                } else {
                    // Empty array means ticker might not be supported on IEX or invalid
                    // Don't error yet, try Crypto
                }
            },
            Err(e) => {
                error!("Failed to parse IEX response for {}: {}. Raw text: {}", ticker, e, text);
            }
        }
    } else {
        error!("IEX API Error for {}: Status {}", ticker, iex_res.status());
    }

    // Fallback to Crypto
    let crypto_url = format!("https://api.tiingo.com/tiingo/crypto/top?tickers={}&token={}", ticker, api_key);
    let crypto_res = client.get(&crypto_url).send().await?;
    
    if crypto_res.status().is_success() {
        let text = crypto_res.text().await?;
        // Crypto returns array: [{"ticker":"btcusd", "lastPrice": ...}]
        match serde_json::from_str::<Vec<CryptoPrice>>(&text) {
            Ok(prices) => {
                if let Some(p) = prices.first() {
                    if let Some(price) = p.lastPrice {
                        return Ok(AssetPrice {
                            ticker: p.ticker.clone(),
                            price: price,
                            prev_close: None, 
                            is_crypto: true,
                        });
                    } else {
                        warn!("Crypto response for {} had no lastPrice. Data: {:?}", ticker, p);
                    }
                }
            },
            Err(e) => {
                // Only log error if IEX also failed/was empty, effectively meaning we couldn't find it anywhere
                error!("Failed to parse Crypto response for {}: {}. Raw text: {}", ticker, e, text);
            }
        }
    }

    Err(format!("Could not find price for {}", ticker).into())
}

#[derive(Debug, Deserialize, serde::Serialize)]
pub struct HistoricalData {
    pub date: String,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: Option<f64>,
}

pub async fn get_historical_data(client: &Client, api_key: &str, ticker: &str) -> Result<Vec<HistoricalData>, Box<dyn Error + Send + Sync>> {
    // Defaults to 1 year or YTD usually, we'll ask for last 3 months
    // For simplicity, we use the daily endpoint.
    // Note: Crypto uses different endpoint for historical.
    
    // Try Stock History
    let stock_url = format!("https://api.tiingo.com/tiingo/daily/{}/prices?startDate=2024-01-01&token={}", ticker, api_key);
    let res = client.get(&stock_url).send().await?;
    
    if res.status().is_success() {
        let text = res.text().await?;
        if let Ok(data) = serde_json::from_str::<Vec<HistoricalData>>(&text) {
            if !data.is_empty() {
                return Ok(data);
            }
        }
    }

    // Try Crypto History
    let crypto_url = format!("https://api.tiingo.com/tiingo/crypto/prices?tickers={}&startDate=2024-01-01&resampleFreq=1day&token={}", ticker, api_key);
    let res = client.get(&crypto_url).send().await?;
    
    if res.status().is_success() {
        let text = res.text().await?;
        // Crypto format is slightly different usually, it returns a nested structure
        // [{"ticker": "btcusd", "priceData": [...]}]
        #[derive(Deserialize)]
        struct CryptoHistoryResponse {
            #[serde(rename = "priceData")]
            price_data: Vec<HistoricalData>
        }
        
        if let Ok(wrapper) = serde_json::from_str::<Vec<CryptoHistoryResponse>>(&text) {
            if let Some(first) = wrapper.first() {
                return Ok(serde_json::from_value(serde_json::to_value(&first.price_data)?)?);
            }
        }
    }

    Err(format!("Could not find historical data for {}", ticker).into())
}
