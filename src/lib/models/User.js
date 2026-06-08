import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true, select: false },
  role:        { type: String, enum: ['SuperAdmin', 'Admin', 'Manager', 'Sales', 'VideoEditor', 'GraphicDesigner', 'SMM', 'ContentWriter', 'Intern', 'Client', 'MetaAdsManager'], default: 'Sales' },
  clientProfileId: { type: String, default: '' },
  department:  { type: String, default: '' },
  avatar:      { type: String, default: '' },
  phone:       { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

export default mongoose.models.LeadUser || mongoose.model('LeadUser', UserSchema);
