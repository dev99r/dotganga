const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    monthYear: { type: String, required: true }, // "YYYY-MM"
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    totalCalendarDays: { type: Number, required: true },
    totalPresentDays: { type: Number, default: 0 },
    totalHalfDays: { type: Number, default: 0 },
    totalPaidLeaves: { type: Number, default: 0 },
    totalUnpaidAbsents: { type: Number, default: 0 },
    payableDays: { type: Number, default: 0 },
    dailyWageRate: { type: Number, default: 0 },
    calculatedDeductions: { type: Number, default: 0 },
    finalNetPayout: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['Draft', 'Processed', 'Paid'],
      default: 'Draft',
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PayrollSchema.index({ userId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
