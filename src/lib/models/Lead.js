import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  type:    { type: String, enum: ['created','note','call','whatsapp','email','status_change','reminder','meta'], required: true },
  message: { type: String, required: true },
  by:      { type: String, default: 'System' },
  at:      { type: Date,   default: Date.now },
});

const LeadSchema = new mongoose.Schema({
  // identity
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, trim: true, default: '' },
  email:      { type: String, trim: true, lowercase: true, default: '' },
  company:    { type: String, trim: true, default: '' },
  message:    { type: String, default: '' },

  // pipeline
  stage: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'],
    default: 'New',
  },

  // scoring  (auto-calculated)
  score: { type: Number, default: 0, min: 0, max: 100 },

  // source
  source: {
    type: String,
    enum: ['Meta Ads', 'Manual', 'CSV Upload', 'AI Paste', 'PDF', 'Website', 'WhatsApp', 'Referral'],
    default: 'Manual',
  },

  // Meta Ads linkage
  metaLeadId:   { type: String, default: '' },
  metaAdId:     { type: String, default: '' },
  metaAdName:   { type: String, default: '' },
  metaCampaign: { type: String, default: '' },
  metaFormId:   { type: String, default: '' },

  // assignment
  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'LeadUser', default: null },

  // follow-up
  nextFollowUp: { type: Date, default: null },
  isClaimed:    { type: Boolean, default: false },
  claimedAt:    { type: Date,    default: null },

  // urgency flags
  reminderSent: { type: Boolean, default: false },

  // interaction history
  activities: [ActivitySchema],

  // tags
  tags: [{ type: String }],

  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-score on save
LeadSchema.pre('save', function (next) {
  let score = 0;
  if (this.phone)   score += 25;
  if (this.email)   score += 15;
  if (this.company) score += 10;
  if (this.message && this.message.length > 10) score += 15;
  if (this.source === 'Meta Ads') score += 20;
  if (this.name?.split(' ').length >= 2) score += 10;
  if (this.stage === 'Qualified' || this.stage === 'Proposal') score += 5;
  this.score = Math.min(score, 100);
  next();
});

LeadSchema.index({ stage: 1 });
LeadSchema.index({ source: 1 });
LeadSchema.index({ score: -1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ phone: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
