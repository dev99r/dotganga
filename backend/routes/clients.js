const express  = require('express');
const router   = express.Router();
const Client   = require('../models/Client');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { protect, adminOnly, managerOrAdmin, agencyStaff } = require('../middleware/auth');

// GET /api/clients — list clients (all authenticated users — Staff need this for social calendar)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'Client') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { search, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { contactName:  { $regex: search, $options: 'i' } },
      { email:        { $regex: search, $options: 'i' } },
    ];

    // SMM / Meta Ads Manager only see their assigned clients
    if (['SMM', 'Meta Ads Manager'].includes(req.user.role)) {
      filter._id = { $in: req.user.assignedClients };
    }

    const clients = await Client.find(filter)
      .populate('assignedSMM',       'name email designation')
      .populate('assignedMetaManager','name email')
      .populate('createdBy',          'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, clients });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/clients/my/portal — Client role: their own data
router.get('/my/portal', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Client') {
      return res.status(403).json({ success: false, message: 'Client access only.' });
    }
    const client = await Client.findById(req.user.clientRef)
      .populate('assignedSMM', 'name designation');
    if (!client) return res.status(404).json({ success: false, message: 'Client profile not found.' });
    res.json({ success: true, client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/clients/:id — single client
router.get('/:id', protect, agencyStaff, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedSMM',       'name email designation department')
      .populate('assignedMetaManager','name email')
      .populate('createdBy',          'name');
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    res.json({ success: true, client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/clients — create client (Admin/Manager)
router.post('/', protect, managerOrAdmin, async (req, res) => {
  try {
    const {
      businessName, contactName, email, phone, website, industry,
      services, notes, logoUrl, assignedSMM, assignedMetaManager,
      contentTargets, primaryPlatforms, monthlyBudget, contractNote,
    } = req.body;

    if (!businessName || !contactName || !email) {
      return res.status(400).json({ success: false, message: 'Business name, contact name, and email are required.' });
    }

    const client = await Client.create({
      businessName, contactName, email, phone, website, industry,
      services: services || [], notes, logoUrl,
      assignedSMM: assignedSMM || [],
      assignedMetaManager: assignedMetaManager || null,
      contentTargets: contentTargets || {},
      primaryPlatforms: primaryPlatforms || [],
      monthlyBudget: monthlyBudget || 0,
      contractNote: contractNote || '',
      createdBy: req.user._id,
    });

    // Notify assigned team
    if (assignedSMM?.length) {
      const notifs = assignedSMM.map(uid => ({
        userId: uid,
        title: `New client assigned: ${businessName}`,
        message: `You have been assigned to manage ${businessName}.`,
        type: 'client',
      }));
      await Notification.insertMany(notifs);
    }

    res.status(201).json({ success: true, client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/clients/:id — update client (Admin/Manager)
router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    res.json({ success: true, client });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/clients/:id — deactivate (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    res.json({ success: true, message: 'Client deactivated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
