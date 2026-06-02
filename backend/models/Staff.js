const mongoose = require('mongoose');

const WageHistorySchema = new mongoose.Schema({
  dailyWage: { type: Number, required: true, min: 0 },
  effectiveDate: { type: Date, required: true }
}, { _id: false });

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dailyWage: { type: Number, required: true, min: 0 },
  wageHistory: { type: [WageHistorySchema], default: [] }
}, { timestamps: true });

// Pre-save hook to ensure wageHistory has at least one entry matching the dailyWage
StaffSchema.pre('save', function(next) {
  if (!this.wageHistory || this.wageHistory.length === 0) {
    this.wageHistory = [{
      dailyWage: this.dailyWage,
      effectiveDate: new Date(0)
    }];
  }
  next();
});

module.exports = mongoose.model('Staff', StaffSchema);


