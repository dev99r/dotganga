const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    clientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    platforms:      [{ type: String, enum: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'YouTube', 'WhatsApp'] }],
    caption:        { type: String, default: '' },
    hashtags:       { type: String, default: '' },
    mediaUrls:      [{ type: String }],
    scheduledDate:  { type: Date },
    postedAt:       { type: Date },
    status:         { type: String, enum: ['Draft','Scheduled','Posted','Failed'], default: 'Draft' },
    approvalStatus: { type: String, enum: ['Pending','Approved','Rejected','Revision'], default: 'Pending' },
    approvalNote:   { type: String, default: '' },
    approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt:     { type: Date },
    category:       { type: String, enum: ['Organic','Ad Creative','Story','Reel','Carousel','Other'], default: 'Organic' },
    aiGenerated:    { type: Boolean, default: false },
    notes:          { type: String, default: '' },
    script: {
      hook:          { type: String, default: '' },
      body:          { type: String, default: '' },
      cta:           { type: String, default: '' },
      voiceover:     { type: String, default: '' },
      textOverlays:  [{ type: String }],
    },
    videoUrls:      [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
