import { parseLeadsFromText } from '@/lib/aiParser';
import { getSession, authResponse } from '@/lib/auth';

// Extract-only — does NOT save to DB. Caller saves via POST /api/leads.
export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();

  const { text } = await req.json();
  if (!text?.trim()) {
    return Response.json({ success: false, message: 'No text provided.' }, { status: 400 });
  }

  const leads = await parseLeadsFromText(text);

  if (!leads || leads.length === 0) {
    return Response.json({ success: false, message: 'No leads found in the text. Try adding more details like names, phones, or emails.' });
  }

  // Normalize fields and tag source before returning for preview
  const normalized = leads.map(l => ({
    name:    l.name    || 'Unknown',
    phone:   l.phone   || '',
    email:   l.email   || '',
    company: l.company || '',
    message: l.message || '',
    stage:   l.stage   || 'New',
    source:  'AI Paste',
  }));

  return Response.json({ success: true, leads: normalized });
}
