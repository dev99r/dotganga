const mongoose = require('mongoose');

const WhatsAppSchema = new mongoose.Schema(
  {
    clientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    phoneNumber:  { type: String, required: true, trim: true },
    message:      { type: String, required: true },
    mediaUrl:     { type: String, default: '' },
    messageType:  { type: String, enum: ['text', 'image', 'document'], default: 'text' },
    scheduledAt:  { type: Date, default: null },
    sentAt:       { type: Date, default: null },
    status:       { type: String, enum: ['Draft', 'Scheduled', 'Sent', 'Failed'], default: 'Draft' },
    campaignName: { type: String, default: '' },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform:     { type: String, default: 'WhatsApp' },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

WhatsAppSchema.index({ clientId: 1, status: 1 });
WhatsAppSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('WhatsApp', WhatsAppSchema);
