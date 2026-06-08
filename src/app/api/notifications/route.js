import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const notifications = await Notification.find({
    $or: [{ userId: session.id }, { userId: session.role.toLowerCase() }]
  }).sort({ createdAt: -1 }).limit(30).lean();

  const unread = notifications.filter(n => !n.read).length;
  return Response.json({ success: true, notifications, unread });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();
  await Notification.updateMany(
    { $or: [{ userId: session.id }, { userId: session.role.toLowerCase() }] },
    { $set: { read: true } }
  );
  return Response.json({ success: true });
}
