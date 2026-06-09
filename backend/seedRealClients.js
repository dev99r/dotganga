/**
 * Seed script — DotGanga Real Clients
 * Clears ALL existing clients, client users, and posts, then recreates fresh.
 * Run: node backend/seedRealClients.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User     = require('./models/User');
const Client   = require('./models/Client');
const Post     = require('./models/Post');
const Approval = require('./models/Approval');

// ── Date helpers ──────────────────────────────────────────────────────────────
const d = (day, hr = 10, min = 0) => new Date(2026, 5, day, hr, min, 0);

// ── Client definitions ────────────────────────────────────────────────────────
const CLIENTS = [
  // ── 1. El-Arte ⭐ ──────────────────────────────────────────────────────────
  {
    businessName: 'El-Arte',
    contactName:  'El-Arte Admin',
    email:        'elarte@client.in',
    password:     'Client@123',
    industry:     'Art & Creative Studio',
    services:     ['Instagram Management', 'Content Creation', 'Reels', 'Meta Ads'],
    platforms:    ['Instagram', 'Facebook'],
    priority:     true,
    posts: [
      { day:1,  hr:9,  cat:'Reel',         plat:['Instagram'],           status:'Posted',    approval:'Approved',
        cap:'🎨 Every brushstroke tells a story. Watch our latest art piece come to life in this mesmerizing timelapse! Art is the language of the soul.\n\n#ElArte #ArtStudio #AbstractArt #ArtLovers #CreativeIndia', tags:'#ElArte #ArtStudio #AbstractArt' },
      { day:3,  hr:11, cat:'Carousel',     plat:['Instagram','Facebook'], status:'Scheduled', approval:'Approved',
        cap:'5 art styles trending in 2026 🖼️ From abstract expressionism to digital art — which speaks to your soul? Swipe to discover your style.\n\n#ArtTrends #ContemporaryArt #ElArte', tags:'#ArtTrends #ContemporaryArt' },
      { day:7,  hr:10, cat:'Story',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Behind the canvas ✨ Meet the artists behind El-Arte and their creative process. Real people, real passion, real art.', tags:'#BehindTheCanvas #Artist' },
      { day:10, hr:12, cat:'Organic',      plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Art is not what you see, but what you make others see. 🌟 Come visit our gallery this weekend — walk-ins welcome!\n\n#ArtGallery #ElArte #Gallery', tags:'#ArtGallery #OpenGallery' },
      { day:14, hr:10, cat:'Ad Creative',  plat:['Instagram','Facebook'], status:'Scheduled', approval:'Approved',
        cap:'🎭 Limited edition prints now available! Original artwork by our curated artists. Only 50 pieces each. DM us to order yours before they\'re gone.\n\nStarting ₹2,999 only.', tags:'#LimitedEdition #ArtPrints' },
      { day:18, hr:9,  cat:'Reel',         plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Colour, texture, emotion 🎨 A behind-the-scenes look at how we create custom murals for homes & offices. Transform any wall into a masterpiece.', tags:'#CustomMurals #WallArt' },
      { day:22, hr:11, cat:'Carousel',     plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'6 ways to style art in your living room 🏠 The right piece transforms a space. Swipe for inspiration from our interior styling team!\n\n#InteriorArt #HomeDecor #ElArte', tags:'#HomeDecor #InteriorArt' },
      { day:26, hr:10, cat:'Organic',      plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'Thank you for 10,000 art lovers following our journey! 🙏❤️ Your support means everything to us. Stay tuned — something special is coming this month.', tags:'#Milestone #ThankYou #ElArte' },
      { day:28, hr:14, cat:'Ad Creative',  plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'🖼️ Commission your own custom artwork with El-Arte. Perfect for homes, offices, gifts & events. Starting ₹5,000. Limited slots available this month.', tags:'#CommissionArt #CustomArtwork' },
    ],
  },

  // ── 2. Sundeep ⭐ ──────────────────────────────────────────────────────────
  {
    businessName: 'Sundeep',
    contactName:  'Sundeep',
    email:        'sundeep@client.in',
    password:     'Client@123',
    industry:     'Personal Brand / Entrepreneur',
    services:     ['Personal Branding', 'LinkedIn Management', 'Instagram Management'],
    platforms:    ['Instagram', 'LinkedIn', 'Facebook'],
    priority:     true,
    posts: [
      { day:1,  hr:8,  cat:'Organic',     plat:['Instagram','LinkedIn'], status:'Posted',    approval:'Approved',
        cap:'The only difference between a good day and a great day is your mindset. 🚀 Start your week with intention.\n\n#MondayMotivation #Entrepreneur #Sundeep', tags:'#MondayMotivation #Mindset' },
      { day:4,  hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'3 things I wish I knew before starting my first business 💡 Watch till the end — the third one changed everything for me.\n\n#BusinessTips #Entrepreneur', tags:'#BusinessTips #StartupLife' },
      { day:8,  hr:10, cat:'Carousel',    plat:['Instagram','LinkedIn'], status:'Scheduled', approval:'Approved',
        cap:'How I went from ₹0 to my first ₹10L in business 📈 It wasn\'t luck. It was a system. Here\'s exactly what I did — step by step. Save this post.\n\n#BusinessGrowth', tags:'#BusinessGrowth #Entrepreneur' },
      { day:12, hr:8,  cat:'Organic',     plat:['LinkedIn'],             status:'Scheduled', approval:'Approved',
        cap:'Leadership isn\'t about being the loudest in the room. It\'s about lifting everyone around you higher. What\'s your leadership style?\n\n#Leadership #BusinessMindset', tags:'#Leadership #Professional' },
      { day:16, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'A typical day in my life as an entrepreneur 📅 From 5 AM to 11 PM — the real, unfiltered version. No filters, no fake routines. Just hustle.', tags:'#DayInLife #Entrepreneur' },
      { day:20, hr:10, cat:'Carousel',    plat:['Instagram','LinkedIn'], status:'Draft',     approval:'Pending',
        cap:'7 books that transformed my thinking as an entrepreneur 📚 I read these in 2025 and they changed how I make decisions. Which have you read?\n\n#Books #Entrepreneur', tags:'#BookRecommendations #Reading' },
      { day:24, hr:8,  cat:'Organic',     plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Your network is your net worth. 🤝 But only if you actually add value to those relationships. Stop taking. Start giving.\n\n#Networking #BusinessTips #Sundeep', tags:'#Networking #GrowthMindset' },
      { day:28, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'The uncomfortable truth about success that nobody talks about 🎯 It\'s not about talent. It\'s not about luck. It\'s about this one thing...', tags:'#SuccessMindset #Truth' },
    ],
  },

  // ── 3. Rambhadeep ─────────────────────────────────────────────────────────
  {
    businessName: 'Rambhadeep',
    contactName:  'Rambhadeep',
    email:        'rambhadeep@client.in',
    password:     'Client@123',
    industry:     'Business',
    services:     ['Social Media Management', 'Content Creation'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:2,  hr:10, cat:'Organic',     plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Building something great takes time, patience, and the right team. 💪 We are here to stay.\n\n#Rambhadeep #Business #Growth', tags:'#Business #Growth' },
      { day:6,  hr:11, cat:'Carousel',    plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Our journey so far — milestones that made us who we are today. Swipe through our story. 🌟\n\n#OurStory #Milestone #Rambhadeep', tags:'#OurStory #Journey' },
      { day:10, hr:10, cat:'Reel',        plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Hard work always pays off. Here\'s proof. 🙌 Watch our team in action and see what dedication looks like.\n\n#HardWork #Team #Rambhadeep', tags:'#HardWork #TeamWork' },
      { day:15, hr:9,  cat:'Organic',     plat:['Facebook'],             status:'Draft',     approval:'Pending',
        cap:'Thank you to our loyal customers and partners. Your trust is our biggest achievement. 🙏\n\n#Gratitude #Customers #Rambhadeep', tags:'#Gratitude #Community' },
      { day:20, hr:10, cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'New services available now! Get in touch with us today and let us help your business grow. 📞 DM or call us.\n\n#NewServices #Business', tags:'#NewOffer #Services' },
      { day:25, hr:11, cat:'Carousel',    plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'5 reasons why our clients choose us over the competition. Real results, real relationships. Swipe to see why.\n\n#WhyUs #Testimonials', tags:'#ClientChoice #Results' },
    ],
  },

  // ── 4. Kuriya Resorts ─────────────────────────────────────────────────────
  {
    businessName: 'Kuriya Resorts',
    contactName:  'Kuriya Resorts Admin',
    email:        'kuriya@client.in',
    password:     'Client@123',
    industry:     'Hospitality & Tourism',
    services:     ['Instagram Management', 'Facebook Ads', 'Content Creation', 'Meta Ads'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:1,  hr:10, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Wake up to this view every morning ☀️ Kuriya Resorts — where nature meets luxury. Book your stay this summer.\n\nCall: [number] | DM to book\n\n#KuriyaResorts #Resort #NatureRetreat', tags:'#Resort #NatureRetreat #Staycation' },
      { day:5,  hr:11, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Our rooms, your sanctuary 🏡 Swipe to explore our premium cottages, family suites, and luxury tents. Which one would you choose?\n\n#KuriyaResorts #LuxuryStay', tags:'#LuxuryResort #HotelRooms' },
      { day:9,  hr:9,  cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Scheduled', approval:'Approved',
        cap:'🌿 SUMMER SPECIAL OFFER 🌿\nGet 30% OFF on all bookings this June!\nIncludes breakfast, bonfire & nature walk.\nValid till 30 June 2026.\n\n📞 Book now — limited slots!', tags:'#SummerOffer #ResortDeal' },
      { day:13, hr:10, cat:'Organic',     plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'A weekend at Kuriya is more than a stay — it\'s a feeling. 🌄 Our guests say they leave feeling recharged, renewed, and ready for anything.\n\n#GuestReview #KuriyaResorts', tags:'#GuestReview #Peaceful' },
      { day:17, hr:11, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'The bonfire experience at Kuriya Resorts 🔥✨ Nothing beats stories, laughter, and the night sky with your favourite people. Book your stay today!', tags:'#Bonfire #WeekendGetaway' },
      { day:21, hr:10, cat:'Story',       plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Today\'s resort activities: Morning yoga ☀️ | Forest trek 🌲 | Pool time 🏊 | Evening bonfire 🔥 — Book your all-inclusive package.', tags:'#ResortActivities #Wellness' },
      { day:25, hr:9,  cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Draft',     approval:'Pending',
        cap:'Plan your monsoon getaway now! 🌧️ Kuriya Resorts in monsoon is pure magic. Lush green views, cozy rooms, hot chai. Early bird discount available.\n\nDM to book!', tags:'#MonsoonGetaway #EarlyBird' },
    ],
  },

  // ── 5. Shree Mahaveer Real Estate ⭐ ──────────────────────────────────────
  {
    businessName: 'Shree Mahaveer Real Estate',
    contactName:  'Shree Mahaveer Admin',
    email:        'mahaveer@client.in',
    password:     'Client@123',
    industry:     'Real Estate',
    services:     ['Facebook Ads', 'Instagram Management', 'Lead Generation', 'Meta Ads'],
    platforms:    ['Facebook', 'Instagram', 'WhatsApp'],
    priority:     true,
    posts: [
      { day:1,  hr:10, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Posted',    approval:'Approved',
        cap:'🏡 YOUR DREAM HOME IS HERE!\nPremium 2BHK & 3BHK flats now available.\n✅ Ready to move\n✅ Bank loan available\n✅ Prime location\n\n📞 Call now for site visit!', tags:'#RealEstate #DreamHome #Property' },
      { day:4,  hr:11, cat:'Carousel',    plat:['Facebook','Instagram'], status:'Posted',    approval:'Approved',
        cap:'Why invest in real estate now? 📈 5 reasons the market is at its best in years. Shree Mahaveer Real Estate helps you make smart property decisions. Swipe to learn more.', tags:'#PropertyInvestment #RealEstate' },
      { day:8,  hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'SOLD! Another happy family finds their dream home 🏡❤️ From site visit to keys in hand — watch their journey. You could be next. DM us today!\n\n#HappyCustomer #SoldProperty', tags:'#SoldProperty #HappyClient' },
      { day:12, hr:10, cat:'Organic',     plat:['Facebook'],             status:'Scheduled', approval:'Approved',
        cap:'Understanding home loans in 2026: What you need to know before buying 📄 Our experts simplify the process for first-time buyers. Free consultation available.\n\n#HomeLoan #FirstTimebuyer', tags:'#HomeLoan #RealEstateTips' },
      { day:16, hr:11, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Draft',     approval:'Pending',
        cap:'🔑 PROPERTY EXPO THIS WEEKEND!\nLocation: [Venue]\nDate: 20-21 June 2026\nTime: 10 AM – 6 PM\n\nSee 50+ properties. Meet our experts. Get best deals!\nFree entry. Register now.', tags:'#PropertyExpo #RealEstateFair' },
      { day:20, hr:9,  cat:'Carousel',    plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'Top 4 localities to invest in right now 📍 Based on infrastructure growth, connectivity and ROI. Our experts pick the best areas for you. Save this post!\n\n#PropertyInvestment', tags:'#InvestmentTips #PropertyGuide' },
      { day:24, hr:10, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'3BHK luxury apartment tour 🏠✨ Premium fittings, modular kitchen, covered parking. Available at a special pre-launch price. Limited units. Call us TODAY!', tags:'#ApartmentTour #LuxuryFlat' },
      { day:28, hr:11, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Draft',     approval:'Pending',
        cap:'LAST CHANCE! 🚨 Only 3 units remaining at this price. Book before June ends and save ₹2 Lakhs on your dream home.\n\n📞 Call now! Limited offer.', tags:'#LastChance #PropertyDeal #LimitedUnits' },
    ],
  },

  // ── 6. Pro-Route ⭐ ───────────────────────────────────────────────────────
  {
    businessName: 'Pro-Route',
    contactName:  'Pro-Route Admin',
    email:        'proroute@client.in',
    password:     'Client@123',
    industry:     'Logistics & Transport',
    services:     ['Social Media Management', 'Content Creation', 'Meta Ads'],
    platforms:    ['LinkedIn', 'Instagram', 'Facebook'],
    priority:     true,
    posts: [
      { day:2,  hr:9,  cat:'Organic',     plat:['LinkedIn','Facebook'],  status:'Posted',    approval:'Approved',
        cap:'On-time delivery isn\'t just our promise — it\'s our identity. 🚛 Pro-Route connects businesses across India with reliable, tracked logistics solutions.\n\n#ProRoute #Logistics #Transport', tags:'#Logistics #Transport #Delivery' },
      { day:5,  hr:10, cat:'Carousel',    plat:['LinkedIn'],             status:'Posted',    approval:'Approved',
        cap:'How Pro-Route reduced delivery times by 40% for 50+ businesses 📦 A case study. Swipe to see how smart routing saves time and money for our clients.', tags:'#CaseStudy #Logistics #Efficiency' },
      { day:9,  hr:11, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Scheduled', approval:'Approved',
        cap:'🚚 FLEET OF 200+ VEHICLES READY FOR YOU\n✅ Pan-India delivery\n✅ Real-time tracking\n✅ Same-day dispatch\n✅ Insurance covered\n\nGet a free quote today! DM or call.', tags:'#FreightSolutions #B2BLogistics' },
      { day:13, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'A day in the life of a Pro-Route driver 🛣️ Dedication, precision, and pride in every delivery. Meet the backbone of our operation.\n\n#OurTeam #ProRoute #Logistics', tags:'#TeamSpotlight #LogisticsLife' },
      { day:17, hr:10, cat:'Organic',     plat:['LinkedIn'],             status:'Draft',     approval:'Pending',
        cap:'Supply chain disruptions cost businesses millions. Here\'s how Pro-Route\'s smart routing tech keeps your supply chain bulletproof. 📊\n\n#SupplyChain #B2B #ProRoute', tags:'#SupplyChain #Technology' },
      { day:21, hr:11, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'5 signs your business needs a better logistics partner 🚩 If any of these sound familiar, it\'s time to switch to Pro-Route. Swipe to check.\n\n#LogisticsTips #B2B', tags:'#LogisticsTips #BusinessGrowth' },
      { day:25, hr:9,  cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Draft',     approval:'Pending',
        cap:'🌟 SPECIAL OFFER FOR NEW CLIENTS\nSign up with Pro-Route this month and get:\n📦 First 10 deliveries FREE\n📍 Free GPS tracking setup\n💼 Dedicated account manager\n\nDM us now!', tags:'#NewClientOffer #ProRoute' },
    ],
  },

  // ── 7. Baluka Resorts ─────────────────────────────────────────────────────
  {
    businessName: 'Baluka Resorts',
    contactName:  'Baluka Resorts Admin',
    email:        'baluka@client.in',
    password:     'Client@123',
    industry:     'Hospitality & Tourism',
    services:     ['Instagram Management', 'Content Creation', 'Meta Ads'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:2,  hr:10, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'The sound of the river, the breeze in the trees, the warmth of the fire 🔥🌊 This is Baluka. Come feel it yourself.\n\n#BalukaResorts #NatureRetreat #Escape', tags:'#NatureRetreat #Riverfront' },
      { day:6,  hr:11, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Explore Baluka Resorts 🌿 Our luxury tents, riverside cottages, and family cabins. Which is your perfect stay? Swipe to explore.\n\n#BalukaResorts #Resort', tags:'#ResortLife #Accommodation' },
      { day:11, hr:9,  cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Scheduled', approval:'Approved',
        cap:'🌧️ MONSOON PACKAGE — ₹3,999/night\nIncludes: Breakfast + Dinner + Bonfire + Adventure activity\n2 nights minimum. Valid July-September.\n\nBook NOW — fills fast every year!', tags:'#MonsoonPackage #ResortOffer' },
      { day:16, hr:10, cat:'Story',       plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Today at Baluka: Waterfall hike ⛰️ | River kayaking 🛶 | Campfire stories 🔥 Book your monsoon getaway now!', tags:'#ResortActivities #Monsoon' },
      { day:21, hr:11, cat:'Organic',     plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'"Best weekend of our lives!" — Our guests keep coming back, and they bring their families. 💚 Read what people say about Baluka.\n\n#GuestReview #BalukaResorts', tags:'#Testimonial #HappyGuests' },
      { day:26, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Sunrise at Baluka Resorts 🌅 This is what waking up in nature feels like. No alarms, just birdsong. You deserve this break.\n\n#SunriseViews #NatureLovers', tags:'#Sunrise #NaturePhotography' },
    ],
  },

  // ── 8. Jayalwal Design ────────────────────────────────────────────────────
  {
    businessName: 'Jayalwal Design',
    contactName:  'Jayalwal Design Admin',
    email:        'jayalwal@client.in',
    password:     'Client@123',
    industry:     'Interior Design',
    services:     ['Instagram Management', 'Portfolio Showcase', 'Content Creation'],
    platforms:    ['Instagram', 'Pinterest', 'Facebook'],
    posts: [
      { day:2,  hr:10, cat:'Carousel',    plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Before & After 🏡✨ A complete home makeover by Jayalwal Design. Swipe to see the transformation — same space, completely new life.\n\n#InteriorDesign #JayalwalDesign #BeforeAfter', tags:'#InteriorDesign #HomeTransformation' },
      { day:6,  hr:11, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Designing a modern living room from scratch 🛋️✨ Watch the entire process — from empty walls to a stunning, functional space. This is Jayalwal Design.\n\n#InteriorDesign #HomeDecor', tags:'#LivingRoomDesign #ModernHome' },
      { day:11, hr:9,  cat:'Organic',     plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Your home should tell the story of who you are 🏠 At Jayalwal Design, every space we create is personal, functional, and beautiful. DM for free consultation.\n\n#HomeDesign', tags:'#InteriorInspiration #DesignStudio' },
      { day:16, hr:10, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'10 small changes that make a BIG difference in your home 🪴 Easy, affordable interior upgrades you can do this weekend. Save this post!\n\n#HomeDecorTips #InteriorHacks', tags:'#HomeDecorTips #DIYInterior' },
      { day:21, hr:11, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Client handover day 🎉 Nothing beats the look on a client\'s face when they walk into their newly designed home for the first time. This is why we do what we do.\n\n#JayalwalDesign', tags:'#ClientHandover #InteriorDesign' },
      { day:26, hr:9,  cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'🛋️ FREE INTERIOR CONSULTATION\nBook a free 30-minute design consultation with Jayalwal Design this month.\nWe transform homes. We transform lives.\n\nDM "DESIGN" to get started!', tags:'#FreeConsultation #InteriorDesign' },
    ],
  },

  // ── 9. Pustira ────────────────────────────────────────────────────────────
  {
    businessName: 'Pustira',
    contactName:  'Pustira Admin',
    email:        'pustira@client.in',
    password:     'Client@123',
    industry:     'Retail / Books & Stationery',
    services:     ['Instagram Management', 'Content Creation'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:3,  hr:10, cat:'Organic',     plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'A book a day keeps the dullness away 📚✨ Explore our handpicked collection of fiction, non-fiction, self-help and more at Pustira.\n\n#Pustira #Books #Bookstore', tags:'#Bookstore #ReadingCommunity' },
      { day:7,  hr:11, cat:'Carousel',    plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Top 5 books you MUST read this month 📖 Our staff picks for June 2026. Swipe to see them all and find your next great read!\n\n#Pustira #BookRecommendations', tags:'#BookRecommendations #StaffPicks' },
      { day:12, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'New arrivals at Pustira! 🎉📚 Fresh stock just landed — from bestsellers to hidden gems. Come visit us or order online!\n\n#NewArrivals #Pustira #Books', tags:'#NewArrivals #Bookshop' },
      { day:17, hr:10, cat:'Organic',     plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'Reading transforms you. One page at a time. 📖💭 Share your current read in the comments! We love hearing what our community is exploring.\n\n#ReadingCommunity #Pustira', tags:'#ReadingChallenge #BookClub' },
      { day:22, hr:11, cat:'Carousel',    plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Set up the perfect reading corner at home 🪑☕ 5 simple ideas to create your cozy reading nook. Swipe for inspiration!\n\n#ReadingCorner #CozyHome #Pustira', tags:'#ReadingNook #BookLover' },
      { day:27, hr:9,  cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'📚 JUNE BOOK SALE — UP TO 40% OFF!\nOn all fiction, self-help & children\'s books.\nValid till 30 June 2026.\n\nVisit Pustira or order via DM. Free delivery on orders above ₹500!', tags:'#BookSale #Discount #Pustira' },
    ],
  },

  // ── 10. Da Italia by Sundeep ⭐ ────────────────────────────────────────────
  {
    businessName: 'Da Italia by Sundeep',
    contactName:  'Da Italia Admin',
    email:        'daitalia@client.in',
    password:     'Client@123',
    industry:     'Restaurant & F&B',
    services:     ['Instagram Management', 'Food Photography', 'Meta Ads', 'Reels'],
    platforms:    ['Instagram', 'Facebook', 'Zomato'],
    priority:     true,
    posts: [
      { day:1,  hr:12, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Our wood-fired pizza is not just food — it\'s art 🍕🔥 Watch it go from dough to perfection in 90 seconds. Made fresh, made with love, every single time.\n\n#DaItalia #Pizza #ItalianFood', tags:'#Pizza #ItalianRestaurant #WoodFired' },
      { day:4,  hr:13, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Our June specials are HERE! 🍝✨ Truffle Pasta | Burrata Salad | Tiramisu Cheesecake and more. Swipe to see what\'s new on the menu this month at Da Italia!\n\n#NewMenu #DaItalia', tags:'#NewMenu #ItalianFood #Foodie' },
      { day:7,  hr:12, cat:'Organic',     plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'"The best Italian food outside Italy!" — We\'ve heard this too many times to count 😍 Come taste the difference at Da Italia by Sundeep.\n\nReservations: DM or call us.\n\n#FoodReview', tags:'#FoodReview #Restaurant #Italian' },
      { day:11, hr:13, cat:'Reel',        plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Our chef\'s secret Bolognese sauce recipe... well, not the FULL secret 😄 But enough to show you why it takes 4 hours to make! 🍝\n\n#ChefSecrets #DaItalia #Pasta', tags:'#ChefBehindTheScenes #PastaLover' },
      { day:15, hr:12, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Scheduled', approval:'Approved',
        cap:'🍕 DATE NIGHT SPECIAL — ₹1,999 for 2\nIncludes: Starter + 2 Mains + 1 Dessert + Mocktails\nAvailable Friday & Saturday evenings.\n\nBook your table now — limited seats!', tags:'#DateNight #RestaurantOffer #Couples' },
      { day:19, hr:13, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'How our Tiramisu is made — from scratch, every morning 🍮✨ No shortcuts. No compromises. That\'s the Da Italia promise.\n\n#Tiramisu #Dessert #ItalianDesserts', tags:'#Tiramisu #DessertLovers #Foodgram' },
      { day:23, hr:12, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'5 dishes you MUST try at Da Italia before you die 🍽️ Our most loved, most Instagrammed, most requested dishes of all time. Swipe to see them all!\n\n#MustEat #DaItalia', tags:'#MustTry #FoodPhotography #Italian' },
      { day:27, hr:13, cat:'Organic',     plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Sunday vibes + Italian food = the perfect combination ☀️🍝 Join us for our Sunday Brunch special this weekend. Families welcome. Walk-ins available.\n\n#SundayBrunch #DaItalia', tags:'#SundayBrunch #Brunch #FamilyDining' },
    ],
  },

  // ── 11. Alakh Lights ──────────────────────────────────────────────────────
  {
    businessName: 'Alakh Lights',
    contactName:  'Alakh Lights Admin',
    email:        'alakh@client.in',
    password:     'Client@123',
    industry:     'Lighting & Electricals',
    services:     ['Instagram Management', 'Product Photography', 'Content Creation'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:2,  hr:10, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'The right light changes everything ✨ Watch how Alakh Lights transformed this living room with our premium LED collection. Same space. Completely different feel.\n\n#AlakhLights #Lighting #HomeDecor', tags:'#Lighting #LEDLights #HomeDecor' },
      { day:6,  hr:11, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'How to choose the right lighting for every room 💡 A complete guide from Alakh Lights. Kitchen | Bedroom | Living room | Bathroom. Swipe through!\n\n#LightingGuide #HomeLighting', tags:'#LightingDesign #InteriorLighting' },
      { day:11, hr:9,  cat:'Organic',     plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Energy saving + beautiful design = Alakh Lights 🌿💡 Our premium LED collection cuts your electricity bill by up to 60% without compromising on style.\n\n#EnergySaving #LED #AlakhLights', tags:'#EnergySaving #GreenHome #LEDLighting' },
      { day:16, hr:10, cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'🎉 FESTIVE LIGHTING SALE — UP TO 35% OFF!\nDecorative lights | LED strips | Chandeliers | Smart bulbs\n\nFree installation on orders above ₹5,000.\nShop now or DM us!', tags:'#LightingSale #HomeIllumination' },
      { day:21, hr:11, cat:'Carousel',    plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Commercial lighting solutions by Alakh Lights 🏢 Hotels, restaurants, offices, showrooms — we light them all. See our commercial projects. Swipe.\n\n#CommercialLighting #B2B', tags:'#CommercialLighting #OfficeLights' },
      { day:26, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Smart lighting for smart homes 🏠📱 Control your entire home\'s lighting from your phone. Alakh Smart Series — now available in India.\n\n#SmartLighting #SmartHome #AlakhLights', tags:'#SmartHome #IoTLighting' },
    ],
  },

  // ── 12. Krishna Villas Namkeen ⭐ ──────────────────────────────────────────
  {
    businessName: 'Krishna Villas Namkeen',
    contactName:  'Krishna Villas Admin',
    email:        'krishna@client.in',
    password:     'Client@123',
    industry:     'Food & Snacks Brand',
    services:     ['Instagram Management', 'Product Photography', 'Meta Ads', 'Content Creation'],
    platforms:    ['Instagram', 'Facebook', 'WhatsApp'],
    priority:     true,
    posts: [
      { day:1,  hr:11, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Made fresh, made with love 🙏 Watch how our traditional namkeen is prepared the authentic way — the same recipe for 3 generations.\n\n#KrishnaVillasNamkeen #Namkeen #SnackLovers', tags:'#Namkeen #TraditionalSnacks #Foodie' },
      { day:4,  hr:10, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Our bestselling namkeen flavours! 😋 Swipe to see all 12 varieties — from classic Bikaneri Bhujia to our new Peri-Peri Mix. Order home delivery!\n\n#KrishnaVillas #Snacks', tags:'#SnackTime #NamkeenLovers #Varieties' },
      { day:8,  hr:11, cat:'Organic',     plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Chai time is incomplete without our crispy sev! ☕ Crunch, flavour, happiness in every bite. Order now — shipping across India.\n\n#ChaiAndNamkeen #KrishnaVillas #Snacks', tags:'#ChaiTime #Sev #IndianSnacks' },
      { day:12, hr:10, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Scheduled', approval:'Approved',
        cap:'🎁 GIFT HAMPERS FOR EVERY OCCASION!\nKrishna Villas Namkeen gift boxes — perfect for Diwali, birthdays, corporate gifting & more.\nCustom branding available.\n\nOrder now! DM or WhatsApp.', tags:'#GiftHamper #NamkeenGift #CorporateGifts' },
      { day:16, hr:11, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'ASMR of our fresh namkeen being packed 📦✨ The crunch, the colour, the aroma — you can almost smell it through the screen! Order yours today.\n\n#ASMRFood #KrishnaVillas', tags:'#ASMRFood #FoodASMR #Satisfying' },
      { day:20, hr:10, cat:'Carousel',    plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'6 ways to eat our namkeen beyond just snacking 🍽️ Use it as a chaat topping, sandwich filling, salad crunch and more! Swipe for ideas.\n\n#NamkeenRecipes #SnackHacks', tags:'#FoodHacks #SnackRecipes' },
      { day:24, hr:11, cat:'Organic',     plat:['Facebook'],             status:'Draft',     approval:'Pending',
        cap:'3 generations of taste, packed with love in every bag 🙏 Krishna Villas Namkeen — a family tradition since 1987. Because some recipes are too good to change.\n\n#Since1987 #Heritage', tags:'#TraditionalFood #FamilyBusiness' },
      { day:28, hr:10, cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'🚚 FREE DELIVERY PAN INDIA above ₹499!\nFresh Namkeen | No preservatives | Traditional recipe\nOrder on our website or DM us.\nMade fresh. Delivered fast. Eaten instantly! 😄', tags:'#FreeDelivery #OrderNow #NamkeenDelivery' },
    ],
  },

  // ── 13. Mayank Fashion ────────────────────────────────────────────────────
  {
    businessName: 'Mayank Fashion',
    contactName:  'Mayank Fashion Admin',
    email:        'mayank@client.in',
    password:     'Client@123',
    industry:     'Fashion & Apparel',
    services:     ['Instagram Management', 'Reels', 'Fashion Photography', 'Meta Ads'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:2,  hr:11, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'New collection DROP 🔥 Summer 2026 is here! Bold colours, clean silhouettes, and effortless style. This season at Mayank Fashion.\n\n#MayankFashion #SummerCollection #Fashion', tags:'#FashionReels #OOTD #SummerFashion' },
      { day:5,  hr:10, cat:'Carousel',    plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Style 1 outfit 5 ways 👗✨ Our bestselling kurta — styled differently for different occasions. Casual to formal, day to evening. Swipe to see all looks!\n\n#StyleTips #MayankFashion', tags:'#StyleInspo #OOTD #FashionTips' },
      { day:9,  hr:11, cat:'Organic',     plat:['Instagram','Facebook'], status:'Scheduled', approval:'Approved',
        cap:'Fashion is not about what you wear. It\'s about how you wear it. 💫 At Mayank Fashion, we make every outfit worthy of your confidence.\n\n#MayankFashion #FashionQuote', tags:'#Confidence #Fashion #Style' },
      { day:13, hr:10, cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Scheduled', approval:'Approved',
        cap:'🛍️ SUMMER SALE — 25% OFF EVERYTHING!\nKurtas | Co-ords | Western wear | Fusion sets\nValid 13-20 June 2026.\n\nShop online or visit us in-store. Link in bio!', tags:'#FashionSale #SummerSale #Discount' },
      { day:18, hr:11, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Behind the seams 🧵✂️ Watch our artisans hand-craft each piece with precision. Quality you can feel from the very first stitch. That\'s Mayank Fashion.\n\n#Handcrafted #Fashion', tags:'#BehindTheScenes #Handmade #Craftsmanship' },
      { day:22, hr:10, cat:'Carousel',    plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'The perfect wedding guest outfits for June 2026 👰 From Sangeet to Reception — we\'ve styled it all! Swipe for 6 complete looks from Mayank Fashion.\n\n#WeddingFashion', tags:'#WeddingGuest #WeddingOutfit #PartyWear' },
      { day:27, hr:11, cat:'Organic',     plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Customer spotlight! 🌟 See how our community styles their Mayank Fashion picks. Tag us in your photos for a chance to be featured!\n\n#CustomerLove #FashionCommunity', tags:'#CustomerFeature #StyleCommunity' },
    ],
  },

  // ── 14. Rehab 360 ⭐ ──────────────────────────────────────────────────────
  {
    businessName: 'Rehab 360',
    contactName:  'Rehab 360 Admin',
    email:        'rehab360@client.in',
    password:     'Client@123',
    industry:     'Healthcare / Rehabilitation',
    services:     ['Instagram Management', 'Patient Education Content', 'Meta Ads', 'Facebook Management'],
    platforms:    ['Instagram', 'Facebook', 'LinkedIn'],
    priority:     true,
    posts: [
      { day:1,  hr:9,  cat:'Organic',     plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Recovery is not a destination — it\'s a journey. 💪 At Rehab 360, we walk every step of that journey with you. Expert care. Personalised programs. Real results.\n\n#Rehab360 #Rehabilitation #PhysioTherapy', tags:'#Rehab #PhysioTherapy #Recovery' },
      { day:4,  hr:10, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'5 exercises for back pain relief you can do at home 🧘 Our physiotherapists share their top picks. Safe, effective, and takes less than 10 minutes. Save this!\n\n#BackPain #Rehab360', tags:'#BackPainRelief #Physiotherapy #HomeExercise' },
      { day:8,  hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Patient success story 🌟 "I couldn\'t walk properly for 3 years. Today I ran 5km." Watch Ramesh\'s incredible recovery journey with Rehab 360.\n\n#SuccessStory #Rehab360 #Physiotherapy', tags:'#PatientStory #RecoveryJourney #Inspiration' },
      { day:12, hr:10, cat:'Organic',     plat:['LinkedIn'],             status:'Scheduled', approval:'Approved',
        cap:'Understanding post-surgical rehabilitation 🏥 Why the first 6 weeks after surgery are critical for long-term recovery. A guide from our clinical team at Rehab 360.\n\n#PostSurgicalRehab', tags:'#SurgicalRehab #ClinicalCare' },
      { day:16, hr:9,  cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Draft',     approval:'Pending',
        cap:'🩺 FREE ASSESSMENT CAMP — 20 June 2026\n📍 Rehab 360 Centre\n⏰ 9 AM – 4 PM\n\nFree physiotherapy assessment for:\n• Back & neck pain\n• Sports injuries\n• Post-surgery recovery\n\nRegister now — 50 slots only!', tags:'#FreeAssessment #PhysioTherapyCamp' },
      { day:20, hr:10, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'Know your pain: When to see a physiotherapist vs. when to rest 🤔 Our experts break down the 5 signs you should NOT ignore.\n\n#HealthAdvice #Rehab360 #WhenToSeeDr', tags:'#HealthTips #PainManagement #Physio' },
      { day:24, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Desk worker? Watch this! 💻 3 simple stretches to undo a full day of sitting. Takes 5 minutes. Your spine will thank you. Share this with a coworker!\n\n#DeskExercise #Rehab360', tags:'#DeskWorker #Posture #OfficeHealth' },
      { day:28, hr:10, cat:'Organic',     plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'Your health is your greatest wealth. 🙏 If pain is stopping you from living your best life — we\'re here to help. Book a consultation at Rehab 360 today.\n\n#HealthFirst #Rehab360', tags:'#HealthAndWellness #PainFree #Rehab' },
    ],
  },

  // ── 15. Chirag – The Interior Mall ────────────────────────────────────────
  {
    businessName: 'Chirag – The Interior Mall',
    contactName:  'Chirag Admin',
    email:        'chirag@client.in',
    password:     'Client@123',
    industry:     'Interior Design & Decor Retail',
    services:     ['Instagram Management', 'Content Creation', 'Meta Ads'],
    platforms:    ['Instagram', 'Facebook'],
    posts: [
      { day:3,  hr:10, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'India\'s most beautiful interior mall is back with new arrivals! 🏡✨ Furniture | Lighting | Decor | Curtains | Flooring — all under one roof at Chirag.\n\n#ChiragInteriorMall #InteriorDesign', tags:'#InteriorMall #HomeDecor #Furniture' },
      { day:7,  hr:11, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Top 8 home decor trends for 2026 🛋️ Japandi | Biophilic | Maximalist | Earthy tones — which trend suits YOUR home? Swipe and save!\n\n#ChiragMall #InteriorTrends2026', tags:'#InteriorTrends #HomeDesign2026' },
      { day:12, hr:9,  cat:'Organic',     plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Your home is your canvas 🎨 At Chirag – The Interior Mall, we have everything you need to paint it beautifully. Visit us and transform your space today.\n\n#ChiragMall', tags:'#HomeTransformation #InteriorShopping' },
      { day:17, hr:10, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Draft',     approval:'Pending',
        cap:'🏠 INTERIOR MALL SALE — UP TO 50% OFF!\nSofas | Beds | Dining sets | Lighting | Curtains\nValid 17-30 June 2026.\n\nVisit Chirag – The Interior Mall or shop online!', tags:'#InteriorSale #FurnitureSale #HomeShopping' },
      { day:22, hr:11, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'3 rooms completely transformed by Chirag 🏡 Our interior design team works with any budget. See what\'s possible when design meets expertise!\n\n#RoomMakeover #ChiragMall', tags:'#RoomTransformation #BeforeAfter #InteriorDesign' },
      { day:27, hr:9,  cat:'Carousel',    plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Small space? Big style! 🏠✨ 7 ways to make any small room feel huge. Our interior experts share their top space-saving tips. Save this!\n\n#SmallSpaceLiving #ChiragMall', tags:'#SmallSpaceDesign #InteriorHacks' },
    ],
  },

  // ── 16. The HideOut Cafe ──────────────────────────────────────────────────
  {
    businessName: 'The HideOut Cafe',
    contactName:  'HideOut Cafe Admin',
    email:        'hideout@client.in',
    password:     'Client@123',
    industry:     'Cafe & Restaurant',
    services:     ['Instagram Management', 'Food Photography', 'Reels', 'Meta Ads'],
    platforms:    ['Instagram', 'Facebook', 'Zomato'],
    posts: [
      { day:1,  hr:11, cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Find your vibe at The HideOut ☕🎵 Good food, great coffee, the perfect playlist. Your new favourite hangout spot is here.\n\n#TheHideOutCafe #Cafe #CafeVibes', tags:'#CafeVibes #CoffeeLovers #Hangout' },
      { day:5,  hr:12, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'Our menu highlights! ☕🥪 Signature cold brews | Loaded sandwiches | Dessert waffles | Fresh smoothies. Swipe to drool!\n\n#CafeMenu #HideOutCafe #FoodPhotography', tags:'#CafeFood #FoodPhotography #MustEat' },
      { day:9,  hr:11, cat:'Organic',     plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'The perfect date spot? 💕 Cozy corners, soft lighting, great coffee and even better conversation. Book a table at The HideOut Cafe today.\n\n#DateSpot #CafeDate #TheHideOutCafe', tags:'#DateSpot #RomanticCafe #CoupleGoals' },
      { day:13, hr:12, cat:'Ad Creative', plat:['Facebook','Instagram'], status:'Scheduled', approval:'Approved',
        cap:'☕ STUDENT SPECIAL — Every day 2 PM to 5 PM\n20% off on all beverages with student ID\nFree WiFi | Power plugs | Study-friendly zones\n\nThe HideOut is your campus away from campus! 🎓', tags:'#StudentOffer #StudyCafe #CafeSpecial' },
      { day:17, hr:11, cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Watch our barista make the most beautiful latte art ☕🎨 It takes skill, patience, and a whole lot of passion. Come see it live at The HideOut Cafe!\n\n#LatteArt #Barista', tags:'#LatteArt #CoffeeArt #BaristaLife' },
      { day:21, hr:12, cat:'Story',       plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Today\'s HideOut specials ☕🥞\n🌟 Mango Cold Brew — ₹199\n🌟 Avocado Toast — ₹249\n🌟 Chocolate Waffle Tower — ₹349\nOnly available today — come before we run out!', tags:'#TodaySpecial #CafeSpecials #LimitedOffer' },
      { day:25, hr:11, cat:'Organic',     plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'"Best cafe in the city!" — thank you for the love ❤️ We put our heart into every cup, every dish, every visit. See you at The HideOut!\n\n#CustomerLove #CafeReview #TheHideOutCafe', tags:'#CafeReview #Feedback #Grateful' },
    ],
  },

  // ── 17. TREK App ──────────────────────────────────────────────────────────
  {
    businessName: 'TREK App',
    contactName:  'TREK App Admin',
    email:        'trekapp@client.in',
    password:     'Client@123',
    industry:     'Technology / Adventure App',
    services:     ['Instagram Management', 'Content Creation', 'Meta Ads', 'LinkedIn Management'],
    platforms:    ['Instagram', 'LinkedIn', 'Facebook'],
    posts: [
      { day:1,  hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Posted',    approval:'Approved',
        cap:'Adventure is just one tap away 🏔️📱 Introducing TREK — the app that plans your perfect trek, finds your crew, and keeps you safe. Download now!\n\n#TREKApp #Adventure #TrekkingApp', tags:'#TrekApp #Adventure #Hiking' },
      { day:4,  hr:10, cat:'Carousel',    plat:['Instagram','Facebook'], status:'Posted',    approval:'Approved',
        cap:'5 reasons 50,000+ trekkers use TREK App 🌄 GPS routes | Safety alerts | Community | Weather updates | Trek diaries. Swipe to see what makes us different.\n\n#TREKApp', tags:'#TrekkingCommunity #AdventureApp' },
      { day:8,  hr:9,  cat:'Organic',     plat:['Instagram'],            status:'Scheduled', approval:'Approved',
        cap:'Not all those who wander are lost — some just have TREK App 😄🗺️ Explore 500+ verified trek routes across India. Free to download.\n\n#TREKApp #Trekking #ExploreIndia', tags:'#ExploreIndia #TrekkingIndia #Wanderlust' },
      { day:12, hr:10, cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Scheduled', approval:'Approved',
        cap:'📱 DOWNLOAD TREK APP FREE\n✅ 500+ verified routes\n✅ Offline GPS maps\n✅ SOS emergency alerts\n✅ Find trek buddies near you\n✅ Live weather updates\n\nYour safest adventure starts here. Download now!', tags:'#TrekApp #Download #AdventureApp' },
      { day:16, hr:9,  cat:'Reel',        plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'User story: How TREK App helped Priya complete her first solo trek safely 🏔️❤️ Our SOS feature and offline maps made all the difference. This is why we built TREK.\n\n#UserStory', tags:'#UserStory #SoloTrek #WomenWhoTrek' },
      { day:20, hr:10, cat:'Carousel',    plat:['LinkedIn'],             status:'Draft',     approval:'Pending',
        cap:'TREK App — the startup changing how India treks 🚀 We\'re solving safety, discovery, and community for 50M+ trekkers in India. Here\'s our product journey. Swipe.\n\n#StartupIndia #TechForAdventure', tags:'#StartupIndia #TechStartup #ProductJourney' },
      { day:24, hr:9,  cat:'Organic',     plat:['Instagram'],            status:'Draft',     approval:'Pending',
        cap:'Weekend adventure challenge! 🌿 Share your trek photos using #TREKAppChallenge and win a Pro subscription worth ₹999. 20 winners every week!\n\n#TREKApp #TrekChallenge #WinBig', tags:'#TrekChallenge #Contest #Adventure' },
      { day:28, hr:10, cat:'Ad Creative', plat:['Instagram','Facebook'], status:'Draft',     approval:'Pending',
        cap:'🌄 SUMMER TREKKING SEASON IS HERE!\nFind the best summer treks in Himachal, Uttarakhand & Kashmir — all on TREK App.\nFree route guides | Expert tips | Join 50,000+ trekkers\n\nDownload free now!', tags:'#SummerTrekking #HimalayanTreks #TrekApp' },
    ],
  },
];

// ── Main seed function ─────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dotganga_attendance');
  console.log('✅ Connected to MongoDB');

  // 1. Delete ALL client-role users, all clients, all posts, all approvals
  console.log('🗑️  Clearing old client data...');
  await User.deleteMany({ role: 'Client' });
  await Client.deleteMany({});
  await Post.deleteMany({});
  await Approval.deleteMany({});
  console.log('   Done — old data cleared.');

  // 2. Find an admin user to use as createdBy
  const admin = await User.findOne({ role: { $in: ['Super Admin', 'Admin'] } });
  if (!admin) {
    console.error('❌ No admin user found. Run the main seed.js first to create admin users.');
    process.exit(1);
  }

  const results = [];

  for (const def of CLIENTS) {
    // Create login user
    const clientUser = await User.create({
      name:        def.businessName,
      email:       def.email,
      password:    def.password,
      role:        'Client',
      department:  'Client',
      designation: 'Client',
    });

    // Create client record
    const client = await Client.create({
      businessName:     def.businessName,
      contactName:      def.contactName,
      email:            def.email,
      industry:         def.industry,
      services:         def.services,
      primaryPlatforms: def.platforms,
      userRef:          clientUser._id,
      createdBy:        admin._id,
      isActive:         true,
    });

    // Link client back to user (clientRef) — CRITICAL for portal login
    await User.findByIdAndUpdate(clientUser._id, { clientRef: client._id });

    // Create posts + approvals
    let postCount = 0;
    for (const p of def.posts) {
      const post = await Post.create({
        clientId:       client._id,
        platforms:      p.plat,
        caption:        p.cap,
        hashtags:       p.tags || '',
        category:       p.cat,
        scheduledDate:  d(p.day, p.hr),
        status:         p.status || 'Draft',
        approvalStatus: p.approval || 'Pending',
        createdBy:      admin._id,
        mediaUrls:      [],
      });

      await Approval.create({
        postId:      post._id,
        clientId:    client._id,
        requestedBy: admin._id,
        status:      p.approval || 'Pending',
        dueDate:     d(p.day, p.hr),
      });
      postCount++;
    }

    results.push({ name: def.businessName, email: def.email, posts: postCount });
    console.log(`✅ ${def.businessName} — ${postCount} posts created`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 ALL CLIENTS SEEDED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 CLIENT LOGIN CREDENTIALS (password: Client@123 for all)\n');
  console.log('Business Name                     Email');
  console.log('─────────────────────────────────────────────────────────────');
  results.forEach(r => {
    console.log(`${r.name.padEnd(34)} ${r.email}  (${r.posts} posts)`);
  });
  console.log('\n🔑 All passwords: Client@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
