const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  productName: { type: String, required: true },
  unit: { type: String, default: 'kg' },
  availableQty: { type: Number, default: 0 },
  purchasedQty: { type: Number, default: 0 },
  usedQty: { type: Number, default: 0 },
  remainingQty: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  category: { type: String, default: 'General' },
  isWanted: { type: Boolean, default: false },
  shop: { type: String, default: 'Shop 1', enum: ['Shop 1', 'Shop 2'] },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
