const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['Super Admin', 'Admin', 'Manager', 'Staff', 'SMM', 'Client', 'Meta Ads Manager'], default: 'Staff' },
    designation: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    joinedDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    phone:          { type: String, trim: true, default: '' },
    whatsappNumber: { type: String, trim: true, default: '' },
    // For Client role — link to Client document
    clientRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    // For SMM / Meta Ads Manager — which clients they manage
    assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
    // Welcome email / password-reset token
    resetToken:       { type: String, select: false },
    resetTokenExpiry: { type: Date,   select: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
