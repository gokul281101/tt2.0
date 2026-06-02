const Purchase = require('../models/Purchase');

exports.getAll = async (req, res) => {
  try {
    const { search, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.productName = { $regex: search, $options: 'i' };
    if (from || to) {
      filter.purchaseDate = {};
      if (from) filter.purchaseDate.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23, 59, 59); filter.purchaseDate.$lte = t; }
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Purchase.find(filter).sort({ purchaseDate: -1 }).skip(skip).limit(Number(limit)),
      Purchase.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    body.shop = 'Global';
    body.totalAmount = parseFloat(body.quantity) * parseFloat(body.pricePerUnit);
    const purchase = await Purchase.create(body);
    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const body = req.body;
    if (body.quantity && body.pricePerUnit) body.totalAmount = body.quantity * body.pricePerUnit;
    const p = await Purchase.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json({ success: true, data: p });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/purchases/summary — product-wise aggregation
exports.getSummary = async (req, res) => {
  try {
    const summary = await Purchase.aggregate([
      { $group: {
        _id: '$productName',
        timesBought: { $sum: 1 },
        totalQty: { $sum: '$quantity' },
        totalSpent: { $sum: '$totalAmount' },
        unit: { $first: '$unit' },
        lastPurchase: { $max: '$purchaseDate' },
      }},
      { $sort: { totalSpent: -1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
