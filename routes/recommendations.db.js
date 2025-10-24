const express = require('express');
const Recommendation = require('../models/Recommendation');
const router = express.Router();

// List with filters + pagination
router.get('/', async (req, res) => {
  try {
    const { topic, filter = 'all', page = 1, limit = 10 } = req.query;
    const q = { status: 'approved' };
    if (topic && topic !== 'all') q.topic = topic;

    let sort = { createdAt: -1 };
    if (filter === 'popular') sort = { likes: -1 };
    if (filter === 'recent') sort = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Recommendation.find(q).sort(sort).skip(skip).limit(parseInt(limit)),
      Recommendation.countDocuments(q)
    ]);

    res.json({
      recommendations: items,
      totalRecommendations: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + items.length < total
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const { name, email, topic, title, message, tags } = req.body || {};
    if (!name || !email || !topic || !title || !message) return res.status(400).json({ error: 'Name, email, topic, title, and message are required' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

    const rec = await Recommendation.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      topic,
      title: title.trim(),
      message: message.trim(),
      tags: (tags || '').split(',').filter(Boolean).map(t => t.trim().toLowerCase()),
      status: 'approved'
    });
    res.status(201).json({ message: 'Recommendation submitted successfully!', recommendation: { id: rec._id, title: rec.title, status: rec.status } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create recommendation' });
  }
});

// Like
router.post('/:id/like', async (req, res) => {
  try {
    const rec = await Recommendation.findOneAndUpdate({ _id: req.params.id, status: 'approved' }, { $inc: { likes: 1 } }, { new: true });
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
    res.json({ message: 'Recommendation liked successfully', likes: rec.likes });
  } catch (e) {
    res.status(500).json({ error: 'Failed to like recommendation' });
  }
});

module.exports = router;
