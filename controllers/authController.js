const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const userResponse = (user) => ({
  _id: user._id, name: user.name, email: user.email, role: user.role,
  avatar: user.avatar, subscription: user.subscription, scores: user.scores,
  selectedCharity: user.selectedCharity, charityPercentage: user.charityPercentage,
  totalWon: user.totalWon, drawsEntered: user.drawsEntered,
});

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, token: generateToken(user._id), user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password').populate('selectedCharity', 'name logo');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, token: generateToken(user._id), user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('selectedCharity', 'name logo description');
    res.json({ success: true, user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, charityPercentage, selectedCharity } = req.body;
    const upd = {};
    if (name) upd.name = name;
    if (charityPercentage) upd.charityPercentage = charityPercentage;
    if (selectedCharity !== undefined) upd.selectedCharity = selectedCharity || null;
    const user = await User.findByIdAndUpdate(req.user._id, upd, { new: true })
      .populate('selectedCharity', 'name logo');
    res.json({ success: true, user: userResponse(user) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
