import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('PII Sanitizer Worker', () => {
  it('returns health status on GET /', async () => {
    const req = new Request('http://localhost/', { method: 'GET' });
    const res = await worker.fetch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('sanitizes text properly', async () => {
    // 4111 1111 1111 1111 is a standard test card that passes the Luhn check
    const body = { text: "My email is test@example.com and card is 4111 1111 1111 1111." };
    const req = new Request('http://localhost/sanitize/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const res = await worker.fetch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sanitized_text).toBe("My email is [EMAIL] and card is [CREDIT_CARD].");
  });

  it('does not mask invalid credit cards (Luhn check failure)', async () => {
    // Ends in 1112, which fails the Luhn algorithm
    const body = { text: "My product ID is 4111 1111 1111 1112." };
    const req = new Request('http://localhost/sanitize/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const res = await worker.fetch(req);
    const data = await res.json();
    expect(data.sanitized_text).toBe("My product ID is 4111 1111 1111 1112.");
  });

  it('sanitizes nested JSON payloads', async () => {
    const payload = {
      user: {
        name: "John",
        password: "supersecret123",
        contact: "john@example.com",
        ip: "192.168.1.1"
      }
    };
    const req = new Request('http://localhost/sanitize/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });
    
    const res = await worker.fetch(req);
    const data = await res.json();
    expect(data.sanitized_payload.user.password).toBe("[REDACTED]");
    expect(data.sanitized_payload.user.contact).toBe("[EMAIL]");
    expect(data.sanitized_payload.user.ip).toBe("[IPV4]");
  });
});
