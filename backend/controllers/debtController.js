const Debt = require('../models/Debt');

exports.getAll = async (req, res) => {
  try {
    const data = await Debt.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    body.remainingAmount = body.originalAmount;
    const debt = await Debt.create(body);
    res.status(201).json({ success: true, data: debt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!debt) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: debt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.pay = async (req, res) => {
  try {
    const { amount, date, description, paymentMethod } = req.body;
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ success: false, message: 'Debt record not found' });

    const payAmount = parseFloat(amount);
    debt.payments.push({
      amount: payAmount,
      date: date ? new Date(date) : new Date(),
      description: description || 'Partial Payment',
      paymentMethod: paymentMethod || 'cash'
    });
    debt.remainingAmount = Math.round(Math.max(0, debt.remainingAmount - payAmount) * 100) / 100;
    
    if (debt.remainingAmount <= 0) {
      debt.status = 'paid';
    }

    await debt.save();
    res.json({ success: true, data: debt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const debt = await Debt.findById(id);
    if (!debt) return res.status(404).json({ success: false, message: 'Debt record not found' });

    const payment = debt.payments.id(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    debt.payments.pull(paymentId);

    const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    debt.remainingAmount = Math.round(Math.max(0, debt.originalAmount - totalPaid) * 100) / 100;

    if (debt.remainingAmount > 0) {
      debt.status = 'pending';
    } else {
      debt.status = 'paid';
    }

    await debt.save();
    res.json({ success: true, data: debt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

