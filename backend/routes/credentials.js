const express    = require('express');
const router     = express.Router();
const Credential = require('../models/ClientCredential');
const { protect, agencyStaff } = require('../middleware/auth');

// GET /api/credentials?clientId=xxx — list credentials for a client
router.get('/', protect, agencyStaff, async (req, res) => {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ success:false, message:'clientId required.' });

    const creds = await Credential.find({ clientId })
      .populate('addedBy',   'name designation')
      .populate('updatedBy', 'name')
      .sort({ platform: 1, createdAt: -1 })
      .lean({ virtuals: true });

    res.json({ success: true, credentials: creds });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/credentials — add credential
router.post('/', protect, agencyStaff, async (req, res) => {
  try {
    const { clientId, platform, label, username, password, twoFAEnabled, twoFASecret, notes } = req.body;
    if (!clientId || !platform) return res.status(400).json({ success:false, message:'clientId and platform are required.' });

    const cred = new Credential({ clientId, platform, label, username, twoFAEnabled: !!twoFAEnabled, twoFASecret:'', notes, addedBy: req.user._id });
    cred.password = password || '';
    if (twoFASecret) cred.twoFASecret = twoFASecret;
    await cred.save();

    const populated = await Credential.findById(cred._id).populate('addedBy','name designation').lean({ virtuals:true });
    res.status(201).json({ success:true, credential: populated });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/credentials/:id — update
router.put('/:id', protect, agencyStaff, async (req, res) => {
  try {
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ success:false, message:'Not found.' });

    const { platform, label, username, password, twoFAEnabled, twoFASecret, notes } = req.body;
    if (platform)    cred.platform     = platform;
    if (label !== undefined) cred.label= label;
    if (username !== undefined) cred.username = username;
    if (password !== undefined) cred.password = password;
    if (twoFAEnabled !== undefined) cred.twoFAEnabled = !!twoFAEnabled;
    if (twoFASecret)  cred.twoFASecret = twoFASecret;
    if (notes !== undefined) cred.notes = notes;
    cred.updatedBy = req.user._id;
    await cred.save();

    const populated = await Credential.findById(cred._id).populate('addedBy','name').populate('updatedBy','name').lean({ virtuals:true });
    res.json({ success:true, credential: populated });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/credentials/:id/documents — add document link
router.post('/:id/documents', protect, agencyStaff, async (req, res) => {
  try {
    const { name, url, type } = req.body;
    if (!name || !url) return res.status(400).json({ success:false, message:'name and url required.' });
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ success:false, message:'Not found.' });
    cred.documents.push({ name, url, type: type || 'Other', addedAt: new Date() });
    cred.updatedBy = req.user._id;
    await cred.save();
    res.json({ success:true, documents: cred.documents });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// DELETE /api/credentials/:id/documents/:docId
router.delete('/:id/documents/:docId', protect, agencyStaff, async (req, res) => {
  try {
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ success:false, message:'Not found.' });
    cred.documents = cred.documents.filter(d => String(d._id) !== req.params.docId);
    await cred.save();
    res.json({ success:true });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// DELETE /api/credentials/:id
router.delete('/:id', protect, agencyStaff, async (req, res) => {
  try {
    await Credential.findByIdAndDelete(req.params.id);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
