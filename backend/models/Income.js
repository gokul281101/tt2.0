const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'card'], default: 'cash' },
  category: { type: String, default: 'Full Day Income' },
  shop: { type: String, default: 'Shop 1', enum: ['Shop 1', 'Shop 2'] },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Income', IncomeSchema);
