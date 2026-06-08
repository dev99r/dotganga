import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a lead extraction AI for a CRM system.
Extract lead information from the given text and return ONLY a valid JSON array.
Each lead object must have these fields (use empty string "" if not found):
- name (full name, capitalize properly)
- phone (with country code if present, digits only or with +)
- email (lowercase)
- company (business/company name)
- message (their inquiry or intent, summarized in 1 sentence)
- source (guess: "WhatsApp", "Email", "Facebook", "Website", or "Unknown")

Rules:
- Extract ALL leads found in the text
- If text has multiple people, create multiple lead objects
- Phone numbers: keep original format but remove spaces
- Do NOT include any text outside the JSON array
- If zero leads found, return []`;

export async function parseLeadsFromText(rawText) {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: basic regex extraction
    return fallbackParse(rawText);
  }

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: `Extract leads from this text:\n\n${rawText.slice(0, 8000)}` },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const raw = res.choices[0].message.content;
    // The model returns { leads: [...] } or just [...]
    const parsed = JSON.parse(raw);
    const leads = Array.isArray(parsed) ? parsed : (parsed.leads || parsed.data || []);
    return leads.filter(l => l.name && l.name.length > 1);
  } catch (err) {
    console.error('AI parse error:', err.message);
    return fallbackParse(rawText);
  }
}

function fallbackParse(text) {
  const leads = [];
  const lines = text.split('\n').filter(l => l.trim());

  // Try to find name: phone: email: patterns
  const phoneRe  = /(\+?[\d\s\-()]{8,15})/g;
  const emailRe  = /[\w.+-]+@[\w-]+\.[\w.]+/gi;
  const phones   = [...text.matchAll(phoneRe)].map(m => m[1].replace(/\s/g, ''));
  const emails   = [...text.matchAll(emailRe)].map(m => m[0]);

  // Try line-by-line name detection
  const nameRe = /^[A-Z][a-z]+ [A-Z][a-z]+/;
  const names  = lines.filter(l => nameRe.test(l.trim())).map(l => l.trim());

  if (names.length > 0) {
    names.forEach((name, i) => {
      leads.push({
        name,
        phone:   phones[i] || '',
        email:   emails[i] || '',
        company: '',
        message: '',
        source:  'AI Paste',
      });
    });
  } else if (phones.length > 0 || emails.length > 0) {
    leads.push({
      name:    lines[0]?.trim().slice(0, 40) || 'Unknown',
      phone:   phones[0] || '',
      email:   emails[0] || '',
      company: '',
      message: text.slice(0, 100),
      source:  'AI Paste',
    });
  }

  return leads;
}
