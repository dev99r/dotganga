const express    = require('express');
const router     = express.Router();
const WhatsApp   = require('../models/WhatsApp');
const { protect } = require('../middleware/auth');

// ── GET / — list messages ─────────────────────────────────────────────────────
// Query params: clientId, status, from, to, page, limit
router.get('/', protect, async (req, res) => {
  try {
    const { clientId, status, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (clientId) filter.clientId = clientId;
    if (status)   filter.status   = status;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from);
      if (to)   filter.scheduledAt.$lte = new Date(to);
    }

    const messages = await WhatsApp.find(filter)
      .populate('clientId',  'businessName logoUrl')
      .populate('createdBy', 'name designation')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await WhatsApp.countDocuments(filter);

    res.json({ success: true, messages, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /:id — single message ─────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const msg = await WhatsApp.findById(req.params.id)
      .populate('clientId',  'businessName logoUrl')
      .populate('createdBy', 'name');
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST / — create message ───────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { clientId, phoneNumber, message, mediaUrl, messageType, scheduledAt, campaignName, status } = req.body;

    if (!clientId || !phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'clientId, phoneNumber, and message are required.',
      });
    }

    const msg = await WhatsApp.create({
      clientId,
      phoneNumber,
      message,
      mediaUrl:     mediaUrl    || '',
      messageType:  messageType || 'text',
      scheduledAt:  scheduledAt ? new Date(scheduledAt) : null,
      campaignName: campaignName || '',
      status:       status       || 'Draft',
      createdBy:    req.user._id,
    });

    const populated = await msg.populate([
      { path: 'clientId', select: 'businessName logoUrl' },
      { path: 'createdBy', select: 'name' },
    ]);

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /:id — update message ─────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    // Prevent editing already-sent messages unless admin
    const existing = await WhatsApp.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Message not found.' });

    if (existing.status === 'Sent' && !['Super Admin', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Cannot edit a sent message.' });
    }

    const updated = await WhatsApp.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('clientId',  'businessName logoUrl')
      .populate('createdBy', 'name');

    res.json({ success: true, message: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /:id — delete message ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const msg = await WhatsApp.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    if (msg.status === 'Sent') {
      return res.status(400).json({ success: false, message: 'Cannot delete a sent message.' });
    }

    await WhatsApp.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /:id/send — mark as sent (would call Meta Cloud API in production) ──
router.patch('/:id/send', protect, async (req, res) => {
  try {
    const msg = await WhatsApp.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    if (msg.status === 'Sent') {
      return res.status(400).json({ success: false, message: 'Message already sent.' });
    }

    // In production: call Meta WhatsApp Cloud API here
    // const metaResponse = await sendViaMetaAPI(msg);

    msg.status  = 'Sent';
    msg.sentAt  = new Date();
    await msg.save();

    const populated = await msg.populate([
      { path: 'clientId', select: 'businessName logoUrl' },
      { path: 'createdBy', select: 'name' },
    ]);

    res.json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
