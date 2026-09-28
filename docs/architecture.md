# Khipusol Architecture Overview ☀️🇵🇪

Khipusol is engineered for high performance, reliability, and zero runtime dependence on third-party government services. This document outlines the technical architecture of the Khipusol CLI tool.

---

## 1. High-Level Data Flow

1. **Input Parsing:** The CLI reads a user-provided CSV file containing payment amounts, dates (`DD/MM/YYYY`), and optional rate types (`C` or `V`).
2. **Cache Lookup:** Khipusol checks its local embedded database (`bbolt`) to see if the required exchange rate for that month is already cached and valid.
3. **CDN Fallback:** If the rate is missing or expired, Khipusol fetches the corresponding pre-compiled monthly JSON file (`rates/YYYY/MM.json`) directly from the public GitHub repository via the **JSDelivr CDN**.
4. **Computation & Output:** The payment is converted using the exact daily rate, and results are either printed to the terminal or exported to a new CSV file.

---

## 2. Core Packages

* **`../internal/fetcher`**: Handles HTTP GET requests to retrieve static JSON rate files from the CDN repository (`https://cdn.jsdelivr.net/gh/mistergamarra/khipusol@main/rates`).
* **`../internal/storage`**: Implements a lightning-fast embedded `bbolt` key-value database stored natively in the operating system's standard cache directory.
* **`../internal/processor`**: Coordinates CSV parsing, date normalization, rate matching, and mathematical currency conversion.
