# TrustMeBro Bot

<div align="center">
  <img src="assets/logo.jpg" alt="TrustMeBro Capital Logo" width="200"/>
  <br>
</div>

# Overview
TrustMeBro is a Discord bot that integrates with the **Tiingo** API to provide real market data, alerts, charts, and news. Joke commands have been removed; the bot now focuses on actionable features only.

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

## ⚙️ Setup

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
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

## 🧭 Commands
- `/price <ticker>`: Get the latest price (stocks or crypto) from Tiingo.
- `/chart <ticker>`: Generate and return a recent price chart.
- `/alert <ticker> <price>`: Set a price alert; you will be pinged when triggered.
- (Auto) News: Latest Tiingo news is posted to the configured channel.

## 🤝 Contributing
Pull requests are welcome. If you fix a bug, you're hired (unpaid intern).

## 📜 License
MIT License. Do whatever you want, just don't sue us when you get liquidated.
