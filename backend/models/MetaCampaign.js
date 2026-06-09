const mongoose = require('mongoose');

const MetaCampaignSchema = new mongoose.Schema(
  {
    clientId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    metaCampaignId:  { type: String, required: true },
    metaAdSetId:     { type: String, default: '' },
    metaAdId:        { type: String, default: '' },
    name:            { type: String, required: true },
    objective:       { type: String, default: '' },
    status:          { type: String, enum: ['ACTIVE','PAUSED','DELETED','ARCHIVED'], default: 'ACTIVE' },
    dailyBudget:     { type: Number, default: 0 },
    lifetimeBudget:  { type: Number, default: 0 },
    startDate:       { type: Date },
    endDate:         { type: Date },
    targeting:       { type: Object, default: {} },
  },
  { timestamps: true }
);

MetaCampaignSchema.index({ clientId: 1, metaCampaignId: 1 }, { unique: true });

module.exports = mongoose.model('MetaCampaign', MetaCampaignSchema);
