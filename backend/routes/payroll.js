const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const SalaryProfile = require('../models/SalaryProfile');
const { protect, adminOnly } = require('../middleware/auth');
const { calculateUserPayroll } = require('../utils/payrollEngine');

// POST /api/payroll/generate — generate payroll for all staff for a month
router.post('/generate', protect, adminOnly, async (req, res, next) => {
  try {
    const { monthYear } = req.body; // "YYYY-MM"
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return res.status(400).json({ success: false, message: 'monthYear must be in YYYY-MM format.' });
    }

    const staffUsers = await User.find({ role: 'Staff', isActive: true });
    const results = [];
    const errors = [];

    for (const user of staffUsers) {
      try {
        const payrollData = await calculateUserPayroll(user._id, monthYear, req.user._id);

        const payroll = await Payroll.findOneAndUpdate(
          { userId: user._id, monthYear },
          { ...payrollData, paymentStatus: 'Draft' },
          { upsert: true, new: true, runValidators: true }
        );

        results.push({ userId: user._id, name: user.name, status: 'Generated', payroll });
      } catch (err) {
        errors.push({ userId: user._id, name: user.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Payroll generated for ${results.length} staff. ${errors.length} error(s).`,
      generated: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/generate/:userId — generate for single user
router.post('/generate/:userId', protect, adminOnly, async (req, res, next) => {
  try {
    const { monthYear } = req.body;
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return res.status(400).json({ success: false, message: 'monthYear must be in YYYY-MM format.' });
    }

    const payrollData = await calculateUserPayroll(req.params.userId, monthYear, req.user._id);

    const payroll = await Payroll.findOneAndUpdate(
      { userId: req.params.userId, monthYear },
      { ...payrollData, paymentStatus: 'Draft' },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Payroll generated.', payroll });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll?month=YYYY-MM — all payroll records for month (admin)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { month } = req.query;
    const filter = month ? { monthYear: month } : {};

    const payrolls = await Payroll.find(filter)
      .populate('userId', 'name email designation')
      .populate('generatedBy', 'name')
      .sort({ 'userId.name': 1 });

    res.json({ success: true, count: payrolls.length, payrolls });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/my — own payroll history
router.get('/my', protect, async (req, res, next) => {
  try {
    const payrolls = await Payroll.find({ userId: req.user._id }).sort({ monthYear: -1 });
    res.json({ success: true, payrolls });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/my/preview?month=YYYY-MM — live payroll preview (no DB write)
router.get('/my/preview', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const preview = await calculateUserPayroll(req.user._id, targetMonth, req.user._id);
    res.json({ success: true, preview });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/payroll/:id/status — update payment status
router.patch('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!['Draft', 'Processed', 'Paid'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    }

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, ...(paymentStatus === 'Paid' && { paidAt: new Date() }) },
      { new: true }
    ).populate('userId', 'name email');

    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found.' });

    res.json({ success: true, message: `Payment status updated to ${paymentStatus}.`, payroll });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/export?month=YYYY-MM — export payroll to Excel
router.get('/export', protect, adminOnly, async (req, res, next) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ success: false, message: 'month parameter required.' });

    const payrolls = await Payroll.find({ monthYear: month })
      .populate('userId', 'name email designation')
      .sort({ createdAt: 1 });

    const rows = payrolls.map((p) => ({
      'Employee Name': p.userId?.name || 'N/A',
      'Email': p.userId?.email || '',
      'Designation': p.userId?.designation || '',
      'Month': p.monthYear,
      'Base Salary': p.baseSalary,
      'Calendar Days': p.totalCalendarDays,
      'Present Days': p.totalPresentDays,
      'Half Days': p.totalHalfDays,
      'Paid Leaves': p.totalPaidLeaves,
      'Unpaid Absents': p.totalUnpaidAbsents,
      'Payable Days': p.payableDays,
      'Daily Wage Rate': p.dailyWageRate,
      'Allowances': p.allowances,
      'Deductions': p.calculatedDeductions,
      'Net Payout': p.finalNetPayout,
      'Payment Status': p.paymentStatus,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, `Payroll-${month}`);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=payroll-${month}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
