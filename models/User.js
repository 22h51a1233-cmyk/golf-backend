const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const scoreSchema = new mongoose.Schema({
  score: { type: Number, min: 1, max: 45, required: true },
  date: { type: Date, required: true },
  addedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['subscriber', 'admin'], default: 'subscriber' },
  avatar: { type: String, default: '' },

  subscription: {
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'lapsed'], default: 'inactive' },
    plan: { type: String, enum: ['monthly', 'yearly', null], default: null },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },

  scores: { type: [scoreSchema], default: [] },

  selectedCharity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
  charityPercentage: { type: Number, default: 10, min: 10, max: 100 },

  totalWon: { type: Number, default: 0 },
  drawsEntered: { type: Number, default: 0 },

  passwordResetToken: String,
  passwordResetExpire: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.addScore = function (score, date) {
  this.scores.push({ score, date });
  this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (this.scores.length > 5) this.scores = this.scores.slice(0, 5);
};

module.exports = mongoose.model('User', userSchema);
