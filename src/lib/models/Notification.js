import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId:  { type: String, required: true },
  type:    { type: String, enum: ['approval_needed','approved','rejected','post_scheduled','post_published','new_client','reminder','meta_alert'], default: 'reminder' },
  title:   { type: String, required: true },
  body:    { type: String, default: '' },
  link:    { type: String, default: '' },
  read:    { type: Boolean, default: false },
  postId:  { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
