/**
 * POST /api/seed-now
 * One-shot production seed endpoint — Admin auth required.
 * Hit once from the browser after deploying to populate all client data.
 * Safe to call multiple times (idempotent — uses upserts).
 */
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const CLIENT_DATA = [
  {
    businessName:'Marwar Sweets & Snacks',    contactName:'Ramesh Soni',
    email:'marwar.sweets@gmail.com',           phone:'9876543210',
    industry:'Food & Beverage',               services:['Social Media Management','Reels Production','Facebook Ads'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:6, Carousel:4, Story:8, Organic:6, 'Ad Creative':4 },
    monthlyBudget:25000, portalEmail:'client.marwar@dotganga.com', portalPassword:'client123',
    notes:'Premium halwai — focus on festive content.',
  },
  {
    businessName:'Blue City Realtors',         contactName:'Suresh Patel',
    email:'bluecity.realty@gmail.com',         phone:'9765432109',
    industry:'Real Estate',                   services:['Social Media Management','Drone Shoots','Lead Gen Ads'],
    primaryPlatforms:['Instagram','Facebook','LinkedIn'], contentTargets:{ Reel:8, Carousel:6, Story:6, Organic:4, 'Ad Creative':6 },
    monthlyBudget:40000, portalEmail:'client.bluecity@dotganga.com', portalPassword:'client123',
    notes:'Luxury properties in Jodhpur.',
  },
  {
    businessName:'Rajputana Jewels',           contactName:'Anita Rathore',
    email:'rajputana.jewels@gmail.com',        phone:'9654321098',
    industry:'Jewellery & Fashion',           services:['Social Media Management','Product Photography','Influencer Outreach'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:10, Carousel:8, Story:12, Organic:4, 'Ad Creative':4 },
    monthlyBudget:35000, portalEmail:'client.rajputana@dotganga.com', portalPassword:'client123',
    notes:'Bridal jewellery — peak during wedding season.',
  },
  {
    businessName:'Desert Wind Tours',          contactName:'Vikram Joshi',
    email:'desertwind.tours@gmail.com',        phone:'9543210987',
    industry:'Travel & Tourism',              services:['Social Media Management','Google Ads','Blog Writing'],
    primaryPlatforms:['Instagram','Facebook','YouTube'], contentTargets:{ Reel:8, Carousel:5, Story:10, Organic:5, 'Ad Creative':4 },
    monthlyBudget:30000, portalEmail:'client.desertwind@dotganga.com', portalPassword:'client123',
    notes:'Camel safari + heritage tours.',
  },
  {
    businessName:'FitZone Gym Jodhpur',        contactName:'Karan Singh',
    email:'fitzone.jodhpur@gmail.com',         phone:'9432109876',
    industry:'Health & Fitness',              services:['Social Media Management','Reels Production','Facebook Ads'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:10, Carousel:4, Story:12, Organic:6, 'Ad Creative':2 },
    monthlyBudget:20000, portalEmail:'client.fitzone@dotganga.com', portalPassword:'client123',
    notes:'Motivation + transformation content works best.',
  },
  {
    businessName:'Spice Route Restaurant',     contactName:'Meena Choudhary',
    email:'spiceroute.restro@gmail.com',       phone:'9321098765',
    industry:'Food & Beverage',               services:['Social Media Management','Food Photography','Zomato Management'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:6, Carousel:6, Story:10, Organic:8, 'Ad Creative':2 },
    monthlyBudget:22000, portalEmail:'client.spiceroute@dotganga.com', portalPassword:'client123',
    notes:'Authentic Rajasthani cuisine.',
  },
  {
    businessName:'Mehrangarh Handicrafts',     contactName:'Gopal Das',
    email:'mehrangarh.crafts@gmail.com',       phone:'9210987654',
    industry:'Handicrafts & Art',             services:['Social Media Management','Export Branding','WhatsApp Marketing'],
    primaryPlatforms:['Instagram','YouTube'], contentTargets:{ Reel:6, Carousel:8, Story:8, Organic:6, 'Ad Creative':4 },
    monthlyBudget:18000, portalEmail:'client.mehrangarh@dotganga.com', portalPassword:'client123',
    notes:'Export-quality handicrafts.',
  },
  {
    businessName:'Riya Fashion Boutique',      contactName:'Riya Khanna',
    email:'riya.fashion@gmail.com',            phone:'9109876543',
    industry:'Fashion & Apparel',             services:['Social Media Management','Influencer Collaboration','Meta Ads'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:12, Carousel:8, Story:14, Organic:4, 'Ad Creative':4 },
    monthlyBudget:28000, portalEmail:'client.riya@dotganga.com', portalPassword:'client123',
    notes:'Women ethnic wear. Strong Instagram following.',
  },
  {
    businessName:'TechSpark Solutions',        contactName:'Arun Gupta',
    email:'techspark.sol@gmail.com',           phone:'9098765432',
    industry:'Technology & IT',               services:['Social Media Management','LinkedIn Ads','Content Marketing'],
    primaryPlatforms:['LinkedIn','Facebook'], contentTargets:{ Reel:3, Carousel:10, Story:4, Organic:10, 'Ad Creative':4 },
    monthlyBudget:35000, portalEmail:'client.techspark@dotganga.com', portalPassword:'client123',
    notes:'B2B software company.',
  },
  {
    businessName:'Dr. Sharma Dental Clinic',   contactName:'Dr. Neeraj Sharma',
    email:'sharma.dental@gmail.com',           phone:'9987654321',
    industry:'Healthcare',                    services:['Social Media Management','Google Ads','Reputation Management'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:4, Carousel:6, Story:8, Organic:8, 'Ad Creative':4 },
    monthlyBudget:20000, portalEmail:'client.sharmadental@dotganga.com', portalPassword:'client123',
    notes:'Before/after transformations drive leads.',
  },
  {
    businessName:'Oasis Events & Decor',       contactName:'Sunita Vyas',
    email:'oasis.events@gmail.com',            phone:'9876501234',
    industry:'Events & Wedding Planning',     services:['Social Media Management','Wedding Reels','Instagram Ads'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:10, Carousel:8, Story:12, Organic:4, 'Ad Creative':4 },
    monthlyBudget:32000, portalEmail:'client.oasis@dotganga.com', portalPassword:'client123',
    notes:'Wedding decor + event management.',
  },
  {
    businessName:'Green Leaf Organic Farm',    contactName:'Hemant Bishnoi',
    email:'greenleaf.organic@gmail.com',       phone:'9765012345',
    industry:'Agriculture & Organic Food',    services:['Social Media Management','WhatsApp Marketing','Content Creation'],
    primaryPlatforms:['Instagram','Facebook'], contentTargets:{ Reel:5, Carousel:6, Story:8, Organic:10, 'Ad Creative':2 },
    monthlyBudget:15000, portalEmail:'client.greenleaf@dotganga.com', portalPassword:'client123',
    notes:'Organic vegetables + dairy.',
  },
];

