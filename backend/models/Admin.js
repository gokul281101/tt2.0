const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  password: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
