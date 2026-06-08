import { getSession, authResponse } from '@/lib/auth';

const FIELD_MAP = {
  name:    ['name','full name','fullname','client name','customer name','lead name','contact'],
  phone:   ['phone','mobile','contact number','phone number','cell','whatsapp','tel','telephone'],
  email:   ['email','email address','mail','e-mail'],
  company: ['company','company name','business','organisation','organization','firm'],
  message: ['message','note','notes','inquiry','query','description','comment','intent'],
  source:  ['source','lead source','channel'],
};

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line) => {
    const row = []; let cur = ''; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    row.push(cur.trim());
    return row;
  };
  const headers = parseRow(lines[0]);
  const rows    = lines.slice(1).map(parseRow).filter(r => r.some(c => c));
  return { headers, rows };
}

function mapColumns(headers) {
  const mapping = {};
  headers.forEach((h, i) => {
    const n = h.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.some(a => n.includes(a))) { mapping[field] = i; break; }
    }
  });
  return mapping;
}

// Returns parsed leads for preview — does NOT save to DB. Caller saves via POST /api/leads.
export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();

  const text = await req.text();
  if (!text?.trim()) {
    return Response.json({ success: false, message: 'Empty file.' }, { status: 400 });
  }

  const { headers, rows } = parseCSV(text);
  if (!headers.length || !rows.length) {
    return Response.json({ success: false, message: 'Could not parse CSV. Check the file format.' }, { status: 400 });
  }

  const colMap = mapColumns(headers);
  const leads  = [];

  for (const row of rows) {
    const name = row[colMap.name]?.toString().trim();
    if (!name || name.length < 2) continue;
    leads.push({
      name,
      phone:   colMap.phone   !== undefined ? String(row[colMap.phone]   || '').trim() : '',
      email:   colMap.email   !== undefined ? String(row[colMap.email]   || '').trim() : '',
      company: colMap.company !== undefined ? String(row[colMap.company] || '').trim() : '',
      message: colMap.message !== undefined ? String(row[colMap.message] || '').trim() : '',
      source:  'CSV Upload',
      stage:   'New',
    });
  }

  if (!leads.length) {
    return Response.json({ success: false, message: 'No valid leads found. Make sure the CSV has a "name" column.' }, { status: 400 });
  }

  return Response.json({ success: true, leads, columnMapping: colMap });
}
