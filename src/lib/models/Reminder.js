import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  leadId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'LeadUser' },
  title:       { type: String, required: true },
  note:        { type: String, default: '' },
  dueAt:       { type: Date, required: true },
  isDone:      { type: Boolean, default: false },
  doneAt:      { type: Date },
  type:        { type: String, enum: ['call', 'whatsapp', 'email', 'follow_up', 'meeting'], default: 'call' },
  isAutomatic: { type: Boolean, default: false },
}, { timestamps: true });

ReminderSchema.index({ dueAt: 1, isDone: 1 });

export default mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);
