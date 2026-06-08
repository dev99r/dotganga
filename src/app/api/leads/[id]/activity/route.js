import { connectDB } from '@/lib/db';
import Lead from '@/lib/models/Lead';
import { getSession, authResponse } from '@/lib/auth';

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { type, message } = await req.json();
  if (!type || !message) {
    return Response.json({ success: false, message: 'type and message required.' }, { status: 400 });
  }

  const lead = await Lead.findById(params.id);
  if (!lead) return Response.json({ success: false, message: 'Not found.' }, { status: 404 });

  lead.activities.push({ type, message, by: session.name });
  await lead.save();

  return Response.json({ success: true, lead: lead.toObject() });
}
