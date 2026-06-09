/**
 * Seed — DotGanga Real Clients
 * Each client gets: 6 Reels + 4 Carousels + 4 Stories + 2 Organic + 2 Ad Creative = 18 posts/month
 * Run: node backend/seedRealClients.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User     = require('./models/User');
const Client   = require('./models/Client');
const Post     = require('./models/Post');
const Approval = require('./models/Approval');

const d = (day, hr = 10) => new Date(2026, 5, day, hr, 0, 0); // June 2026

// Generate 6 Reels + 4 Carousels + 4 Stories + 2 Organic + 2 Ad Creative per client
function makePosts(biz, niche) {
  const niches = {
    art:       { reelCaps: ['🎨 Watch this stunning art piece come to life in 90 seconds! Like if you love art ❤️', '✨ The making of our most detailed painting yet — pure magic from start to finish. Share with an art lover!', '🖌️ Speed painting challenge! We tried to create a full portrait in 60 seconds 😱 Watch till the end!', '🎭 Behind the scenes: How we create custom murals for homes & offices. DM us to get yours!', '🌈 Colour therapy — painting live for mental wellness. Art heals. Come see us this weekend.', '🔥 Our most satisfying reel yet — watch this canvas transformation. Save it for inspiration!'], postCaps: ['5 art styles trending in 2026 🖼️ Which speaks to your soul? Swipe →', '6 ways to style original art in your home 🏠 Save this for your next redecoration!', 'Commission your own custom artwork this month 🎨 Starting ₹2,999. DM to book your slot!', '10,000 followers and counting! Thank you for supporting the art community ❤️'] },
    brand:     { reelCaps: ['3 things I wish I knew before starting my first business 💡 Watch till the end!', 'A day in my life as an entrepreneur 📅 The real, unfiltered version. No filters.', '5 habits that changed my mornings forever ☀️ Try these for 7 days — you\'ll thank me later.', 'How I closed my biggest deal — the exact conversation 🤝 Watch this carefully.', 'The mistake that cost me ₹5L — and what I learned 💸 Don\'t make this one.', 'Why 90% of people fail at their goals — the honest truth nobody tells you 🎯'], postCaps: ['7 books every entrepreneur must read 📚 I read these in 2025 and they changed everything.', 'Your network is your net worth — but only if you give first 🤝 Here\'s how I built mine.', 'The morning routine that made me 3x more productive ⏰ Save this!', 'Leadership isn\'t about being the loudest. It\'s about lifting everyone around you. 💪'] },
    resort:    { reelCaps: ['Wake up to THIS view every morning ☀️ This is what your next getaway looks like!', 'Our bonfire experience — stories, stars, and unforgettable memories 🔥✨', 'From pool to forest trek to gourmet dinner — a full day at the resort 🌿', 'The monsoon transformation at the resort 🌧️ Pure magic. Come see for yourself!', 'Sunrise yoga session at the resort ☀️🧘 Your body and mind will thank you.', 'Check-in to check-out — the full resort experience in 60 seconds 🏡'], postCaps: ['Everything included in our weekend package 🌿 Swipe to see all activities!', 'Top 5 reasons guests keep coming back every year ❤️ Real reviews, real stories.', 'MONSOON OFFER: 30% off all bookings in July-August 🌧️ Book before it\'s gone!', 'A photo tour of our luxury tents, cottages & family cabins 🏕️ Which is your favourite?'] },
    realestate:{ reelCaps: ['SOLD in 48 hours! 🏡 See how we found the perfect home for this family ❤️', 'Tour this stunning 3BHK luxury flat — available now! 🏠✨', 'Home loan explained in 60 seconds 🏦 Everything a first-time buyer needs to know.', '5 things to check BEFORE buying any property 🔍 Save this — it could save you lakhs!', 'Property market update June 2026 📈 Is NOW the right time to buy? Our expert answers.', 'From site visit to keys in hand — the full journey ✨ You could be next!'], postCaps: ['Top 4 localities to invest in right now 📍 Based on growth, connectivity & ROI.', 'Understanding home loans in 2026: What you MUST know before applying 📄', 'Our customer success story — from rented flat to dream home in 90 days 🏡❤️', '🏠 2BHK & 3BHK flats available — ready to move in, bank loan available, prime location!'] },
    logistics: { reelCaps: ['A day in the life of our delivery driver 🚛 Dedication you can trust!', 'How we deliver 10,000 packages across India every single day 📦 Behind the scenes!', 'Smart routing tech that cuts delivery time by 40% ⚡ See it in action.', 'From warehouse to doorstep — the full logistics journey in 90 seconds 🌐', 'Meet our fleet of 200+ vehicles ready to serve you 🚚 Ready for your business?', 'How Pro-Route kept a business running during peak season 🔥 Real case study.'], postCaps: ['5 signs your business needs a better logistics partner 🚩 Swipe to check.', 'How we reduced delivery times by 40% for 50+ businesses 📊 Case study inside →', 'NEW CLIENT OFFER: First 10 deliveries FREE + dedicated account manager 🎁', 'Pan-India delivery | Real-time tracking | Insurance covered | Same-day dispatch ✅'] },
    food:      { reelCaps: ['Our wood-fired pizza made from scratch — watch the full process 🍕🔥', 'How our Tiramisu is made every morning — no shortcuts, ever 🍮✨', 'Chef\'s secret Bolognese sauce — 4 hours of love in every pot 🍝', 'A full day in our kitchen — early morning to last service 👨‍🍳', 'The most satisfying food ASMR you\'ll see today 😍 Watch with volume up!', 'Date night at Da Italia — what a perfect evening looks like 🕯️❤️'], postCaps: ['Our June specials — new dishes added to the menu this month! 🍽️ Swipe to see all.', '"Best Italian food outside Italy!" — Thank you for the love! Come taste the difference 😍', 'DATE NIGHT SPECIAL: ₹1,999 for 2 — starter + mains + dessert + mocktails 🕯️', 'Top 5 must-try dishes at Da Italia — every foodie\'s bucket list! 🍕🍝🍮'] },
    lighting:  { reelCaps: ['Watch how the right lighting completely transforms this living room ✨ Before & After!', 'Smart home lighting demo — control your entire home from your phone 📱🏠', 'How we lit this luxury hotel lobby — the full installation story 💡', 'Energy saving LED vs. old bulbs — the difference will shock you 💚', 'The most beautiful showroom lighting setup you\'ve ever seen ✨', 'Installing decorative lights in 3 hours — timelapse transformation 🎆'], postCaps: ['How to choose the right lighting for every room 💡 Complete guide — save this!', 'Commercial lighting solutions for hotels, restaurants & offices 🏢 See our portfolio.', '🎉 LIGHTING SALE — Up to 35% OFF! Free installation above ₹5,000. This week only!', 'Smart lighting for smart homes 🏠 Control, timer, ambiance — all from one app.'] },
    namkeen:   { reelCaps: ['Watch our namkeen being made fresh — the traditional way 🙏 3 generations of taste!', 'ASMR of fresh namkeen being packed 📦 The crunch, the colour, the aroma! 😍', 'Can you guess how many kg of bhujia we make in one day? 😱 The answer will shock you!', '6 ways to eat namkeen beyond just snacking 🍽️ Try these at home tonight!', 'Our delivery process — from kitchen to your doorstep in under 48 hours 🚚', 'New flavour launch! 🎉 Watch the whole team\'s reaction when they taste it for the first time!'], postCaps: ['Our 12 bestselling flavours — which one\'s your favourite? 😋 Comment below!', 'Chai time is incomplete without our crispy sev ☕ Order now, pan-India delivery!', '🎁 GIFT HAMPERS for Diwali, birthdays & corporate gifting. Custom branding available!', 'FREE DELIVERY pan-India above ₹499! Fresh namkeen, no preservatives, traditional recipe 🙏'] },
    fashion:   { reelCaps: ['New collection DROP 🔥 Summer 2026 is HERE. Swipe through the whole look!', 'Style one outfit 5 ways 👗 From casual to formal — watch till the end!', 'Behind the seams — how each piece is handcrafted by our artisans 🧵', 'OOTD transformation 💃 3 complete looks using only pieces from our store!', 'Packaging day at Mayank Fashion 📦 Every order gets this special treatment ❤️', 'Summer fabrics for Indian weather — what works and what doesn\'t 🌞 Must watch!'], postCaps: ['Style 1 outfit 5 ways 👗 Our bestselling kurta styled for every occasion. Save this!', 'Perfect wedding guest outfits for June 2026 💃 Swipe for 6 complete looks!', '🛍️ SUMMER SALE — 25% off everything! Valid 13-20 June. Shop now!', 'Customer spotlight — see how our community styles their Mayank Fashion picks 🌟'] },
    health:    { reelCaps: ['5 exercises for back pain relief you can do at home 🧘 Our physio\'s top picks — save this!', 'Patient success story: "I couldn\'t walk for 3 years. Today I ran 5km." 🌟', '3 stretches for desk workers — takes 5 minutes, saves your spine 💻', 'What happens in a physiotherapy session? Full walkthrough 🏥', 'Sports injury rehab — from zero to back on the field in 8 weeks ⚽', 'Common posture mistakes you\'re making right now — and how to fix them 📏'], postCaps: ['5 exercises for back pain you can do at home 🧘 Our physiotherapists recommend these!', 'FREE ASSESSMENT CAMP — 20 June 2026. Back pain, sports injuries, post-surgery. 50 slots!', 'Know your pain: When to see a physio vs. when to rest 🩺 Expert guide inside →', 'Post-surgical rehabilitation: Why the first 6 weeks are CRITICAL for long-term recovery 🏥'] },
    interior:  { reelCaps: ['Before & After: Complete home makeover by Jayalwal Design 🏡✨ Same space, new life!', 'Designing a modern living room from scratch — full process 🛋️', 'Client handover day 🎉 Nothing beats this moment. This is why we do what we do!', 'Small space, BIG style — how we transformed a 300 sq ft studio apartment 🏠', '3 rooms completely transformed — watch the magic happen ✨', 'Modern kitchen reveal 🍳 From white walls to a chef\'s dream in 30 days!'], postCaps: ['Before & After — our most loved home transformation of the month 🏠✨', '10 small changes that make a BIG difference in your home 🪴 Save this!', 'FREE 30-minute interior consultation this month 🛋️ DM "DESIGN" to book your slot!', 'Top 8 home decor trends for 2026 — which one suits your home? Swipe →'] },
    books:     { reelCaps: ['New arrivals at Pustira! 🎉📚 Fresh stock just landed — come see them in store!', 'Book recommendation ASMR 📖 Our staff picks this month — watch with volume up!', 'Setting up the perfect reading corner — 5 easy steps 🪑☕', 'Unboxing our biggest order ever! 📦 See what\'s coming to Pustira shelves!', '30-day reading challenge — will you join us? 📚 Comment YES below!', 'Staff book review — honest opinion on our #1 bestseller this month 📖'], postCaps: ['Top 5 books you MUST read this month 📖 Our staff picks — comment your current read!', 'Set up the perfect reading corner at home 🪑☕ 5 simple ideas — save this!', '📚 JUNE BOOK SALE — Up to 40% off! Free delivery above ₹500. Valid till 30 June!', 'Reading transforms you. One page at a time 📖 What are you reading right now?'] },
    cafe:      { reelCaps: ['A day in the life of our barista ☕ — the passion behind every perfect cup!', 'Latte art timelapse — watch our barista create something beautiful 🎨☕', 'Our new Mango Cold Brew — the most refreshing thing you\'ll drink this summer 🥭', 'From bean to cup — how we brew our signature cold brew ☕ 12-hour process!', 'Cafe ASMR morning routine 🌅 The sounds that start our day at The HideOut!', 'Our most viral food item — the Chocolate Waffle Tower 🍫 Making it from scratch!'], postCaps: ['Our menu highlights — Signature cold brews | Loaded sandwiches | Dessert waffles 🍽️', 'STUDENT SPECIAL: 20% off beverages 2-5 PM daily with student ID 🎓 Free WiFi included!', 'The perfect date spot? Cozy corners, great coffee, even better vibes 💕 Book your table!', 'Today\'s specials ☕ Mango Cold Brew ₹199 | Avocado Toast ₹249 | Waffle Tower ₹349'] },
    app:       { reelCaps: ['Adventure in one tap — introducing TREK App! 🏔️📱 Download now, it\'s free!', 'How TREK App helped a solo trekker complete Kedarkantha safely ❤️ Real story.', '500+ verified trek routes in your pocket 🗺️ See how the app works in 60 seconds!', 'User review: "TREK App is the best thing that happened to trekking in India" 🌟', 'How our SOS feature saved someone\'s life on the trail 🆘 This is why we built TREK.', 'Himachal summer treks 2026 — top 5 routes on TREK App 🏔️ Plan your next adventure!'], postCaps: ['5 reasons 50,000+ trekkers use TREK App 🌄 GPS | Safety | Community | Weather | Diaries', '🌄 SUMMER TREKKING SEASON IS HERE! 500+ routes in Himachal, Uttarakhand & Kashmir.', 'TREK App Challenge 🌿 Share your trek using #TREKAppChallenge — win a Pro subscription!', 'Download TREK App FREE — verified routes, offline GPS, SOS alerts, trek buddies near you ✅'] },
    mall:      { reelCaps: ['Chirag Interior Mall — India\'s most beautiful interior destination! 🏡 Full tour inside!', 'Furniture transformation — from our showroom to your living room ✨ Watch the reveal!', 'Interior styling tips from our experts 🛋️ 5 changes that transform any room!', 'New arrivals at Chirag! 🎉 Sofas | Beds | Dining sets | Lighting — all under one roof!', 'Before & After: 3 rooms transformed using furniture from Chirag 🏠✨', 'How to choose the right sofa for your home 🛋️ Expert guide in 60 seconds!'], postCaps: ['Top 8 home decor trends for 2026 🛋️ Japandi | Biophilic | Earthy — swipe to find yours!', 'Small space? Big style! 7 ways to make any room feel larger 🏠✨ Save this!', '🏠 INTERIOR MALL SALE — Up to 50% off sofas, beds, lighting & curtains! 17-30 June.', 'Our interior design team helps you from concept to completion 🎨 Free consultation available!'] },
    business:  { reelCaps: ['Building something great takes time, patience & the right team 💪 Here\'s our story!', 'Behind the scenes of our operations — the people who make it happen every day 🌟', 'A client success story — how we helped them grow 3x in 6 months 📈', 'Answering your top questions about our services 🎙️ Watch till end!', 'Team of the month spotlight — meet the people behind the brand ❤️', 'Expanding to 3 new cities! 🎉 Watch the announcement — big news coming!'], postCaps: ['Our journey so far — milestones that shaped who we are today 🌟 Swipe →', 'Why our clients choose us over the competition 💯 Real reasons, real results.', '5 reasons businesses in Rajasthan trust us for their needs 🤝 Read the stories!', 'New services available now! Contact us today and let\'s grow together 📞'] },
  };

  const n = niches[niche] || niches.business;

  // 6 Reels: days 2,5,9,13,18,23
  const reelDays = [2, 5, 9, 13, 18, 23];
  // 4 Carousels: days 7,14,21,28
  const carDays  = [7, 14, 21, 28];
  // 4 Stories: days 3,10,17,24
  const storyDays= [3, 10, 17, 24];
  // 2 Organic: days 11,25
  const orgDays  = [11, 25];
  // 2 Ad Creative: days 6,20
  const adDays   = [6, 20];

  const posts = [];

  reelDays.forEach((day, i) => {
    const posted   = i < 3; // first 3 already posted
    const approved = i < 4; // first 4 approved
    posts.push({
      day, hr: 9 + (i % 3),
      cat: 'Reel',
      plat: ['Instagram'],
      status: posted ? 'Posted' : approved ? 'Scheduled' : 'Draft',
      approval: approved ? 'Approved' : 'Pending',
      cap: n.reelCaps[i] || `🎬 Reel #${i+1} for ${biz} — watch this amazing content we created for you!`,
      tags: `#${biz.replace(/\s/g,'')} #Reels #InstagramReels #DigitalMarketing`,
    });
  });

  carDays.forEach((day, i) => {
    const posted   = i < 2;
    const approved = i < 3;
    posts.push({
      day, hr: 11 + (i % 2),
      cat: 'Carousel',
      plat: ['Instagram', 'Facebook'],
      status: posted ? 'Posted' : approved ? 'Scheduled' : 'Draft',
      approval: approved ? 'Approved' : 'Pending',
      cap: n.postCaps[i] || `📸 Post #${i+1} for ${biz} — great content for your audience!`,
      tags: `#${biz.replace(/\s/g,'')} #ContentMarketing #SocialMedia`,
    });
  });

  storyDays.forEach((day, i) => {
    const posted = i < 2;
    posts.push({
      day, hr: 10,
      cat: 'Story',
      plat: ['Instagram'],
      status: posted ? 'Posted' : 'Scheduled',
      approval: 'Approved',
      cap: `📱 Story update for ${biz}! Quick peek behind the scenes — stay tuned for more amazing content this week! 🌟`,
      tags: `#${biz.replace(/\s/g,'')} #Story`,
    });
  });

  orgDays.forEach((day, i) => {
    posts.push({
      day, hr: 12,
      cat: 'Organic',
      plat: ['Instagram', 'Facebook'],
      status: i === 0 ? 'Posted' : 'Draft',
      approval: i === 0 ? 'Approved' : 'Pending',
      cap: n.postCaps[3] || `🌟 ${biz} — thank you for the amazing support! We are growing every day because of you. ❤️`,
      tags: `#${biz.replace(/\s/g,'')} #Community #Grateful`,
    });
  });

  adDays.forEach((day, i) => {
    posts.push({
      day, hr: 14,
      cat: 'Ad Creative',
      plat: ['Instagram', 'Facebook'],
      status: 'Draft',
      approval: 'Pending',
      cap: `🎯 SPECIAL OFFER from ${biz}! Limited time deal — contact us today before it expires. Premium quality, unbeatable value.\n\n📞 DM or call us now!`,
      tags: `#${biz.replace(/\s/g,'')} #Offer #AdCreative`,
    });
  });

  return posts;
}

const CLIENTS = [
  { businessName:'El-Arte',                     contactName:'El-Arte Admin',          email:'elarte@client.in',      password:'Client@123', industry:'Art & Creative Studio',      services:['Instagram','Reels','Content Creation','Meta Ads'],   platforms:['Instagram','Facebook'], niche:'art'        },
  { businessName:'Sundeep',                      contactName:'Sundeep',                email:'sundeep@client.in',     password:'Client@123', industry:'Personal Brand',             services:['Instagram','LinkedIn','Personal Branding'],          platforms:['Instagram','LinkedIn','Facebook'], niche:'brand'   },
  { businessName:'Rambhadeep',                   contactName:'Rambhadeep',             email:'rambhadeep@client.in',  password:'Client@123', industry:'Business',                   services:['Social Media Management','Content Creation'],        platforms:['Instagram','Facebook'], niche:'business'   },
  { businessName:'Kuriya Resorts',               contactName:'Kuriya Resorts Admin',   email:'kuriya@client.in',      password:'Client@123', industry:'Hospitality & Tourism',      services:['Instagram','Facebook Ads','Meta Ads'],               platforms:['Instagram','Facebook'], niche:'resort'     },
  { businessName:'Shree Mahaveer Real Estate',   contactName:'Mahaveer Admin',         email:'mahaveer@client.in',    password:'Client@123', industry:'Real Estate',                services:['Facebook Ads','Lead Gen','Instagram','Meta Ads'],    platforms:['Facebook','Instagram'], niche:'realestate' },
  { businessName:'Pro-Route',                    contactName:'Pro-Route Admin',        email:'proroute@client.in',    password:'Client@123', industry:'Logistics & Transport',      services:['LinkedIn','Social Media','Meta Ads'],                platforms:['LinkedIn','Instagram','Facebook'], niche:'logistics'},
  { businessName:'Baluka Resorts',               contactName:'Baluka Admin',           email:'baluka@client.in',      password:'Client@123', industry:'Hospitality & Tourism',      services:['Instagram','Content Creation','Meta Ads'],           platforms:['Instagram','Facebook'], niche:'resort'     },
  { businessName:'Jayalwal Design',              contactName:'Jayalwal Admin',         email:'jayalwal@client.in',    password:'Client@123', industry:'Interior Design',            services:['Instagram','Portfolio','Content Creation'],          platforms:['Instagram','Facebook'], niche:'interior'   },
  { businessName:'Pustira',                      contactName:'Pustira Admin',          email:'pustira@client.in',     password:'Client@123', industry:'Books & Stationery',         services:['Instagram','Content Creation'],                      platforms:['Instagram','Facebook'], niche:'books'      },
  { businessName:'Da Italia by Sundeep',         contactName:'Da Italia Admin',        email:'daitalia@client.in',    password:'Client@123', industry:'Restaurant & F&B',           services:['Instagram','Food Photography','Meta Ads','Reels'],   platforms:['Instagram','Facebook'], niche:'food'       },
  { businessName:'Alakh Lights',                 contactName:'Alakh Admin',            email:'alakh@client.in',       password:'Client@123', industry:'Lighting & Electricals',     services:['Instagram','Product Photography','Content'],         platforms:['Instagram','Facebook'], niche:'lighting'   },
  { businessName:'Krishna Villas Namkeen',       contactName:'Krishna Admin',          email:'krishna@client.in',     password:'Client@123', industry:'Food & Snacks Brand',        services:['Instagram','Product Photography','Meta Ads'],        platforms:['Instagram','Facebook','WhatsApp'], niche:'namkeen'},
  { businessName:'Mayank Fashion',               contactName:'Mayank Admin',           email:'mayank@client.in',      password:'Client@123', industry:'Fashion & Apparel',          services:['Instagram','Reels','Fashion Photography','Meta Ads'],platforms:['Instagram','Facebook'], niche:'fashion'    },
  { businessName:'Rehab 360',                    contactName:'Rehab Admin',            email:'rehab360@client.in',    password:'Client@123', industry:'Healthcare / Rehabilitation',services:['Instagram','Facebook','Patient Education','Meta Ads'],platforms:['Instagram','Facebook','LinkedIn'], niche:'health'},
  { businessName:'Chirag – The Interior Mall',   contactName:'Chirag Admin',           email:'chirag@client.in',      password:'Client@123', industry:'Interior Design & Decor',    services:['Instagram','Content Creation','Meta Ads'],           platforms:['Instagram','Facebook'], niche:'mall'       },
  { businessName:'The HideOut Cafe',             contactName:'HideOut Admin',          email:'hideout@client.in',     password:'Client@123', industry:'Cafe & Restaurant',          services:['Instagram','Food Photography','Reels','Meta Ads'],   platforms:['Instagram','Facebook'], niche:'cafe'       },
  { businessName:'TREK App',                     contactName:'TREK Admin',             email:'trekapp@client.in',     password:'Client@123', industry:'Technology / Adventure App', services:['Instagram','LinkedIn','Content Creation','Meta Ads'],platforms:['Instagram','LinkedIn','Facebook'], niche:'app' },
];

const CONTENT_TARGETS = { Reel:6, Carousel:4, Story:4, Organic:2, 'Ad Creative':2 };

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dotganga_attendance');
  console.log('✅ Connected to MongoDB\n🗑️  Clearing old data...');
  await User.deleteMany({ role: 'Client' });
  await Client.deleteMany({});
  await Post.deleteMany({});
  await Approval.deleteMany({});
  console.log('   Done.\n');

  const admin = await User.findOne({ role: { $in: ['Super Admin', 'Admin'] } });
  if (!admin) { console.error('❌ No admin found. Run seed.js first.'); process.exit(1); }

  const results = [];

  for (const def of CLIENTS) {
    const clientUser = await User.create({
      name: def.businessName, email: def.email, password: def.password,
      role: 'Client', department: 'Client', designation: 'Client',
    });

    const client = await Client.create({
      businessName: def.businessName, contactName: def.contactName,
      email: def.email, industry: def.industry, services: def.services,
      primaryPlatforms: def.platforms, userRef: clientUser._id,
      createdBy: admin._id, isActive: true, contentTargets: CONTENT_TARGETS,
    });

    await User.findByIdAndUpdate(clientUser._id, { clientRef: client._id });

    const posts = makePosts(def.businessName, def.niche);
    let postCount = 0;
    for (const p of posts) {
      const post = await Post.create({
        clientId: client._id, platforms: p.plat, caption: p.cap,
        hashtags: p.tags || '', category: p.cat, scheduledDate: d(p.day, p.hr),
        status: p.status, approvalStatus: p.approval, createdBy: admin._id, mediaUrls: [],
      });
      await Approval.create({
        postId: post._id, clientId: client._id, requestedBy: admin._id,
        status: p.approval, dueDate: d(p.day, p.hr),
      });
      postCount++;
    }

    results.push({ name: def.businessName, email: def.email, posts: postCount });
    console.log(`✅ ${def.businessName.padEnd(36)} ${postCount} posts (6R+4C+4S+2O+2A)`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 ALL 17 CLIENTS SEEDED — 18 POSTS EACH!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 ALL PASSWORDS: Client@123\n');
  results.forEach(r => console.log(`  ${r.email.padEnd(32)} Client@123`));
  console.log('\nAdmin: admin@dotganga.com / admin123\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
