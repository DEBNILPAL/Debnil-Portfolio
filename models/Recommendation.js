const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'admin'], required: true },
  name: { type: String, required: true },
  email: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const RecommendationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  topic: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  tags: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  messages: { type: [MessageSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', RecommendationSchema);
