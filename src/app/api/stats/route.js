import { connectDB } from '@/lib/db';
import Lead from '@/lib/models/Lead';
import { getSession, authResponse } from '@/lib/auth';

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const now = new Date();
  const startOfDay  = new Date(now); startOfDay.setHours(0,0,0,0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth= new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

  const [
    totalLeads, todayLeads, weekLeads, monthLeads,
    stageCounts, sourceCounts, avgScore,
    unclaimed15min, weekTrend,
  ] = await Promise.all([
    Lead.countDocuments({ isArchived: false }),
    Lead.countDocuments({ isArchived: false, createdAt: { $gte: startOfDay } }),
    Lead.countDocuments({ isArchived: false, createdAt: { $gte: startOfWeek } }),
    Lead.countDocuments({ isArchived: false, createdAt: { $gte: startOfMonth } }),

    Lead.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),

    Lead.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),

    Lead.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]),

    // Leads unclaimed for > 15 minutes
    Lead.countDocuments({
      isArchived: false,
      stage: 'New',
      isClaimed: false,
      createdAt: { $lte: new Date(Date.now() - 15 * 60000) },
    }),

    // Last 7 days lead counts
    Lead.aggregate([
      { $match: { isArchived: false, createdAt: { $gte: startOfWeek } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return Response.json({
    success: true,
    stats: {
      totalLeads, todayLeads, weekLeads, monthLeads,
      stageCounts: Object.fromEntries(stageCounts.map(s => [s._id, s.count])),
      sourceCounts: Object.fromEntries(sourceCounts.map(s => [s._id, s.count])),
      avgScore: Math.round(avgScore[0]?.avg || 0),
      unclaimed15min,
      weekTrend,
    },
  });
}
