const Charity = require('../models/Charity');

exports.getCharities = async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const charities = await Charity.find(filter).sort({ isFeatured: -1, name: 1 });
    res.json({ success: true, charities });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getCharity = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });
    res.json({ success: true, charity });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createCharity = async (req, res) => {
  try {
    const charity = await Charity.create(req.body);
    res.status(201).json({ success: true, charity });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateCharity = async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!charity) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, charity });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.deleteCharity = async (req, res) => {
  try {
    await Charity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Charity deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
