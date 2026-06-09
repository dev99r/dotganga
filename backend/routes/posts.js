const express  = require('express');
const router   = express.Router();
const Post     = require('../models/Post');
const Approval = require('../models/Approval');
const Notification = require('../models/Notification');
const Client   = require('../models/Client');
const { protect, agencyStaff } = require('../middleware/auth');

// GET /api/posts — list posts (agency staff + Client role for their own posts)
router.get('/', protect, async (req, res) => {
  try {
    const { clientId, status, approvalStatus, platform, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (clientId)       filter.clientId = clientId;
    if (status)         filter.status = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (platform)       filter.platforms = platform;
    if (from || to) {
      filter.scheduledDate = {};
      if (from) filter.scheduledDate.$gte = new Date(from);
      if (to)   filter.scheduledDate.$lte = new Date(to);
    }

    // Client role: only their own posts
    if (req.user.role === 'Client') {
      filter.clientId = req.user.clientRef;
    }

    const posts = await Post.find(filter)
      .populate('clientId',  'businessName logoUrl')
      .populate('createdBy', 'name designation')
      .populate('approvedBy','name')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Post.countDocuments(filter);
    res.json({ success: true, posts, total, page: Number(page) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/posts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('clientId',  'businessName')
      .populate('createdBy', 'name')
      .populate('approvedBy','name');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/posts — create post (agency staff)
router.post('/', protect, agencyStaff, async (req, res) => {
  try {
    const { clientId, platforms, caption, hashtags, mediaUrls, videoUrls, scheduledDate, category, notes, aiGenerated, script } = req.body;
    if (!clientId || !platforms?.length) {
      return res.status(400).json({ success: false, message: 'Client and platform are required.' });
    }

    const post = await Post.create({
      clientId, platforms, caption, hashtags,
      mediaUrls:  mediaUrls  || [],
      videoUrls:  videoUrls  || [],
      script:     script     || {},
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      category:  category  || 'Organic',
      notes, aiGenerated: !!aiGenerated,
      createdBy: req.user._id,
      status: 'Draft',
      approvalStatus: 'Pending',
    });

    // Auto-create approval record
    const approval = await Approval.create({
      postId:      post._id,
      clientId:    post.clientId,
      requestedBy: req.user._id,
      status:      'Pending',
      dueDate:     scheduledDate ? new Date(scheduledDate) : null,
    });

    // Notify client
    const client = await Client.findById(clientId).select('userRef businessName');
    if (client?.userRef) {
      await Notification.create({
        userId:  client.userRef,
        title:   'New post awaiting your approval',
        message: `A new post for ${client.businessName} needs your review.`,
        type:    'approval',
        data:    { postId: post._id },
      });
    }

    res.status(201).json({ success: true, post, approval });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/posts/:id — update post
router.put('/:id', protect, agencyStaff, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/posts/:id/approve — client or admin approves/rejects
router.patch('/:id/approve', protect, async (req, res) => {
  try {
    const { status, note } = req.body; // status: Approved | Rejected | Revision
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    post.approvalStatus = status;
    post.approvalNote   = note || '';
    post.approvedBy     = req.user._id;
    post.approvedAt     = new Date();
    if (status === 'Approved') post.status = 'Scheduled';
    await post.save();

    // Update approval record
    await Approval.findOneAndUpdate(
      { postId: post._id },
      { status, clientNote: note, reviewedBy: req.user._id, reviewedAt: new Date() }
    );

    // Notify the creator
    await Notification.create({
      userId:  post.createdBy,
      title:   `Post ${status}`,
      message: `Your post has been ${status.toLowerCase()}.${note ? ` Note: ${note}` : ''}`,
      type:    'approval',
      data:    { postId: post._id },
    });

    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/posts/:id
router.delete('/:id', protect, agencyStaff, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    await Approval.deleteMany({ postId: req.params.id });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
