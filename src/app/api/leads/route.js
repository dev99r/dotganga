import { connectDB } from '@/lib/db';
import Lead from '@/lib/models/Lead';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { searchParams } = new URL(req.url);
  const stage   = searchParams.get('stage');
  const source  = searchParams.get('source');
  const search  = searchParams.get('q');
  const page    = parseInt(searchParams.get('page') || '1');
  const limit   = parseInt(searchParams.get('limit') || '50');
  const sort    = searchParams.get('sort') || '-createdAt';

  const hasFollowUp     = searchParams.get('hasFollowUp')     === 'true';
  const overdueFollowUp = searchParams.get('overdueFollowUp') === 'true';
  const todayFollowUp   = searchParams.get('todayFollowUp')   === 'true';

  const filter = { isArchived: false };
  if (stage  && stage  !== 'all') filter.stage  = stage;
  if (source && source !== 'all') filter.source = source;
  if (hasFollowUp)     filter.nextFollowUp = { $ne: null };
  if (overdueFollowUp) filter.nextFollowUp = { $lt: new Date(), $ne: null };
  if (todayFollowUp) {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    filter.nextFollowUp = { $gte: s, $lte: e };
  }
  if (search) {
    filter.$or = [
      { name:    { $regex: search, $options: 'i' } },
      { phone:   { $regex: search, $options: 'i' } },
      { email:   { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  // Stage counts for pipeline
  const stageCounts = await Lead.aggregate([
    { $match: { isArchived: false } },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
  ]);

  return Response.json({ success: true, leads, total, page, stageCounts });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const body = await req.json();
  const leadsToCreate = Array.isArray(body) ? body : [body];

  const created = [];
  for (const l of leadsToCreate) {
    const lead = await Lead.create({
      ...l,
      activities: [{
        type: 'created',
        message: `Lead created via ${l.source || 'Manual'}`,
        by: session.name,
      }],
    });
    created.push(lead);
  }

  return Response.json({ success: true, leads: created, count: created.length }, { status: 201 });
}
