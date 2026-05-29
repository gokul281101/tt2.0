const Income = require('../models/Income');

// GET /api/income
exports.getAll = async (req, res) => {
  try {
    const { search, method, from, to, page = 1, limit = 20 } = req.query;
    const shop = req.headers['x-shop'] || 'Shop 1';
    const filter = { shop };
    if (search) filter.description = { $regex: search, $options: 'i' };
    if (method) filter.paymentMethod = method;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23, 59, 59); filter.date.$lte = t; }
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Income.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Income.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/income
exports.create = async (req, res) => {
  try {
    const body = req.body;
    body.shop = req.headers['x-shop'] || 'Shop 1';
    const income = await Income.create(body);
    res.status(201).json({ success: true, data: income });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/income/:id
exports.update = async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!income) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: income });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/income/:id
exports.remove = async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);
    if (!income) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
