```markdown
# PII Sanitizer API

A high-performance, stateless API designed to detect and redact Personally Identifiable Information (PII) within plain text and complex JSON payloads. Built for serverless edge execution with zero external database dependencies.

## Features

- **Text Redaction:** Scans unstructured strings to mask emails, standard phone numbers, IPv4 addresses, and credit card numbers.
- **Algorithmic Validation:** Employs the Luhn algorithm to verify potential credit card numbers before masking, significantly reducing false positives.
- **Deep JSON Traversal:** Recursively processes nested JSON objects, neutralizing known sensitive keys (such as passwords, tokens, and API keys) while sanitizing string values.
- **Zero Latency Overhead:** Runs entirely in-memory using native JavaScript regex and string manipulation.

## Endpoints for Testing

### 1. Health Check
- **GET /health**
- **Description:** Returns operational status and available endpoints.
- **Example Response:**
  ```json
  {
    "status": "ok",
    "endpoints": [
      "POST /sanitize/text",
      "POST /sanitize/json"
    ]
  }

```

### 2. Sanitize Text

* **POST /sanitize/text**
* **Description:** Scans a text string and masks emails, credit cards, standard phone numbers, and IPv4 addresses.
* **Request Body:**
```json
{
  "text": "Contact john.doe@example.com or call 555-123-4567. Card: 4111 1111 1111 1111."
}

```


* **Example Response:**
```json
{
  "original_length": 77,
  "sanitized_text": "Contact [EMAIL] or call [PHONE]. Card: [CREDIT_CARD].",
  "processing_time_ms": 1
}

```



### 3. Sanitize JSON Payload

* **POST /sanitize/json**
* **Description:** Recursively traverses a JSON object, masking known sensitive key names and sanitizing string values for PII.
* **Request Body:**
```json
{
  "payload": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "supersecretpassword"
    }
  }
}

```


* **Example Response:**
```json
{
  "sanitized_payload": {
    "user": {
      "name": "John Doe",
      "email": "[EMAIL]",
      "password": "[REDACTED]"
    }
  },
  "processing_time_ms": 2
}

```



## Local Development & Testing

1. Install dependencies:
```bash
npm install

```


2. Run tests:
```bash
npm test

```


3. Run locally:
```bash
npx wrangler dev

```



## Deployment

Deploy directly to the Cloudflare Edge network using Wrangler:

```bash
npx wrangler deploy

```
