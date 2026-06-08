import { connectDB } from '@/lib/db';
import CallLog from '@/lib/models/CallLog';
import Lead from '@/lib/models/Lead';
import Reminder from '@/lib/models/Reminder';
import { getSession, authResponse } from '@/lib/auth';

// GET /api/calls — list call logs (today, or by leadId, or all)
export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('leadId');
  const today  = searchParams.get('today') === 'true';
  const page   = parseInt(searchParams.get('page') || '1');

  const filter = {};
  if (leadId) filter.leadId = leadId;
  if (today) {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    filter.calledAt = { $gte: start, $lte: end };
  }

  const [logs, total] = await Promise.all([
    CallLog.find(filter).sort({ calledAt: -1 }).skip((page-1)*50).limit(50).lean(),
    CallLog.countDocuments(filter),
  ]);

  // Stats for today
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const [todayStats, outcomeStats] = await Promise.all([
    CallLog.aggregate([
      { $match: { calledAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: 1 }, answered: { $sum: { $cond: [{ $eq: ['$outcome','Answered'] },1,0] } }, totalDuration: { $sum: '$durationSec' } } },
    ]),
    CallLog.aggregate([
      { $match: { calledAt: { $gte: todayStart } } },
      { $group: { _id: '$outcome', count: { $sum: 1 } } },
    ]),
  ]);

  const ts = todayStats[0] || { total: 0, answered: 0, totalDuration: 0 };
  const oc = Object.fromEntries(outcomeStats.map(o => [o._id, o.count]));

  return Response.json({
    success: true, logs, total, page,
    stats: {
      todayCalls:    ts.total,
      todayAnswered: ts.answered,
      answerRate:    ts.total > 0 ? Math.round(ts.answered / ts.total * 100) : 0,
      avgDurationSec: ts.total > 0 ? Math.round(ts.totalDuration / ts.total) : 0,
      outcomes: oc,
    },
  });
}

// POST /api/calls — log a completed call
export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { leadId, outcome, durationSec, notes, followUpAt } = await req.json();
  if (!leadId || !outcome) return Response.json({ success: false, message: 'leadId and outcome required.' }, { status: 400 });

  const lead = await Lead.findById(leadId);
  if (!lead) return Response.json({ success: false, message: 'Lead not found.' }, { status: 404 });

  const log = await CallLog.create({
    leadId, leadName: lead.name, leadPhone: lead.phone,
    by: session.name, byId: session.id,
    outcome, durationSec: durationSec || 0, notes: notes || '',
    followUpAt: followUpAt ? new Date(followUpAt) : null,
    followUpSet: !!followUpAt,
  });

  // Log in lead activity
  const dur = durationSec > 0 ? ` (${Math.floor(durationSec/60)}m ${durationSec%60}s)` : '';
  const msg = `Call ${outcome}${dur}${notes ? ' — ' + notes : ''}`;
  lead.activities.push({ type: 'call', message: msg, by: session.name });

  // Set stage to Contacted if New
  if (lead.stage === 'New' && outcome === 'Answered') {
    lead.stage = 'Contacted';
    lead.activities.push({ type: 'status_change', message: 'Stage changed to "Contacted" after answered call', by: session.name });
  }

  if (followUpAt) {
    lead.nextFollowUp = new Date(followUpAt);
    await Reminder.create({
      leadId, userId: session.id,
      title: `Follow-up call with ${lead.name}`,
      note: notes || '',
      dueAt: new Date(followUpAt),
      type: 'call',
    });
  }

  await lead.save();
  return Response.json({ success: true, log }, { status: 201 });
}
