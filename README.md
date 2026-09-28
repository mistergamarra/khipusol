# Khipusol ☀️🇵🇪

**Khipusol** is a lightweight, cross-platform CLI tool built in Go that automates financial calculations by converting payment amounts from CSV files using official **SUNAT** exchange rate data.

It features an embedded local caching system (`bbolt`) to store historical rates, minimizing network requests and allowing smooth processing.

---

## ✨ Features

* **Official SUNAT Integration:** Directly connects to SUNAT's exchange rate endpoint using token-based authentication.
* **Smart Local Caching:** Automatically caches fetched monthly rates locally with a 30-day TTL to prevent redundant API calls.
* **CSV Processing & Export:** Easily parse payment records and export converted results directly into a new CSV file.
* **Flexible Configuration:** Supports both CLI flags and `.env` environment files.

---

## ⚙️ Configuration (`.env`)

Create a `.env` file in your root project directory to manage your tokens:

```env
SUNAT_API_TOKEN=your_sunat_session_token_here
CACHE_TTL_DAYS=30
DEBUG=false