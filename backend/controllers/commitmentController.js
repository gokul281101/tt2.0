const Commitment = require('../models/Commitment');
const CommitmentPayment = require('../models/CommitmentPayment');

// GET /api/commitments?monthKey=2024-05
exports.getAll = async (req, res) => {
  try {
    const { monthKey } = req.query;
    const commitments = await Commitment.find({ isActive: true }).sort({ dueDay: 1 });
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
    body.shop = 'Global';
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

// POST /api/commitments/:id/pay  — adds one partial-payment installment
exports.markPaid = async (req, res) => {
  try {
    const { monthKey, paidAmount, paymentMethod, paidDate, note } = req.body;

    // Build the new partial-payment sub-doc
    const partial = { amount: parseFloat(paidAmount), paymentMethod, paidDate, note: note || '' };

    // Upsert the parent doc and push the partial
    let payment = await CommitmentPayment.findOne({ commitmentId: req.params.id, monthKey });

    if (!payment) {
      payment = new CommitmentPayment({
        commitmentId: req.params.id,
        monthKey,
        paidAmount: partial.amount,
        paymentMethod,
        paidDate,
        note: note || '',
        partialPayments: [partial],
      });
    } else {
      payment.partialPayments.push(partial);
      // Recalculate cumulative total
      payment.paidAmount = payment.partialPayments.reduce((s, p) => s + p.amount, 0);
      // Update top-level convenience fields with latest payment info
      payment.paymentMethod = paymentMethod;
      payment.paidDate = paidDate;
      payment.note = note || '';
    }

    await payment.save();
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/commitments/:id/pay/:partialId  — removes one partial-payment installment
exports.deletePartialPayment = async (req, res) => {
  try {
    const { id, partialId } = req.params;
    const { monthKey } = req.query;

    const payment = await CommitmentPayment.findOne({ commitmentId: id, monthKey });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const before = payment.partialPayments.length;
    payment.partialPayments.pull(partialId);
    if (payment.partialPayments.length === before) {
      return res.status(404).json({ success: false, message: 'Partial payment not found' });
    }

    if (payment.partialPayments.length === 0) {
      // No more partials — delete the entire payment record
      await payment.deleteOne();
      return res.json({ success: true, data: null });
    }

    payment.paidAmount = payment.partialPayments.reduce((s, p) => s + p.amount, 0);
    await payment.save();
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

