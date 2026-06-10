require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── STAFF ────────────────────────────────────────────────────────────────────

const STAFF = [
  { name:'DotGanga Admin', email:'admin@dotganga.com',   password:'admin123',   role:'Admin',   designation:'System Administrator', department:'Management', salary:0      },
  { name:'Priya Kapoor',   email:'manager@dotganga.com', password:'manager123', role:'Manager', designation:'Operations Manager',   department:'Management', salary:55000  },
  { name:'Rudra',          email:'rudra@dotganga.com',   password:'rudra123',   role:'Staff',   designation:'Sales Executive',      department:'Sales',      salary:30000  },
  { name:'TP',             email:'tp@dotganga.com',      password:'tp1234',     role:'Staff',   designation:'Sales Executive',      department:'Sales',      salary:30000  },
  { name:'Deepak',         email:'deepak@dotganga.com',  password:'deepak123',  role:'Staff',   designation:'Sales Executive',      department:'Sales',      salary:28000  },
  { name:'Prachi',         email:'prachi@dotganga.com',  password:'prachi123',  role:'Staff',   designation:'Content Writer',       department:'Marketing',  salary:25000  },
  { name:'Mohit',          email:'mohit@dotganga.com',   password:'mohit123',   role:'Staff',   designation:'Video Editor',         department:'Creative',   salary:28000  },
  { name:'Ritika',         email:'ritika@dotganga.com',  password:'ritika123',  role:'Staff',   designation:'Graphic Designer',     department:'Creative',   salary:27000  },
  { name:'Vinod',          email:'vinod@dotganga.com',   password:'vinod123',   role:'Staff',   designation:'Operations Executive', department:'Operations', salary:26000  },
  { name:'Triti',          email:'triti@dotganga.com',   password:'triti123',   role:'Staff',   designation:'Social Media Manager', department:'Marketing',  salary:30000  },
  { name:'Kavya Sharma',   email:'smm1@dotganga.com',    password:'smm1234',    role:'SMM',     designation:'Social Media Manager', department:'Marketing',  salary:28000  },
  { name:'Arjun Mehta',    email:'smm2@dotganga.com',    password:'smm1234',    role:'SMM',     designation:'Social Media Executive',department:'Marketing', salary:25000  },
];

// ─── CLIENTS (12 real Jodhpur-based businesses) ───────────────────────────────