const CAPTIONS = {
  Reel:        ['Behind the scenes — watch the magic happen! 🎬 Follow for more.', 'This one took 3 tries but it was worth it 🔥 Watch till the end!', 'POV: You\'re working with the best team in Jodhpur 💪', 'One week of hard work in 30 seconds ⚡ Drop a ❤️ if you agree!'],
  Carousel:    ['5 things you need to know — swipe to see all! 👉', 'Our clients\' top results this month — swipe through 📊', 'Behind the brand story — 8 slides, real journey 🙌', 'Save this for later — you\'ll thank us! 📌'],
  Story:       ['Today\'s update — check now! 👀', 'Quick poll: which do you prefer? Vote below!', '24h offer alert ⏰ Don\'t miss this!', 'New post incoming — stay tuned 🔔'],
  Organic:     ['Sharing something personal today about our journey... 🙏', 'The story behind why we started — read this 👇', 'What makes us different? Honestly, it\'s this simple thing...', 'Grateful for each of you. Here\'s a small update from us 💛'],
  'Ad Creative':['🎯 Limited time offer — act now!\n\n✅ Special price\n✅ Guaranteed results\n✅ Trusted by 500+ customers\n\nDM or call NOW! 📞', '🔥 Deal alert — ends Sunday!\n\n50% OFF on selected services. Don\'t wait — spots filling fast!', '📣 New launch — see what everyone is talking about!\n\nBe the first to experience it. Contact us today 👇'],
};

const HASHTAGS = {
  'Food & Beverage': '#JodhpurFood #RajasthaniFood #Foodie #FoodLovers #IndianFood #DeliciousFood',
  'Real Estate': '#JodhpurRealEstate #BlueCity #PropertyInJodhpur #DreamHome #RealEstate #Realtors',
  'Health & Fitness': '#FitnessGoals #GymLife #WorkoutMotivation #FitIndia #HealthyLifestyle #Transformation',
  'Fashion & Apparel': '#EthnicWear #IndianFashion #WomenFashion #Jodhpur #KurtaCollection #BridalWear',
  'Travel & Tourism': '#RajasthanTourism #JodhpurDiaries #BlueCity #Camel #DesertLife #IncredibleIndia',
  'default': '#Jodhpur #Business #Marketing #DotGanga #SocialMedia #Growth',
};

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randDate(offsetMinDays, offsetMaxDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetMinDays + Math.floor(Math.random() * (offsetMaxDays - offsetMinDays)));
  d.setHours(rnd([9,10,11,14,15,16,17,18]), rnd([0,15,30,45]), 0, 0);
  return d;
}

