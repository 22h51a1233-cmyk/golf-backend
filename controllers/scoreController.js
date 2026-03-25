const User = require('../models/User');

exports.getScores = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('scores');
    const scores = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.addScore = async (req, res) => {
  try {
    const { score, date } = req.body;
    if (!score || score < 1 || score > 45)
      return res.status(400).json({ success: false, message: 'Score must be 1-45 (Stableford)' });
    const user = await User.findById(req.user._id);
    user.addScore(Number(score), new Date(date || Date.now()));
    await user.save();
    const scores = [...user.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores, message: 'Score added' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateScore = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const entry = user.scores.id(req.params.scoreId);
    if (!entry) return res.status(404).json({ success: false, message: 'Score not found' });
    if (req.body.score) entry.score = Number(req.body.score);
    if (req.body.date) entry.date = new Date(req.body.date);
    user.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (user.scores.length > 5) user.scores = user.scores.slice(0, 5);
    await user.save();
    res.json({ success: true, scores: user.scores, message: 'Score updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteScore = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.scores = user.scores.filter(s => s._id.toString() !== req.params.scoreId);
    await user.save();
    res.json({ success: true, scores: user.scores, message: 'Score deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
