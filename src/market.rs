use serde::Deserialize;
use reqwest::Client;
use std::error::Error;

#[derive(Debug, Deserialize)]
pub struct StockPrice {
    pub ticker: String,
    pub last: f64,
    pub tms: String, // timestamp
    pub open: Option<f64>,
    pub high: Option<f64>,
    pub low: Option<f64>,
    pub prevClose: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CryptoPrice {
    pub ticker: String,
    pub lastPrice: f64, // Note: Tiingo crypto uses lastPrice
    pub quoteTimestamp: String,
}

// Unified struct for our bot to use
#[derive(Debug)]
pub struct AssetPrice {
    pub ticker: String,
    pub price: f64,
    pub prev_close: Option<f64>, // For calculating % change
    pub is_crypto: bool,
}

pub async fn get_price(client: &Client, api_key: &str, ticker: &str) -> Result<AssetPrice, Box<dyn Error + Send + Sync>> {
    // Try Crypto first (simple heuristic: generic error handling flow)
    // Actually, let's just try both or use a heuristic. 
    // Tiingo format: "btcusd" is crypto, "aapl" is stock.
    
    // Attempt IEX (Stock) first as it's common
    let iex_url = format!("https://api.tiingo.com/iex/?tickers={}&token={}", ticker, api_key);
    let iex_res = client.get(&iex_url).send().await?;
    
    if iex_res.status().is_success() {
        let text = iex_res.text().await?;
        // IEX returns an array: [{"ticker":"AAPL", ...}]
        if let Ok(prices) = serde_json::from_str::<Vec<StockPrice>>(&text) {
            if let Some(p) = prices.first() {
                return Ok(AssetPrice {
                    ticker: p.ticker.clone(),
                    price: p.last,
                    prev_close: p.prevClose,
                    is_crypto: false,
                });
            }
        }
    }

    // Fallback to Crypto
    let crypto_url = format!("https://api.tiingo.com/tiingo/crypto/top?tickers={}&token={}", ticker, api_key);
    let crypto_res = client.get(&crypto_url).send().await?;
    
    if crypto_res.status().is_success() {
        let text = crypto_res.text().await?;
        // Crypto returns array: [{"ticker":"btcusd", "lastPrice": ...}]
        if let Ok(prices) = serde_json::from_str::<Vec<CryptoPrice>>(&text) {
            if let Some(p) = prices.first() {
                return Ok(AssetPrice {
                    ticker: p.ticker.clone(),
                    price: p.lastPrice,
                    prev_close: None, // Crypto doesn't always give 24h prev close easily in this endpoint, simplifying for now
                    is_crypto: true,
                });
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
            priceData: Vec<HistoricalData>
        }
        
        if let Ok(wrapper) = serde_json::from_str::<Vec<CryptoHistoryResponse>>(&text) {
            if let Some(first) = wrapper.first() {
                return Ok(serde_json::from_value(serde_json::to_value(&first.priceData)?)?);
            }
        }
    }

    Err(format!("Could not find historical data for {}", ticker).into())
}