const CLIENT_DATA = [
  {
    businessName:'Marwar Sweets & Snacks',    contactName:'Ramesh Soni',
    email:'marwar.sweets@gmail.com',           phone:'9876543210',
    industry:'Food & Beverage',               services:['Social Media Management','Reels Production','Facebook Ads'],
    primaryPlatforms:['Instagram','Facebook'], website:'https://marwarsweets.in',
    contentTargets:{ Reel:6, Carousel:4, Story:8, Organic:6, 'Ad Creative':4 },
    monthlyBudget:25000, notes:'Premium halwai — focus on festive content and behind-the-scenes.',
    portalEmail:'client.marwar@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Blue City Realtors',         contactName:'Suresh Patel',
    email:'bluecity.realty@gmail.com',         phone:'9765432109',
    industry:'Real Estate',                   services:['Social Media Management','Drone Shoots','Lead Gen Ads'],
    primaryPlatforms:['Instagram','Facebook','LinkedIn'], website:'https://bluecityrealtors.com',
    contentTargets:{ Reel:8, Carousel:6, Story:6, Organic:4, 'Ad Creative':6 },
    monthlyBudget:40000, notes:'Luxury properties in Jodhpur. Drone shots convert best.',
    portalEmail:'client.bluecity@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Rajputana Jewels',           contactName:'Anita Rathore',
    email:'rajputana.jewels@gmail.com',        phone:'9654321098',
    industry:'Jewellery & Fashion',           services:['Social Media Management','Product Photography','Influencer Outreach'],
    primaryPlatforms:['Instagram','Facebook','YouTube'], website:'https://rajputanajewels.com',
    contentTargets:{ Reel:10, Carousel:8, Story:12, Organic:4, 'Ad Creative':4 },
    monthlyBudget:35000, notes:'Bridal jewellery — big peak during wedding season (Oct-Feb).',
    portalEmail:'client.rajputana@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Desert Wind Tours',          contactName:'Vikram Joshi',
    email:'desertwind.tours@gmail.com',        phone:'9543210987',
    industry:'Travel & Tourism',              services:['Social Media Management','Google Ads','Blog Writing'],
    primaryPlatforms:['Instagram','Facebook','YouTube'], website:'https://desertwindtours.in',
    contentTargets:{ Reel:8, Carousel:5, Story:10, Organic:5, 'Ad Creative':4 },
    monthlyBudget:30000, notes:'Camel safari + heritage tours. Peak season: Oct-Mar.',
    portalEmail:'client.desertwind@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'FitZone Gym Jodhpur',        contactName:'Karan Singh',
    email:'fitzone.jodhpur@gmail.com',         phone:'9432109876',
    industry:'Health & Fitness',              services:['Social Media Management','Reels Production','Facebook Ads'],
    primaryPlatforms:['Instagram','Facebook'], website:'https://fitzonejodhpur.com',
    contentTargets:{ Reel:10, Carousel:4, Story:12, Organic:6, 'Ad Creative':2 },
    monthlyBudget:20000, notes:'Motivation + transformation content works best.',
    portalEmail:'client.fitzone@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Spice Route Restaurant',     contactName:'Meena Choudhary',
    email:'spiceroute.restro@gmail.com',       phone:'9321098765',
    industry:'Food & Beverage',               services:['Social Media Management','Food Photography','Zomato Management'],
    primaryPlatforms:['Instagram','Facebook','WhatsApp'], website:'https://spiceroutejodhpur.com',
    contentTargets:{ Reel:6, Carousel:6, Story:10, Organic:8, 'Ad Creative':2 },
    monthlyBudget:22000, notes:'Authentic Rajasthani cuisine. Laal maas + dal baati content goes viral.',
    portalEmail:'client.spiceroute@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Mehrangarh Handicrafts',     contactName:'Gopal Das',
    email:'mehrangarh.crafts@gmail.com',       phone:'9210987654',
    industry:'Handicrafts & Art',             services:['Social Media Management','Export Branding','WhatsApp Marketing'],
    primaryPlatforms:['Instagram','Facebook','YouTube'], website:'https://mehrangarhcrafts.com',
    contentTargets:{ Reel:6, Carousel:8, Story:8, Organic:6, 'Ad Creative':4 },
    monthlyBudget:18000, notes:'Export-quality handicrafts. UK and US buyers through Instagram.',
    portalEmail:'client.mehrangarh@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Riya Fashion Boutique',      contactName:'Riya Khanna',
    email:'riya.fashion@gmail.com',            phone:'9109876543',
    industry:'Fashion & Apparel',             services:['Social Media Management','Influencer Collaboration','Meta Ads'],
    primaryPlatforms:['Instagram','Facebook'], website:'https://riyafashion.in',
    contentTargets:{ Reel:12, Carousel:8, Story:14, Organic:4, 'Ad Creative':4 },
    monthlyBudget:28000, notes:'Women ethnic wear. Strong Instagram following. Weekly drops.',
    portalEmail:'client.riya@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'TechSpark Solutions',        contactName:'Arun Gupta',
    email:'techspark.sol@gmail.com',           phone:'9098765432',
    industry:'Technology & IT',               services:['Social Media Management','LinkedIn Ads','Content Marketing'],
    primaryPlatforms:['LinkedIn','Facebook','Twitter'], website:'https://techsparksolutions.com',
    contentTargets:{ Reel:3, Carousel:10, Story:4, Organic:10, 'Ad Creative':4 },
    monthlyBudget:35000, notes:'B2B software company. LinkedIn is primary channel.',
    portalEmail:'client.techspark@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Dr. Sharma Dental Clinic',   contactName:'Dr. Neeraj Sharma',
    email:'sharma.dental@gmail.com',           phone:'9987654321',
    industry:'Healthcare',                    services:['Social Media Management','Google Ads','Reputation Management'],
    primaryPlatforms:['Instagram','Facebook'], website:'https://sharmadental.in',
    contentTargets:{ Reel:4, Carousel:6, Story:8, Organic:8, 'Ad Creative':4 },
    monthlyBudget:20000, notes:'Before/after transformations drive leads. Testimonial content.',
    portalEmail:'client.sharmadental@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Oasis Events & Decor',       contactName:'Sunita Vyas',
    email:'oasis.events@gmail.com',            phone:'9876501234',
    industry:'Events & Wedding Planning',     services:['Social Media Management','Wedding Reels','Instagram Ads'],
    primaryPlatforms:['Instagram','Facebook','YouTube'], website:'https://oasisevents.in',
    contentTargets:{ Reel:10, Carousel:8, Story:12, Organic:4, 'Ad Creative':4 },
    monthlyBudget:32000, notes:'Wedding decor + event management. Peak: wedding season.',
    portalEmail:'client.oasis@dotganga.com', portalPassword:'client123',
  },
  {
    businessName:'Green Leaf Organic Farm',    contactName:'Hemant Bishnoi',
    email:'greenleaf.organic@gmail.com',       phone:'9765012345',
    industry:'Agriculture & Organic Food',    services:['Social Media Management','WhatsApp Marketing','Content Creation'],
    primaryPlatforms:['Instagram','Facebook','WhatsApp'], website:'https://greenleaforganic.in',
    contentTargets:{ Reel:5, Carousel:6, Story:8, Organic:10, 'Ad Creative':2 },
    monthlyBudget:15000, notes:'Organic vegetables + dairy. Strong community in Jodhpur.',
    portalEmail:'client.greenleaf@dotganga.com', portalPassword:'client123',
  },
];

