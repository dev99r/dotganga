const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName:    { type: String, required: true },
    designation: { type: String, default: '' },
    department:  { type: String, default: '' },
    date:        { type: String, required: true }, // YYYY-MM-DD
    hoursWorked: { type: Number, default: 0 },
    tasks: [
      {
        task:   { type: String, required: true },
        status: { type: String, enum: ['Done', 'In Progress', 'Blocked'], default: 'Done' },
      },
    ],
    highlights:   { type: String, default: '' },
    blockers:     { type: String, default: '' },
    tomorrowPlan: [{ type: String }],
    sentiment:    { type: String, enum: ['Happy', 'Neutral', 'Stressed', 'Burnout'], default: 'Neutral' },
    status:       { type: String, enum: ['Pending', 'Approved', 'Flagged'], default: 'Pending' },
    managerComment: { type: String, default: '' },
    reviewedBy:   { type: String, default: '' },
    reviewedAt:   { type: Date },
  },
  { timestamps: true }
);

DailyReportSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyReportSchema.index({ date: 1 });

module.exports = mongoose.model('DailyReport', DailyReportSchema);
