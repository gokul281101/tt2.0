const Expense = require('../models/Expense');

exports.getAll = async (req, res) => {
  try {
    const { search, type, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.description = { $regex: search, $options: 'i' };
    if (type) filter.type = type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23, 59, 59); filter.date.$lte = t; }
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    const expense = await Expense.create(body);
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    const Purchase = require('../models/Purchase');
    await Purchase.deleteMany({ expenseId: req.params.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
