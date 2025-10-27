const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Sample blog data (in a real app, this would come from a database)
const blogPosts = [
    {
        id: 1,
        title: "The Future of Web Development: Trends to Watch in 2025",
        slug: "future-web-development-2025",
        excerpt: "Exploring emerging trends and technologies that will shape web development in 2025.",
        content: "Full article content here...",
        author: "Debnil Pal",
        publishDate: "2024-12-20",
        category: "web-development",
        tags: ["web development", "future tech", "AI", "frameworks"],
        readingTime: 8,
        featured: true,
        image: "assets/featured-blog.svg"
    },
    {
        id: 2,
        title: "Modern JavaScript Best Practices for 2024",
        slug: "javascript-best-practices-2024",
        excerpt: "Essential practices every JavaScript developer should follow in 2024.",
        content: "Full article content here...",
        author: "Debnil Pal",
        publishDate: "2024-12-15",
        category: "javascript",
        tags: ["javascript", "best practices", "ES6", "performance"],
        readingTime: 6,
        featured: false,
        image: "assets/blog2.svg"
    },
    {
        id: 3,
        title: "Creating Intuitive User Interfaces with React",
        slug: "intuitive-ui-react",
        excerpt: "Design principles for building user-friendly and accessible React interfaces.",
        content: "Full article content here...",
        author: "Debnil Pal",
        publishDate: "2024-12-10",
        category: "react",
        tags: ["react", "UI/UX", "accessibility", "design"],
        readingTime: 7,
        featured: false,
        image: "assets/blog3.svg"
    },
    {
        id: 4,
        title: "Node.js Performance Optimization Techniques",
        slug: "nodejs-performance-optimization",
        excerpt: "Advanced techniques to optimize your Node.js applications for better performance.",
        content: "Full article content here...",
        author: "Debnil Pal",
        publishDate: "2024-12-05",
        category: "nodejs",
        tags: ["nodejs", "performance", "optimization", "backend"],
        readingTime: 9,
        featured: false,
        image: "assets/blog1.svg"
    },
    {
        id: 5,
        title: "CSS Grid vs Flexbox: When to Use Which",
        slug: "css-grid-vs-flexbox",
        excerpt: "Understanding the differences between CSS Grid and Flexbox and when to use each.",
        content: "Full article content here...",
        author: "Debnil Pal",
        publishDate: "2024-11-30",
        category: "web-development",
        tags: ["CSS", "grid", "flexbox", "layout"],
        readingTime: 5,
        featured: false,
        image: "public/assets/blog2.svg"
    },
    {
        id: 6,
        title: "Building Responsive Web Applications",
        slug: "responsive-web-applications",
        excerpt: "Complete guide to creating responsive web applications that work on all devices.",
        content: "Full article content here...",
        author: "Debnil Pal",
        publishDate: "2024-11-25",
        category: "web-development",
        tags: ["responsive", "mobile", "CSS", "design"],
        readingTime: 8,
        featured: false,
        image: "public/assets/blog3.svg"
    }
];

// Get all blog posts with filtering and pagination
router.get('/', (req, res) => {
    try {
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
        const featuredPost = blogPosts.find(post => post.featured);
        if (featuredPost) return res.json(featuredPost);
        res.status(404).json({ error: 'No featured post found' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch featured post' });
    }
});

router.get('/:slug', (req, res) => {
    try {
        const post = blogPosts.find(p => p.slug === req.params.slug);
        if (post) return res.json(post);
        res.status(404).json({ error: 'Blog post not found' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch blog post' });
    }
});

router.get('/categories/list', (req, res) => {
    try {
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

router.post('/newsletter', (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
        console.log(`Newsletter subscription: ${email}`);
        // Email site owner about new subscription if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: process.env.EMAIL_PORT || 587,
                secure: false,
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
