/**
 * Financial Identifier Validation API
 * Endpoints:
 *   GET /iban/validate?value=DE89370400440532013000
 *   GET /bic/validate?value=DEUTDEFF500
 *   GET /vat/validate?country=GB&value=GB123456789
 *
 * Pure algorithmic validation. No external calls, no rate limits, no cost.
 */

// ISO 13616 IBAN length per country (partial, covers the common commercial set).
const IBAN_LENGTHS = {
  AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18,
  EE: 20, ES: 24, FI: 18, FR: 27, GB: 22, GR: 27, HR: 21, HU: 28, IE: 22,
  IS: 26, IT: 27, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18,
  NO: 15, PL: 28, PT: 25, RO: 24, SE: 24, SI: 19, SK: 24, SM: 27
};

function ibanMod97(iban) {
  // Move first 4 chars to end, convert letters to numbers (A=10..Z=35), compute mod 97.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    if (/[A-Z]/.test(ch)) {
      numeric += (ch.charCodeAt(0) - 55).toString();
    } else {
      numeric += ch;
    }
  }
  // Compute mod 97 on a large numeric string via chunked remainder.
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = String(remainder) + numeric.substring(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder;
}

function validateIban(raw) {
  const value = (raw || "").replace(/\s+/g, "").toUpperCase();
  const result = { input: raw, normalized: value, valid: false, checks: {} };

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(value)) {
    result.checks.format = false;
    result.error = "Does not match IBAN structure (2 letter country + 2 check digits + BBAN).";
    return result;
  }
  result.checks.format = true;

  const country = value.slice(0, 2);
  const expectedLen = IBAN_LENGTHS[country];
  if (!expectedLen) {
    result.checks.knownCountry = false;
    result.error = `Country code ${country} not in supported IBAN length table.`;
    return result;
  }
  result.checks.knownCountry = true;

  if (value.length !== expectedLen) {
    result.checks.length = false;
    result.error = `Invalid length for ${country}: expected ${expectedLen}, got ${value.length}.`;
    return result;
  }
  result.checks.length = true;

  const remainder = ibanMod97(value);
  result.checks.checksum = remainder === 1;
  result.valid = result.checks.checksum;
  if (!result.valid) result.error = "Checksum (mod-97) failed.";

  result.country = country;
  return result;
}

function validateBic(raw) {
  const value = (raw || "").replace(/\s+/g, "").toUpperCase();
  const result = { input: raw, normalized: value, valid: false, checks: {} };

  // 4 letter bank code + 2 letter country + 2 alphanumeric location (+ optional 3 alphanumeric branch)
  const match = /^([A-Z]{4})([A-Z]{2})([A-Z0-9]{2})([A-Z0-9]{3})?$/.exec(value);
  if (!match) {
    result.checks.format = false;
    result.error = "Does not match BIC/SWIFT structure (8 or 11 characters).";
    return result;
  }
  result.checks.format = true;
  result.checks.length = value.length === 8 || value.length === 11;

  result.bankCode = match[1];
  result.countryCode = match[2];
  result.locationCode = match[3];
  result.branchCode = match[4] || null;

  result.valid = result.checks.format && result.checks.length;
  if (!result.valid) result.error = "Invalid BIC length.";
  return result;
}

// Structural + checksum validation where a public checksum algorithm exists.
// This is NOT a live government registry lookup (that requires VIES SOAP access).
const VAT_PATTERNS = {
  GB: /^GB(\d{9}|\d{12}|(GD|HA)\d{3})$/,
  DE: /^DE\d{9}$/,
  FR: /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/,
  IT: /^IT\d{11}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  NL: /^NL\d{9}B\d{2}$/,
  BE: /^BE0\d{9}$/,
  IE: /^IE\d{7}[A-Z]{1,2}$/,
  SE: /^SE\d{12}$/,
  PL: /^PL\d{10}$/
};

function ukVatChecksum(digits) {
  // Standard UK VAT modulus-97 checksum algorithm.
  const weights = [8, 7, 6, 5, 4, 3, 2];
  const base = digits.slice(0, 7).split("").map(Number);
  const checkDigits = Number(digits.slice(7, 9));
  let sum = base.reduce((acc, d, i) => acc + d * weights[i], 0);
  const validOld = (sum + checkDigits) % 97 === 0;
  const validNew = ((sum + checkDigits - 55) % 97) === 0;
  return validOld || validNew;
}

function validateVat(country, raw) {
  const value = (raw || "").replace(/\s+/g, "").toUpperCase();
  const cc = (country || value.slice(0, 2)).toUpperCase();
  const result = { input: raw, normalized: value, country: cc, valid: false, checks: {} };

  const pattern = VAT_PATTERNS[cc];
  if (!pattern) {
    result.checks.knownCountry = false;
    result.error = `No format rule for country ${cc}. Supported: ${Object.keys(VAT_PATTERNS).join(", ")}.`;
    return result;
  }
  result.checks.knownCountry = true;
  result.checks.format = pattern.test(value);

  if (!result.checks.format) {
    result.error = "Does not match expected VAT number structure for this country.";
    return result;
  }

  if (cc === "GB") {
    const digits = value.slice(2);
    if (/^\d{9}$/.test(digits)) {
      result.checks.checksum = ukVatChecksum(digits);
    } else {
      result.checks.checksum = null; // government/branch numbers skip checksum
    }
  } else {
    result.checks.checksum = null; // no public checksum algorithm implemented for this country yet
  }

  result.valid = result.checks.format && result.checks.checksum !== false;
  result.note = "Structural/checksum validation only. Does not confirm active registration with the tax authority.";
  return result;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (pathname === "/iban/validate") {
      return json(validateIban(searchParams.get("value")));
    }
    if (pathname === "/bic/validate") {
      return json(validateBic(searchParams.get("value")));
    }
    if (pathname === "/vat/validate") {
      return json(validateVat(searchParams.get("country"), searchParams.get("value")));
    }
    if (pathname === "/" || pathname === "/health") {
      return json({
        status: "ok",
        endpoints: [
          "/iban/validate?value=DE89370400440532013000",
          "/bic/validate?value=DEUTDEFF500",
          "/vat/validate?country=GB&value=GB553557881"
        ]
      });
    }
    return json({ error: "Not found" }, 404);
  }
};
