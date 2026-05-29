require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Staff roster ──────────────────────────────────────────────────────────────
const STAFF = [
  // ── Admin & Management ────────────────────────────────────────────────────
  { name: 'DotGanga Admin', email: 'admin@dotganga.com',   password: 'admin123',   role: 'Admin',   designation: 'System Administrator', department: 'Management', salary: 0     },
  { name: 'Priya Kapoor',   email: 'manager@dotganga.com', password: 'manager123', role: 'Manager', designation: 'Operations Manager',   department: 'Management', salary: 55000 },

  // ── Core Team ─────────────────────────────────────────────────────────────
  { name: 'Rudra',   email: 'rudra@dotganga.com',  password: 'rudra123',  role: 'Staff', designation: 'Sales Executive',      department: 'Sales',     salary: 30000 },
  { name: 'TP',      email: 'tp@dotganga.com',      password: 'tp1234',    role: 'Staff', designation: 'Sales Executive',      department: 'Sales',     salary: 30000 },
  { name: 'Deepak',  email: 'deepak@dotganga.com',  password: 'deepak123', role: 'Staff', designation: 'Sales Executive',      department: 'Sales',     salary: 28000 },
  { name: 'Prachi',  email: 'prachi@dotganga.com',  password: 'prachi123', role: 'Staff', designation: 'Content Writer',       department: 'Marketing', salary: 25000 },
  { name: 'Mohit',   email: 'mohit@dotganga.com',   password: 'mohit123',  role: 'Staff', designation: 'Video Editor',         department: 'Creative',  salary: 28000 },
  { name: 'Ritika',  email: 'ritika@dotganga.com',  password: 'ritika123', role: 'Staff', designation: 'Graphic Designer',     department: 'Creative',  salary: 27000 },
  { name: 'Vinod',   email: 'vinod@dotganga.com',   password: 'vinod123',  role: 'Staff', designation: 'Operations Executive', department: 'Operations',salary: 26000 },
  { name: 'Triti',   email: 'triti@dotganga.com',   password: 'triti123',  role: 'Staff', designation: 'Social Media Manager', department: 'Marketing', salary: 30000 },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dotganga_attendance');
  console.log('✓ Connected to MongoDB\n');

  const db      = mongoose.connection.db;
  const users   = db.collection('users');
  const salaries = db.collection('salaryprofiles');
  const companies = db.collection('companies');

  // ── Users — raw MongoDB, bypasses all mongoose middleware ──────────────────
  console.log('Setting up staff accounts...');
  for (const s of STAFF) {
    const hashed = await bcrypt.hash(s.password, 10);
    const now    = new Date();

    const result = await users.findOneAndUpdate(
      { email: s.email },
      {
        $set: {
          name:        s.name,
          email:       s.email,
          password:    hashed,
          role:        s.role,
          designation: s.designation,
          department:  s.department,
          isActive:    true,
          updatedAt:   now,
        },
        $setOnInsert: {
          phone:      '',
          joinedDate: now,
          createdAt:  now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    const user = result.value || result;
    const uid  = user?._id;
    console.log(`  ✓  ${s.role.padEnd(8)}  ${s.email.padEnd(34)}  →  ${s.password}`);

    // Salary profile (upsert, no duplicates)
    if (s.salary > 0 && uid) {
      await salaries.updateOne(
        { userId: uid },
        {
          $set: {
            baseMonthlySalary:   s.salary,
            allowances:          0,
            deductionPerHalfDay: 0.5,
            currency:            'INR',
            updatedAt:           now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
    }
  }

  // ── Company config ─────────────────────────────────────────────────────────
  console.log('\nChecking company config...');
  const existingCompany = await companies.findOne({});
  if (!existingCompany) {
    await companies.insertOne({
      officeName:         'DotGanga — Your Marketing Agency',
      officeStartTime:    '09:30',
      officeEndTime:      '18:30',
      gracePeriodMinutes: 15,
      officeLatitude:     26.29303,
      officeLongitude:    73.02201,
      allowedRadiusMeter: 100,
      allowedWiFiSSID:    'DotGanga-Office',
      createdAt:          new Date(),
      updatedAt:          new Date(),
    });
    console.log('  ✓ Company config created');
  } else {
    console.log('  — Company config already exists');
  }

  await mongoose.disconnect();

  console.log(`
══════════════════════════════════════════════════════════════
  SEED COMPLETE — All logins are ready
══════════════════════════════════════════════════════════════

  ADMIN / MANAGER  →  /admin after login
  ──────────────────────────────────────────────────────────
  admin@dotganga.com        /  admin123      Admin
  manager@dotganga.com      /  manager123    Manager

  STAFF  →  /staff after login
  ──────────────────────────────────────────────────────────
  rudra@dotganga.com        /  rudra123      Sales Executive
  tp@dotganga.com           /  tp1234        Sales Executive
  deepak@dotganga.com       /  deepak123     Sales Executive
  prachi@dotganga.com       /  prachi123     Content Writer
  mohit@dotganga.com        /  mohit123      Video Editor
  ritika@dotganga.com       /  ritika123     Graphic Designer
  vinod@dotganga.com        /  vinod123      Operations Executive
  triti@dotganga.com        /  triti123      Social Media Manager

  URL → http://localhost:5173
══════════════════════════════════════════════════════════════`);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
