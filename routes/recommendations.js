const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

let recommendations = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', topic: 'web-development', title: 'Best Practices for React Component Architecture', message: 'I\'ve been working with React for 3 years and wanted to share some insights on component architecture. What are your thoughts on using compound components vs render props?', tags: ['react','architecture','components'], createdAt: '2024-12-18T10:30:00Z', likes: 15, replies: 8, status: 'approved' },
  { id: 2, name: 'Mike Chen', email: 'mike@example.com', topic: 'artificial-intelligence', title: 'AI Tools for Developers in 2024', message: 'The AI landscape is evolving rapidly. I\'d love to discuss which AI tools have been most helpful for your development workflow. GitHub Copilot? ChatGPT? Others?', tags: ['AI','tools','productivity'], createdAt: '2024-12-17T14:20:00Z', likes: 23, replies: 12, status: 'approved' },
  { id: 3, name: 'Emily Rodriguez', email: 'emily@example.com', topic: 'ui-ux-design', title: 'Accessibility in Modern Web Design', message: 'Accessibility should be a priority, not an afterthought. Let\'s discuss practical ways to implement WCAG guidelines without compromising design aesthetics.', tags: ['accessibility','WCAG','inclusive design'], createdAt: '2024-12-16T09:15:00Z', likes: 31, replies: 18, status: 'approved' },
].map(r => ({ ...r, messages: [{ role: 'user', name: r.name, email: r.email, message: r.message, createdAt: r.createdAt }] }));

function createTransporter(){
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = (process.env.EMAIL_SECURE === 'true') || port === 465; // SSL for 465
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}
async function notifyOwner(subject, html){
  if(!(process.env.EMAIL_USER && process.env.EMAIL_PASS)){
    console.log('Email not configured:', subject);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject,
    html
  });
}

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
    const rec = { id: recommendations.length+1, name: name.trim(), email: email.trim().toLowerCase(), topic, title: title.trim(), message: message.trim(), tags: tags? tags.split(',').map(t=>t.trim().toLowerCase()):[], createdAt: new Date().toISOString(), likes:0, replies:0, status:'approved', messages: [{ role:'user', name: name.trim(), email: email.trim().toLowerCase(), message: message.trim(), createdAt: new Date().toISOString() }] };
    recommendations.push(rec);
    // Email notify owner
    notifyOwner(
      `New Discussion: ${rec.title}`,
      `<div style="font-family:Arial,sans-serif"><h2 style="color:#667eea">New Discussion Submitted</h2><p><strong>Name:</strong> ${rec.name}</p><p><strong>Email:</strong> ${rec.email}</p><p><strong>Topic:</strong> ${rec.topic}</p><p><strong>Title:</strong> ${rec.title}</p><div style="background:#fafafa;padding:12px;border-radius:8px"><pre style="white-space:pre-wrap;font-family:inherit">${rec.message}</pre></div></div>`
    ).catch(()=>{});
    res.status(201).json({ message:'Discussion created successfully!', recommendation:{ id: rec.id, title: rec.title, status: rec.status } });
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

// Fetch a single discussion with messages (in-memory)
router.get('/:id', (req, res) => {
  try {
    const rec = recommendations.find(r=> r.id === parseInt(req.params.id));
    if (!rec || rec.status !== 'approved') return res.status(404).json({ error: 'Discussion not found' });
    res.json(rec);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch discussion' }); }
});

// Post a reply to discussion (in-memory)
router.post('/:id/replies', (req, res) => {
  try {
    const rec = recommendations.find(r=> r.id === parseInt(req.params.id));
    if (!rec || rec.status !== 'approved') return res.status(404).json({ error: 'Discussion not found' });
    const { name, email, message, adminToken } = req.body || {};
    const isAdmin = adminToken && adminToken === process.env.ADMIN_TOKEN;
    if (!isAdmin) {
      if (!name || !email || !email.includes('@')) return res.status(400).json({ error: 'Valid name and email required' });
    }
    const msg = { role: isAdmin ? 'admin' : 'user', name: isAdmin ? 'Admin' : String(name).trim(), email: isAdmin ? undefined : String(email).trim().toLowerCase(), message: String(message||'').trim(), createdAt: new Date().toISOString() };
    if (!msg.message) return res.status(400).json({ error: 'Message required' });
    rec.messages = rec.messages || [];
    rec.messages.push(msg);
    rec.replies = Math.max(0, (rec.messages.length||1) - 1);
    // Email notify owner for new reply
    notifyOwner(
      `New Reply on: ${rec.title}`,
      `<div style="font-family:Arial,sans-serif"><h2 style="color:#667eea">New Reply Posted</h2><p><strong>Discussion:</strong> ${rec.title}</p><p><strong>By:</strong> ${msg.name}${msg.email? ' ('+msg.email+')':''}</p><div style="background:#fafafa;padding:12px;border-radius:8px"><pre style="white-space:pre-wrap;font-family:inherit">${msg.message}</pre></div></div>`
    ).catch(()=>{});
    res.status(201).json({ message: 'Reply posted', replies: rec.replies });
  } catch (e) { res.status(500).json({ error: 'Failed to post reply' }); }
});

module.exports = router;
