import mongoose from 'mongoose';

const CallLogSchema = new mongoose.Schema({
  leadId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  leadName:  { type: String, required: true },
  leadPhone: { type: String, required: true },
  by:        { type: String, required: true },
  byId:      { type: String, required: true },

  outcome:   { type: String, enum: ['Answered', 'No Answer', 'Busy', 'Voicemail', 'Wrong Number'], required: true },
  durationSec: { type: Number, default: 0 },
  notes:     { type: String, default: '' },

  followUpAt:  { type: Date,   default: null },
  followUpSet: { type: Boolean, default: false },

  calledAt: { type: Date, default: Date.now },
}, { timestamps: true });

CallLogSchema.index({ leadId: 1, calledAt: -1 });
CallLogSchema.index({ byId: 1, calledAt: -1 });

export default mongoose.models.CallLog || mongoose.model('CallLog', CallLogSchema);
