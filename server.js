const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Track MongoDB connection state
let mongoConnected = false;

// Blogs always served from JSON files (data/blogs.json)
app.use('/api/blogs', require('./routes/blogs'));

// Attempt MongoDB connection for recommendations & contact persistence
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    mongoConnected = true;
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    mongoConnected = false;
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('ℹ️  Running with file-based fallbacks (blogs from JSON, contact saved to file)');
  });

  // Listen for disconnect events
  mongoose.connection.on('disconnected', () => { mongoConnected = false; });
  mongoose.connection.on('connected', () => { mongoConnected = true; });

  app.use('/api/recommendations', require('./routes/recommendations.db'));
} else {
  app.use('/api/recommendations', require('./routes/recommendations'));
}

// Expose connection state for the contact route
app.use((req, res, next) => { req.mongoConnected = mongoConnected; next(); });
app.use('/api/contact', require('./routes/contact'));

// Static pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/blogs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blogs.html'));
});

app.get('/recommendations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recommendations.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/skills', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'skills.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
});
