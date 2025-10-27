const express = require('express');
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');
const router = express.Router();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields are required' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });
    // Persist to MongoDB if connected/configured
    try {
      if (process.env.MONGODB_URI) {
        await ContactMessage.create({ name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: String(message).trim() });
      }
    } catch (dbErr) {
      console.error('Failed to persist contact message:', dbErr?.message);
      // continue to email even if DB save fails
    }

    const emailContent = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">New Contact Form Submission</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1a202c; margin-top: 0;">Contact Details</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #1a202c; margin-top: 0;">Message</h3>
          <p style="line-height: 1.6; color: #4a5568;">${String(message).replace(/\n/g,'<br>')}</p>
        </div>
      </div>`
    };

    const autoReplyContent = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting me!',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Thank You for Reaching Out!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">Thanks for your message about <strong>${subject}</strong>. I typically respond within 24-48 hours.</p>
        <ul style="color: #4a5568; line-height: 1.6;">
          <li>Blogs: ${process.env.PORTFOLIO_URL || 'http://localhost:3000'}/blogs.html</li>
          <li>Projects: ${process.env.PORTFOLIO_URL || 'http://localhost:3000'}/#projects</li>
          <li>Discussions: ${process.env.PORTFOLIO_URL || 'http://localhost:3000'}/recommendations.html</li>
        </ul>
        <p>Best regards,<br><strong>Debnil Pal</strong></p>
      </div>`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = createTransporter();
      await transporter.sendMail(emailContent);
      await transporter.sendMail(autoReplyContent);
    } else {
      console.log('Contact (email not configured):', { name, email, subject, message });
    }

    res.json({ message: "Message sent successfully! I'll get back to you soon." });
  } catch (e) {
    console.error('Contact form error:', e);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
