import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  metaCampaignId:   { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  status:           { type: String, enum: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'], default: 'ACTIVE' },
  objective:        { type: String, default: '' },
  spend:            { type: Number, default: 0 },
  impressions:      { type: Number, default: 0 },
  clicks:           { type: Number, default: 0 },
  leads:            { type: Number, default: 0 },
  cpl:              { type: Number, default: 0 },
  dailyBudget:      { type: Number, default: 0 },
  lifetimeBudget:   { type: Number, default: 0 },
  startTime:        { type: Date },
  stopTime:         { type: Date },
  lastSyncAt:       { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
