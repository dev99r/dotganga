const https = require('https');

/**
 * Send a WhatsApp message via Meta's WhatsApp Business Cloud API.
 * Falls back to a console log in dev if credentials are not set.
 *
 * Required env vars:
 *   WA_PHONE_NUMBER_ID   - from Meta Business dashboard
 *   WA_ACCESS_TOKEN      - permanent system user token
 *
 * Phone numbers must include country code without '+', e.g. "917891234567"
 */
async function sendWhatsAppMessage(toPhone, message) {
  const phoneId   = process.env.WA_PHONE_NUMBER_ID;
  const token     = process.env.WA_ACCESS_TOKEN;

  // Strip non-digits and leading +
  const cleanPhone = String(toPhone).replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) return;

  if (!phoneId || !token) {
    // Dev fallback — log the message that would be sent
    console.log(`[WhatsApp DEV] To: ${cleanPhone} | ${message.slice(0, 80)}`);
    return;
  }

  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'text',
    text: { body: message },
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/v19.0/${phoneId}/messages`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error('[WhatsApp] Failed:', res.statusCode, data.slice(0, 200));
          }
          resolve();
        });
      }
    );
    req.on('error', err => { console.error('[WhatsApp] Request error:', err.message); resolve(); });
    req.write(body);
    req.end();
  });
}

/**
 * Notify multiple users by their WhatsApp numbers.
 * Silently skips users with no whatsappNumber.
 */
async function notifyUsers(users, message) {
  const targets = (Array.isArray(users) ? users : [users])
    .filter(u => u?.whatsappNumber);
  await Promise.all(targets.map(u => sendWhatsAppMessage(u.whatsappNumber, message)));
}

module.exports = { sendWhatsAppMessage, notifyUsers };
