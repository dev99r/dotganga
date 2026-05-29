const mongoose = require('mongoose');

const SalaryProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    baseMonthlySalary: { type: Number, required: [true, 'Base salary is required'], min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductionPerHalfDay: { type: Number, default: 0.5, min: 0, max: 1 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryProfile', SalaryProfileSchema);
