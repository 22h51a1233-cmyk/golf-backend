const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchType: { type: String, enum: ['five_match', 'four_match', 'three_match'] },
  matchedNumbers: [Number],
  prizeAmount: Number,
  verificationStatus: { type: String, enum: ['pending', 'submitted', 'approved', 'rejected'], default: 'pending' },
  proofUrl: String,
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: Date,
});

const drawSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year:  { type: Number, required: true },
  title: String,
  status: { type: String, enum: ['upcoming', 'simulated', 'published', 'completed'], default: 'upcoming' },
  drawType: { type: String, enum: ['random', 'algorithmic'], default: 'random' },
  winningNumbers: [Number],
  prizePool: {
    total: { type: Number, default: 0 },
    fiveMatch: { type: Number, default: 0 },
    fourMatch: { type: Number, default: 0 },
    threeMatch: { type: Number, default: 0 },
    jackpotRollover: { type: Number, default: 0 },
  },
  subscriptionRevenue: { type: Number, default: 0 },
  activeSubscriberCount: { type: Number, default: 0 },
  winners: [winnerSchema],
  jackpotRolledOver: { type: Boolean, default: false },
  rolledOverAmount: { type: Number, default: 0 },
  publishedAt: Date,
}, { timestamps: true });

drawSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Draw', drawSchema);
