const mongoose = require('mongoose');

const PartialPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'zomato'], default: 'cash' },
  paidDate: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: true, timestamps: false });

const CommitmentPaymentSchema = new mongoose.Schema({
  commitmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commitment', required: true },
  monthKey: { type: String, required: true }, // "YYYY-MM"
  // paidAmount is the SUM of all partialPayments for backward-compat reads
  paidAmount: { type: Number, required: true, default: 0 },
  // Keep top-level fields for backward compatibility (last payment method/date/note)
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'zomato'], default: 'cash' },
  paidDate: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  // Array of individual partial installments
  partialPayments: { type: [PartialPaymentSchema], default: [] },
}, { timestamps: true });

CommitmentPaymentSchema.index({ commitmentId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('CommitmentPayment', CommitmentPaymentSchema);
