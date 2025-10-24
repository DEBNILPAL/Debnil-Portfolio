const express = require('express');
const router = express.Router();

let recommendations = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', topic: 'web-development', title: 'Best Practices for React Component Architecture', message: 'I\'ve been working with React for 3 years and wanted to share some insights on component architecture. What are your thoughts on using compound components vs render props?', tags: ['react','architecture','components'], createdAt: '2024-12-18T10:30:00Z', likes: 15, replies: 8, status: 'approved' },
  { id: 2, name: 'Mike Chen', email: 'mike@example.com', topic: 'artificial-intelligence', title: 'AI Tools for Developers in 2024', message: 'The AI landscape is evolving rapidly. I\'d love to discuss which AI tools have been most helpful for your development workflow. GitHub Copilot? ChatGPT? Others?', tags: ['AI','tools','productivity'], createdAt: '2024-12-17T14:20:00Z', likes: 23, replies: 12, status: 'approved' },
  { id: 3, name: 'Emily Rodriguez', email: 'emily@example.com', topic: 'ui-ux-design', title: 'Accessibility in Modern Web Design', message: 'Accessibility should be a priority, not an afterthought. Let\'s discuss practical ways to implement WCAG guidelines without compromising design aesthetics.', tags: ['accessibility','WCAG','inclusive design'], createdAt: '2024-12-16T09:15:00Z', likes: 31, replies: 18, status: 'approved' },
];

router.get('/', (req,res)=>{
  try {
    const { topic, filter='all', page=1, limit=10 } = req.query;
    let list = recommendations.filter(r => r.status === 'approved');
    if (topic && topic !== 'all') list = list.filter(r => r.topic === topic);
    switch(filter){
      case 'popular': list.sort((a,b)=>b.likes-a.likes); break;
      case 'recent': list.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)); break;
      case 'unanswered': list = list.filter(r=> r.replies===0); break;
      default: list.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    }
    const start=(page-1)*limit, end=start+parseInt(limit);
    res.json({ recommendations: list.slice(start,end), totalRecommendations: list.length, currentPage: parseInt(page), totalPages: Math.ceil(list.length/limit), hasMore: end < list.length });
  } catch(e){ res.status(500).json({error:'Failed to fetch recommendations'}); }
});

router.post('/', (req,res)=>{
  try {
    const { name, email, topic, title, message, tags } = req.body || {};
    if (!name || !email || !topic || !title || !message) return res.status(400).json({error:'Name, email, topic, title, and message are required'});
    if (!email.includes('@')) return res.status(400).json({error:'Valid email is required'});
    const rec = { id: recommendations.length+1, name: name.trim(), email: email.trim().toLowerCase(), topic, title: title.trim(), message: message.trim(), tags: tags? tags.split(',').map(t=>t.trim().toLowerCase()):[], createdAt: new Date().toISOString(), likes:0, replies:0, status:'pending' };
    recommendations.push(rec);
    res.status(201).json({ message:'Recommendation submitted successfully! It will be reviewed before being published.', recommendation:{ id: rec.id, title: rec.title, status: rec.status } });
  } catch(e){ res.status(500).json({error:'Failed to create recommendation'}); }
});

router.post('/:id/like', (req,res)=>{
  try {
    const rec = recommendations.find(r=> r.id === parseInt(req.params.id));
    if (!rec || rec.status !== 'approved') return res.status(404).json({error:'Recommendation not found'});
    rec.likes += 1;
    res.json({ message:'Recommendation liked successfully', likes: rec.likes });
  } catch(e){ res.status(500).json({error:'Failed to like recommendation'}); }
});

module.exports = router;
