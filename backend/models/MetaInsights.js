const mongoose = require('mongoose');

const MetaInsightsSchema = new mongoose.Schema(
  {
    clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client',       required: true },
    campaignId:  { type: mongoose.Schema.Types.ObjectId, ref: 'MetaCampaign', required: true },
    date:        { type: Date, required: true },
    impressions: { type: Number, default: 0 },
    clicks:      { type: Number, default: 0 },
    spend:       { type: Number, default: 0 },
    reach:       { type: Number, default: 0 },
    cpm:         { type: Number, default: 0 },
    ctr:         { type: Number, default: 0 },
    cpc:         { type: Number, default: 0 },
    roas:        { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    leadCount:   { type: Number, default: 0 },
    syncedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MetaInsightsSchema.index({ clientId: 1, campaignId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MetaInsights', MetaInsightsSchema);
