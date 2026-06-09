/**
 * DotGanga — Full Seed Script
 * Run: node seed.js
 *
 * Creates 3 clients, 5 users (SMM / Meta Manager / 3 client logins),
 * a full month of social media posts, Meta campaigns, 30 days of insights,
 * approvals, media library entries, notifications, tasks and leads.
 */

require('dotenv').config();
const mongoose     = require('mongoose');
const bcrypt       = require('bcryptjs');
const User         = require('./models/User');
const Client       = require('./models/Client');
const Post         = require('./models/Post');
const Approval     = require('./models/Approval');
const MetaCampaign = require('./models/MetaCampaign');
const MetaInsights = require('./models/MetaInsights');
const MediaLibrary = require('./models/MediaLibrary');
const Notification = require('./models/Notification');
const Lead         = require('./models/Lead');
const Task         = require('./models/Task');

// ─── helpers ──────────────────────────────────────────────────────────────────
const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(10, 0, 0, 0);
  return d;
};

const rand   = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── seed data ────────────────────────────────────────────────────────────────
const CLIENTS_DATA = [
  {
    businessName: 'Acme Fashion',
    contactName:  'Riya Kapoor',
    email:        'riya@acmefashion.com',
    phone:        '9876543210',
    website:      'https://acmefashion.com',
    industry:     'Fashion',
    services:     ['Social Media', 'Meta Ads', 'Graphic Design', 'Shoot'],
    notes:        'Top priority client. Seasonal campaigns planned for every quarter.',
    logoUrl:      'https://api.dicebear.com/7.x/initials/svg?seed=AF&backgroundColor=ec4899&textColor=ffffff',
    metaConnected: true,
    metaAdAccountId: 'act_123456789',
  },
  {
    businessName: 'TechVibe Solutions',
    contactName:  'Arun Kumar',
    email:        'arun@techvibe.in',
    phone:        '9845012345',
    website:      'https://techvibe.in',
    industry:     'Tech',
    services:     ['Social Media', 'Meta Ads', 'Content Writing', 'SEO'],
    notes:        'B2B SaaS company. Focus on LinkedIn and thought leadership content.',
    logoUrl:      'https://api.dicebear.com/7.x/initials/svg?seed=TV&backgroundColor=3b82f6&textColor=ffffff',
    metaConnected: true,
    metaAdAccountId: 'act_987654321',
  },
  {
    businessName: 'FoodieHub',
    contactName:  'Sunita Patel',
    email:        'sunita@foodiehub.in',
    phone:        '9900112233',
    website:      'https://foodiehub.in',
    industry:     'Food & Beverage',
    services:     ['Social Media', 'Shoot', 'Video Editing', 'Graphic Design'],
    notes:        'Restaurant chain. Heavy on reels and food photography.',
    logoUrl:      'https://api.dicebear.com/7.x/initials/svg?seed=FH&backgroundColor=f59e0b&textColor=ffffff',
    metaConnected: false,
  },
];

const UNSPLASH_IMGS = {
  Fashion: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
  ],
  Tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
    'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=400',
  ],
  'Food & Beverage': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  ],
};

