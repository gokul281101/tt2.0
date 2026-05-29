const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  pricePerUnit: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true },
  vendorName: { type: String, default: '' },
  category: { type: String, default: 'General' },
  shop: { type: String, default: 'Shop 1', enum: ['Shop 1', 'Shop 2'] },
  purchaseDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);
