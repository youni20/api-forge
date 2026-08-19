/**
 * PII Sanitizer API
 * Endpoints:
 *   POST /sanitize/text
 *   POST /sanitize/json
 */

// Validates potential credit card numbers to reduce false positives
function luhnCheck(num) {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
}

function sanitizeText(text) {
  if (typeof text !== 'string') return text;

  let result = text;

  // Mask Emails
  result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, '[EMAIL]');

  // Mask Credit Cards (matches 13-19 digits, checks Luhn validity)
  result = result.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    if (luhnCheck(match)) return '[CREDIT_CARD]';
    return match; // Return original if it fails algorithmic validation
  });

  // Mask Standard Phone Numbers
  result = result.replace(/\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g, '[PHONE]');

  // Mask IPv4 Addresses
  result = result.replace(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, '[IPV4]');

  return result;
}

function sanitizeJson(data) {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item));
  }
  if (data !== null && typeof data === 'object') {
    const sanitizedObj = {};
    for (const key in data) {
      if (Object.hasOwn(data, key)) {
        const lowerKey = key.toLowerCase();
        // Exact match masking for structural keys that imply sensitive data
        if (['password', 'secret', 'token', 'apikey', 'ssn'].includes(lowerKey)) {
          sanitizedObj[key] = '[REDACTED]';
        } else {
          sanitizedObj[key] = sanitizeJson(data[key]);
        }
      }
    }
    return sanitizedObj;
  }
  return data;
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
    const pathname = url.pathname;

    if (request.method !== "POST") {
      if (pathname === "/" || pathname === "/health") {
        return json({
          status: "ok",
          endpoints: ["POST /sanitize/text", "POST /sanitize/json"]
        });
      }
      return json({ error: "Method not allowed. Use POST." }, 405);
    }

    try {
      if (pathname === "/sanitize/text") {
        const body = await request.json();
        if (!body.text) return json({ error: "Missing 'text' field in JSON body." }, 400);
        
        const startTime = Date.now();
        const sanitized = sanitizeText(body.text);
        const processingTimeMs = Date.now() - startTime;
        
        return json({ 
          original_length: body.text.length, 
          sanitized_text: sanitized,
          processing_time_ms: processingTimeMs
        });
      }

      if (pathname === "/sanitize/json") {
        const body = await request.json();
        if (!body.payload) return json({ error: "Missing 'payload' field in JSON body." }, 400);

        const startTime = Date.now();
        const sanitized = sanitizeJson(body.payload);
        const processingTimeMs = Date.now() - startTime;

        return json({
          sanitized_payload: sanitized,
          processing_time_ms: processingTimeMs
        });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: "Invalid JSON body or processing error.", details: err.message }, 400);
    }
  }
};
