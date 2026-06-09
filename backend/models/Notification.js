const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:   { type: String, required: true },
    message: { type: String, default: '' },
    type:    { type: String, enum: ['approval','task','leave','meta','client','general'], default: 'general' },
    read:    { type: Boolean, default: false },
    link:    { type: String, default: '' },
    data:    { type: Object, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
