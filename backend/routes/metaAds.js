const express       = require('express');
const router        = express.Router();
const Client        = require('../models/Client');
const MetaCampaign  = require('../models/MetaCampaign');
const MetaInsights  = require('../models/MetaInsights');
const { protect, agencyStaff } = require('../middleware/auth');

const META_APP_ID     = process.env.META_APP_ID     || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_REDIRECT   = process.env.META_REDIRECT_URI || '';

// GET /api/meta-ads/auth-url/:clientId — get OAuth URL
router.get('/auth-url/:clientId', protect, agencyStaff, async (req, res) => {
  try {
    if (!META_APP_ID) {
      return res.status(400).json({ success: false, message: 'Meta App ID not configured.' });
    }
    const scope = 'ads_read,ads_management,pages_read_engagement';
    const state = Buffer.from(JSON.stringify({ clientId: req.params.clientId, userId: req.user._id })).toString('base64');
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT)}&scope=${scope}&state=${state}&response_type=code`;
    res.json({ success: true, url });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/meta-ads/callback — OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(`${process.env.FRONTEND_URL}/admin?meta_error=${error}`);

    const { clientId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT)}&client_secret=${META_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // Get long-lived token
    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const llData = await llRes.json();

    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + (llData.expires_in || 5183944));

    await Client.findByIdAndUpdate(clientId, {
      metaAccessToken:       llData.access_token || tokenData.access_token,
      metaAccessTokenExpiry: expiry,
      metaConnected:         true,
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?meta_connected=1`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?meta_error=${err.message}`);
  }
});

// GET /api/meta-ads/campaigns/:clientId — list campaigns
router.get('/campaigns/:clientId', protect, agencyStaff, async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId).select('+metaAccessToken');
    if (!client || !client.metaConnected) {
      return res.status(400).json({ success: false, message: 'Meta Ads not connected for this client.' });
    }

    // Try to sync from Meta API if token available
    if (client.metaAccessToken && client.metaAdAccountId) {
      try {
        const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time';
        const apiRes = await fetch(
          `https://graph.facebook.com/v19.0/act_${client.metaAdAccountId}/campaigns?fields=${fields}&access_token=${client.metaAccessToken}`
        );
        const apiData = await apiRes.json();

        if (apiData.data) {
          for (const camp of apiData.data) {
            await MetaCampaign.findOneAndUpdate(
              { clientId: client._id, metaCampaignId: camp.id },
              {
                clientId: client._id,
                metaCampaignId: camp.id,
                name: camp.name,
                objective: camp.objective,
                status: camp.status,
                dailyBudget: camp.daily_budget ? camp.daily_budget / 100 : 0,
                lifetimeBudget: camp.lifetime_budget ? camp.lifetime_budget / 100 : 0,
                startDate: camp.start_time,
                endDate: camp.stop_time,
              },
              { upsert: true, new: true }
            );
          }
        }
      } catch (_) {}
    }

    const campaigns = await MetaCampaign.find({ clientId: req.params.clientId }).sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/meta-ads/insights/:clientId — aggregated insights
router.get('/insights/:clientId', protect, agencyStaff, async (req, res) => {
  try {
    const { from, to, campaignId } = req.query;
    const filter = { clientId: req.params.clientId };
    if (campaignId) filter.campaignId = campaignId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const insights = await MetaInsights.find(filter)
      .populate('campaignId', 'name status')
      .sort({ date: -1 })
      .limit(90);

    // Aggregate totals
    const totals = insights.reduce((acc, i) => {
      acc.impressions  += i.impressions;
      acc.clicks       += i.clicks;
      acc.spend        += i.spend;
      acc.reach        += i.reach;
      acc.conversions  += i.conversions;
      acc.leadCount    += i.leadCount;
      return acc;
    }, { impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0, leadCount: 0 });

    totals.ctr  = totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0;
    totals.cpm  = totals.impressions ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : 0;
    totals.cpc  = totals.clicks      ? (totals.spend / totals.clicks).toFixed(2) : 0;

    res.json({ success: true, insights, totals });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/meta-ads/sync/:clientId — manual sync insights from Meta API
router.post('/sync/:clientId', protect, agencyStaff, async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId).select('+metaAccessToken');
    if (!client || !client.metaConnected || !client.metaAdAccountId) {
      return res.status(400).json({ success: false, message: 'Meta not connected or ad account missing.' });
    }

    const campaigns = await MetaCampaign.find({ clientId: client._id, status: 'ACTIVE' });
    let synced = 0;

    for (const camp of campaigns) {
      try {
        const fields = 'impressions,clicks,spend,reach,cpm,ctr,cpc,actions';
        const since  = req.body.since || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const until  = req.body.until || new Date().toISOString().slice(0, 10);

        const apiRes = await fetch(
          `https://graph.facebook.com/v19.0/${camp.metaCampaignId}/insights?fields=${fields}&time_range[since]=${since}&time_range[until]=${until}&time_increment=1&access_token=${client.metaAccessToken}`
        );
        const apiData = await apiRes.json();
        if (!apiData.data) continue;

        for (const row of apiData.data) {
          const leads = row.actions?.find(a => a.action_type === 'lead')?.value || 0;
          const convs = row.actions?.find(a => a.action_type === 'offsite_conversion')?.value || 0;
          await MetaInsights.findOneAndUpdate(
            { clientId: client._id, campaignId: camp._id, date: new Date(row.date_start) },
            {
              impressions: Number(row.impressions) || 0,
              clicks:      Number(row.clicks) || 0,
              spend:       Number(row.spend) || 0,
              reach:       Number(row.reach) || 0,
              cpm:         Number(row.cpm) || 0,
              ctr:         Number(row.ctr) || 0,
              cpc:         Number(row.cpc) || 0,
              conversions: Number(convs),
              leadCount:   Number(leads),
              syncedAt:    new Date(),
            },
            { upsert: true }
          );
          synced++;
        }
      } catch (_) {}
    }

    res.json({ success: true, message: `Synced ${synced} insight records.`, synced });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/meta-ads/disconnect/:clientId
router.put('/disconnect/:clientId', protect, agencyStaff, async (req, res) => {
  try {
    await Client.findByIdAndUpdate(req.params.clientId, {
      metaConnected: false, metaAccessToken: '', metaAdAccountId: '',
    });
    res.json({ success: true, message: 'Meta Ads disconnected.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
