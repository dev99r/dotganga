const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/leaves — apply for leave
router.post(
  '/',
  protect,
  [
    body('leaveType').isIn(['Casual', 'Sick', 'Half-Day Leave']).withMessage('Invalid leave type'),
    body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Start date must be YYYY-MM-DD'),
    body('endDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('End date must be YYYY-MM-DD'),
    body('reason').trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { leaveType, startDate, endDate, reason } = req.body;

      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
      }

      // Check for overlapping leave applications
      const overlap = await Leave.findOne({
        userId: req.user._id,
        status: { $ne: 'Rejected' },
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      });

      if (overlap) {
        return res.status(409).json({
          success: false,
          message: 'You already have a leave application for overlapping dates.',
        });
      }

      const leave = await Leave.create({
        userId: req.user._id,
        leaveType,
        startDate,
        endDate,
        reason,
      });

      res.status(201).json({ success: true, message: 'Leave application submitted.', leave });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/leaves/my — own leave history
router.get('/my', protect, async (req, res, next) => {
  try {
    const leaves = await Leave.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name');

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    next(err);
  }
});

// GET /api/leaves — all leaves (admin); own leaves (staff)
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, userId, month } = req.query;
    let filter = {};

    if (req.user.role !== 'Admin') {
      filter.userId = req.user._id;
    } else if (userId) {
      filter.userId = userId;
    }

    if (status) filter.status = status;
    if (month) {
      filter.$or = [
        { startDate: { $regex: `^${month}` } },
        { endDate: { $regex: `^${month}` } },
      ];
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email designation')
      .populate('approvedBy', 'name');

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leaves/:id/approve — admin approve
router.patch('/:id/approve', protect, adminOnly, async (req, res, next) => {
  try {
    const { adminRemarks } = req.body;
    const leave = await Leave.findById(req.params.id).populate('userId', 'name email');

    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'Pending') {
      return res.status(409).json({ success: false, message: 'Leave has already been actioned.' });
    }

    leave.status = 'Approved';
    leave.approvedBy = req.user._id;
    leave.adminRemarks = adminRemarks || '';
    await leave.save();

    // Create attendance records for leave dates with Leave status
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      await Attendance.findOneAndUpdate(
        { userId: leave.userId._id, date: dateStr },
        {
          userId: leave.userId._id,
          date: dateStr,
          signInTime: new Date(`${dateStr}T09:00:00.000Z`),
          status: leave.leaveType === 'Half-Day Leave' ? 'Half-Day' : 'Leave',
          remarks: `Approved ${leave.leaveType}: ${leave.reason}`,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, message: 'Leave approved successfully.', leave });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leaves/:id/reject — admin reject
router.patch('/:id/reject', protect, adminOnly, async (req, res, next) => {
  try {
    const { adminRemarks } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'Pending') {
      return res.status(409).json({ success: false, message: 'Leave has already been actioned.' });
    }

    leave.status = 'Rejected';
    leave.approvedBy = req.user._id;
    leave.adminRemarks = adminRemarks || '';
    await leave.save();

    res.json({ success: true, message: 'Leave rejected.', leave });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leaves/:id — withdraw pending leave (own only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, userId: req.user._id });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'Pending') {
      return res.status(409).json({ success: false, message: 'Only pending leaves can be withdrawn.' });
    }

    await leave.deleteOne();
    res.json({ success: true, message: 'Leave application withdrawn.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
