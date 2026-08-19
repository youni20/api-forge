# Financial Identifier Validation API

IBAN, BIC/SWIFT, and VAT number format + checksum validation. Zero external
dependencies, zero cost to run, deployable on Cloudflare Workers' free tier.

## What it validates

- `/iban/validate?value=...` — ISO 13616 structure, per-country length, mod-97 checksum
- `/bic/validate?value=...` — ISO 9362 structure (8 or 11 char)
- `/vat/validate?country=XX&value=...` — per-country format regex; full checksum
  implemented for GB (modulus-97 algorithm), format-only for DE/FR/IT/ES/NL/BE/IE/SE/PL

This is algorithmic validation, not a live call to a government registry
(VIES, HMRC, etc.). Say so explicitly in your API description so buyers know
what they're getting — misrepresenting this is the fastest way to a bad
review and a chargeback.

## Deploy today (zero cost, no card)

1. Install dependencies:
   ```
   cd fin-validate-api
   npm install
   ```
2. Log in to Cloudflare (free account, email + password only):
   ```
   npx wrangler login
   ```
3. Deploy:
   ```
   npx wrangler deploy
   ```
   This prints a live URL: `https://fin-validate-api.<your-subdomain>.workers.dev`
4. Test it:
   ```
   curl "https://fin-validate-api.<your-subdomain>.workers.dev/iban/validate?value=DE89370400440532013000"
   ```

## List it on RapidAPI

1. Create a free provider account at rapidapi.com.
2. "Add New API" → paste your `workers.dev` base URL.
3. Add the three endpoints manually (path, query params, example response —
   use the examples in `src/index.js`'s `/health` route as a template).
4. Set pricing tiers on the dashboard, suggested starting point:
   - Free: 100 requests/day
   - Basic: $5/month, 10,000 requests
   - Pro: $15/month, 100,000 requests
5. Publish. RapidAPI handles auth, metering, and billing from here — you
   don't write any of that yourself.

## Distribution (the part that actually determines whether you make money)

Posting the listing is not marketing. Do at least one of these the same day
you publish:
- Post in a relevant subreddit (r/webdev, r/SaaS) as "I built a free IBAN/VAT
  validator API, feedback welcome" — lead with free value, not a sales pitch.
- Answer an existing Stack Overflow question about IBAN/VAT validation with a
  genuine answer, mention the API as one option, not the only one.
- "Show HN" if you want higher-effort, higher-ceiling exposure.

No traffic source, no conversions, regardless of how correct the checksum
math is.