// ─── POST TEMPLATES per industry ─────────────────────────────────────────────

const POST_TEMPLATES = {
  'Food & Beverage': [
    { category:'Reel',         caption:'Behind the scenes — watch our chefs craft the perfect laal maas! 🔥 Pure Rajasthani magic in every bite. Come visit us today.\n\n📍 Jodhpur, Rajasthan', hashtags:'#LaalMaas #RajasthaniFood #JodhpurFood #Foodie #IndianCuisine #ChefLife' },
    { category:'Carousel',     caption:'5 dishes you MUST try at our restaurant this season 🍽️\n\nSwipe to see our most-loved menu items that keep our customers coming back!', hashtags:'#JodhpurRestaurant #MustTryFood #RajasthaniCuisine #FoodBlogger' },
    { category:'Story',        caption:'Today\'s special — Dal Baati Churma! Limited plates available. Come fast! 🫓', hashtags:'#DalBaatiChurma #TodaySpecial' },
    { category:'Organic',      caption:'Did you know? Our ghee is made from pure desi cow milk sourced locally. Every dish we prepare carries the love and tradition of Rajasthan. 🐄', hashtags:'#PureGhee #TraditionalFood #LocalSourcing' },
    { category:'Reel',         caption:'Morning rush at our kitchen — 500+ orders, 1 team, pure dedication! 💪\n\nThis is how we start every day at [Business Name]. Order now! 🛵', hashtags:'#KitchenLife #FoodLove #MorningVibes' },
    { category:'Ad Creative',  caption:'🎉 Grand Opening Special — 20% OFF on all orders this weekend!\n\nDon\'t miss this chance. Limited time. Book your table now! 📞', hashtags:'#GrandOpening #SpecialOffer #Discount #JodhpurEats' },
  ],
  'Real Estate': [
    { category:'Reel',         caption:'Luxury 3BHK with a stunning Blue City view 🏙️\n\nThis dream apartment is now available. Watch till the end to see the breathtaking terrace view!', hashtags:'#BlueCity #JodhpurRealty #LuxuryApartment #DreamHome #PropertyInJodhpur' },
    { category:'Carousel',     caption:'Top 5 locations to invest in Jodhpur right now 📍\n\nSwipe to discover the hottest real estate zones with maximum ROI potential in 2025.', hashtags:'#RealEstateInvestment #JodhpurProperty #PropertyInvestment #RealEstate' },
    { category:'Organic',      caption:'Thinking of buying a home in Jodhpur? Here\'s what you need to know about the current market trends. Prices are rising — act fast! 📈', hashtags:'#JodhpurRealEstate #HomeBuying #PropertyMarket' },
    { category:'Ad Creative',  caption:'🏠 LIMITED OFFER — 2BHK starting ₹45 Lakh only!\n\nPrime location, great amenities, easy EMI. Call us TODAY for site visit! 📞', hashtags:'#AffordableHomes #2BHK #Jodhpur #HomeLoan #EMI' },
    { category:'Reel',         caption:'Drone tour of our newest premium project in Jodhpur 🚁\n\n360° views, modern architecture, and a lifestyle you deserve. Launching soon!', hashtags:'#DroneTour #PremiumHomes #NewLaunch #JodhpurRealty' },
    { category:'Carousel',     caption:'Customer success story — how Rakesh ji bought his dream home with us 🏠❤️\n\nSwipe to read his journey from renting to owning!', hashtags:'#CustomerStory #Testimonial #HappyCustomer #DreamHome' },
  ],
  'Health & Fitness': [
    { category:'Reel',         caption:'30-day transformation that will BLOW YOUR MIND 🔥💪\n\nOur member Rohit lost 12kg in 30 days with our customised program. Results speak louder!', hashtags:'#Transformation #WeightLoss #FitnessGoals #GymLife #FitZone #Jodhpur' },
    { category:'Carousel',     caption:'5 exercises to build a strong core at home 🏋️\n\nNo equipment needed! Save this post and try today. Tag a friend who needs this!', hashtags:'#HomeWorkout #CoreStrength #NoEquipment #FitnessTips' },
    { category:'Story',        caption:'Morning batch starting in 15 minutes! Spots available. DM to join 💥', hashtags:'#MorningWorkout #FitnessJodhpur' },
    { category:'Reel',         caption:'Battle rope challenge — can you do 100 reps? 🎯\n\nOur trainers are ready to push your limits. First class FREE this week only!', hashtags:'#BattleRope #GymChallenge #FreeClass #JodhpurGym' },
    { category:'Organic',      caption:'Why most people fail at their fitness goals — and how to fix it forever 🎯\n\nRead this if you want sustainable results, not just a crash diet.', hashtags:'#FitnessAdvice #HealthyLifestyle #FitnessMotivation' },
    { category:'Ad Creative',  caption:'🔥 MONSOON OFFER — Membership at just ₹999/month!\n\nAC gym, personal trainer, diet plan included. Join TODAY — offer ends Sunday! 💪', hashtags:'#GymOffer #MembershipDiscount #JodhpurGym #FitnessOffer' },
  ],
  'Fashion & Apparel': [
    { category:'Reel',         caption:'New collection just dropped — Festive 2025 🌟\n\nWatch our model showcase the entire collection. Every piece is handcrafted in Jodhpur!', hashtags:'#FestiveCollection #EthnicWear #IndianFashion #Jodhpur #NewCollection' },
    { category:'Carousel',     caption:'How to style one dupatta 5 different ways 🧣✨\n\nSave this style guide! Perfect for college, work, and weddings.', hashtags:'#StyleGuide #DupattaStyle #FashionTips #EthnicFashion' },
    { category:'Reel',         caption:'Behind the scenes — watch our artisans create your favourite lehenga from scratch 🧵\n\nEvery stitch is love. Every piece is a masterpiece.', hashtags:'#Handcrafted #Artisan #BehindTheScenes #LeheengaDesign' },
    { category:'Story',        caption:'Flash sale LIVE now — 30% OFF on all kurtas! 48 hours only ⚡', hashtags:'#FlashSale #KurtaCollection #Offer' },
    { category:'Ad Creative',  caption:'💃 Wedding season is here — Book your bridal lehenga TODAY!\n\nCustom stitching, 500+ designs, premium fabric. DM for catalogue 📩', hashtags:'#BridalLehenga #WeddingSeason #BridalWear #CustomStitching' },
    { category:'Carousel',     caption:'Top 8 trending ethnic looks for Navratri 2025 🎊\n\nSave and share with your squad! All pieces available in our store.', hashtags:'#Navratri2025 #GarbaOutfit #EthnicLook #Trending' },
  ],
  'Travel & Tourism': [
    { category:'Reel',         caption:'Magical sunset at Sam Sand Dunes 🌅🐪\n\nThis is why Rajasthan is India\'s most visited state. Watch till the end for the money shot!', hashtags:'#SamSandDunes #Rajasthan #JodhpurTourism #DesertSunset #Camel #Travel' },
    { category:'Carousel',     caption:'7 hidden gems in Jodhpur that most tourists miss 🗺️\n\nBookmark this before your next trip! Local\'s guide to the Blue City.', hashtags:'#HiddenGems #JodhpurTravel #TravelTips #BlueCity #Tourism' },
    { category:'Reel',         caption:'Our guests\' reaction seeing the Mehrangarh Fort for the first time 😍\n\nNothing can prepare you for this view. Book your Jodhpur tour now!', hashtags:'#MehrangarhFort #JodhpurFort #TravelReaction #Rajasthan' },
    { category:'Organic',      caption:'Best time to visit Jodhpur — month by month guide 🗓️\n\nWhether you\'re planning for winter or summer, we\'ve got the perfect itinerary for you.', hashtags:'#BestTimeToVisit #JodhpurGuide #TravelPlanning' },
    { category:'Ad Creative',  caption:'🌟 Early Bird Offer — Rajasthan Desert Tour at ₹8,999!\n\nIncludes Jodhpur + Jaisalmer + Bikaner. Limited seats. Book TODAY! 🐪', hashtags:'#RajasthanTour #DesertTour #TravelDeal #EarlyBird' },
  ],
  'default': [
    { category:'Reel',         caption:'Exciting news! We\'re taking things to the next level in 2025 🚀\n\nStay tuned for what\'s coming. You won\'t want to miss this!', hashtags:'#BigAnnouncement #Exciting #StayTuned #NewChapter' },
    { category:'Carousel',     caption:'5 reasons why our customers love us ❤️\n\nSwipe to see what makes us different. Real stories, real results!', hashtags:'#CustomerLove #WhyUs #Testimonials #Trusted' },
    { category:'Reel',         caption:'Behind the scenes — this is how we work every single day 💼\n\nOur team is dedicated to delivering nothing but the best for our clients!', hashtags:'#BehindTheScenes #TeamWork #Dedication #WorkCulture' },
    { category:'Organic',      caption:'We\'re grateful for every single one of you! 🙏\n\nThank you for your trust, your support, and your love. We promise to keep getting better.', hashtags:'#Gratitude #ThankYou #Community #GrowingTogether' },
    { category:'Ad Creative',  caption:'🎯 Special Offer — Don\'t miss out!\n\nLimited time deal exclusively for our followers. DM us NOW to claim yours! 📩', hashtags:'#SpecialOffer #Exclusive #LimitedTime #DontMiss' },
    { category:'Story',        caption:'Quick update — new services launching this week! Watch this space 👀', hashtags:'#NewServices #ComingSoon #Update' },
    { category:'Carousel',     caption:'Our journey so far — from Day 1 to today 📈\n\nSwipe to see how far we\'ve come. The best is yet to come!', hashtags:'#OurStory #GrowthJourney #Milestone #Proud' },
  ],
};

