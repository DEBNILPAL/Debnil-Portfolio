const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: false },
  source: { type: String, trim: true, default: 'newsletter' },
}, { timestamps: true });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
