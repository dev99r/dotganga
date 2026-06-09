const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema(
  {
    postId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post',   required: true },
    clientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    requestedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    status:       { type: String, enum: ['Pending','Approved','Rejected','Revision'], default: 'Pending' },
    clientNote:   { type: String, default: '' },
    internalNote: { type: String, default: '' },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:   { type: Date },
    dueDate:      { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Approval', ApprovalSchema);