const PLATFORMS_BY_INDUSTRY = {
  'Food & Beverage':           ['Instagram','Facebook'],
  'Real Estate':               ['Instagram','Facebook','LinkedIn'],
  'Jewellery & Fashion':       ['Instagram','Facebook'],
  'Travel & Tourism':          ['Instagram','Facebook','YouTube'],
  'Health & Fitness':          ['Instagram','Facebook'],
  'Fashion & Apparel':         ['Instagram','Facebook'],
  'Technology & IT':           ['LinkedIn','Facebook'],
  'Healthcare':                ['Instagram','Facebook'],
  'Events & Wedding Planning': ['Instagram','Facebook'],
  'Agriculture & Organic Food':['Instagram','Facebook','WhatsApp'],
  'Handicrafts & Art':         ['Instagram','YouTube'],
  'default':                   ['Instagram','Facebook'],
};

function getPlatforms(industry) {
  return PLATFORMS_BY_INDUSTRY[industry] || PLATFORMS_BY_INDUSTRY.default;
}

function getTemplates(industry) {
  return POST_TEMPLATES[industry] || POST_TEMPLATES.default;
}

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(daysOffsetMin, daysOffsetMax) {
  const now    = new Date();
  const offset = daysOffsetMin + Math.floor(Math.random() * (daysOffsetMax - daysOffsetMin));
  const d      = new Date(now);
  d.setDate(d.getDate() + offset);
  d.setHours(rnd([9,10,11,14,15,16,17,18,19]), rnd([0,15,30,45]), 0, 0);
  return d;
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

const seed = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('MONGODB_URI not set in .env'); process.exit(1); }

  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  const db         = mongoose.connection.db;
  const usersCol   = db.collection('users');
  const salariesCol= db.collection('salaryprofiles');
  const companiesCol=db.collection('companies');
  const clientsCol = db.collection('clients');
  const postsCol   = db.collection('posts');
  const approvalsCol=db.collection('approvals');

  // ─── 1. Staff ───────────────────────────────────────────────────────────────
  console.log('1. Setting up staff accounts...');
  const staffMap = {};
  for (const s of STAFF) {
    const hashed = await bcrypt.hash(s.password, 10);
    const now    = new Date();
    const result = await usersCol.findOneAndUpdate(
      { email: s.email },
      {
        $set: { name:s.name, email:s.email, password:hashed, role:s.role, designation:s.designation, department:s.department, isActive:true, updatedAt:now },
        $setOnInsert: { phone:'', whatsappNumber:'', joinedDate:now, createdAt:now },
      },
      { upsert:true, returnDocument:'after' },
    );
    const user = result?.value || result;
    const uid  = user?._id;
    staffMap[s.email] = uid;
    if (s.salary > 0 && uid) {
      await salariesCol.updateOne(
        { userId:uid },
        { $set:{ baseMonthlySalary:s.salary, allowances:0, deductionPerHalfDay:0.5, currency:'INR', updatedAt:now }, $setOnInsert:{ createdAt:now } },
        { upsert:true },
      );
    }
    console.log(`   ✓ ${s.role.padEnd(8)} ${s.email}`);
  }
  const adminId = staffMap['admin@dotganga.com'];

  // ─── 2. Company ─────────────────────────────────────────────────────────────
  console.log('\n2. Company config...');
  if (!await companiesCol.findOne({})) {
    await companiesCol.insertOne({
      officeName:'DotGanga — Your Marketing Agency', officeStartTime:'09:30', officeEndTime:'18:30',
      gracePeriodMinutes:15, officeLatitude:26.29303, officeLongitude:73.02201,
      allowedRadiusMeter:100, allowedWiFiSSID:'DotGanga-Office', createdAt:new Date(), updatedAt:new Date(),
    });
    console.log('   ✓ Created');
  } else { console.log('   — Already exists'); }

  // ─── 3. Clients + Portal Users + Posts ──────────────────────────────────────
  console.log('\n3. Creating clients and content calendars...\n');

  for (const cd of CLIENT_DATA) {
    // a) Create or upsert client portal user
    const portalHashed = await bcrypt.hash(cd.portalPassword, 10);
    const now = new Date();

    const pRes = await usersCol.findOneAndUpdate(
      { email: cd.portalEmail },
      {
        $set: { name:cd.contactName, email:cd.portalEmail, password:portalHashed, role:'Client', designation:'Client', department:'Client', isActive:true, updatedAt:now },
        $setOnInsert: { phone:cd.phone, whatsappNumber:'', joinedDate:now, createdAt:now },
      },
      { upsert:true, returnDocument:'after' },
    );
    const portalUser    = pRes?.value || pRes;
    const portalUserId  = portalUser?._id;

    // b) Create or upsert client
    const cRes = await clientsCol.findOneAndUpdate(
      { email: cd.email },
      {
        $set: {
          businessName:    cd.businessName,
          contactName:     cd.contactName,
          email:           cd.email,
          phone:           cd.phone,
          industry:        cd.industry,
          services:        cd.services,
          primaryPlatforms:cd.primaryPlatforms,
          website:         cd.website || '',
          contentTargets:  cd.contentTargets,
          monthlyBudget:   cd.monthlyBudget,
          notes:           cd.notes,
          isActive:        true,
          userRef:         portalUserId,
          createdBy:       adminId,
          updatedAt:       now,
        },
        $setOnInsert: { metaConnected:false, metaAdAccountId:'', createdAt:now },
      },
      { upsert:true, returnDocument:'after' },
    );
    const client    = cRes?.value || cRes;
    const clientId  = client?._id;

    // c) Wire clientRef on portal user
    if (portalUserId && clientId) {
      await usersCol.updateOne({ _id:portalUserId }, { $set:{ clientRef:clientId } });
    }

    // d) Seed posts — 2 months ago, last month, this month, next month
    const templates  = getTemplates(cd.industry);
    const platforms  = getPlatforms(cd.industry);
    const targets    = cd.contentTargets;
    const totalPosts = Object.values(targets).reduce((a,b) => a+b, 0);

    // Check existing posts for this client to avoid duplicates
    const existingCount = await postsCol.countDocuments({ clientId });
    if (existingCount > 10) {
      console.log(`   ↷  ${cd.businessName.padEnd(35)} already has ${existingCount} posts — skipping`);
      continue;
    }

    const postsToInsert = [];

    // Helper: generate posts for a given month offset (0 = this month)
    const genMonthPosts = (monthOffset, statusOverride) => {
      const tplCopy = [...templates];
      // shuffle
      for (let i = tplCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tplCopy[i], tplCopy[j]] = [tplCopy[j], tplCopy[i]];
      }

      let dayOffset;
      if (monthOffset === 0)   dayOffset = [-28, 28];   // this month
      if (monthOffset === -1)  dayOffset = [-58, -28];  // last month
      if (monthOffset === -2)  dayOffset = [-88, -58];  // 2 months ago
      if (monthOffset === 1)   dayOffset = [28, 58];    // next month

      tplCopy.slice(0, Math.min(tplCopy.length, 6)).forEach((tpl, i) => {
        const sDate    = randomDate(dayOffset[0] + i * 2, dayOffset[1]);
        const isPast   = sDate < new Date();
        let status     = statusOverride || (isPast ? rnd(['Posted','Posted','Posted','Scheduled']) : rnd(['Draft','Scheduled','Scheduled']));
        let approvalSt = status === 'Posted' ? 'Approved' : isPast ? rnd(['Approved','Pending']) : rnd(['Pending','Approved']);
        if (statusOverride === 'Posted') { status = 'Posted'; approvalSt = 'Approved'; }

        const caption = tpl.caption.replace('[Business Name]', cd.businessName);
        postsToInsert.push({
          clientId,
          createdBy:      adminId,
          platforms:      platforms.slice(0, 1 + Math.floor(Math.random() * 2)),
          caption,
          hashtags:       tpl.hashtags,
          mediaUrls:      [],
          videoUrls:      [],
          scheduledDate:  sDate,
          postedAt:       status === 'Posted' ? sDate : null,
          status,
          approvalStatus: approvalSt,
          approvalNote:   '',
          approvedBy:     approvalSt === 'Approved' ? adminId : null,
          approvedAt:     approvalSt === 'Approved' ? sDate : null,
          category:       tpl.category,
          aiGenerated:    false,
          notes:          '',
          script:         { hook:'', body:'', cta:'', voiceover:'', textOverlays:[] },
          createdAt:      new Date(sDate.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt:      new Date(),
        });
      });
    };

    genMonthPosts(-2);    // 2 months ago — mostly posted
    genMonthPosts(-1);    // last month — mostly posted/approved
    genMonthPosts(0);     // this month — mix of posted, pending, scheduled
    genMonthPosts(1);     // next month — mostly draft/scheduled

    await postsCol.insertMany(postsToInsert, { ordered:false }).catch(() => {});

    // e) Create approval records for pending posts
    const pendingPosts = postsToInsert.filter(p => p.approvalStatus === 'Pending');
    if (pendingPosts.length > 0) {
      await approvalsCol.insertMany(
        pendingPosts.map(p => ({
          postId:      p._id || new mongoose.Types.ObjectId(),
          clientId,
          requestedBy: adminId,
          status:      'Pending',
          dueDate:     p.scheduledDate,
          createdAt:   new Date(),
          updatedAt:   new Date(),
        })),
        { ordered:false }
      ).catch(() => {});
    }

    console.log(`   ✓  ${cd.businessName.padEnd(35)} | ${postsToInsert.length} posts | portal: ${cd.portalEmail} / ${cd.portalPassword}`);
  }

  await mongoose.disconnect();

  console.log(`
══════════════════════════════════════════════════════════════════
  SEED COMPLETE ✅
══════════════════════════════════════════════════════════════════

  ADMIN LOGIN
  ──────────────────────────────────────────────────────────────
  admin@dotganga.com    /  admin123     (Admin)
  manager@dotganga.com  /  manager123  (Manager)
  smm1@dotganga.com     /  smm1234     (SMM)

  CLIENT PORTAL LOGINS (all pass: client123)
  ──────────────────────────────────────────────────────────────
${CLIENT_DATA.map(c => `  ${c.portalEmail.padEnd(42)}  ${c.businessName}`).join('\n')}

  STAFF LOGINS
  ──────────────────────────────────────────────────────────────
  rudra@dotganga.com    /  rudra123
  triti@dotganga.com    /  triti123
  mohit@dotganga.com    /  mohit123
  ritika@dotganga.com   /  ritika123

══════════════════════════════════════════════════════════════════`);
};

seed().catch(err => {
  console.error('Seed failed:', err.message, err.stack);
  process.exit(1);
});
