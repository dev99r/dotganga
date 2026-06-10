const express = require('express');
const router  = express.Router();
const https   = require('https');
const { protect, agencyStaff } = require('../middleware/auth');

// ─── Smart template captions (used when no API key) ──────────────────────────

const TEMPLATES = {
  Reel: [
    'Watch till the end — this one will surprise you! 🎬\n\n{hook}\n\nDouble tap if you agree! ❤️',
    'We\'ve been working on this for a while... and it\'s finally here 🔥\n\n{hook}\n\nSave this post for later!',
    'POV: You just discovered the best {industry} in town 👀\n\n{hook}\n\nFollow for more content like this!',
    'Nobody talks about this, so we will 🎯\n\n{hook}\n\nComment below what you think!',
  ],
  Carousel: [
    'Swipe to see all {count} reasons why {businessName} is different ➡️\n\n{hook}\n\nSave this — you\'ll need it later! 📌',
    '{count} things you didn\'t know about {industry} — swipe through! 👉\n\n{hook}\n\nWhich one surprised you? Comment below!',
    'The complete guide you\'ve been waiting for 📖\n\nSwipe through all {count} slides!\n\n{hook}',
  ],
  Story: [
    'Quick update from {businessName}! 👀\n\n{hook}\n\nDM us for details!',
    'Today only — {hook} ⚡\n\nSwipe up or DM NOW!',
    'Behind the scenes at {businessName} 🎬\n\n{hook}',
  ],
  Organic: [
    'Here\'s something we don\'t talk about enough…\n\n{hook}\n\nWhat do you think? Drop a comment below 👇',
    'A little story about {businessName} that changed everything ✨\n\n{hook}\n\nSave this post if it resonated with you!',
    'Grateful for every single one of you 🙏\n\n{hook}\n\nThank you for being part of our journey!',
    'The truth about {industry} that nobody tells you:\n\n{hook}\n\nTag someone who needs to see this 👇',
  ],
  'Ad Creative': [
    '🎯 Limited Time Offer — Don\'t Miss This!\n\n✅ {hook}\n✅ Guaranteed results\n✅ Trusted by hundreds\n\n📞 Call/DM NOW — Offer ends soon!',
    '🔥 Special Deal Alert!\n\n{hook}\n\nOnly a few spots left. Contact us TODAY! 📩',
    '⚡ Big Announcement from {businessName}!\n\n{hook}\n\nBe the first to grab this. DM for details! 👇',
  ],
};

const HOOKS = {
  'Food & Beverage':          ['Our secret recipe is finally revealed', 'Fresh, local, and made with love every single day', 'This dish took 3 years to perfect'],
  'Real Estate':               ['Your dream home is closer than you think', 'The market is moving fast — here\'s what you need to know', 'We found a hidden gem in the city'],
  'Health & Fitness':          ['This 10-minute routine changed everything for our members', 'The truth about weight loss that nobody tells you', 'Before and after — 30 days of hard work'],
  'Fashion & Apparel':         ['New collection just dropped and it\'s already selling out', 'This season\'s trending look, styled 3 different ways', 'Handcrafted with love — every stitch tells a story'],
  'Travel & Tourism':          ['This hidden spot in Rajasthan will take your breath away', 'The perfect 7-day itinerary for first-time visitors', 'Our guests\' reaction seeing the fort for the first time'],
  'Technology & IT':           ['We built something that saves our clients 10 hours a week', 'The one software mistake every business is making', 'Our latest project went live and the results are incredible'],
  'Healthcare':                ['Your smile transformation starts with one appointment', 'The question every patient asks us — here\'s the honest answer', 'Before and after — patient results that speak for themselves'],
  'Events & Wedding Planning': ['The wedding decor that made everyone stop and stare', '200 guests, 1 night, zero stress — here\'s how we did it', 'Your dream wedding is our masterpiece'],
  'default':                   ['We\'re doing things differently — here\'s how', 'The behind-the-scenes no one shows you', 'Big things are happening at our studio — stay tuned'],
};

