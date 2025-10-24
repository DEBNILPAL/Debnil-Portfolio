const express = require('express');
const BlogPost = require('../models/BlogPost');
const router = express.Router();

// Seed default posts if empty
async function ensureSeed() {
  const count = await BlogPost.countDocuments();
  if (count === 0) {
    await BlogPost.insertMany([
      { title: 'The Future of Web Development: Trends to Watch in 2025', slug: 'future-web-development-2025', excerpt: 'Exploring emerging trends and technologies that will shape web development in 2025.', content: 'Full article content here...', category: 'web-development', tags: ['web development','future tech','AI','frameworks'], readingTime: 8, featured: true, image: 'assets/featured-blog.svg', publishDate: new Date('2024-12-20') },
      { title: 'Modern JavaScript Best Practices for 2024', slug: 'javascript-best-practices-2024', excerpt: 'Essential practices every JavaScript developer should follow in 2024.', content: 'Full article content here...', category: 'javascript', tags: ['javascript','best practices','ES6','performance'], readingTime: 6, image: 'assets/blog2.svg', publishDate: new Date('2024-12-15') },
      { title: 'Creating Intuitive User Interfaces with React', slug: 'intuitive-ui-react', excerpt: 'Design principles for building user-friendly and accessible React interfaces.', content: 'Full article content here...', category: 'react', tags: ['react','UI/UX','accessibility','design'], readingTime: 7, image: 'assets/blog3.svg', publishDate: new Date('2024-12-10') }
    ]);
  }
}

// Get all blog posts with filtering and pagination
router.get('/', async (req, res) => {
  try {
    await ensureSeed();
    const { category, search, page = 1, limit = 6 } = req.query;
    const q = {};
    if (category && category !== 'all') q.category = category;
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      BlogPost.find(q).sort({ publishDate: -1 }).skip(skip).limit(parseInt(limit)),
      BlogPost.countDocuments(q)
    ]);
    res.json({ posts, totalPosts: total, currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), hasMore: skip + posts.length < total });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const featured = await BlogPost.findOne({ featured: true }).sort({ publishDate: -1 });
    if (!featured) return res.status(404).json({ error: 'No featured post found' });
    res.json(featured);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch featured post' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.get('/categories/list', async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const categoryList = categories.map(c => ({ name: c._id, count: c.count, displayName: c._id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }));
    res.json(categoryList);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    // For now, just acknowledge
    res.json({ message: 'Successfully subscribed to newsletter!', email });
  } catch (e) {
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
});

module.exports = router;
