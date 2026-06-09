const express      = require('express');
const router       = express.Router();
const MediaLibrary = require('../models/MediaLibrary');
const { protect, agencyStaff } = require('../middleware/auth');

// GET /api/media
router.get('/', protect, async (req, res) => {
  try {
    const { clientId, fileType, folder, search } = req.query;
    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (fileType) filter.fileType = fileType;
    if (folder)   filter.folder   = folder;
    if (search)   filter.fileName = { $regex: search, $options: 'i' };

    if (req.user.role === 'Client') {
      filter.clientId = req.user.clientRef;
    }

    const media = await MediaLibrary.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    // Distinct folders
    const folders = await MediaLibrary.distinct('folder', { clientId: filter.clientId });

    res.json({ success: true, media, folders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/media — upload (agency staff only)
router.post('/', protect, agencyStaff, async (req, res) => {
  try {
    const { clientId, fileName, fileUrl, thumbnailUrl, fileType, mimeType, fileSize, width, height, duration, tags, folder } = req.body;
    if (!clientId || !fileName || !fileUrl) {
      return res.status(400).json({ success: false, message: 'clientId, fileName, and fileUrl are required.' });
    }

    const media = await MediaLibrary.create({
      clientId, fileName, fileUrl,
      thumbnailUrl: thumbnailUrl || fileUrl,
      fileType: fileType || 'image',
      mimeType, fileSize, width, height, duration,
      tags: tags || [],
      folder: folder || 'General',
      uploadedBy: req.user._id,
    });

    res.status(201).json({ success: true, media });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/media/:id — update tags/folder
router.put('/:id', protect, agencyStaff, async (req, res) => {
  try {
    const { tags, folder, fileName } = req.body;
    const media = await MediaLibrary.findByIdAndUpdate(
      req.params.id,
      { tags, folder, fileName },
      { new: true }
    );
    if (!media) return res.status(404).json({ success: false, message: 'Media not found.' });
    res.json({ success: true, media });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/media/:id
router.delete('/:id', protect, agencyStaff, async (req, res) => {
  try {
    await MediaLibrary.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
