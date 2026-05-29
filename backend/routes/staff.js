const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User    = require('../models/User');
const SalaryProfile = require('../models/SalaryProfile');
const Attendance    = require('../models/Attendance');
const { protect, adminOnly, managerOrAdmin } = require('../middleware/auth');

// GET /api/staff — all staff (Admin + Manager)
router.get('/', protect, managerOrAdmin, async (req, res, next) => {
  try {
    const { search, active } = req.query;
    const filter = { role: { $in: ['Staff', 'Manager'] } };

    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { department:  { $regex: search, $options: 'i' } },
      ];
    }

    const staff = await User.find(filter).sort({ name: 1 });
    const staffWithSalary = await Promise.all(
      staff.map(async (user) => {
        const salary = await SalaryProfile.findOne({ userId: user._id });
        return { ...user.toObject(), salaryProfile: salary || null };
      })
    );

    res.json({ success: true, count: staff.length, staff: staffWithSalary });
  } catch (err) { next(err); }
});

// GET /api/staff/dashboard/summary — operational summary (Admin + Manager)
router.get('/dashboard/summary', protect, managerOrAdmin, async (req, res, next) => {
  try {
    const now    = new Date();
    const ist    = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const today  = ist.toISOString().split('T')[0];

    const [totalStaff, activeStaff, todayAttendance, pendingLeaves] = await Promise.all([
      User.countDocuments({ role: { $in: ['Staff', 'Manager'] } }),
      User.countDocuments({ role: { $in: ['Staff', 'Manager'] }, isActive: true }),
      Attendance.find({ date: today }).populate('userId', 'name designation email'),
      require('../models/Leave').countDocuments({ status: 'Pending' }),
    ]);

    const onDutyNow  = todayAttendance.filter(a => a.signInTime && !a.signOutTime);
    const lateToday  = todayAttendance.filter(a => a.isLate);
    const checkedOut = todayAttendance.filter(a => a.signOutTime);

    res.json({
      success: true,
      summary: {
        totalStaff, activeStaff,
        onDutyNow:    onDutyNow.length,
        inOffice:     onDutyNow.filter(a => a.workMode === 'Office').length,
        wfhNow:       onDutyNow.filter(a => a.workMode === 'WFH').length,
        lateToday:    lateToday.length,
        checkedOut:   checkedOut.length,
        pendingLeaves,
        todayCheckins: todayAttendance.length,
      },
      todayAttendance,
    });
  } catch (err) { next(err); }
});

// GET /api/staff/:id — single staff details (Admin + Manager)
router.get('/:id', protect, managerOrAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    const salaryProfile  = await SalaryProfile.findOne({ userId: user._id });
    const today          = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.findOne({ userId: user._id, date: today });

    res.json({ success: true, user, salaryProfile, todayAttendance });
  } catch (err) { next(err); }
});

// POST /api/staff — add staff (Admin + Manager)
router.post(
  '/',
  protect,
  managerOrAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('designation').optional().trim(),
    body('department').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { name, email, password, designation, department, phone, joinedDate } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

      const user = await User.create({
        name, email, password, designation, department, phone,
        role: 'Staff',
        joinedDate: joinedDate || Date.now(),
      });

      res.status(201).json({ success: true, message: 'Staff member added.', user: user.toSafeObject() });
    } catch (err) { next(err); }
  }
);

// PUT /api/staff/:id — update profile (Admin + Manager)
router.put('/:id', protect, managerOrAdmin, async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'designation', 'department', 'phone', 'isActive', 'joinedDate'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Only Admin can change role
    if (req.user.role === 'Admin' && req.body.role) updates.role = req.body.role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'Staff not found.' });

    res.json({ success: true, message: 'Staff updated.', user });
  } catch (err) { next(err); }
});

// DELETE /api/staff/:id — deactivate (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Staff not found.' });
    res.json({ success: true, message: 'Staff deactivated.' });
  } catch (err) { next(err); }
});

// GET /api/staff/:id/salary
router.get('/:id/salary', protect, managerOrAdmin, async (req, res, next) => {
  try {
    const salary = await SalaryProfile.findOne({ userId: req.params.id });
    res.json({ success: true, salaryProfile: salary || null });
  } catch (err) { next(err); }
});

// PUT /api/staff/:id/salary
router.put(
  '/:id/salary',
  protect,
  adminOnly,
  [
    body('baseMonthlySalary').isFloat({ min: 0 }).withMessage('Base salary must be positive'),
    body('allowances').optional().isFloat({ min: 0 }),
    body('deductionPerHalfDay').optional().isFloat({ min: 0, max: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

      const { baseMonthlySalary, allowances, deductionPerHalfDay } = req.body;
      const salary = await SalaryProfile.findOneAndUpdate(
        { userId: req.params.id },
        { userId: req.params.id, baseMonthlySalary, allowances, deductionPerHalfDay },
        { upsert: true, new: true, runValidators: true }
      );
      res.json({ success: true, message: 'Salary profile saved.', salaryProfile: salary });
    } catch (err) { next(err); }
  }
);

module.exports = router;
