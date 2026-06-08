import mongoose from 'mongoose';

const ClientProfileSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, lowercase: true, trim: true },
  phone:       { type: String, default: '' },
  company:     { type: String, default: '' },
  logo:        { type: String, default: '' },
  industry:    { type: String, default: '' },
  website:     { type: String, default: '' },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'LeadUser' },
  assignedSmm: { type: String, default: '' },
  assignedSmmId: { type: String, default: '' },
  platforms:   [{ type: String, enum: ['Instagram','Facebook','YouTube','LinkedIn','Twitter','WhatsApp'] }],
  services:    [{ type: String }],
  metaAdAccountId: { type: String, default: '' },
  metaAccessToken: { type: String, default: '' },
  reportingEmail:  { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  notes:       { type: String, default: '' },
  contractStart: { type: Date },
  contractEnd:   { type: Date },
  monthlyBudget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.ClientProfile || mongoose.model('ClientProfile', ClientProfileSchema);