router.post('/', protect, async (req, res) => {
  if (!['Admin', 'Super Admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin only.' });
  }

  const db          = mongoose.connection.db;
  const usersCol    = db.collection('users');
  const clientsCol  = db.collection('clients');
  const postsCol    = db.collection('posts');
  const log         = [];
  const adminId     = req.user._id;

  try {
    for (const cd of CLIENT_DATA) {
      // 1. Portal user
      const ph  = await bcrypt.hash(cd.portalPassword, 10);
      const now = new Date();
      const pRes = await usersCol.findOneAndUpdate(
        { email: cd.portalEmail },
        {
          $set: { name:cd.contactName, email:cd.portalEmail, password:ph, role:'Client', designation:'Client', department:'Client', isActive:true, phone:cd.phone, updatedAt:now },
          $setOnInsert: { whatsappNumber:'', joinedDate:now, createdAt:now },
        },
        { upsert:true, returnDocument:'after' },
      );
      const portalUserId = pRes?.value?._id || pRes?._id;

      // 2. Client record
      const cRes = await clientsCol.findOneAndUpdate(
        { email: cd.email },
        {
          $set: {
            businessName:cd.businessName, contactName:cd.contactName, email:cd.email,
            phone:cd.phone, industry:cd.industry, services:cd.services,
            primaryPlatforms:cd.primaryPlatforms, contentTargets:cd.contentTargets,
            monthlyBudget:cd.monthlyBudget, notes:cd.notes||'',
            isActive:true, userRef:portalUserId, createdBy:adminId, updatedAt:now,
          },
          $setOnInsert: { metaConnected:false, createdAt:now },
        },
        { upsert:true, returnDocument:'after' },
      );
      const clientId = cRes?.value?._id || cRes?._id;

      // Wire clientRef back
      if (portalUserId && clientId) {
        await usersCol.updateOne({ _id:portalUserId }, { $set:{ clientRef:clientId } });
      }

      // 3. Posts — skip if already seeded
      const existing = await postsCol.countDocuments({ clientId });
      if (existing > 5) {
        log.push({ client:cd.businessName, posts:0, note:'already has posts' });
        continue;
      }

      const tags = HASHTAGS[cd.industry] || HASHTAGS.default;
      const cats = ['Reel','Carousel','Story','Organic','Ad Creative'];
      const posts = [];

      // Generate 24 posts spread across -60 days to +30 days
      for (let i = 0; i < 24; i++) {
        const offsetMin = -60 + i * 3;
        const offsetMax = offsetMin + 5;
        const sDate     = randDate(offsetMin, offsetMax);
        const isPast    = sDate < new Date();
        const cat       = cats[i % cats.length];
        const status    = isPast ? rnd(['Posted','Posted','Scheduled']) : rnd(['Draft','Scheduled']);
        const approval  = status === 'Posted' ? 'Approved' : isPast ? rnd(['Approved','Pending']) : rnd(['Pending','Approved']);
        const capArr    = CAPTIONS[cat] || CAPTIONS.Organic;
        posts.push({
          clientId, createdBy:adminId,
          platforms: cd.primaryPlatforms.slice(0, 1 + (i % 2)),
          caption:   rnd(capArr),
          hashtags:  tags,
          mediaUrls:[], videoUrls:[],
          scheduledDate: sDate,
          postedAt: status === 'Posted' ? sDate : null,
          status, approvalStatus: approval,
          approvalNote:'',
          approvedBy: approval === 'Approved' ? adminId : null,
          approvedAt: approval === 'Approved' ? sDate : null,
          category: cat,
          aiGenerated:false, notes:'',
          script:{ hook:'', body:'', cta:'', voiceover:'', textOverlays:[] },
          createdAt: new Date(sDate.getTime() - 2 * 86400000),
          updatedAt: new Date(),
        });
      }

      await postsCol.insertMany(posts, { ordered:false }).catch(() => {});
      log.push({ client:cd.businessName, posts:posts.length, portal:cd.portalEmail });
    }

    res.json({
      success: true,
      message: `✅ Seeded ${CLIENT_DATA.length} clients with posts!`,
      clients: log,
      logins: CLIENT_DATA.map(c => ({ email:c.portalEmail, password:c.portalPassword, business:c.businessName })),
    });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;
