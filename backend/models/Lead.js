const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  addedBy:   { type: String },
  addedAt:   { type: Date, default: Date.now },
});

const leadSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, trim: true, default: '' },
  email:       { type: String, trim: true, default: '' },
  company:     { type: String, trim: true, default: '' },

  source:      { type: String, enum: ['Meta Ads','Instagram','Facebook','WhatsApp','Referral','Walk-in','Google','Website','Cold Call','Other'], default: 'Meta Ads' },
  service:     { type: String, enum: ['Social Media','Meta Ads','Video Editing','Graphic Design','Website','SEO','Shoot','Branding','Other'], default: 'Social Media' },

  status:      { type: String, enum: ['New','Contacted','Interested','Demo Scheduled','Proposal Sent','Won','Lost','Not Interested'], default: 'New' },

  budget:      { type: String, default: '' },
  location:    { type: String, default: '' },

  assignedTo:  { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, userName: String },

  followUpDate: { type: String, default: '' },
  lastContactDate: { type: String, default: '' },

  // Meta Ads specific
  adCampaign:  { type: String, default: '' },
  adSet:       { type: String, default: '' },
  adName:      { type: String, default: '' },

  notes:       [noteSchema],
  tags:        [String],
  priority:    { type: String, enum: ['Hot','Warm','Cold'], default: 'Warm' },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
