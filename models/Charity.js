const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 200 },
  logo: { type: String, default: '' },
  images: [String],
  website: { type: String, default: '' },
  category: {
    type: String,
    enum: ['health', 'education', 'environment', 'sports', 'community', 'children', 'other'],
    default: 'other',
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  totalContributions: { type: Number, default: 0 },
  subscriberCount: { type: Number, default: 0 },
  upcomingEvents: [{
    title: String,
    date: Date,
    description: String,
    location: String,
  }],
}, { timestamps: true });

charitySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Charity', charitySchema);
