const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, required: true },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'zomato'], default: 'cash' },
  shop: { type: String, default: 'Global' },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);

