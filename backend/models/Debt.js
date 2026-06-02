const mongoose = require('mongoose');

const DebtPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  description: { type: String, default: 'Partial Payment' },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'zomato'], default: 'cash' }
});

const DebtSchema = new mongoose.Schema({
  debtName: { type: String, required: true },
  creditorName: { type: String, required: true },
  originalAmount: { type: Number, required: true, min: 0 },
  remainingAmount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  payments: [DebtPaymentSchema],
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Debt', DebtSchema);
