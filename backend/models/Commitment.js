const mongoose = require('mongoose');

const CommitmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: '🏪' },
  amount: { type: Number, required: true, min: 0 },
  dueDay: { type: Number, required: true, min: 1, max: 31 },
  color: { type: String, default: '#7c3aed' },
  isActive: { type: Boolean, default: true },
  shop: { type: String, default: 'Global' },
}, { timestamps: true });

module.exports = mongoose.model('Commitment', CommitmentSchema);
