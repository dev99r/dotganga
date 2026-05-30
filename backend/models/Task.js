const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },

  assignedTo:  { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, userName: String },
  assignedBy:  { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, userName: String },

  department:  { type: String, default: '' },
  category:    { type: String, enum: ['Ads', 'Video Editing', 'Graphic Design', 'Social Media', 'Shoot', 'Content Writing', 'Operations', 'Management', 'General'], default: 'General' },
  priority:    { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status:      { type: String, enum: ['To Do', 'In Progress', 'Review', 'Done'], default: 'To Do' },

  client:      { type: String, default: '' },
  campaign:    { type: String, default: '' },
  dueDate:     { type: String, default: '' },
  notes:       { type: String, default: '' },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
