import mongoose from 'mongoose';

const ApprovalHistorySchema = new mongoose.Schema({
  action:    { type: String, enum: ['submitted','approved','rejected','revision_requested'] },
  by:        { type: String },
  byId:      { type: String },
  comment:   { type: String, default: '' },
  at:        { type: Date, default: Date.now },
}, { _id: false });

const PostSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  caption:     { type: String, default: '' },
  hashtags:    [{ type: String }],
  mediaUrls:   [{ type: String }],
  mediaType:   { type: String, enum: ['image','video','reel','story','carousel'], default: 'image' },
  platforms:   [{ type: String, enum: ['Instagram','Facebook','YouTube','LinkedIn','Twitter','WhatsApp'] }],
  status:      { type: String, enum: ['Draft','Pending Approval','Approved','Rejected','Scheduled','Published','Failed'], default: 'Draft' },
  scheduledAt: { type: Date },
  publishedAt: { type: Date },
  client:      { type: String, default: '' },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ClientProfile' },
  createdBy:   { type: String },
  createdById: { type: String },
  assignedTo:  { type: String },
  campaignId:  { type: String, default: '' },
  approvalHistory: [ApprovalHistorySchema],
  revisionNote:{ type: String, default: '' },
  likes:       { type: Number, default: 0 },
  comments:    { type: Number, default: 0 },
  reach:       { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
