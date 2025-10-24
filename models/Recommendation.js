const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  topic: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  tags: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', RecommendationSchema);
