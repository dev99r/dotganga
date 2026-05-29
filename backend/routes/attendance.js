const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');
const Leave = require('../models/Leave');
const { protect, adminOnly } = require('../middleware/auth');
const { isWithinGeofence } = require('../utils/haversine');

function getISTDateStr() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function getISTMinutes() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.getHours() * 60 + ist.getMinutes();
}

function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// POST /api/attendance/checkin  (no geofence — time-based only)
router.post('/checkin', protect, async (req, res, next) => {
  try {
    const todayStr = getISTDateStr();

    const existing = await Attendance.findOne({ userId: req.user._id, date: todayStr });
    if (existing) return res.status(409).json({ success: false, message: 'Already checked in today.' });

    const company = await Company.findOne();

    const currentMin  = getISTMinutes();
    const shiftStart  = company ? parseTimeToMinutes(company.officeStartTime)  : 9 * 60 + 30;
    const graceCutoff = company ? shiftStart + company.gracePeriodMinutes       : shiftStart + 15;

    let status  = 'Full-Day';
    let isLate  = false;
    let remarks = '';

    if (currentMin > graceCutoff) {
      status  = 'Half-Day';
      isLate  = true;
      remarks = `Auto Half-Day: ${currentMin - shiftStart} min late.`;
    } else if (currentMin > shiftStart) {
      isLate  = true;
      remarks = 'Late within grace period.';
    }

    const attendance = await Attendance.create({
      userId:    req.user._id,
      date:      todayStr,
      signInTime: new Date(),
      workMode:  'Office',
      status,
      isLate,
      remarks,
    });

    res.status(201).json({
      success:  true,
      message:  isLate && status === 'Half-Day'
        ? 'Checked in — recorded as Half-Day (late arrival).'
        : 'Checked in! Have a great day 🚀',
      attendance,
      status,
      isLate,
    });
  } catch (err) { next(err); }
});

// PUT /api/attendance/checkout
router.put('/checkout', protect, async (req, res, next) => {
  try {
    const todayStr = getISTDateStr();
    const record = await Attendance.findOne({ userId: req.user._id, date: todayStr });

    if (!record) return res.status(404).json({ success: false, message: 'No check-in found for today.' });
    if (record.signOutTime) return res.status(409).json({ success: false, message: 'Already checked out today.' });

    const now = new Date();
    record.signOutTime = now;
    record.workingHours = Math.round(((now - record.signInTime) / 3600000) * 100) / 100;
    await record.save();

    res.json({ success: true, message: 'Checked out. See you tomorrow!', attendance: record });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/today
router.get('/today', protect, async (req, res, next) => {
  try {
    const todayStr = getISTDateStr();
    const filter = req.user.role === 'Admin' ? { date: todayStr } : { userId: req.user._id, date: todayStr };
    const records = await Attendance.find(filter)
      .populate('userId', 'name email designation')
      .sort({ signInTime: 1 });
    res.json({ success: true, attendance: records });
  } catch (err) { next(err); }
});

// GET /api/attendance/my?month=YYYY-MM
router.get('/my', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const filter = { userId: req.user._id };
    if (month) {
      const [y, m] = month.split('-');
      filter.date = { $regex: `^${y}-${String(m).padStart(2, '0')}` };
    }
    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json({ success: true, attendance: records });
  } catch (err) { next(err); }
});

// GET /api/attendance/stats?month=YYYY-MM
router.get('/stats', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const target = month || new Date().toISOString().slice(0, 7);
    const [y, m] = target.split('-');
    const regex = `^${y}-${String(m).padStart(2, '0')}`;

    const records = await Attendance.find({ userId: req.user._id, date: { $regex: regex } });
    const leaves = await Leave.find({
      userId: req.user._id, status: 'Approved',
      $or: [{ startDate: { $regex: regex } }, { endDate: { $regex: regex } }],
    });

    res.json({
      success: true,
      month: target,
      stats: {
        fullDays: records.filter(r => r.status === 'Full-Day').length,
        halfDays: records.filter(r => r.status === 'Half-Day').length,
        lateDays: records.filter(r => r.isLate).length,
        approvedLeaves: leaves.length,
        totalCheckins: records.length,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/attendance/report?month=YYYY-MM&userId=xxx  (admin)
router.get('/report', protect, adminOnly, async (req, res, next) => {
  try {
    const { month, userId } = req.query;
    const filter = {};
    if (month) {
      const [y, m] = month.split('-');
      filter.date = { $regex: `^${y}-${String(m).padStart(2, '0')}` };
    }
    if (userId) filter.userId = userId;
    const records = await Attendance.find(filter)
      .populate('userId', 'name email designation')
      .sort({ date: -1, signInTime: 1 });
    res.json({ success: true, attendance: records });
  } catch (err) { next(err); }
});

// PATCH /api/attendance/:id  (admin override)
router.patch('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const allowed = ['status', 'remarks'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const record = await Attendance.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('userId', 'name email');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, attendance: record });
  } catch (err) { next(err); }
});

module.exports = router;
