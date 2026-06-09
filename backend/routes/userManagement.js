const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Client  = require('../models/Client');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// GET /api/users — list all users (Admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter)
      .populate('clientRef', 'businessName')
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/users — create user with any role (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, phone, department, designation, clientId, assignedClients } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const userData = { name, email, password, role: role || 'Staff', phone, department, designation };

    if (role === 'Client' && clientId) {
      userData.clientRef = clientId;
    }
    if (['SMM', 'Meta Ads Manager'].includes(role) && assignedClients) {
      userData.assignedClients = assignedClients;
    }

    const user = await User.create(userData);

    // If linking client, update the client's userRef
    if (role === 'Client' && clientId) {
      await Client.findByIdAndUpdate(clientId, { userRef: user._id });
    }

    // Notify the new user
    await Notification.create({
      userId:  user._id,
      title:   'Welcome to DotGanga!',
      message: `Your account has been created. Role: ${user.role}.`,
      type:    'general',
    });

    res.status(201).json({ success: true, user: user.toSafeObject(), token: signToken(user._id) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id — update user (Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, role, department, designation, isActive, assignedClients, clientId } = req.body;
    const update = { name, email, phone, role, department, designation };
    if (isActive !== undefined) update.isActive = isActive;
    if (assignedClients)        update.assignedClients = assignedClients;
    if (clientId)               update.clientRef = clientId;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id/reset-password — reset password (Admin)
router.put('/:id/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.password = password;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/users/:id — deactivate (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
