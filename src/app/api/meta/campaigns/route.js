import { connectDB } from '@/lib/db';
import Campaign from '@/lib/models/Campaign';
import { getSession, authResponse } from '@/lib/auth';

const BASE    = 'https://graph.facebook.com/v18.0';
const TOKEN   = process.env.META_ACCESS_TOKEN;
const ACCOUNT = process.env.META_AD_ACCOUNT_ID;

async function metaFetch(path, params = {}) {
  const qs = new URLSearchParams({ access_token: TOKEN, ...params }).toString();
  const res = await fetch(`${BASE}${path}?${qs}`);
  return res.json();
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return authResponse();

  const { searchParams } = new URL(req.url);
  const dateRange = searchParams.get('range') || '30d';

  if (!TOKEN) {
    return Response.json({ success: true, campaigns: getMockCampaigns(), trend: getMockTrend(), isMock: true });
  }

  await connectDB();
  try {
    const datePreset = dateRange === '7d' ? 'last_7d' : dateRange === '14d' ? 'last_14d' : 'last_30d';

    const data = await metaFetch(`/${ACCOUNT}/campaigns`, {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      limit: 25,
    });

    const campaigns = [];
    for (const c of (data.data || [])) {
      const [insightRes, adsetRes] = await Promise.all([
        metaFetch(`/${c.id}/insights`, { fields: 'spend,impressions,clicks,actions', date_preset: datePreset }),
        metaFetch(`/${c.id}/adsets`, { fields: 'id,name,status,daily_budget', limit: 10 }),
      ]);
      const insight = insightRes.data?.[0] || {};
      const leadActions = (insight.actions || []).find(a => a.action_type === 'lead')?.value || 0;
      const spend  = parseFloat(insight.spend || 0);
      const leads  = parseInt(leadActions);

      const adsets = (adsetRes.data || []).map(as => ({
        id: as.id, name: as.name, status: as.status,
        dailyBudget: parseInt(as.daily_budget || 0) / 100,
      }));

      const camp = await Campaign.findOneAndUpdate(
        { metaCampaignId: c.id },
        {
          metaCampaignId: c.id,
          name: c.name, status: c.status, objective: c.objective,
          spend, impressions: parseInt(insight.impressions || 0),
          clicks: parseInt(insight.clicks || 0), leads,
          cpl: leads > 0 ? Math.round(spend / leads * 100) / 100 : 0,
          dailyBudget: parseInt(c.daily_budget || 0) / 100,
          lifetimeBudget: parseInt(c.lifetime_budget || 0) / 100,
          lastSyncAt: new Date(),
        },
        { upsert: true, new: true }
      );
      campaigns.push({ ...camp.toObject(), adsets });
    }

    return Response.json({ success: true, campaigns, trend: buildTrendFromCampaigns(campaigns) });
  } catch (err) {
    console.error('Meta campaigns error:', err.message);
    return Response.json({ success: true, campaigns: getMockCampaigns(), trend: getMockTrend(), isMock: true, error: err.message });
  }
}

export async function PATCH(req) {
  const session = await getSession();
  if (!session) return authResponse();

  const { campaignId, action, budget } = await req.json();
  if (!TOKEN) return Response.json({ success: false, message: 'Meta access token not configured.' }, { status: 400 });

  try {
    let body;
    if (action === 'pause')               body = { status: 'PAUSED' };
    if (action === 'resume')              body = { status: 'ACTIVE' };
    if (action === 'budget' && budget)    body = { daily_budget: String(budget * 100) };

    const res  = await fetch(`${BASE}/${campaignId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, access_token: TOKEN }),
    });
    const data = await res.json();

    if (data.success) {
      await connectDB();
      await Campaign.findOneAndUpdate({ metaCampaignId: campaignId }, {
        ...(action === 'pause'  && { status: 'PAUSED' }),
        ...(action === 'resume' && { status: 'ACTIVE' }),
        ...(action === 'budget' && { dailyBudget: budget }),
      });
    }
    return Response.json({ success: !!data.success, data });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

function buildTrendFromCampaigns(campaigns) {
  const spend = campaigns.reduce((a, c) => a + (c.spend || 0), 0);
  const leads = campaigns.reduce((a, c) => a + (c.leads || 0), 0);
  return getMockTrend(spend, leads);
}

function getMockTrend(totalSpend = 13200, totalLeads = 238) {
  const days = [];
  const now  = new Date();
  const spendPerDay = totalSpend / 7;
  const leadsPerDay = totalLeads / 7;
  const factors = [0.82, 1.1, 0.95, 1.18, 0.88, 1.25, 0.97];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const f = factors[6 - i];
    days.push({
      date:   d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      spend:  Math.round(spendPerDay * f),
      leads:  Math.round(leadsPerDay * f),
    });
  }
  return days;
}

function getMockCampaigns() {
  return [
    {
      _id: 'c1', metaCampaignId: 'c1',
      name: 'DotGanga — Summer Offer', status: 'ACTIVE', objective: 'LEAD_GENERATION',
      spend: 4800, impressions: 128400, clicks: 2640, leads: 84, cpl: 57.14,
      dailyBudget: 500, lifetimeBudget: 0, lastSyncAt: new Date(),
      adsets: [
        { id: 'as1', name: 'Jodhpur 25–35 · Lookalike', status: 'ACTIVE', spend: 2100, leads: 42, cpl: 50.0, dailyBudget: 220 },
        { id: 'as2', name: 'Jaipur 30–45 · Interest',   status: 'ACTIVE', spend: 1800, leads: 30, cpl: 60.0, dailyBudget: 180 },
        { id: 'as3', name: 'Mumbai Retargeting',         status: 'PAUSED', spend: 900,  leads: 12, cpl: 75.0, dailyBudget: 100 },
      ],
    },
    {
      _id: 'c2', metaCampaignId: 'c2',
      name: 'Real Estate Leads Q2', status: 'ACTIVE', objective: 'LEAD_GENERATION',
      spend: 7200, impressions: 210000, clicks: 3900, leads: 132, cpl: 54.54,
      dailyBudget: 800, lifetimeBudget: 0, lastSyncAt: new Date(),
      adsets: [
        { id: 'as4', name: 'Buyers 35–55 · Broad',      status: 'ACTIVE', spend: 3600, leads: 72, cpl: 50.0, dailyBudget: 400 },
        { id: 'as5', name: 'Investors · LAL 1%',         status: 'ACTIVE', spend: 2400, leads: 44, cpl: 54.5, dailyBudget: 260 },
        { id: 'as6', name: 'NRI Targeting',              status: 'ACTIVE', spend: 1200, leads: 16, cpl: 75.0, dailyBudget: 140 },
      ],
    },
    {
      _id: 'c3', metaCampaignId: 'c3',
      name: 'Brand Awareness — Jodhpur', status: 'PAUSED', objective: 'BRAND_AWARENESS',
      spend: 1200, impressions: 98000, clicks: 1100, leads: 22, cpl: 54.54,
      dailyBudget: 200, lifetimeBudget: 0, lastSyncAt: new Date(),
      adsets: [
        { id: 'as7', name: 'Jodhpur 18–45 · Video',     status: 'PAUSED', spend: 800,  leads: 14, cpl: 57.1, dailyBudget: 130 },
        { id: 'as8', name: 'Jodhpur Stories',            status: 'PAUSED', spend: 400,  leads: 8,  cpl: 50.0, dailyBudget: 70 },
      ],
    },
  ];
}
