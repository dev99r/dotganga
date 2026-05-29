const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['Casual', 'Sick', 'Half-Day Leave'],
      required: [true, 'Leave type is required'],
    },
    startDate: { type: String, required: [true, 'Start date is required'] }, // YYYY-MM-DD
    endDate: { type: String, required: [true, 'End date is required'] },     // YYYY-MM-DD
    reason: { type: String, required: [true, 'Reason is required'], trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminRemarks: { type: String, default: '' },
  },
  { timestamps: true }
);

LeaveSchema.index({ userId: 1, startDate: 1 });

module.exports = mongoose.model('Leave', LeaveSchema);
