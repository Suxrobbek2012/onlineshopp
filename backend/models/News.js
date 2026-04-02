const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  content:     { type: String, required: true },
  excerpt:     { type: String, default: '' },
  image:       { type: String, default: '' },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
