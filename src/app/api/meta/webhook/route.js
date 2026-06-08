import { connectDB } from '@/lib/db';
import Lead from '@/lib/models/Lead';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

// GET: webhook verification (Meta challenge)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST: receive real-time leads from Meta
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (body.object !== 'page') {
      return Response.json({ success: false, message: 'Not a page event.' }, { status: 400 });
    }

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'leadgen') continue;

        const value       = change.value;
        const leadgenId   = value.leadgen_id;
        const adId        = value.ad_id;
        const adName      = value.ad_name    || '';
        const campaignId  = value.campaign_id || '';
        const formId      = value.form_id    || '';

        // Fetch full lead data from Meta Graph API
        let leadData = {};
        try {
          const metaRes = await fetch(
            `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${process.env.META_ACCESS_TOKEN}`
          );
          leadData = await metaRes.json();
        } catch { /* no API token yet — use what we have */ }

        // Map Meta field_data to our schema
        const fields = {};
        (leadData.field_data || []).forEach(f => {
          fields[f.name] = f.values?.[0] || '';
        });

        const lead = await Lead.create({
          name:         fields.full_name || fields.name || 'Meta Lead',
          phone:        fields.phone_number || fields.mobile || '',
          email:        fields.email || '',
          company:      fields.company_name || '',
          message:      fields.message || fields.comments || '',
          source:       'Meta Ads',
          metaLeadId:   leadgenId,
          metaAdId:     adId,
          metaAdName:   adName,
          metaCampaign: campaignId,
          metaFormId:   formId,
          activities: [{
            type: 'meta',
            message: `Real-time lead from Meta Ad "${adName}" (Campaign: ${campaignId})`,
            by: 'Meta Ads',
          }],
        });

        console.log('✅ New Meta lead saved:', lead.name);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Meta webhook error:', err);
    return Response.json({ success: false }, { status: 500 });
  }
}
