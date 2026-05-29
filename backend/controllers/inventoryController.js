const Inventory = require('../models/Inventory');

exports.getAll = async (req, res) => {
  try {
    const { search, lowStock } = req.query;
    const shop = req.headers['x-shop'] || 'Shop 1';
    const filter = { shop };
    if (search) filter.productName = { $regex: search, $options: 'i' };
    if (lowStock === 'true') filter.$expr = { $lte: ['$remainingQty', '$minStockLevel'] };
    const data = await Inventory.find(filter).sort({ productName: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    body.shop = req.headers['x-shop'] || 'Shop 1';
    body.remainingQty = (body.availableQty || 0) + (body.purchasedQty || 0) - (body.usedQty || 0);
    body.lastUpdated = new Date();
    const item = await Inventory.create(body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const body = req.body;
    if (body.availableQty !== undefined || body.purchasedQty !== undefined || body.usedQty !== undefined) {
      const existing = await Inventory.findById(req.params.id);
      const avail = body.availableQty ?? existing.availableQty;
      const purch = body.purchasedQty ?? existing.purchasedQty;
      const used = body.usedQty ?? existing.usedQty;
      body.remainingQty = avail + purch - used;
    }
    body.lastUpdated = new Date();
    const item = await Inventory.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
