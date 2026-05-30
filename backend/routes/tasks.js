const express = require('express');
const router  = express.Router();
const Task    = require('../models/Task');
const { protect } = require('../middleware/auth');

// GET /api/tasks  — all tasks visible to this user
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, mine } = req.query;
    const isAdmin = ['Admin', 'Manager'].includes(req.user.role);

    let filter = {};
    if (!isAdmin || mine === 'true') {
      filter.$or = [
        { 'assignedTo.userId': req.user._id },
        { 'assignedBy.userId': req.user._id },
      ];
    }
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, tasks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/tasks
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, assignedToId, assignedToName, department, category, priority, dueDate, notes, client, campaign } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });

    const task = await Task.create({
      title:       title.trim(),
      description: description || '',
      assignedTo:  { userId: assignedToId, userName: assignedToName },
      assignedBy:  { userId: req.user._id, userName: req.user.name },
      department, category, priority,
      dueDate:  dueDate   || '',
      notes:    notes     || '',
      client:   client    || '',
      campaign: campaign  || '',
    });
    res.status(201).json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/tasks/:id/status  — update status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isOwner   = String(task.assignedTo.userId) === String(req.user._id);
    const isCreator = String(task.assignedBy.userId) === String(req.user._id);
    const isAdmin   = ['Admin', 'Manager'].includes(req.user.role);
    if (!isOwner && !isCreator && !isAdmin)
      return res.status(403).json({ success: false, message: 'Not allowed.' });

    task.status = req.body.status;
    if (req.body.status === 'Done') task.completedAt = new Date();
    await task.save();
    res.json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/tasks/:id  — full update (admin/creator)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isCreator = String(task.assignedBy.userId) === String(req.user._id);
    const isAdmin   = ['Admin', 'Manager'].includes(req.user.role);
    if (!isCreator && !isAdmin)
      return res.status(403).json({ success: false, message: 'Only the creator can edit.' });

    const fields = ['title','description','category','priority','dueDate','notes','status'];
    fields.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
    if (req.body.assignedToId) {
      task.assignedTo = { userId: req.body.assignedToId, userName: req.body.assignedToName };
    }
    await task.save();
    res.json({ success: true, task });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isCreator = String(task.assignedBy.userId) === String(req.user._id);
    const isAdmin   = ['Admin', 'Manager'].includes(req.user.role);
    if (!isCreator && !isAdmin)
      return res.status(403).json({ success: false, message: 'Only creator or admin can delete.' });

    await task.deleteOne();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
