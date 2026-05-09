const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const Subscription = require('../models/Subscription');
const router = express.Router();

// Load blog posts from JSON file
function loadBlogPosts() {
    const filePath = path.join(__dirname, '..', 'public', 'data', 'blogs.json');
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to load blogs.json:', err.message);
        return [];
    }
}

// Get all blog posts with filtering and pagination
router.get('/', (req, res) => {
    try {
        const blogPosts = loadBlogPosts();
        const { category, search, page = 1, limit = 6 } = req.query;
        let filteredPosts = [...blogPosts];

        if (category && category !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === category);
        }
        if (search) {
            const s = search.toLowerCase();
            filteredPosts = filteredPosts.filter(post =>
                post.title.toLowerCase().includes(s) ||
                post.excerpt.toLowerCase().includes(s) ||
                post.tags.some(tag => tag.toLowerCase().includes(s))
            );
        }

        filteredPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

        res.json({
            posts: paginatedPosts,
            totalPosts: filteredPosts.length,
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredPosts.length / limit),
            hasMore: endIndex < filteredPosts.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

router.get('/featured', (req, res) => {
    try {
        const blogPosts = loadBlogPosts();
        const featuredPost = blogPosts.find(post => post.featured);
        if (featuredPost) return res.json(featuredPost);
        res.status(404).json({ error: 'No featured post found' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch featured post' });
    }
});

router.get('/:slug', (req, res) => {
    try {
        const blogPosts = loadBlogPosts();
        const post = blogPosts.find(p => p.slug === req.params.slug);
        if (post) return res.json(post);
        res.status(404).json({ error: 'Blog post not found' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

router.get('/categories/list', (req, res) => {
    try {
        const blogPosts = loadBlogPosts();
        const counts = {};
        blogPosts.forEach(p => counts[p.category] = (counts[p.category] || 0) + 1);
        const categoryList = Object.entries(counts).map(([name, count]) => ({
            name,
            count,
            displayName: name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
        }));
        res.json(categoryList);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
        // Persist to Mongo if configured
        try{
            if(process.env.MONGODB_URI){
                await Subscription.create({ email: String(email).trim().toLowerCase(), source: 'newsletter' });
            }
        }catch(dbErr){
            console.error('Failed to persist subscription:', dbErr?.message);
        }
        // Email site owner about new subscription if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
            const port = Number(process.env.EMAIL_PORT || 587);
            const secure = (process.env.EMAIL_SECURE === 'true') || port === 465; // SSL for 465
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER,
                subject: 'New Newsletter Subscription',
                html: `<div style="font-family:Arial,sans-serif"><p>New subscriber: <strong>${email}</strong></p></div>`
            }).catch(()=>{});
        }
        res.json({ message: 'Successfully subscribed to newsletter!', email });
    } catch (e) {
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});

module.exports = router;
