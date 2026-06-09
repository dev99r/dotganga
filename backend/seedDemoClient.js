/**
 * seedDemoClient.js — creates a fully-loaded demo client "Bella Vista Restaurant"
 * with posts, meta campaigns, insights, and a client login.
 *
 * Run: node backend/seedDemoClient.js
 * Login: priya@bellavista.com  /  BellaVista@2026
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User          = require('./models/User');
const Client        = require('./models/Client');
const Post          = require('./models/Post');
const MetaCampaign  = require('./models/MetaCampaign');
const MetaInsights  = require('./models/MetaInsights');

// ─── helpers ──────────────────────────────────────────────────────────────────
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick  = (arr)      => arr[Math.floor(Math.random() * arr.length)];
const days  = (n)        => n * 24 * 60 * 60 * 1000;

function dateInJune(day, hour = 10, min = 0) {
  return new Date(2026, 5, day, hour, min, 0); // month is 0-indexed → 5 = June
}

// ─── post content bank ────────────────────────────────────────────────────────
const POSTS = [
  // REELS — Posted / Approved
  {
    category: 'Reel',
    platforms: ['Instagram', 'Facebook'],
    caption: `✨ Our Chef's secret pasta — made with love and 3 kinds of cheese! Every bite is an experience you won't forget. Come taste it yourself this weekend. 🍝\n\nOpen daily 12 PM – 11 PM | Reservations: +91 98765 43210`,
    hashtags: '#BellaVista #PastaLover #ItalianFood #MumbaiEats #FoodReel #ChefSpecial #FoodiesOfInstagram',
    scheduledDate: dateInJune(2, 11, 0),
    postedAt:      dateInJune(2, 11, 5),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: 'Looks perfect! Go live.',
    script: {
      hook: 'Three cheeses. One pasta. Zero regrets.',
      body: 'Watch our chef hand-fold the pasta dough, layer in the ricotta, mozzarella and parmesan, then bake to golden perfection.',
      cta:  'Save this for your next date night 🍷',
      voiceover: 'At Bella Vista, every dish is crafted with passion…',
    },
  },
  {
    category: 'Reel',
    platforms: ['Instagram'],
    caption: `🌅 Sunday brunch just got an upgrade! Our rooftop setup is LIVE — fresh juices, live music, and the best view of the city. Limited seats every Sunday.\n\nBook your table NOW → link in bio 🔗`,
    hashtags: '#SundayBrunch #RooftopDining #BellaVistaMumbai #BrunchVibes #MumbaiWeekend #FoodBlogger',
    scheduledDate: dateInJune(5, 9, 0),
    postedAt:      dateInJune(5, 9, 10),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: 'Client loved the rooftop angle. Approved!',
  },
  {
    category: 'Reel',
    platforms: ['Instagram', 'Facebook'],
    caption: `🔥 Our signature BBQ Platter is BACK by popular demand! 6 cuts. 2 sauces. Pure fire. Tag someone who deserves a cheat day. 😈\n\nAvailable Friday–Sunday only. Limited portions daily.`,
    hashtags: '#BBQPlatter #BellaVistaSpecial #WeekendVibes #MeatLovers #FoodReel #MumbaiFood #CheatDay',
    scheduledDate: dateInJune(7, 18, 30),
    postedAt:      dateInJune(7, 18, 35),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: '',
  },

  // CAROUSELS — Mix
  {
    category: 'Carousel',
    platforms: ['Instagram', 'Facebook'],
    caption: `🍕 Swipe to build your perfect pizza! ➡️\n\nAt Bella Vista we let YOU customise every topping, base, and sauce. Because your pizza should taste like YOU.\n\nOrder online or dine in — link in bio.`,
    hashtags: '#CustomPizza #BellaVistaPizza #PizzaLovers #MumbaiPizza #FoodCustomization #BuildYourPizza',
    scheduledDate: dateInJune(3, 12, 0),
    postedAt:      dateInJune(3, 12, 5),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: 'Great carousel flow. Approved.',
  },
  {
    category: 'Carousel',
    platforms: ['Instagram'],
    caption: `🌿 Meet your new favourite — our plant-based menu! ➡️\n\nSwipe through 8 dishes that prove healthy eating never has to be boring. From truffle mushroom risotto to Thai green curry — all 100% plant power.\n\n#EatGreen at Bella Vista.`,
    hashtags: '#PlantBased #VeganMumbai #HealthyEating #BellaVistaVegan #GreenFood #PlantPower #MumbaiVegan',
    scheduledDate: dateInJune(9, 10, 0),
    status: 'Scheduled',
    approvalStatus: 'Approved',
    approvalNote: 'Client approved. Schedule as planned.',
  },
  {
    category: 'Carousel',
    platforms: ['Instagram', 'Facebook'],
    caption: `💍 Planning a private event? We've got you covered!\n\nSwipe to see our Private Dining Hall — perfect for birthdays, anniversaries, corporate dinners and proposals. Fully customisable décor, curated menu, private bar.\n\nDM us to check availability! 💌`,
    hashtags: '#PrivateDining #EventVenueMumbai #BirthdayDinner #CorporateDinner #BellaVistaEvents #AnniversaryDinner',
    scheduledDate: dateInJune(11, 14, 0),
    status: 'Scheduled',
    approvalStatus: 'Pending',
  },

  // STORIES — Posted
  {
    category: 'Story',
    platforms: ['Instagram'],
    caption: `📍 We're open today! Come say hi 👋\nHours: 12 PM – 11 PM\nReservations: +91 98765 43210`,
    hashtags: '',
    scheduledDate: dateInJune(1, 10, 0),
    postedAt:      dateInJune(1, 10, 2),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: '',
  },
  {
    category: 'Story',
    platforms: ['Instagram', 'Facebook'],
    caption: `⏰ FLASH SALE — Today only!\n\n20% OFF all desserts when you show this story at the counter. Valid until 8 PM tonight. 🎂`,
    hashtags: '',
    scheduledDate: dateInJune(4, 16, 0),
    postedAt:      dateInJune(4, 16, 5),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: 'Quick approval — time-sensitive story.',
  },
  {
    category: 'Story',
    platforms: ['Instagram'],
    caption: `🌟 5-star review from @foodie_mumbai — "Best pasta in the city, hands down. The ambiance is divine!" ⭐⭐⭐⭐⭐\n\nThank you for the love! Drop your review on Google 🙏`,
    hashtags: '',
    scheduledDate: dateInJune(6, 13, 0),
    postedAt:      dateInJune(6, 13, 5),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: '',
  },
  {
    category: 'Story',
    platforms: ['Instagram'],
    caption: `🎉 TODAY is our 5th Anniversary!\n\nFree dessert for every table dining with us tonight. No code needed — just come celebrate with us! 🍰`,
    hashtags: '',
    scheduledDate: dateInJune(8, 11, 0),
    postedAt:      dateInJune(8, 11, 3),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: '',
  },

  // ORGANIC — Mix of posted & scheduled
  {
    category: 'Organic',
    platforms: ['Instagram', 'Facebook'],
    caption: `Good food. Good people. Good vibes. ❤️\n\nThat's the Bella Vista promise — every single day. Drop in tonight and let us take care of the rest.\n\nReservations via link in bio or WhatsApp +91 98765 43210`,
    hashtags: '#BellaVista #DineOut #MumbaiRestaurant #FoodLovers #GoodFood #RestaurantMumbai #FoodGram',
    scheduledDate: dateInJune(1, 19, 0),
    postedAt:      dateInJune(1, 19, 8),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: '',
  },
  {
    category: 'Organic',
    platforms: ['Facebook', 'Instagram'],
    caption: `🏆 We are THRILLED to announce — Bella Vista has been named "Best Italian Restaurant in Mumbai 2026" by @foodaward_india! 🥇\n\nThis award belongs to every customer who trusted us with their special moments. Thank you from the bottom of our hearts! 🙏`,
    hashtags: '#BestRestaurant #FoodAward #BellaVistaMumbai #ItalianFood #Proud #MumbaiEats #AwardWinning',
    scheduledDate: dateInJune(5, 14, 0),
    postedAt:      dateInJune(5, 14, 10),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: 'Exciting news post! Push immediately.',
  },
  {
    category: 'Organic',
    platforms: ['Instagram'],
    caption: `🌙 Late-night cravings? We're open until 11 PM.\n\nOur midnight menu features exclusive dishes only available after 9 PM — think truffle fries, burrata bruschetta, and our signature dessert board. Perfect for night owls. 🦉`,
    hashtags: '#LateNightFood #MidnightCravings #BellaVistaLate #MumbaiNightLife #FoodAtNight #LateNightMumbai',
    scheduledDate: dateInJune(10, 20, 0),
    status: 'Scheduled',
    approvalStatus: 'Pending',
  },
  {
    category: 'Organic',
    platforms: ['Instagram', 'Facebook'],
    caption: `👨‍🍳 Chef's table experience — an intimate 6-course dinner prepared right in front of you by Chef Rahul!\n\nOnly 8 seats available every Friday. Book in advance — DM us or call +91 98765 43210.\n\nPrice: ₹3,500 per person inclusive of wine pairing.`,
    hashtags: '#ChefsTable #FineKining #BellaVistaExclusive #6Course #MumbaiDining #ChefRahul #ExclusiveDining',
    scheduledDate: dateInJune(12, 11, 0),
    status: 'Scheduled',
    approvalStatus: 'Pending',
  },

  // AD CREATIVE — Mix
  {
    category: 'Ad Creative',
    platforms: ['Instagram', 'Facebook'],
    caption: `🍝 Mumbai's finest Italian, now with FREE home delivery!\n\nOrder ₹999+ and get FREE delivery anywhere in South Mumbai. Use code BELLA20 for 20% off your first order! 🛵\n\nOrder now → link in bio`,
    hashtags: '#BellaVistaDelivery #FreeDelivery #ItalianFood #OnlineOrder #MumbaiFood #FoodDelivery',
    scheduledDate: dateInJune(3, 10, 0),
    postedAt:      dateInJune(3, 10, 5),
    status: 'Posted',
    approvalStatus: 'Approved',
    approvalNote: 'Ad creative approved. Running on Meta.',
    aiGenerated: true,
  },
  {
    category: 'Ad Creative',
    platforms: ['Instagram', 'Facebook'],
    caption: `🎁 GIFT A DINING EXPERIENCE!\n\nBella Vista Gift Cards — starting from ₹1,000. Perfect for birthdays, anniversaries, and corporate gifting. Valid for 1 year.\n\nBuy online → link in bio | DM for bulk orders 💌`,
    hashtags: '#GiftCard #DiningExperience #BellaVistaGift #MumbaiRestaurant #GiftIdea #CorporateGifting',
    scheduledDate: dateInJune(8, 10, 0),
    status: 'Scheduled',
    approvalStatus: 'Revision',
    approvalNote: 'Please update the gift card visual with the new pricing. The ₹1,000 minimum should be larger text.',
    aiGenerated: true,
  },
  {
    category: 'Ad Creative',
    platforms: ['Facebook'],
    caption: `🚨 WEEKEND OFFER — Book a table for 4 and get a complimentary bottle of house wine!\n\nThis weekend only. Limited tables. Reserve yours before they're gone!\n\nCall: +91 98765 43210`,
    hashtags: '',
    scheduledDate: dateInJune(6, 9, 0),
    postedAt:      dateInJune(6, 9, 5),
    status: 'Posted',
    approvalStatus: 'Rejected',
    approvalNote: 'The wine offer might not comply with local advertising restrictions. Please remove the wine mention and resubmit.',
  },
  {
    category: 'Ad Creative',
    platforms: ['Instagram', 'Facebook'],
    caption: `🌟 Table for 2 — date night done right!\n\nBook Bella Vista's exclusive couple's corner: rose petals, candle light, 3-course dinner + dessert. All for just ₹2,800 per couple.\n\nAvailable Friday & Saturday. DM to book or call +91 98765 43210. ❤️`,
    hashtags: '#DateNight #CouplesCorner #BellaVistaRomance #ValentinesDinner #RomanticDinner #MumbaiDating',
    scheduledDate: dateInJune(13, 10, 0),
    status: 'Draft',
    approvalStatus: 'Pending',
    aiGenerated: true,
  },
];

// ─── meta campaign data ───────────────────────────────────────────────────────
const CAMPAIGNS = [
  {
    metaCampaignId: 'CAMP_BV_001',
    name: 'Bella Vista — Brand Awareness Q2',
    objective: 'BRAND_AWARENESS',
    status: 'ACTIVE',
    dailyBudget: 1500,
    startDate: new Date(2026, 4, 1),
  },
  {
    metaCampaignId: 'CAMP_BV_002',
    name: 'Bella Vista — Lead Generation (Reservations)',
    objective: 'LEAD_GENERATION',
    status: 'ACTIVE',
    dailyBudget: 2500,
    startDate: new Date(2026, 4, 15),
  },
];

// ─── generate 30 days of realistic insights ──────────────────────────────────
function generateInsights(clientId, campaignId, campIdx) {
  const rows = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - days(i));
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const multiplier = isWeekend ? 1.6 : 1.0;
    const base = campIdx === 0 ? 1 : 1.4; // lead gen gets more spend

    const impressions = Math.round(rand(3000, 6000) * multiplier * base);
    const reach       = Math.round(impressions * rand(70, 85) / 100);
    const clicks      = Math.round(impressions * rand(18, 35) / 1000);
    const spend       = parseFloat((rand(800, 2200) * base / 100 * multiplier).toFixed(2));
    const conversions = Math.round(clicks * rand(5, 12) / 100);
    const leadCount   = campIdx === 1 ? Math.round(conversions * rand(60, 90) / 100) : 0;

    const cpm = impressions > 0 ? parseFloat((spend / impressions * 1000).toFixed(2)) : 0;
    const ctr = impressions > 0 ? parseFloat((clicks / impressions * 100).toFixed(2)) : 0;
    const cpc = clicks > 0      ? parseFloat((spend / clicks).toFixed(2)) : 0;
    const roas = campIdx === 1 && spend > 0 ? parseFloat((rand(250, 480) / 100).toFixed(2)) : 0;

    rows.push({ clientId, campaignId, date, impressions, reach, clicks, spend, conversions, leadCount, cpm, ctr, cpc, roas });
  }
  return rows;
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  // Find or create a super admin to act as createdBy
  let admin = await User.findOne({ role: { $in: ['Super Admin', 'Admin'] } }).lean();
  if (!admin) {
    console.error('❌ No admin user found. Please create an admin user first.');
    process.exit(1);
  }
  const adminId = admin._id;
  console.log(`👤 Using admin: ${admin.name} (${admin.email})`);

  // ── 1. Remove old demo data if exists ──────────────────────────────────────
  const existing = await Client.findOne({ email: 'contact@bellavista.in' });
  if (existing) {
    console.log('🗑️  Removing old Bella Vista demo data…');
    await Post.deleteMany({ clientId: existing._id });
    const camps = await MetaCampaign.find({ clientId: existing._id });
    for (const c of camps) await MetaInsights.deleteMany({ campaignId: c._id });
    await MetaCampaign.deleteMany({ clientId: existing._id });
    await User.deleteOne({ email: 'priya@bellavista.in' });
    await Client.deleteOne({ _id: existing._id });
    console.log('   Done.');
  }

  // ── 2. Create client ───────────────────────────────────────────────────────
  const client = await Client.create({
    businessName:  'Bella Vista Restaurant',
    contactName:   'Priya Sharma',
    email:         'contact@bellavista.in',
    phone:         '+91 98765 43210',
    website:       'www.bellavista.in',
    industry:      'Food & Beverage',
    services:      ['Social Media Management', 'Meta Ads', 'Reels Production', 'Content Strategy'],
    primaryPlatforms: ['Instagram', 'Facebook'],
    monthlyBudget: 75000,
    contentTargets: { Reel: 8, Carousel: 8, Story: 15, Organic: 10, 'Ad Creative': 5 },
    notes: 'Premium Italian restaurant in South Mumbai. 5th anniversary in June 2026. Focus on rooftop & private dining. Avoid alcohol promotion in ads per client instruction.',
    contractNote: 'Monthly retainer ₹45,000 + ₹30,000 ad spend managed. Contract runs Jan–Dec 2026.',
    metaConnected: true,
    metaAdAccountId: 'act_123456789',
    metaPageId: 'pg_bellavista_001',
    isActive: true,
    createdBy: adminId,
  });
  console.log(`🏪 Client created: ${client.businessName} (${client._id})`);

  // ── 3. Create client portal login ─────────────────────────────────────────
  const pwHash = await bcrypt.hash('BellaVista@2026', 10);
  const clientUser = await User.create({
    name:      'Priya Sharma',
    email:     'priya@bellavista.in',
    password:  pwHash,
    role:      'Client',
    clientRef: client._id,
    designation: 'Owner',
    isActive:  true,
  });
  // Link userRef back to client
  await Client.findByIdAndUpdate(client._id, { userRef: clientUser._id });
  console.log(`🔑 Client login created: priya@bellavista.in / BellaVista@2026`);

  // ── 4. Create posts ────────────────────────────────────────────────────────
  const postDocs = POSTS.map((p) => ({
    clientId:      client._id,
    createdBy:     adminId,
    platforms:     p.platforms,
    caption:       p.caption,
    hashtags:      p.hashtags || '',
    category:      p.category,
    scheduledDate: p.scheduledDate,
    postedAt:      p.postedAt || null,
    status:        p.status || 'Draft',
    approvalStatus:p.approvalStatus || 'Pending',
    approvalNote:  p.approvalNote || '',
    aiGenerated:   p.aiGenerated || false,
    script:        p.script || {},
    mediaUrls:     [],
  }));

  await Post.insertMany(postDocs);
  console.log(`📝 ${postDocs.length} posts created`);

  // ── 5. Create meta campaigns + insights ───────────────────────────────────
  for (let ci = 0; ci < CAMPAIGNS.length; ci++) {
    const cd = CAMPAIGNS[ci];
    const campaign = await MetaCampaign.create({ ...cd, clientId: client._id });
    console.log(`📊 Campaign: ${campaign.name}`);

    const insightRows = generateInsights(client._id, campaign._id, ci);
    await MetaInsights.insertMany(insightRows);
    console.log(`   ↳ ${insightRows.length} insight records`);
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════');
  console.log('✅  DEMO CLIENT SEEDED SUCCESSFULLY');
  console.log('════════════════════════════════════════════════════════');
  console.log('  Client       : Bella Vista Restaurant');
  console.log('  Industry     : Food & Beverage — Italian Restaurant, Mumbai');
  console.log('  Portal Login : priya@bellavista.in');
  console.log('  Password     : BellaVista@2026');
  console.log('  Posts        : 18 (Reels, Carousels, Stories, Organic, Ad Creative)');
  console.log('  Approvals    : Approved ✓ | Pending ⏳ | Revision ✏️ | Rejected ✕');
  console.log('  Campaigns    : 2 (Brand Awareness + Lead Gen)');
  console.log('  Ad Insights  : 30 days of spend, clicks, impressions, ROAS data');
  console.log('════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
