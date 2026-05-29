const Commitment = require('../models/Commitment');
const CommitmentPayment = require('../models/CommitmentPayment');

// GET /api/commitments?monthKey=2024-05
exports.getAll = async (req, res) => {
  try {
    const { monthKey } = req.query;
    const shop = req.headers['x-shop'] || 'Shop 1';
    const commitments = await Commitment.find({ isActive: true, shop }).sort({ dueDay: 1 });
    let payments = [];
    if (monthKey) {
      payments = await CommitmentPayment.find({ monthKey });
    }
    const paidMap = {};
    payments.forEach(p => { paidMap[p.commitmentId.toString()] = p; });
    const data = commitments.map(c => ({
      ...c.toObject(),
      payment: paidMap[c._id.toString()] || null,
      isPaid: !!paidMap[c._id.toString()],
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    body.shop = req.headers['x-shop'] || 'Shop 1';
    const c = await Commitment.create(body);
    res.status(201).json({ success: true, data: c });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const c = await Commitment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: c });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Commitment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/commitments/:id/pay
exports.markPaid = async (req, res) => {
  try {
    const { monthKey, paidAmount, paymentMethod, paidDate, note } = req.body;
    const payment = await CommitmentPayment.findOneAndUpdate(
      { commitmentId: req.params.id, monthKey },
      { commitmentId: req.params.id, monthKey, paidAmount, paymentMethod, paidDate, note },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/commitments/:id/history
exports.getPaymentHistory = async (req, res) => {
  try {
    const history = await CommitmentPayment.find({ commitmentId: req.params.id }).sort({ monthKey: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
