const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true }
}, { timestamps: true });

// Combine staffId and date to be unique so there is only one entry per employee per day
AttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
