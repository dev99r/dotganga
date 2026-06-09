const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema(
  {
    businessName:   { type: String, required: true, trim: true },
    contactName:    { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:          { type: String, trim: true, default: '' },
    website:        { type: String, trim: true, default: '' },
    logoUrl:        { type: String, default: '' },
    industry:       { type: String, default: '' },
    services:       [{ type: String }],
    notes:          { type: String, default: '' },
    // Meta Ads
    metaAdAccountId:      { type: String, default: '' },
    metaAccessToken:      { type: String, default: '', select: false },
    metaAccessTokenExpiry:{ type: Date },
    metaConnected:        { type: Boolean, default: false },
    metaPageId:           { type: String, default: '' },
    // Team assignments
    assignedSMM:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedMetaManager:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive:             { type: Boolean, default: true },
    // Client login user reference
    userRef:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Content strategy
    contentTargets:       {
      Reel:          { type: Number, default: 6  },
      Carousel:      { type: Number, default: 8  },
      Story:         { type: Number, default: 12 },
      Organic:       { type: Number, default: 8  },
      'Ad Creative': { type: Number, default: 4  },
    },
    primaryPlatforms:     [{ type: String }],
    monthlyBudget:        { type: Number, default: 0 },
    contractNote:         { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', ClientSchema);
