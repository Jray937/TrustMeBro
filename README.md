# TrustMeBro Capital 🤡

<div align="center">
  <img src="assets/logo.jpg" alt="TrustMeBro Capital Logo" width="200"/>
  <br>
</div>

> **"Financial advice not included. Refund not available."**
> **「不含投資建議，概不退款。」**

Welcome to **TrustMeBro Capital**, the world's most reliable source of completely unreliable financial information. We leverage high-frequency Rust algorithms to deliver gut-feeling analytics at the speed of light.

歡迎來到 **信我兄弟資本**，這是世界上最可靠的「完全不可靠金融信息」來源。我們利用高頻 Rust 算法，以光速傳遞基於直覺的市場分析。

## 🚀 Why Rust? (為什麼用 Rust?)
Because we need to lose money *faster* than the other guys.
因為我們需要比別人虧錢虧得*更快*。

## 🛠 Features (核心功能)

### 📊 Real-Time Market Data (Powered by Tiingo)
*   **/price <ticker>**: Check current prices for Crypto and Stocks (e.g., `/price btcusd`, `/price TSLA`).
*   **/chart <ticker>**: Generate beautiful price history charts on the fly.
*   **/alert <ticker> <price>**: Set price alerts so you never miss a liquidation.

### 📰 News Feed
*   **Auto-News**: Automatically posts the latest crypto/financial news to your designated channel.
*   **Smart Filtering**: Filters out duplicate stories and specific tickers.

### 🤡 "Analyst" Tools
*   **/signal**: Generates a "professional" buy/sell signal based on our advanced RNG algorithm.
*   **/verify**: Confirms our "insider" sources (e.g., "My uncle works at Bitcoin").

## 📂 Project Structure (項目結構)

```
TrustMeBro/
├── assets/             # Images and static assets
│   └── logo.jpg        # Our prestigious logo
├── src/
│   ├── main.rs         # Entry point & command registration
│   ├── news.rs         # News fetching & Discord formatting logic
│   ├── market.rs       # Tiingo API integration (Price/History)
│   ├── charts.rs       # Chart generation using 'plotters'
│   └── alerts.rs       # Background price monitoring system
├── Cargo.toml          # Dependencies
└── .env                # Secrets (Not committed)
```

## ⚙️ Setup (如何跑起來)

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- A sense of humor (Required)
- A [Tiingo API Key](https://www.tiingo.com/) (Free/Pro)

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/Jray937/TrustMeBro.git
   cd TrustMeBro
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory. **DO NOT commit this file.**
   ```bash
   DISCORD_TOKEN=your_discord_bot_token_here
   TIINGO_API_KEY=your_tiingo_api_key
   NEWS_CHANNEL_ID=your_discord_channel_id_for_news
   ```

3. **Run the Bot**
   ```bash
   cargo run --release
   ```

## 🤝 Contributing
Pull requests are welcome. If you fix a bug, you're hired (unpaid intern).

## 📜 License
MIT License. Do whatever you want, just don't sue us when you get liquidated.
