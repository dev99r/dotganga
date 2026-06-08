import { connectDB } from '@/lib/db';
import Reminder from '@/lib/models/Reminder';
import Lead from '@/lib/models/Lead';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { searchParams } = new URL(req.url);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const filter = { isDone: false };
  if (searchParams.get('today') === 'true') {
    filter.dueAt = { $gte: today, $lt: tomorrow };
  } else {
    filter.dueAt = { $lte: new Date(Date.now() + 7 * 86400000) };
  }

  const reminders = await Reminder.find(filter)
    .populate('leadId', 'name phone email stage score')
    .sort({ dueAt: 1 });

  return Response.json({ success: true, reminders });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { leadId, title, note, dueAt, type } = await req.json();
  if (!leadId || !title || !dueAt) {
    return Response.json({ success: false, message: 'leadId, title, dueAt required.' }, { status: 400 });
  }

  const reminder = await Reminder.create({
    leadId, title, note: note || '', dueAt: new Date(dueAt), type: type || 'call',
    userId: session.id,
  });

  // Log in lead activity
  await Lead.findByIdAndUpdate(leadId, {
    $push: { activities: { type: 'reminder', message: `Reminder set: "${title}" due ${new Date(dueAt).toLocaleString()}`, by: session.name } },
    nextFollowUp: new Date(dueAt),
  });

  return Response.json({ success: true, reminder }, { status: 201 });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { id } = await req.json();
  const reminder = await Reminder.findByIdAndUpdate(id, { isDone: true, doneAt: new Date() }, { new: true });
  return Response.json({ success: true, reminder });
}
