const PersonalExpense = require('../models/PersonalExpense');

exports.getAll = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59);
        filter.date.$lte = t;
      }
    }
    const data = await PersonalExpense.find(filter).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await PersonalExpense.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const exp = await PersonalExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exp) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: exp });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const exp = await PersonalExpense.findByIdAndDelete(req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
