import { connectDB } from '@/lib/db';
import DailyReport from '@/lib/models/DailyReport';
import { getSession, authResponse } from '@/lib/auth';

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return authResponse();
  if (session.role === 'Sales') return authResponse('Not authorized.', 403);
  await connectDB();

  const body = await req.json();
  const update = { reviewedBy: session.name, reviewedAt: new Date() };
  if (body.status !== undefined)         update.status = body.status;
  if (body.managerComment !== undefined) update.managerComment = body.managerComment;

  const report = await DailyReport.findByIdAndUpdate(params.id, update, { new: true });
  if (!report) return Response.json({ success: false, message: 'Report not found.' }, { status: 404 });

  return Response.json({ success: true, report });
}
