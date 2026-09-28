# Khipusol User Guide ☀️🇵🇪

Welcome to the **Khipusol** User Guide! Khipusol is a lightweight, cross-platform CLI tool built in Go that automates financial calculations by converting payment amounts from CSV files using official **SUNAT** exchange rate data.

It features an embedded local caching system (`bbolt`) to store historical rates, minimizing network requests and allowing smooth processing.

---

## 1. ✨ Features

* **Official SUNAT Integration:** Directly connects to SUNAT's exchange rate endpoint using token-based authentication.
* **Smart Local Caching:** Automatically caches fetched monthly rates locally with a configurable TTL (default: 30 days) to prevent redundant API calls.
* **CSV Processing & Export:** Easily parse payment records and export converted results directly into a new CSV file.
* **Flexible Configuration:** Supports both CLI flags and `.env` environment files.



## 2. ⚙️ Quick Start & Setup

### Environment Configuration (`.env`)
Create a file named `.env` in the same directory where you run Khipusol to manage your API token and settings:

```env
SUNAT_API_TOKEN=your_sunat_session_token_here
CACHE_TTL_DAYS=30
DEBUG=false
```

### 3. 📄 Preparing Your Input CSV
Khipusol reads payment amounts, dates, and rate types from a standard CSV file.


#### Format Rules:
* **amount:** The numeric payment value (e.g., 150.50, 1250.75).

* **date:** Must be formatted strictly as DD/MM/YYYY (e.g., 01/03/2022).

* **type:** (Optional) The exchange rate type:
    * C = Compra (Buy rate)
    * V = Venta (Sell rate)
    * *Note: If omitted or left blank, Khipusol defaults to V.*


Example Input (**payments.csv**)

```env
Code snippet

amount,date,type
150.50,01/03/2022,C
200.00,04/03/2022,V
1250.75,31/03/2022,V
```

## 4. 🚀 End-User Commands & Usage Examples
Khipusol provides a straightforward command-line interface. Below are the primary workflows:

### A. Basic Processing (Output to Terminal)
Processes your payment file using local cache (or fetching online if missing) and prints results directly to your console.

```env
Bash

khipusol payments.csv
```

### B. Exporting Results to a New CSV File (**-o**)
Saves the processed payment rows, applied exchange rates, and calculated totals into a clean new file.

```env
Bash

khipusol --output results.csv payments.csv
# or using shorthand:
khipusol -o results.csv payments.csv
```

### C. Forcing Fresh Rates from SUNAT (-f)
Bypasses the local database cache and forces a fresh query to SUNAT's servers for updated rates.

```env
Bash

khipusol --force-refresh payments.csv
# or using shorthand:
khipusol -f payments.csv
```

### D. Enabling Verbose Debug Mode (-v)
Prints detailed HTTP request payloads, headers, and server response codes for troubleshooting.

```env
Bash

khipusol --debug payments.csv
# or using shorthand:
khipusol -v payments.csv
```

### E. Purging the Local Cache Database (-p)
Clears all locally stored exchange rate records from your system cache and exits.

```env
Bash

khipusol --purge
# or using shorthand:
khipusol -p
```

### 5. 🎛️ Complete CLI Flags Reference
Flag	Shorthand	Description	Default
--output	-o	Export converted results to a specified CSV file path	"" (Terminal only)
--force-refresh	-f	Bypass local database cache and fetch fresh rates	false
--purge	-p	Clear all cached records in the local database and exit	false
--debug	-v	Enable verbose HTTP request/response debugging logs	false
--db-path	-d	Custom path to the local bbolt cache database file	OS Native Cache Directory


### 6. ❓ Frequently Asked Questions (FAQ)
#### Q: Why am I getting a "No matching exchange rate" error?
* A: Check your CSV date format. Khipusol requires DD/MM/YYYY. Additionally, ensure that a rate was published by SUNAT on that specific date (note that SUNAT does not publish exchange rates on certain holidays or weekends; transactions on those days typically rely on the preceding business day's published rate).

#### Q: Where is my local cache stored?
* A: Khipusol saves its cache file natively in your operating system's standard cache folder (e.g., ~/Library/Caches/khipusol/ on macOS, or AppData/Local/khipusol/ on Windows), keeping your project directory clean.