const POST_TEMPLATES = {
  Acme: [
    { caption: '✨ New arrivals just dropped! Our Summer Luxe collection is here — crafted for those who live boldly. Shop now and express yourself like never before. 🌸', hashtags: '#AcmeFashion #SummerCollection #NewArrival #OOTD #FashionIndia', category: 'Reel', platforms: ['Instagram', 'Facebook'] },
    { caption: '🛍️ Weekend sale is LIVE! Up to 40% off on our bestsellers. Your favourite styles, now at prices you\'ll love. Hurry — limited stock! 🔥', hashtags: '#WeekendSale #AcmeFashion #SaleAlert #FashionDeals #IndianFashion', category: 'Carousel', platforms: ['Instagram', 'Facebook'] },
    { caption: '💫 Behind the seams — see how our artisans bring each piece to life. Craftsmanship meets contemporary design. Tag someone who appreciates good fashion!', hashtags: '#BehindTheScenes #AcmeFashion #Handcrafted #FashionDesign', category: 'Reel', platforms: ['Instagram'] },
    { caption: '🌟 Style tip: Mix and match our separates for 5 different looks from just 3 pieces! Versatility is the new luxury. Which combo is your fav?', hashtags: '#StyleTips #OOTD #AcmeFashion #FashionHacks #MixAndMatch', category: 'Carousel', platforms: ['Instagram', 'Facebook'] },
    { caption: '💎 Introducing our exclusive Festive Edit — because celebrations deserve extraordinary style. Pre-order now and be the first to wear magic. ✨', hashtags: '#FestiveCollection #AcmeFashion #FestiveFashion #Diwali2024', category: 'Organic', platforms: ['Instagram', 'Facebook', 'LinkedIn'] },
    { caption: '📸 Real women, real style. Meet our community models wearing the Acme Summer Line. Beauty in every shape, style in every choice. 💕', hashtags: '#RealBeauty #AcmeFashion #CommunityLove #BodyPositive', category: 'Story', platforms: ['Instagram'] },
    { caption: '🎬 It\'s here! Our exclusive fashion film — Summer in the City. Watch full video on YouTube. Link in bio. 🌆', hashtags: '#FashionFilm #AcmeFashion #SummerVibes', category: 'Reel', platforms: ['Instagram', 'YouTube'] },
    { caption: '💡 Customer spotlight: "I\'ve never felt more confident!" — Meera, Mumbai. Share YOUR Acme story and get featured. 🌟', hashtags: '#CustomerLove #AcmeFashion #Testimonial #HappyCustomer', category: 'Organic', platforms: ['Instagram', 'Facebook'] },
    { caption: '🌺 Our bestselling Floral Kurta is BACK in stock! Limited pieces available. Shop now before it sells out — again! 😍', hashtags: '#Restock #AcmeFashion #FloralKurta #BestSeller', category: 'Carousel', platforms: ['Instagram', 'Facebook'] },
    { caption: '✈️ Style doesn\'t take vacations. Pack smart with our travel collection — wrinkle-resistant, breathable, and effortlessly chic. 🧳', hashtags: '#TravelStyle #AcmeFashion #TravelOOTD #PackSmart', category: 'Reel', platforms: ['Instagram', 'Facebook'] },
  ],
  TechVibe: [
    { caption: '🚀 The future of work is AI-powered. TechVibe\'s new automation suite cuts operational costs by 60%. See how we helped 200+ SMBs transform. Read the case study →', hashtags: '#TechVibe #AIAutomation #DigitalTransformation #BusinessGrowth', category: 'Organic', platforms: ['LinkedIn', 'Twitter'] },
    { caption: '💡 5 signs your business needs a tech upgrade RIGHT NOW (and how to do it without disrupting operations). Thread 🧵', hashtags: '#TechTips #BusinessTech #TechVibe #DigitalStrategy', category: 'Carousel', platforms: ['LinkedIn', 'Twitter'] },
    { caption: '🏆 Proud to announce: TechVibe Solutions ranked #3 in "Best B2B SaaS Platforms 2024" by TechCrunch India! Thank you to our amazing customers. 🙏', hashtags: '#Award #TechVibe #SaaS #B2B #Recognition', category: 'Organic', platforms: ['LinkedIn', 'Facebook', 'Twitter'] },
    { caption: '🔐 Is your data really secure? Most companies think yes — until they\'re not. Our 5-point security audit checklist (free download, link in bio). 🛡️', hashtags: '#DataSecurity #Cybersecurity #TechVibe #CloudSecurity', category: 'Carousel', platforms: ['LinkedIn'] },
    { caption: '👥 "TechVibe\'s platform saved us 20 hours per week." — Founders at the helm share their story. Full interview now live on our blog.', hashtags: '#CustomerSuccess #TechVibe #Founders #GrowthStory', category: 'Organic', platforms: ['LinkedIn', 'Twitter'] },
    { caption: '📊 Q3 2024 State of B2B Tech Report is live! 500+ companies surveyed. The results will surprise you. Download free 👇', hashtags: '#TechReport #B2BTech #TechVibe #Research #Data', category: 'Organic', platforms: ['LinkedIn'] },
    { caption: '⚡ Product update: We just launched real-time analytics dashboard. Your business data, live, always. See the demo video!', hashtags: '#ProductUpdate #TechVibe #Analytics #RealTime #Dashboard', category: 'Reel', platforms: ['LinkedIn', 'Twitter', 'Facebook'] },
    { caption: '🌐 Hiring! TechVibe is looking for passionate engineers, designers and marketers. Remote-first culture. Build products that matter. Check open roles 👇', hashtags: '#Hiring #TechJobs #TechVibe #RemoteWork #TechCareers', category: 'Organic', platforms: ['LinkedIn', 'Twitter'] },
  ],
  FoodieHub: [
    { caption: '🔥 Introducing our NEW Butter Chicken Tacos! East meets West in the most delicious way possible. Available at all FoodieHub outlets. Tag who you\'re bringing! 🌮', hashtags: '#FoodieHub #ButterChickenTacos #NewLaunch #FoodLovers #Mumbai', category: 'Reel', platforms: ['Instagram', 'Facebook'] },
    { caption: '🍜 Sunday mornings = our Chef\'s Special Ramen. Slow-cooked broth, 48 hours in the making. Reserve your bowl now — they sell out fast! 🥢', hashtags: '#FoodieHub #SundayBrunch #Ramen #ChefSpecial #Foodstagram', category: 'Organic', platforms: ['Instagram', 'Facebook'] },
    { caption: '📸 Behind the plate — our chefs reveal the secret to our award-winning Dal Makhani. Watch till the end for the surprise ingredient! 👨‍🍳', hashtags: '#BehindTheScenes #FoodieHub #DalMakhani #ChefSecrets #Cooking', category: 'Reel', platforms: ['Instagram', 'YouTube'] },
    { caption: '🎉 Grand opening! FoodieHub Bandra is NOW OPEN! First 100 guests get 50% off their entire bill. Today only! Come celebrate with us! 🥳', hashtags: '#GrandOpening #FoodieHub #Bandra #Mumbai #FoodFestival', category: 'Carousel', platforms: ['Instagram', 'Facebook'] },
    { caption: '❤️ Nothing brings people together like great food. Share your FoodieHub moment — tag us and win a free dessert platter! 🍮', hashtags: '#FoodieHub #FoodCommunity #FoodLovers #TagUs #WinFree', category: 'Story', platforms: ['Instagram'] },
    { caption: '🌱 New on menu: Our Plant-Based Biryani is getting rave reviews! Vegan, gluten-free, and outrageously flavourful. Who\'s trying it first?', hashtags: '#Vegan #PlantBased #FoodieHub #BiryaniLovers #HealthyEating', category: 'Reel', platforms: ['Instagram', 'Facebook'] },
    { caption: '☕ Mornings made magical. Our new breakfast menu is now live — from masala chai to avocado toast. Because mornings deserve great food.', hashtags: '#Breakfast #FoodieHub #MorningVibes #Brunch #MumbaiEats', category: 'Carousel', platforms: ['Instagram', 'Facebook'] },
    { caption: '🍰 Dessert lovers, this one\'s for you! Our new Gulab Jamun Cheesecake just dropped and it\'s everything you never knew you needed. 😍', hashtags: '#Dessert #FoodieHub #GuabJamun #Cheesecake #IndianDessert', category: 'Organic', platforms: ['Instagram', 'Facebook'] },
  ],
};

