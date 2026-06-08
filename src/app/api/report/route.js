import { connectDB } from '@/lib/db';
import DailyReport from '@/lib/models/DailyReport';
import { getSession, authResponse } from '@/lib/auth';

const SALES_ROLES = ['Sales', 'Manager', 'Admin'];

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const { searchParams } = new URL(req.url);
  const date   = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const role   = searchParams.get('role');  // filter by role/department
  const mine   = searchParams.get('mine') === 'true';

  const filter = { date };
  if (mine || (!SALES_ROLES.includes(session.role) && session.role !== 'Admin')) {
    filter.userId = session.id;
  }
  if (SALES_ROLES.includes(session.role) && !mine && role && role !== 'all') {
    filter.role = role;
  }
  if (session.role === 'Admin' && !mine && role && role !== 'all') {
    filter.role = role;
  }

  const reports = await DailyReport.find(filter).sort({ createdAt: -1 }).lean();

  const summary = {
    total:          reports.length,
    approved:       reports.filter(r => r.status === 'Approved').length,
    pending:        reports.filter(r => r.status === 'Pending').length,
    needsReview:    reports.filter(r => r.status === 'Needs Review').length,
    byRole: reports.reduce((acc, r) => {
      acc[r.role] = (acc[r.role] || 0) + 1;
      return acc;
    }, {}),
  };

  return Response.json({ success: true, reports, summary });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return authResponse();
  await connectDB();

  const body = await req.json();
  const date = new Date().toISOString().slice(0, 10);

  const existing = await DailyReport.findOne({ userId: session.id, date });
  if (existing) {
    return Response.json({ success: false, message: 'Report already submitted for today.' }, { status: 409 });
  }

  const { aiSummary, sentiment } = buildSummary(session.role, body, session.name);

  const report = await DailyReport.create({
    userId:       session.id,
    userName:     session.name,
    role:         session.role,
    date,
    metrics:      body.metrics || {},
    highlights:   body.highlights || '',
    blockers:     body.blockers || '',
    tomorrowPlan: (body.tomorrowPlan || []).filter(Boolean),
    aiSummary,
    sentiment,
  });

  return Response.json({ success: true, report }, { status: 201 });
}

