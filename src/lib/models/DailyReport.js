import mongoose from 'mongoose';

const DailyReportSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'LeadUser', required: true },
  userName: { type: String, required: true },
  role:     { type: String, required: true },
  date:     { type: String, required: true }, // YYYY-MM-DD

  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },

  highlights:   { type: String, default: '' },
  blockers:     { type: String, default: '' },
  tomorrowPlan: [{ type: String }],

  aiSummary: { type: String, default: '' },
  sentiment: { type: String, enum: ['Happy', 'Neutral', 'Stressed', 'Burnout'], default: 'Neutral' },

  status:         { type: String, enum: ['Pending', 'Approved', 'Needs Review'], default: 'Pending' },
  managerComment: { type: String, default: '' },
  reviewedBy:     { type: String, default: '' },
  reviewedAt:     { type: Date, default: null },
}, { timestamps: true });

DailyReportSchema.index({ userId: 1, date: -1 }, { unique: true });
DailyReportSchema.index({ date: -1 });
DailyReportSchema.index({ role: 1, date: -1 });

export default mongoose.models.LeadDailyReport || mongoose.model('LeadDailyReport', DailyReportSchema);
