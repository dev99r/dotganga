const express  = require('express');
const router   = express.Router();
const DailyReport = require('../models/DailyReport');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/daily-report?date=YYYY-MM-DD&mine=true
router.get('/', protect, async (req, res) => {
  try {
    const { date, mine } = req.query;
    const today  = new Date().toISOString().slice(0, 10);
    const filter = { date: date || today };

    const isAdminOrManager = ['Admin', 'Manager'].includes(req.user.role);

    if (mine === 'true' || !isAdminOrManager) {
      filter.userId = req.user._id;
    }

    const reports = await DailyReport.find(filter).sort({ createdAt: -1 }).lean();

    const summary = {
      total:    reports.length,
      approved: reports.filter(r => r.status === 'Approved').length,
      pending:  reports.filter(r => r.status === 'Pending').length,
      flagged:  reports.filter(r => r.status === 'Flagged').length,
    };

    res.json({ success: true, reports, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/daily-report
router.post('/', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const existing = await DailyReport.findOne({ userId: req.user._id, date: today });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Report already submitted for today.' });
    }

    const { hoursWorked, tasks, highlights, blockers, tomorrowPlan, sentiment } = req.body;

    const report = await DailyReport.create({
      userId:      req.user._id,
      userName:    req.user.name,
      designation: req.user.designation || '',
      department:  req.user.department  || '',
      date:        today,
      hoursWorked: hoursWorked || 0,
      tasks:       (tasks || []).filter(t => t.task?.trim()),
      highlights:  highlights  || '',
      blockers:    blockers    || '',
      tomorrowPlan: (tomorrowPlan || []).filter(Boolean),
      sentiment:   sentiment   || 'Neutral',
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/daily-report/:id  — staff updates their own report (add/edit tasks)
router.put('/:id', protect, async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (String(report.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own report.' });
    }

    const { hoursWorked, tasks, highlights, blockers, tomorrowPlan, sentiment } = req.body;
    if (hoursWorked  !== undefined) report.hoursWorked  = hoursWorked;
    if (tasks        !== undefined) report.tasks        = tasks.filter(t => t.task?.trim());
    if (highlights   !== undefined) report.highlights   = highlights;
    if (blockers     !== undefined) report.blockers     = blockers;
    if (tomorrowPlan !== undefined) report.tomorrowPlan = tomorrowPlan.filter(Boolean);
    if (sentiment    !== undefined) report.sentiment    = sentiment;

    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/daily-report/:id  (Admin/Manager only)
router.patch('/:id', protect, async (req, res) => {
  try {
    if (!['Admin', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Managers and Admins only.' });
    }
    const { status, managerComment } = req.body;
    const update = { reviewedBy: req.user.name, reviewedAt: new Date() };
    if (status)         update.status         = status;
    if (managerComment !== undefined) update.managerComment = managerComment;

    const report = await DailyReport.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
