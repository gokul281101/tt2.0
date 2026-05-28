const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
