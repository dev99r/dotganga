// Load .env.local manually
const fs   = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '../.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const idx = t.indexOf('=');
    if (idx === -1) return;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (k) process.env[k] = v;
  });
}

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env.local');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  // Work directly on the raw collection — no schema, no hooks, no surprises
  const db       = mongoose.connection.db;
  const users    = db.collection('leadusers');   // mongoose pluralises 'LeadUser'
  const leads    = db.collection('leads');
  const reports  = db.collection('leaddailyreports');

  // ── Users ──────────────────────────────────────────────────────────────────
  const USERS = [
    { name: 'DotGanga Admin',     email: 'admin@dotganga.com',    password: 'admin123',    role: 'Admin',           department: 'Management', isActive: true },
    { name: 'Priya Kapoor',       email: 'manager@dotganga.com',  password: 'manager123',  role: 'Manager',         department: 'Management', isActive: true },
    { name: 'Rahul Verma',        email: 'sales1@dotganga.com',   password: 'sales123',    role: 'Sales',           department: 'Sales',      isActive: true },
    { name: 'Meera Singh',        email: 'sales2@dotganga.com',   password: 'sales123',    role: 'Sales',           department: 'Sales',      isActive: true },
    { name: 'Arjun Sharma',       email: 'editor@dotganga.com',   password: 'editor123',   role: 'VideoEditor',     department: 'Creative',   isActive: true },
    { name: 'Kavya Mehta',        email: 'designer@dotganga.com', password: 'design123',   role: 'GraphicDesigner', department: 'Creative',   isActive: true },
    { name: 'Dev Rathore',        email: 'smm@dotganga.com',      password: 'smm123',      role: 'SMM',             department: 'Marketing',  isActive: true },
    { name: 'Sneha Joshi',        email: 'content@dotganga.com',  password: 'content123',  role: 'ContentWriter',   department: 'Marketing',  isActive: true },
    { name: 'Sahil Kumar',        email: 'intern@dotganga.com',   password: 'intern123',   role: 'Intern',          department: 'Operations', isActive: true },
  ];

  const createdUsers = {};
  console.log('Setting up users...');
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const now    = new Date();
    const result = await users.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          name:       u.name,
          email:      u.email.toLowerCase(),
          password:   hashed,          // single hash, written directly
          role:       u.role,
          department: u.department,
          isActive:   u.isActive,
          updatedAt:  now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: 'after' }
    );
    const doc = result.value || result;
    createdUsers[u.email] = doc;
    console.log(`  ✓  ${u.role.padEnd(16)}  ${u.email.padEnd(30)}  /  ${u.password}`);
  }

  // ── Leads ──────────────────────────────────────────────────────────────────
  console.log('\nChecking leads...');
  const leadCount = await leads.countDocuments();
  if (leadCount === 0) {
    const now = new Date();
    await leads.insertMany([
      { name: 'Rahul Sharma',   phone: '9876543210', email: 'rahul@example.com',    company: 'Sharma Properties', message: 'Interested in 3BHK flat in Jodhpur',  source: 'Meta Ads',  stage: 'New',         score: 85, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Meta Ads', by: 'Seed', at: now }], createdAt: now, updatedAt: now },
      { name: 'Priya Mehta',    phone: '9765432109', email: 'priya.m@gmail.com',     company: '',                  message: 'Looking for investment property',     source: 'Meta Ads',  stage: 'Contacted',   score: 60, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Meta Ads', by: 'Seed', at: now }], createdAt: now, updatedAt: now },
      { name: 'Anil Gupta',     phone: '9654321098', email: '',                      company: 'Gupta Builders',    message: 'Commercial space near airport',       source: 'Website',   stage: 'Qualified',   score: 70, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Website', by: 'Seed', at: now }],   createdAt: now, updatedAt: now },
      { name: 'Sunita Joshi',   phone: '9543210987', email: 'sunita.j@yahoo.com',    company: '',                  message: '2BHK within 50 lakhs',               source: 'WhatsApp',  stage: 'Proposal',    score: 75, isArchived: false, activities: [{ type: 'created', message: 'Lead created via WhatsApp', by: 'Seed', at: now }],  createdAt: now, updatedAt: now },
      { name: 'Vikram Singh',   phone: '9432109876', email: 'vikram@vsingh.in',      company: 'VS Exports',        message: 'Warehouse 5000 sqft',                source: 'Referral',  stage: 'New',         score: 65, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Referral', by: 'Seed', at: now }],  createdAt: now, updatedAt: now },
      { name: 'Kavita Rathore', phone: '9321098765', email: '',                      company: '',                  message: 'Budget 30L, 2BHK preferred',         source: 'Meta Ads',  stage: 'New',         score: 55, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Meta Ads', by: 'Seed', at: now }],  createdAt: now, updatedAt: now },
      { name: 'Deepak Verma',   phone: '',           email: 'deepakv@biz.com',       company: 'Verma Tech',        message: 'Office space 1000 sqft',             source: 'Manual',    stage: 'Closed Won',  score: 90, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Manual', by: 'Seed', at: now }],    createdAt: now, updatedAt: now },
      { name: 'Rohit Kapoor',   phone: '9109876543', email: 'rohit.k@kapoor.com',    company: 'Kapoor Industries', message: 'Plot for factory setup',             source: 'Meta Ads',  stage: 'New',         score: 80, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Meta Ads', by: 'Seed', at: now }],  createdAt: now, updatedAt: now },
      { name: 'Alka Pandey',    phone: '9098765432', email: '',                      company: '',                  message: 'Ready to move flat',                 source: 'Website',   stage: 'Closed Lost', score: 35, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Website', by: 'Seed', at: now }],   createdAt: now, updatedAt: now },
      { name: 'Nisha Bhatia',   phone: '9087654321', email: 'nisha.b@mail.com',      company: '',                  message: 'Villa with pool, budget 1.5Cr',      source: 'Meta Ads',  stage: 'Qualified',   score: 88, isArchived: false, activities: [{ type: 'created', message: 'Lead created via Meta Ads', by: 'Seed', at: now }],  createdAt: now, updatedAt: now },
    ]);
    console.log('  ✓  10 sample leads inserted');
  } else {
    console.log(`  —  ${leadCount} leads already exist`);
  }

  // ── Sample Daily Reports ───────────────────────────────────────────────────
  console.log('\nSetting up sample reports...');
  const today = new Date().toISOString().slice(0, 10);

  // Fetch user _ids after upsert
  const allUsers = await users.find({ email: { $in: USERS.map(u => u.email) } }).toArray();
  const userMap  = {};
  allUsers.forEach(u => { userMap[u.email] = u; });

  const REPORTS = [
    { email: 'sales1@dotganga.com',    role: 'Sales',
      metrics: { callsAttempted: 32, callsConnected: 17, leadsReached: 11, followUpsSet: 6, proposalsSent: 2, dealsClosed: 1, revenue: 48000 },
      highlights: 'Closed deal with Deepak Verma. Great discovery call with Sunita Joshi.',
      blockers: 'Could not reach 3 leads — phones switched off.',
      tomorrowPlan: ['Follow up Sunita Joshi at 11am', 'Send revised proposal to Anil Gupta'],
      aiSummary: '• Made 32 calls — 17 connected (53%)\n• Reached 11 leads, sent 2 proposals\n• Closed 1 deal — ₹48,000 revenue',
      sentiment: 'Happy', status: 'Approved' },
    { email: 'editor@dotganga.com',    role: 'VideoEditor',
      metrics: { videosDelivered: 2, minutesEdited: 52, hooksCreated: 3, revisionRounds: 1, renderExports: 4 },
      highlights: 'Delivered Summer Campaign reel ahead of schedule.',
      blockers: 'After Effects plugin crashed twice.',
      tomorrowPlan: ['Color grade testimonial', 'Export 9:16 + 16:9 versions'],
      aiSummary: '• Delivered 2 videos, edited 52 min\n• Created 3 hooks, exported 4 renders',
      sentiment: 'Happy', status: 'Pending' },
    { email: 'designer@dotganga.com',  role: 'GraphicDesigner',
      metrics: { creativesCompleted: 4, variationsMade: 8, clientRevisions: 1, conceptsPresented: 2 },
      highlights: '4 Facebook ad creatives, 8 variations. Client approved 3/4.',
      blockers: '',
      tomorrowPlan: ['Design 3 Instagram Story templates', 'YouTube thumbnail batch (5)'],
      aiSummary: '• Completed 4 creatives with 8 variations\n• Presented 2 concepts, 1 revision',
      sentiment: 'Happy', status: 'Approved' },
    { email: 'smm@dotganga.com',       role: 'SMM',
      metrics: { leadsGenerated: 18, adSpend: 2400, cpl: 133, campaignsManaged: 3, contentPosted: 5 },
      highlights: 'Generated 18 leads from Real Estate campaign. CTR improved to 2.1%.',
      blockers: 'Meta flagged one creative — delivery slowed 30%.',
      tomorrowPlan: ['Scale winning ad set 20%', 'Launch retargeting'],
      aiSummary: '• Generated 18 leads at ₹133 CPL\n• Managed ₹2,400 across 3 campaigns',
      sentiment: 'Stressed', status: 'Pending' },
    { email: 'content@dotganga.com',   role: 'ContentWriter',
      metrics: { articlesWritten: 2, wordsWritten: 1800, socialCaptions: 8, emailsWritten: 3, seoPosts: 1 },
      highlights: 'Finished 2-part SEO blog series. 8 captions ready.',
      blockers: 'Waiting for image assets from designer.',
      tomorrowPlan: ['Finalize blog post #2', 'Write 5 more Instagram captions'],
      aiSummary: '• Wrote 2 articles (1,800 words)\n• Created 8 captions, 3 emails, 1 SEO post',
      sentiment: 'Neutral', status: 'Pending' },
    { email: 'intern@dotganga.com',    role: 'Intern',
      metrics: { tasksCompleted: 7, hoursWorked: 8, meetingsAttended: 2 },
      highlights: 'Completed all assigned tasks.',
      blockers: 'Needed guidance on Canva template.',
      tomorrowPlan: ['Complete Canva deck', 'Help with lead data entry'],
      aiSummary: '• Completed 7 tasks, 8 hours\n• Attended 2 meetings',
      sentiment: 'Neutral', status: 'Pending' },
  ];

  for (const r of REPORTS) {
    const user = userMap[r.email];
    if (!user) { console.log(`  !  User not found: ${r.email}`); continue; }
    const exists = await reports.findOne({ userId: user._id, date: today });
    if (!exists) {
      const now = new Date();
      await reports.insertOne({
        userId: user._id, userName: user.name, role: r.role, date: today,
        metrics: r.metrics, highlights: r.highlights, blockers: r.blockers,
        tomorrowPlan: r.tomorrowPlan, aiSummary: r.aiSummary,
        sentiment: r.sentiment, status: r.status,
        createdAt: now, updatedAt: now,
      });
      console.log(`  ✓  Report: ${user.name} (${r.role})`);
    } else {
      console.log(`  —  Report exists: ${user.name}`);
    }
  }

  await mongoose.disconnect();

  console.log(`
══════════════════════════════════════════════════════════════
  SEED COMPLETE — Test ALL logins at http://localhost:3000
══════════════════════════════════════════════════════════════

  admin@dotganga.com       /  admin123      → Dashboard
  manager@dotganga.com     /  manager123    → Dashboard
  sales1@dotganga.com      /  sales123      → Dashboard
  sales2@dotganga.com      /  sales123      → Dashboard
  editor@dotganga.com      /  editor123     → Daily Report
  designer@dotganga.com    /  design123     → Daily Report
  smm@dotganga.com         /  smm123        → Meta Ads
  content@dotganga.com     /  content123    → Daily Report
  intern@dotganga.com      /  intern123     → Daily Report

══════════════════════════════════════════════════════════════`);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
