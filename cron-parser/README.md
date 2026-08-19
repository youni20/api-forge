```markdown
# Cron Expression Translator & Scheduler API

A lightweight, stateless API designed to translate standard cron expressions into human-readable text and forecast upcoming execution timestamps. Built for serverless edge execution with zero external database dependencies.

## Features

- **Human-Readable Translation:** Parses standard 5-part cron expressions to generate clear, descriptive explanations of when a scheduled task will fire.
- **Execution Forecaster:** Calculates and returns an array of upcoming ISO 8601 timestamps for a given schedule.
- **Zero Latency Overhead:** Runs entirely in-memory using native JavaScript string manipulation and date-time mathematics.
- **Zero Variable Costs:** Designed for high-throughput edge deployment with no database lookups or third-party dependencies.

## Endpoints for Testing

### 1. Health Check
- **GET /health**
- **Description:** Returns operational status and available endpoints.
- **Example Response:**
  ```json
  {
    "status": "ok",
    "endpoints": [
      "/cron/explain?expression=0+12+*+*+MON-FRI",
      "/cron/next-runs?expression=0+12+*+*+5"
    ]
  }

```

### 2. Translate Cron Expression

* **GET /cron/explain**
* **Description:** Converts a standard 5-part cron expression into a clear, human-readable sentence.
* **Query Parameters:**
* `expression` (string, required): Standard 5-part cron expression (e.g., `0 12 * * MON-FRI`).


* **Example Request:**
`GET /cron/explain?expression=0+12+*+*+MON-FRI`
* **Example Response:**
```json
{
  "valid": true,
  "expression": "0 12 * * MON-FRI",
  "description": "Runs at 12:00 PM (noon), Monday through Friday."
}

```



### 3. Forecast Next Executions

* **GET /cron/next-runs**
* **Description:** Calculates and returns an array of upcoming execution timestamps based on the provided cron expression.
* **Query Parameters:**
* `expression` (string, required): Standard 5-part cron expression.
* `count` (integer, optional): Number of future timestamps to return (default is 5).


* **Example Request:**
`GET /cron/next-runs?expression=0+12+*+*+*&count=3`
* **Example Response:**
```json
{
  "expression": "0 12 * * *",
  "requested_count": 3,
  "next_runs": [
    "2026-08-20T12:00:00.000Z",
    "2026-08-21T12:00:00.000Z",
    "2026-08-22T12:00:00.000Z"
  ]
}

```



## Local Development & Testing

1. Install dependencies:
```bash
npm install

```


2. Run locally:
```bash
npx wrangler dev

```



## Deployment

Deploy directly to the Cloudflare Edge network using Wrangler:

```bash
npx wrangler deploy

```
