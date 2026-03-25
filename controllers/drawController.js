const Draw = require('../models/Draw');
const User = require('../models/User');
const { runDraw, calculatePrizePool } = require('../utils/drawEngine');

exports.getDraws = async (req, res) => {
  try {
    const draws = await Draw.find({ status: { $in: ['published', 'completed'] } }).sort({ year: -1, month: -1 }).limit(12);
    res.json({ success: true, draws });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getUpcomingDraw = async (req, res) => {
  try {
    const draw = await Draw.findOne({ status: { $in: ['upcoming', 'simulated'] } }).sort({ year: 1, month: 1 });
    res.json({ success: true, draw });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id).populate('winners.userId', 'name email');
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    res.json({ success: true, draw });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMyWinnings = async (req, res) => {
  try {
    const draws = await Draw.find({ 'winners.userId': req.user._id });
    const winnings = [];
    draws.forEach(d => {
      const w = d.winners.find(w => w.userId?.toString() === req.user._id.toString());
      if (w) winnings.push({ drawId: d._id, month: d.month, year: d.year, title: d.title, ...w.toObject() });
    });
    res.json({ success: true, winnings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ADMIN
exports.adminGetDraws = async (req, res) => {
  try {
    const draws = await Draw.find().sort({ year: -1, month: -1 });
    res.json({ success: true, draws });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createDraw = async (req, res) => {
  try {
    const { month, year, drawType } = req.body;
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const title = `${months[month - 1]} ${year} Draw`;
    const activeCount = await User.countDocuments({ 'subscription.status': 'active' });
    const revenue = activeCount * 15; // £15 avg per subscriber
    const lastRollover = await Draw.findOne({ jackpotRolledOver: true, rolledOverAmount: { $gt: 0 } }).sort({ year: -1, month: -1 });
    const rollover = lastRollover?.rolledOverAmount || 0;
    if (lastRollover) { lastRollover.rolledOverAmount = 0; await lastRollover.save(); }
    const prizePool = calculatePrizePool(revenue, rollover);
    const draw = await Draw.create({ month, year, title, drawType: drawType || 'random', subscriptionRevenue: revenue, activeSubscriberCount: activeCount, prizePool });
    res.status(201).json({ success: true, draw });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.simulateDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    const result = await runDraw(draw, draw.drawType);
    Object.assign(draw, { winningNumbers: result.winningNumbers, winners: result.winners, jackpotRolledOver: result.jackpotRolledOver, rolledOverAmount: result.rolledOverAmount, status: 'simulated' });
    await draw.save();
    res.json({ success: true, draw, stats: result.stats });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.publishDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status === 'published') return res.status(400).json({ success: false, message: 'Already published' });
    if (draw.status === 'upcoming') {
      const result = await runDraw(draw, draw.drawType);
      Object.assign(draw, { winningNumbers: result.winningNumbers, winners: result.winners, jackpotRolledOver: result.jackpotRolledOver, rolledOverAmount: result.rolledOverAmount });
    }
    draw.status = 'published';
    draw.publishedAt = new Date();
    await draw.save();
    for (const w of draw.winners) await User.findByIdAndUpdate(w.userId, { $inc: { totalWon: w.prizeAmount } });
    await User.updateMany({ 'subscription.status': 'active' }, { $inc: { drawsEntered: 1 } });
    res.json({ success: true, draw, message: 'Draw published!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.verifyWinner = async (req, res) => {
  try {
    const { status } = req.body;
    const draw = await Draw.findById(req.params.drawId);
    const winner = draw.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });
    winner.verificationStatus = status;
    await draw.save();
    res.json({ success: true, message: `Winner ${status}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.markPaid = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);
    const winner = draw.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });
    winner.paymentStatus = 'paid';
    winner.paidAt = new Date();
    await draw.save();
    res.json({ success: true, message: 'Marked as paid' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
