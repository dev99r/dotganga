const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    signInTime: { type: Date, required: true },
    signOutTime: { type: Date, default: null },
    signInLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    connectedWiFi: { type: String, default: '' },
    workMode: {
      type: String,
      enum: ['Office', 'WFH'],
      default: 'Office',
    },
    status: {
      type: String,
      enum: ['Full-Day', 'Half-Day', 'Absent', 'Leave'],
      default: 'Full-Day',
    },
    isLate: { type: Boolean, default: false },
    remarks: { type: String, default: '' },
    workingHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
