const mongoose = require('mongoose');

const SalaryPaymentSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  staffName: { type: String, required: true },
  monthKey: { type: String, required: true }, // "YYYY-MM"
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'zomato'], default: 'cash' },
  paidDate: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { timestamps: true });

// Prevent duplicate salary dispatches for same staff in same month
SalaryPaymentSchema.index({ staffId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('SalaryPayment', SalaryPaymentSchema);
