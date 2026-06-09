const mongoose = require('mongoose');

const MediaLibrarySchema = new mongoose.Schema(
  {
    clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    fileName:    { type: String, required: true },
    fileUrl:     { type: String, required: true },
    thumbnailUrl:{ type: String, default: '' },
    fileType:    { type: String, enum: ['image','video','document','other'], default: 'image' },
    mimeType:    { type: String, default: '' },
    fileSize:    { type: Number, default: 0 },
    width:       { type: Number, default: 0 },
    height:      { type: Number, default: 0 },
    duration:    { type: Number, default: 0 },
    tags:        [{ type: String }],
    folder:      { type: String, default: 'General' },
    usedInPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaLibrary', MediaLibrarySchema);
