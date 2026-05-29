const mongoose = require('mongoose');

const CommitmentPaymentSchema = new mongoose.Schema({
  commitmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commitment', required: true },
  monthKey: { type: String, required: true }, // "YYYY-MM"
  paidAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'gpay', 'card'], default: 'cash' },
  paidDate: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { timestamps: true });

CommitmentPaymentSchema.index({ commitmentId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('CommitmentPayment', CommitmentPaymentSchema);
