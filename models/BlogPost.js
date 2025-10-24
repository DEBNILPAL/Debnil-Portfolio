const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'Debnil Pal' },
  publishDate: { type: Date, default: Date.now },
  category: { type: String, default: 'general' },
  tags: { type: [String], default: [] },
  readingTime: { type: Number, default: 5 },
  featured: { type: Boolean, default: false },
  image: { type: String, default: 'assets/blog1.svg' }
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', BlogPostSchema);
