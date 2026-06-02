const mongoose = require('mongoose');

const PersonalExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, enum: ['Home', 'Personal Use'], required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'zomato'], default: 'cash' }
}, { timestamps: true });

module.exports = mongoose.model('PersonalExpense', PersonalExpenseSchema);
