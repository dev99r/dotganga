const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/company — get company config (all authenticated users)
router.get('/', protect, async (req, res, next) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company configuration not found.' });
    }
    res.json({ success: true, company });
  } catch (err) {
    next(err);
  }
});

// POST /api/company — create company config (admin only)
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('officeName').trim().notEmpty(),
    body('officeLatitude').isFloat({ min: -90, max: 90 }),
    body('officeLongitude').isFloat({ min: -180, max: 180 }),
    body('allowedWiFiSSID').trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const existing = await Company.findOne();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Company config already exists. Use PUT to update.',
        });
      }

      const company = await Company.create(req.body);
      res.status(201).json({ success: true, message: 'Company configured.', company });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/company — update company config (admin only)
router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    const allowedFields = [
      'officeName', 'officeStartTime', 'officeEndTime', 'gracePeriodMinutes',
      'officeLatitude', 'officeLongitude', 'allowedRadiusMeter', 'allowedWiFiSSID',
    ];

    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    let company = await Company.findOne();

    if (!company) {
      company = await Company.create({ ...req.body });
    } else {
      company = await Company.findOneAndUpdate({}, updates, { new: true, runValidators: true });
    }

    res.json({ success: true, message: 'Company configuration updated.', company });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