const CATEGORIES = ['Reel','Carousel','Story','Organic','Ad Creative'];
const STATUSES   = ['Draft','Scheduled','Posted'];
const APPROVALS  = ['Pending','Approved','Rejected','Revision'];

async function run() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.\n');

  // ── 1. Clear agency-related collections ─────────────────────────────────────
  console.log('🗑️  Clearing previous seed data…');
  await Promise.all([
    Post.deleteMany({}),
    Approval.deleteMany({}),
    MetaCampaign.deleteMany({}),
    MetaInsights.deleteMany({}),
    MediaLibrary.deleteMany({}),
    Notification.deleteMany({}),
    Client.deleteMany({}),
    User.deleteMany({ role: { $in: ['SMM','Client','Meta Ads Manager'] } }),
  ]);

  // ── 2. Ensure admin user exists ─────────────────────────────────────────────
  let admin = await User.findOne({ role: 'Admin' });
  if (!admin) {
    admin = await User.create({ name:'DotGanga Admin', email:'admin@dotganga.com', password:'admin123', role:'Admin', department:'Management', designation:'Administrator' });
    console.log('👤 Admin created: admin@dotganga.com / admin123');
  } else {
    console.log('👤 Admin exists:', admin.email);
  }

  // ── 3. Create agency staff ───────────────────────────────────────────────────
  const smm = await User.create({
    name:'Priya Sharma', email:'priya@dotganga.com', password:'priya123',
    role:'SMM', department:'Creative', designation:'Senior Social Media Manager',
    phone:'9876540001',
  });
  const metaMgr = await User.create({
    name:'Rahul Verma', email:'rahul@dotganga.com', password:'rahul123',
    role:'Meta Ads Manager', department:'Marketing', designation:'Meta Ads Specialist',
    phone:'9876540002',
  });
  console.log('👤 SMM: priya@dotganga.com / priya123');
  console.log('👤 Meta Mgr: rahul@dotganga.com / rahul123');

  // ── 4. Create client users ───────────────────────────────────────────────────
  const clientUsers = await User.insertMany([
    { name:'Riya Kapoor',  email:'riya@acmefashion.com',  password:'client123', role:'Client', phone:'9876543210' },
    { name:'Arun Kumar',   email:'arun@techvibe.in',       password:'client123', role:'Client', phone:'9845012345' },
    { name:'Sunita Patel', email:'sunita@foodiehub.in',    password:'client123', role:'Client', phone:'9900112233' },
  ]);
  console.log('👥 Client logins: *@*.com / client123');

  // ── 5. Create clients ────────────────────────────────────────────────────────
  const clients = [];
  for (let i = 0; i < CLIENTS_DATA.length; i++) {
    const cd  = CLIENTS_DATA[i];
    const cu  = clientUsers[i];
    const cli = await Client.create({
      ...cd,
      assignedSMM:         [smm._id],
      assignedMetaManager: metaMgr._id,
      createdBy:           admin._id,
      userRef:             cu._id,
    });
    await User.findByIdAndUpdate(cu._id, { clientRef: cli._id, assignedClients: [cli._id] });
    clients.push(cli);
  }
  const [acme, techvibe, foodiehub] = clients;
  console.log(`\n🏢 Created ${clients.length} clients`);

  // ── 6. Create posts for the current month ───────────────────────────────────
  const allPosts = [];

  // Acme Fashion — 10 posts spread across the month
  const acmeTemplates = POST_TEMPLATES.Acme;
  for (let i = 0; i < acmeTemplates.length; i++) {
    const t      = acmeTemplates[i];
    const offset = Math.round((i / acmeTemplates.length) * 28) - 14; // spread -14 to +14 days
    const imgs   = UNSPLASH_IMGS.Fashion;
    const mediaUrls = t.category === 'Carousel'
      ? [rand(imgs), rand(imgs), rand(imgs)]
      : t.category === 'Reel' || t.category === 'Story'
        ? [rand(imgs)]
        : [];

    const approvalStatus = offset < -5 ? rand(['Approved','Approved','Approved','Revision']) : offset < 0 ? rand(['Approved','Pending','Pending']) : 'Pending';
    const status = approvalStatus === 'Approved' && offset < 0 ? (offset < -8 ? 'Posted' : 'Scheduled') : 'Draft';

    const post = await Post.create({
      clientId:      acme._id,
      createdBy:     smm._id,
      platforms:     t.platforms,
      caption:       t.caption,
      hashtags:      t.hashtags,
      mediaUrls,
      scheduledDate: day(offset),
      category:      t.category,
      status,
      approvalStatus,
      approvedBy:    approvalStatus === 'Approved' ? clientUsers[0]._id : undefined,
      approvedAt:    approvalStatus === 'Approved' ? day(offset - 1) : undefined,
    });
    allPosts.push({ post, clientUser: clientUsers[0], clientId: acme._id });
  }

  // TechVibe — 8 posts
  const tvTemplates = POST_TEMPLATES.TechVibe;
  for (let i = 0; i < tvTemplates.length; i++) {
    const t      = tvTemplates[i];
    const offset = Math.round((i / tvTemplates.length) * 28) - 14;
    const imgs   = UNSPLASH_IMGS.Tech;
    const mediaUrls = t.category === 'Carousel' ? [rand(imgs), rand(imgs)] : t.category === 'Reel' ? [rand(imgs)] : [];
    const approvalStatus = offset < -3 ? rand(['Approved','Approved','Pending']) : 'Pending';
    const status = approvalStatus === 'Approved' && offset < 0 ? 'Posted' : 'Scheduled';

    const post = await Post.create({
      clientId:      techvibe._id,
      createdBy:     smm._id,
      platforms:     t.platforms,
      caption:       t.caption,
      hashtags:      t.hashtags,
      mediaUrls,
      scheduledDate: day(offset),
      category:      t.category,
      status,
      approvalStatus,
    });
    allPosts.push({ post, clientUser: clientUsers[1], clientId: techvibe._id });
  }

  // FoodieHub — 8 posts
  const fhTemplates = POST_TEMPLATES.FoodieHub;
  for (let i = 0; i < fhTemplates.length; i++) {
    const t      = fhTemplates[i];
    const offset = Math.round((i / fhTemplates.length) * 28) - 14;
    const imgs   = UNSPLASH_IMGS['Food & Beverage'];
    const mediaUrls = t.category === 'Carousel' ? [rand(imgs), rand(imgs), rand(imgs)] : [rand(imgs)];
    const approvalStatus = offset < 0 ? rand(['Approved','Approved','Pending','Revision']) : 'Pending';
    const status = approvalStatus === 'Approved' && offset < -5 ? 'Posted' : 'Scheduled';

    const post = await Post.create({
      clientId:      foodiehub._id,
      createdBy:     smm._id,
      platforms:     t.platforms,
      caption:       t.caption,
      hashtags:      t.hashtags,
      mediaUrls,
      scheduledDate: day(offset),
      category:      t.category,
      status,
      approvalStatus,
    });
    allPosts.push({ post, clientUser: clientUsers[2], clientId: foodiehub._id });
  }

  console.log(`📝 Created ${allPosts.length} posts`);

  // ── 7. Create approvals for each post ───────────────────────────────────────
  const approvalDocs = allPosts.map(({ post, clientId }) => ({
    postId:      post._id,
    clientId,
    requestedBy: smm._id,
    status:      post.approvalStatus,
    reviewedAt:  post.approvalStatus !== 'Pending' ? post.scheduledDate : undefined,
  }));
  await Approval.insertMany(approvalDocs);
  console.log('✅ Created approvals');

  // ── 8. Create Meta campaigns ─────────────────────────────────────────────────
  const acmeCamp1 = await MetaCampaign.create({
    clientId:      acme._id,
    metaCampaignId:'23851234567890',
    name:          'Summer Collection 2024 — Awareness',
    objective:     'BRAND_AWARENESS',
    status:        'ACTIVE',
    dailyBudget:   2500,
    startDate:     day(-30),
  });
  const acmeCamp2 = await MetaCampaign.create({
    clientId:      acme._id,
    metaCampaignId:'23851234567891',
    name:          'Weekend Sale — Conversions',
    objective:     'CONVERSIONS',
    status:        'ACTIVE',
    dailyBudget:   4000,
    startDate:     day(-14),
  });
  const tvCamp = await MetaCampaign.create({
    clientId:      techvibe._id,
    metaCampaignId:'23851234567892',
    name:          'B2B Lead Gen — Q3 2024',
    objective:     'LEAD_GENERATION',
    status:        'ACTIVE',
    dailyBudget:   3000,
    startDate:     day(-21),
  });
  console.log('📢 Created Meta campaigns');

  // ── 9. Create 30 days of Meta insights ──────────────────────────────────────
  const insightRows = [];
  for (let d = -29; d <= 0; d++) {
    // Acme Camp 1
    const imp1 = randN(8000, 25000);
    insightRows.push({
      clientId: acme._id, campaignId: acmeCamp1._id,
      date: day(d),
      impressions: imp1, clicks: Math.round(imp1 * 0.025), spend: randN(1800, 2600),
      reach: Math.round(imp1 * 0.8), cpm: 2.8, ctr: 2.5, cpc: 1.1,
      conversions: randN(8, 30), leadCount: randN(5, 20), syncedAt: new Date(),
    });
    // Acme Camp 2 (only last 14 days)
    if (d >= -14) {
      const imp2 = randN(15000, 40000);
      insightRows.push({
        clientId: acme._id, campaignId: acmeCamp2._id,
        date: day(d),
        impressions: imp2, clicks: Math.round(imp2 * 0.032), spend: randN(3200, 4100),
        reach: Math.round(imp2 * 0.75), cpm: 3.1, ctr: 3.2, cpc: 0.9,
        conversions: randN(12, 45), leadCount: randN(8, 30), syncedAt: new Date(),
      });
    }
    // TechVibe (only last 21 days)
    if (d >= -21) {
      const impT = randN(5000, 18000);
      insightRows.push({
        clientId: techvibe._id, campaignId: tvCamp._id,
        date: day(d),
        impressions: impT, clicks: Math.round(impT * 0.04), spend: randN(2200, 3100),
        reach: Math.round(impT * 0.9), cpm: 4.2, ctr: 4.0, cpc: 1.5,
        conversions: randN(3, 15), leadCount: randN(5, 25), syncedAt: new Date(),
      });
    }
  }

  // Use upsert to handle duplicate key edge cases
  for (const row of insightRows) {
    await MetaInsights.findOneAndUpdate(
      { clientId: row.clientId, campaignId: row.campaignId, date: row.date },
      row,
      { upsert: true }
    );
  }
  console.log(`📊 Created ${insightRows.length} insight records`);

  // ── 10. Create media library entries ────────────────────────────────────────
  const mediaEntries = [];
  const mediaFolders = ['Brand Assets','Campaign — Summer 2024','Product Photos','Behind the Scenes'];
  for (const img of UNSPLASH_IMGS.Fashion.slice(0,3)) {
    mediaEntries.push({ clientId:acme._id, uploadedBy:smm._id, fileName:`acme_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`, fileUrl:img, thumbnailUrl:img, fileType:'image', folder:rand(mediaFolders), tags:['fashion','product'], fileSize:randN(200000,800000) });
  }
  for (const img of UNSPLASH_IMGS.Tech.slice(0,2)) {
    mediaEntries.push({ clientId:techvibe._id, uploadedBy:smm._id, fileName:`tv_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`, fileUrl:img, thumbnailUrl:img, fileType:'image', folder:'Brand Assets', tags:['tech','office'], fileSize:randN(200000,500000) });
  }
  for (const img of UNSPLASH_IMGS['Food & Beverage'].slice(0,4)) {
    mediaEntries.push({ clientId:foodiehub._id, uploadedBy:smm._id, fileName:`fh_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`, fileUrl:img, thumbnailUrl:img, fileType:'image', folder:'Food Photography', tags:['food','restaurant'], fileSize:randN(300000,900000) });
  }
  await MediaLibrary.insertMany(mediaEntries);
  console.log(`🖼️  Created ${mediaEntries.length} media library entries`);

  // ── 11. Create notifications ─────────────────────────────────────────────────
  await Notification.insertMany([
    { userId:admin._id,  title:'3 posts pending approval', message:'Acme Fashion has 3 posts awaiting client review.', type:'approval' },
    { userId:admin._id,  title:'Meta Ads sync complete',   message:'30 days of insights synced for Acme Fashion & TechVibe.', type:'meta' },
    { userId:smm._id,    title:'Post approved ✅',          message:'Riya approved the "Summer Collection" reel for Acme Fashion!', type:'approval' },
    { userId:smm._id,    title:'Revision requested ✏️',     message:'"Weekend Sale" carousel needs changes — see client note.', type:'approval' },
    { userId:metaMgr._id,title:'High CTR alert 📈',         message:'Acme Summer Campaign CTR is 3.2% — well above benchmark!', type:'meta' },
    { userId:clientUsers[0]._id, title:'New content for review', message:'Your team has uploaded 3 new posts for your approval.', type:'approval' },
    { userId:clientUsers[1]._id, title:'Meta Ads report ready',  message:'Your Q3 campaign performance report is now available.', type:'meta' },
    { userId:clientUsers[2]._id, title:'Welcome to DotGanga! 🎉',message:'Your client portal is ready. Review and approve your content here.', type:'general' },
  ]);
  console.log('🔔 Created notifications');

  // ── 12. Create sample leads ──────────────────────────────────────────────────
  const leadData = [
    { name:'Vikram Mehta',  phone:'9988776655', company:'Mehta Jewellers',   source:'Meta Ads',  service:'Social Media', status:'Interested', priority:'Hot',  budget:'₹25k/month' },
    { name:'Ananya Singh',  phone:'9977665544', company:'Bloom Skincare',    source:'Instagram', service:'Meta Ads',    status:'Demo Scheduled', priority:'Hot', budget:'₹50k/month' },
    { name:'Rohan Kapoor',  phone:'9900887766', company:'RK Automobiles',    source:'Referral',  service:'Branding',    status:'Proposal Sent', priority:'Warm', budget:'₹35k/month' },
    { name:'Priti Shah',    phone:'9911223344', company:'Priti Boutique',    source:'WhatsApp',  service:'Social Media', status:'New',      priority:'Warm', budget:'₹15k/month' },
    { name:'Suresh Iyer',   phone:'9966554433', company:'Iyer Hotels',       source:'Google',    service:'SEO',         status:'Contacted', priority:'Cold', budget:'₹20k/month' },
    { name:'Kavya Nair',    phone:'9955443322', company:'Kavya Cosmetics',   source:'Facebook',  service:'Meta Ads',    status:'Won',       priority:'Hot',  budget:'₹40k/month' },
    { name:'Rajesh Patel',  phone:'9944332211', company:'Patel Electronics', source:'Cold Call', service:'Website',     status:'Lost',      priority:'Cold', budget:'₹10k/month' },
    { name:'Meera Joshi',   phone:'9933221100', company:'MJ Interiors',      source:'Walk-in',   service:'Social Media', status:'Interested', priority:'Warm', budget:'₹30k/month' },
  ];
  const existingLeads = await Lead.countDocuments();
  if (existingLeads === 0) {
    await Lead.insertMany(leadData.map(l => ({
      ...l,
      notes: [{ text:`Initial contact via ${l.source}. Interested in ${l.service}.`, addedBy:'Admin', addedAt:day(-randN(1,30)) }],
      followUpDate: new Date(day(randN(1,7))).toISOString().slice(0,10),
    })));
    console.log(`🎯 Created ${leadData.length} leads`);
  } else {
    console.log('🎯 Leads already exist, skipped');
  }

  // ── 13. Create sample tasks ──────────────────────────────────────────────────
  const taskData = [
    { title:'Design Acme Summer Collection carousel',     category:'Graphic Design',  priority:'High',   status:'In Progress', client:'Acme Fashion'  },
    { title:'Edit 60-sec reel for FoodieHub grand opening', category:'Video Editing', priority:'Urgent', status:'In Progress', client:'FoodieHub'     },
    { title:'Write 5 LinkedIn articles for TechVibe',     category:'Content Writing', priority:'Medium', status:'To Do',       client:'TechVibe Solutions' },
    { title:'Meta Ads creative — A/B test variants',      category:'Ads',             priority:'High',   status:'Review',      client:'Acme Fashion'  },
    { title:'Shoot FoodieHub new menu items',             category:'Shoot',           priority:'High',   status:'To Do',       client:'FoodieHub'     },
    { title:'Monthly social media report — all clients',  category:'General',         priority:'Medium', status:'To Do',       client:''              },
    { title:'Instagram grid planning — Acme June',        category:'Social Media',    priority:'Medium', status:'Done',        client:'Acme Fashion'  },
  ];
  const existingTasks = await Task.countDocuments();
  if (existingTasks === 0) {
    await Task.insertMany(taskData.map(t => ({
      ...t,
      assignedTo:  { userId: smm._id,   userName: 'Priya Sharma'  },
      assignedBy:  { userId: admin._id, userName: 'DotGanga Admin' },
      department:  'Creative',
      dueDate:     new Date(day(randN(1,10))).toISOString().slice(0,10),
    })));
    console.log(`✅ Created ${taskData.length} tasks`);
  }

  // ── Final summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 SEED COMPLETE!\n');
  console.log('Login credentials:');
  console.log('  Admin:        admin@dotganga.com   / admin123');
  console.log('  SMM:          priya@dotganga.com   / priya123');
  console.log('  Meta Mgr:     rahul@dotganga.com   / rahul123');
  console.log('  Client 1:     riya@acmefashion.com / client123  → Acme Fashion');
  console.log('  Client 2:     arun@techvibe.in      / client123  → TechVibe Solutions');
  console.log('  Client 3:     sunita@foodiehub.in   / client123  → FoodieHub');
  console.log('═'.repeat(60));

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
