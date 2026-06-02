const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  pricePerUnit: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true },
  vendorName: { type: String, default: '' },
  category: { type: String, default: 'General' },
  shop: { type: String, default: 'Global' },
  purchaseDate: { type: Date, default: Date.now },
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);
