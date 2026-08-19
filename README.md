# API Forge

A collection of high-performance, stateless, and purely algorithmic APIs designed for serverless edge deployment. Built with zero external database dependencies or variable hosting costs to maximize passive income potential.

## Deployed APIs

### 1. Financial Identifier Validation API
- **Directory:** `iban-vat-validator/`
- **Description:** Performs pure algorithmic validation on international financial and tax identifiers without external registry calls.
- **Endpoints:**
  - `GET /iban/validate?value=...` - Validates IBAN length and checksum (mod-97).
  - `GET /bic/validate?value=...` - Validates BIC/SWIFT code structure.
  - `GET /vat/validate?country=...&value=...` - Structural and checksum validation for European VAT numbers.

### 2. PII Sanitizer & Data Masking API
- **Directory:** `pii-sanitizer/`
- **Description:** Instantly detects and redacts Personally Identifiable Information (PII) across flat text strings and deeply nested JSON structures.
- **Endpoints:**
  - `POST /sanitize/text` - Masks emails, phone numbers, IPv4 addresses, and valid credit cards (using the Luhn algorithm).
  - `POST /sanitize/json` - Recursively sanitizes JSON objects and neutralizes sensitive keys (e.g., passwords, tokens).

### 3. Cron Expression Translator & Scheduler API
- **Directory:** `cron-parser/`
- **Description:** Translates standard cron expressions into human-readable text descriptions and forecasts upcoming execution timestamps.
- **Endpoints:**
  - `GET /cron/explain?expression=...` - Converts 5-part cron schedules into plain language.
  - `GET /cron/next-runs?expression=...&count=...` - Calculates upcoming execution dates in ISO 8601 format.

## Architecture & Tech Stack

- **Runtime:** Cloudflare Workers (Edge JavaScript V8 Engine)
- **Design Pattern:** Stateless, bare-metal execution utilizing native string manipulation, regular expressions, and mathematical checksum algorithms.
- **Cost Structure:** Zero variable compute overhead, zero database lookups, optimized for free-tier margins.