function buildSummary(role, body, name) {
  const m = body.metrics || {};
  const lines = [];
  let sentiment = 'Neutral';

  if (role === 'Sales' || role === 'Manager' || role === 'Admin') {
    if (m.callsAttempted > 0) {
      const rate = Math.round((m.callsConnected || 0) / m.callsAttempted * 100);
      lines.push(`• Made ${m.callsAttempted} calls — ${m.callsConnected || 0} connected (${rate}% connect rate)`);
    }
    if (m.leadsReached > 0)  lines.push(`• Reached ${m.leadsReached} lead${m.leadsReached !== 1 ? 's' : ''}`);
    if (m.proposalsSent > 0) lines.push(`• Sent ${m.proposalsSent} proposal${m.proposalsSent !== 1 ? 's' : ''}`);
    if (m.dealsClosed > 0)   lines.push(`• Closed ${m.dealsClosed} deal${m.dealsClosed !== 1 ? 's' : ''}${m.revenue ? ` — ₹${Number(m.revenue).toLocaleString()} revenue` : ''}`);
    if (m.followUpsSet > 0)  lines.push(`• Scheduled ${m.followUpsSet} follow-up${m.followUpsSet !== 1 ? 's' : ''}`);
    const cr = m.callsAttempted > 0 ? (m.callsConnected || 0) / m.callsAttempted : 0;
    if (m.dealsClosed > 0 || cr > 0.55) sentiment = 'Happy';

  } else if (role === 'VideoEditor') {
    if (m.videosDelivered > 0) lines.push(`• Delivered ${m.videosDelivered} video${m.videosDelivered !== 1 ? 's' : ''}`);
    if (m.minutesEdited > 0)   lines.push(`• Edited ${m.minutesEdited} minutes of footage`);
    if (m.hooksCreated > 0)    lines.push(`• Created ${m.hooksCreated} hook${m.hooksCreated !== 1 ? 's' : ''} for A/B testing`);
    if (m.revisionRounds > 0)  lines.push(`• Completed ${m.revisionRounds} revision round${m.revisionRounds !== 1 ? 's' : ''}`);
    if (m.renderExports > 0)   lines.push(`• Exported ${m.renderExports} render${m.renderExports !== 1 ? 's' : ''}`);
    if (m.videosDelivered > 0) sentiment = 'Happy';

  } else if (role === 'GraphicDesigner') {
    if (m.creativesCompleted > 0) lines.push(`• Completed ${m.creativesCompleted} creative${m.creativesCompleted !== 1 ? 's' : ''}`);
    if (m.variationsMade > 0)     lines.push(`• Made ${m.variationsMade} variation${m.variationsMade !== 1 ? 's' : ''}`);
    if (m.clientRevisions > 0)    lines.push(`• Handled ${m.clientRevisions} client revision${m.clientRevisions !== 1 ? 's' : ''}`);
    if (m.conceptsPresented > 0)  lines.push(`• Presented ${m.conceptsPresented} concept${m.conceptsPresented !== 1 ? 's' : ''}`);
    if (m.creativesCompleted > 2) sentiment = 'Happy';

  } else if (role === 'SMM') {
    if (m.leadsGenerated > 0)   lines.push(`• Generated ${m.leadsGenerated} lead${m.leadsGenerated !== 1 ? 's' : ''}${m.cpl ? ` at ₹${m.cpl} CPL` : ''}`);
    if (m.adSpend > 0)          lines.push(`• Managed ₹${Number(m.adSpend).toLocaleString()} ad spend`);
    if (m.campaignsManaged > 0) lines.push(`• Managed ${m.campaignsManaged} campaign${m.campaignsManaged !== 1 ? 's' : ''}`);
    if (m.contentPosted > 0)    lines.push(`• Posted ${m.contentPosted} content piece${m.contentPosted !== 1 ? 's' : ''}`);
    if (m.leadsGenerated > 10)  sentiment = 'Happy';

  } else if (role === 'ContentWriter') {
    if (m.articlesWritten > 0) lines.push(`• Wrote ${m.articlesWritten} article${m.articlesWritten !== 1 ? 's' : ''}${m.wordsWritten ? ` (${Number(m.wordsWritten).toLocaleString()} words)` : ''}`);
    if (m.socialCaptions > 0)  lines.push(`• Created ${m.socialCaptions} social caption${m.socialCaptions !== 1 ? 's' : ''}`);
    if (m.emailsWritten > 0)   lines.push(`• Wrote ${m.emailsWritten} email${m.emailsWritten !== 1 ? 's' : ''}/script${m.emailsWritten !== 1 ? 's' : ''}`);
    if (m.seoPosts > 0)        lines.push(`• Published ${m.seoPosts} SEO post${m.seoPosts !== 1 ? 's' : ''}`);
    if (m.articlesWritten > 0) sentiment = 'Happy';

  } else if (role === 'Intern') {
    if (m.tasksCompleted > 0)   lines.push(`• Completed ${m.tasksCompleted} task${m.tasksCompleted !== 1 ? 's' : ''}`);
    if (m.hoursWorked > 0)      lines.push(`• Worked ${m.hoursWorked} hour${m.hoursWorked !== 1 ? 's' : ''}`);
    if (m.meetingsAttended > 0) lines.push(`• Attended ${m.meetingsAttended} meeting${m.meetingsAttended !== 1 ? 's' : ''}`);
    if (m.tasksCompleted > 3)   sentiment = 'Happy';
  }

  if (body.highlights) lines.push(`• ${body.highlights}`);
  if (body.blockers)   lines.push(`• Blocker: ${body.blockers}`);

  const bl = (body.blockers || '').toLowerCase();
  if (bl.includes('burnout') || bl.includes('overwhelm') || bl.length > 80) {
    sentiment = bl.includes('burnout') ? 'Burnout' : 'Stressed';
  }

  return {
    aiSummary: lines.length ? lines.join('\n') : `${name} submitted their daily report.`,
    sentiment,
  };
}
