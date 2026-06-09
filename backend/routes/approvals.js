const express  = require('express');
const router   = express.Router();
const Approval = require('../models/Approval');
const Post     = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, agencyStaff } = require('../middleware/auth');

// GET /api/approvals
router.get('/', protect, async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (status)   filter.status   = status;

    // Client role: only their approvals
    if (req.user.role === 'Client') {
      filter.clientId = req.user.clientRef;
    }

    const approvals = await Approval.find(filter)
      .populate({ path: 'postId', populate: { path: 'createdBy', select: 'name' } })
      .populate('clientId',    'businessName logoUrl')
      .populate('requestedBy', 'name designation')
      .populate('reviewedBy',  'name')
      .sort({ createdAt: -1 });

    const stats = {
      total:    approvals.length,
      pending:  approvals.filter(a => a.status === 'Pending').length,
      approved: approvals.filter(a => a.status === 'Approved').length,
      rejected: approvals.filter(a => a.status === 'Rejected').length,
      revision: approvals.filter(a => a.status === 'Revision').length,
    };

    res.json({ success: true, approvals, stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/approvals/:id — update approval status
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status, clientNote, internalNote } = req.body;
    const approval = await Approval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found.' });

    approval.status       = status;
    approval.clientNote   = clientNote   || approval.clientNote;
    approval.internalNote = internalNote || approval.internalNote;
    approval.reviewedBy   = req.user._id;
    approval.reviewedAt   = new Date();
    await approval.save();

    // Mirror status on the post
    const post = await Post.findById(approval.postId);
    if (post) {
      post.approvalStatus = status;
      post.approvalNote   = clientNote || '';
      post.approvedBy     = req.user._id;
      post.approvedAt     = new Date();
      if (status === 'Approved') post.status = 'Scheduled';
      await post.save();

      // Notify SMM who created it
      if (post.createdBy.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId:  post.createdBy,
          title:   `Post ${status}`,
          message: `Content was ${status.toLowerCase()} by ${req.user.name}.${clientNote ? ` Note: ${clientNote}` : ''}`,
          type:    'approval',
          data:    { postId: post._id, approvalId: approval._id },
        });
      }
    }

    res.json({ success: true, approval });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
