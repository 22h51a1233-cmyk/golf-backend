const User = require('../models/User');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');

exports.getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter['subscription.status'] = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).populate('selectedCharity', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit);
    res.json({ success: true, users, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('selectedCharity', 'name logo');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, scores, selectedCharity, charityPercentage, subscriptionStatus } = req.body;
    const upd = {};
    if (name) upd.name = name;
    if (email) upd.email = email;
    if (scores) upd.scores = scores;
    if (selectedCharity !== undefined) upd.selectedCharity = selectedCharity;
    if (charityPercentage) upd.charityPercentage = charityPercentage;
    if (subscriptionStatus) upd['subscription.status'] = subscriptionStatus;
    const user = await User.findByIdAndUpdate(req.params.id, upd, { new: true });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'subscriber' });
    const activeSubscribers = await User.countDocuments({ 'subscription.status': 'active' });
    const monthlyPlans = await User.countDocuments({ 'subscription.plan': 'monthly', 'subscription.status': 'active' });
    const yearlyPlans = await User.countDocuments({ 'subscription.plan': 'yearly', 'subscription.status': 'active' });
    const draws = await Draw.find({ status: { $in: ['published', 'completed'] } });
    const totalRevenue = draws.reduce((s, d) => s + d.subscriptionRevenue, 0);
    const totalCharityContributions = totalRevenue * 0.1;
    const totalPrizesAwarded = draws.reduce((s, d) => s + d.prizePool.total, 0);
    const totalWinners = draws.reduce((s, d) => s + d.winners.length, 0);

    const charityStats = await User.aggregate([
      { $match: { selectedCharity: { $ne: null } } },
      { $group: { _id: '$selectedCharity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
      { $lookup: { from: 'charities', localField: '_id', foreignField: '_id', as: 'charity' } },
      { $unwind: '$charity' },
      { $project: { name: '$charity.name', count: 1 } },
    ]);

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, analytics: { totalUsers, activeSubscribers, monthlyPlans, yearlyPlans, totalRevenue, totalCharityContributions, totalPrizesAwarded, totalDraws: draws.length, totalWinners, charityStats, monthlyGrowth } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAllWinners = async (req, res) => {
  try {
    const draws = await Draw.find({ 'winners.0': { $exists: true } }).populate('winners.userId', 'name email').sort({ year: -1, month: -1 });
    const winners = [];
    draws.forEach(d => d.winners.forEach(w => winners.push({
      drawId: d._id, drawTitle: d.title, month: d.month, year: d.year,
      user: w.userId, matchType: w.matchType, prizeAmount: w.prizeAmount,
      verificationStatus: w.verificationStatus, paymentStatus: w.paymentStatus,
      proofUrl: w.proofUrl, winnerId: w._id,
    })));
    res.json({ success: true, winners });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
