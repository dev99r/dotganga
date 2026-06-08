import { connectDB } from '@/lib/db';
import Lead from '@/lib/models/Lead';
import Reminder from '@/lib/models/Reminder';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const lead = await Lead.findById(params.id).lean();
  if (!lead) return Response.json({ success: false, message: 'Lead not found.' }, { status: 404 });

  const reminders = await Reminder.find({ leadId: params.id, isDone: false }).sort({ dueAt: 1 });
  return Response.json({ success: true, lead, reminders });
}

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const body = await req.json();
  const lead = await Lead.findById(params.id);
  if (!lead) return Response.json({ success: false, message: 'Lead not found.' }, { status: 404 });

  const allowedFields = ['name','phone','email','company','message','stage','nextFollowUp','assignedTo','tags','isClaimed'];
  allowedFields.forEach(f => { if (body[f] !== undefined) lead[f] = body[f]; });

  // Track stage changes
  if (body.stage && body.stage !== lead.stage) {
    lead.activities.push({
      type: 'status_change',
      message: `Stage changed to "${body.stage}"`,
      by: session.name,
    });
  }

  // Track claim
  if (body.isClaimed && !lead.claimedAt) {
    lead.claimedAt = new Date();
    lead.activities.push({ type: 'created', message: `Lead claimed by ${session.name}`, by: session.name });
  }

  await lead.save();
  return Response.json({ success: true, lead });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  if (session.role !== 'Admin') return authResponse('Admin only.', 403);
  await connectDB();

  await Lead.findByIdAndUpdate(params.id, { isArchived: true });
  return Response.json({ success: true, message: 'Lead archived.' });
}
