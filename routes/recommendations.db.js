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
      status: 'approved',
      messages: [{
        role: 'user',
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim()
      }]
    });
    res.status(201).json({ message: 'Discussion created successfully!', recommendation: { id: rec._id, title: rec.title, status: rec.status } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create recommendation' });
  }
});

// Get a single discussion thread with messages
router.get('/:id', async (req, res) => {
  try {
    const rec = await Recommendation.findById(req.params.id);
    if (!rec || rec.status !== 'approved') return res.status(404).json({ error: 'Discussion not found' });
    res.json(rec);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
});

// Post a reply to a discussion (user or admin)
router.post('/:id/replies', async (req, res) => {
  try {
    const { name, email, message, adminToken } = req.body || {};
    const rec = await Recommendation.findById(req.params.id);
    if (!rec || rec.status !== 'approved') return res.status(404).json({ error: 'Discussion not found' });

    const isAdmin = adminToken && adminToken === process.env.ADMIN_TOKEN;
    if (!isAdmin) {
      if (!name || !email || !email.includes('@')) return res.status(400).json({ error: 'Valid name and email required' });
    }

    const msg = {
      role: isAdmin ? 'admin' : 'user',
      name: isAdmin ? 'Admin' : String(name).trim(),
      email: isAdmin ? undefined : String(email).trim().toLowerCase(),
      message: String(message || '').trim()
    };
    if (!msg.message) return res.status(400).json({ error: 'Message required' });

    rec.messages.push(msg);
    rec.replies = Math.max(0, (rec.messages?.length || 1) - 1);
    await rec.save();

    res.status(201).json({ message: 'Reply posted', replies: rec.replies });
  } catch (e) {
    res.status(500).json({ error: 'Failed to post reply' });
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