const HASHTAGS_BY = {
  'Food & Beverage':  '#Foodie #RajasthaniFood #JodhpurFood #FoodPhotography #IndianCuisine #Yummy #FoodLover #ChefLife',
  'Real Estate':      '#RealEstate #JodhpurRealty #DreamHome #PropertyInvestment #HomeForSale #BlueCity #RealEstateAgent',
  'Health & Fitness': '#FitnessGoals #GymLife #WorkoutMotivation #HealthyLifestyle #FitIndia #Transformation #GymJodhpur',
  'Fashion & Apparel':'#EthnicWear #IndianFashion #BridalWear #KurtaCollection #WomenFashion #FashionBlogger #Jodhpur',
  'Travel & Tourism': '#RajasthanTourism #JodhpurDiaries #IncredibleIndia #TravelIndia #DesertLife #BlueCity #TravelPhotography',
  'Technology & IT':  '#Tech #Innovation #SoftwareDevelopment #DigitalTransformation #StartupIndia #B2B #TechSolutions',
  'Healthcare':       '#DentalCare #SmileTransformation #HealthcareIndia #DoctorLife #PatientCare #MedicalTourism',
  'Events & Wedding': '#WeddingDecor #WeddingPlanning #BridalInspiration #EventManagement #DreamWedding #WeddingPhotography',
  'default':          '#Jodhpur #Business #Marketing #Growth #Success #Entrepreneur #SocialMedia #DotGanga',
};

function buildCaption(category, industry, businessName) {
  const tpls  = TEMPLATES[category] || TEMPLATES.Organic;
  const hooks = HOOKS[industry]     || HOOKS.default;
  const tpl   = tpls[Math.floor(Math.random() * tpls.length)];
  const hook  = hooks[Math.floor(Math.random() * hooks.length)];
  return tpl
    .replace(/{hook}/g, hook)
    .replace(/{businessName}/g, businessName || 'us')
    .replace(/{industry}/g, (industry || 'business').toLowerCase())
    .replace(/{count}/g, String(Math.floor(Math.random() * 4) + 5));
}

// ─── Anthropic AI call (via raw https — no SDK needed) ───────────────────────

function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages:   [{ role: 'user', content: prompt }],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path:     '/v1/messages',
        method:   'POST',
        headers:  {
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type':      'application/json',
          'Content-Length':    Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed?.content?.[0]?.text || null);
          } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─── POST /api/ai/caption ─────────────────────────────────────────────────────

router.post('/caption', protect, agencyStaff, async (req, res) => {
  try {
    const { category, industry, businessName, platform, theme } = req.body;
    const tags = HASHTAGS_BY[industry] || HASHTAGS_BY.default;

    // Try Anthropic AI first
    const aiPrompt = `You are a social media expert for Indian businesses. Write a ${category} post caption for:
Business: ${businessName || 'a local business'}
Industry: ${industry || 'general'}
Platform: ${platform || 'Instagram'}
Theme/Topic: ${theme || 'general brand post'}

Requirements:
- 2-4 short punchy paragraphs
- Use 1-2 relevant emojis per paragraph
- End with a clear call-to-action (DM us, Call now, Follow for more, etc.)
- Sound authentic, not corporate
- Max 150 words

Return ONLY the caption text, no labels or explanations.`;

    const aiCaption = await callAnthropic(aiPrompt);

    if (aiCaption && aiCaption.length > 20) {
      return res.json({
        success: true,
        caption:  aiCaption.trim(),
        hashtags: tags,
        source:   'ai',
      });
    }

    // Fallback: smart template
    const caption = buildCaption(category, industry, businessName);
    res.json({
      success: true,
      caption,
      hashtags: tags,
      source: 'template',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/ai/hashtags ────────────────────────────────────────────────────

router.post('/hashtags', protect, agencyStaff, async (req, res) => {
  try {
    const { industry, category, platform, caption } = req.body;
    const base = HASHTAGS_BY[industry] || HASHTAGS_BY.default;

    const aiPrompt = `Generate 15 relevant Instagram/Facebook hashtags for this post:

Industry: ${industry || 'general business'}
Category: ${category}
Caption preview: ${(caption || '').slice(0, 100)}

Rules:
- Mix of high-traffic (#Foodie 50M+) and niche (#JodhpurFood 50K) tags
- Include 2-3 location-based India/Rajasthan/Jodhpur tags
- No spaces in hashtags
- Return ONLY hashtags separated by spaces, nothing else`;

    const aiTags = await callAnthropic(aiPrompt);

    res.json({
      success:  true,
      hashtags: aiTags?.trim() || base,
      source:   aiTags ? 'ai' : 'template',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
