const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const SalaryPayment = require('../models/SalaryPayment');

function getDailyWageForDate(staff, date) {
  if (!staff.wageHistory || staff.wageHistory.length === 0) {
    return staff.dailyWage;
  }
  const sortedHistory = [...staff.wageHistory].sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));
  let activeWage = staff.dailyWage;
  
  if (sortedHistory.length > 0) {
    activeWage = sortedHistory[0].dailyWage;
  }

  for (let entry of sortedHistory) {
    const effDate = new Date(entry.effectiveDate);
    effDate.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);
    if (effDate <= targetDate) {
      activeWage = entry.dailyWage;
    } else {
      break;
    }
  }
  return activeWage;
}


// Staff Management
exports.getAllStaff = async (req, res) => {
  try {
    const data = await Staff.find({}).sort({ name: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, dailyWage, wageHistory } = req.body;
    const history = wageHistory || [
      {
        dailyWage: parseFloat(dailyWage),
        effectiveDate: new Date(0)
      }
    ];
    const data = await Staff.create({
      name,
      dailyWage: parseFloat(dailyWage),
      wageHistory: history
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const { name, dailyWage, wageHistory } = req.body;

    if (name !== undefined) staff.name = name;

    if (dailyWage !== undefined && parseFloat(dailyWage) !== staff.dailyWage) {
      const wageVal = parseFloat(dailyWage);
      let effDate;
      if (req.body.effectiveDate) {
        const [yr, mo, dy] = req.body.effectiveDate.split('-').map(Number);
        effDate = new Date(Date.UTC(yr, mo - 1, dy));
      } else {
        effDate = new Date();
        effDate.setUTCHours(0, 0, 0, 0);
      }

      const existingIdx = staff.wageHistory.findIndex(entry => {
        const entryDate = new Date(entry.effectiveDate);
        entryDate.setUTCHours(0, 0, 0, 0);
        return entryDate.getTime() === effDate.getTime();
      });

      if (existingIdx > -1) {
        staff.wageHistory[existingIdx].dailyWage = wageVal;
      } else {
        staff.wageHistory.push({
          dailyWage: wageVal,
          effectiveDate: effDate
        });
      }
      staff.dailyWage = wageVal;
    }

    if (wageHistory !== undefined) {
      staff.wageHistory = wageHistory;
      if (wageHistory.length > 0) {
        const sorted = [...wageHistory].sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));
        staff.dailyWage = sorted[sorted.length - 1].dailyWage;
      }
    }

    await staff.save();
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.removeStaff = async (req, res) => {
  try {
    const data = await Staff.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Staff member not found' });
    // Also remove their attendance records
    await Attendance.deleteMany({ staffId: req.params.id });
    // Also remove their salary payments
    const SalaryPayment = require('../models/SalaryPayment');
    await SalaryPayment.deleteMany({ staffId: req.params.id });
    res.json({ success: true, message: 'Staff, attendance, and salary payment data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Attendance Management
exports.getAttendance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) {
        const [yr, mo, dy] = from.split('-').map(Number);
        filter.date.$gte = new Date(Date.UTC(yr, mo - 1, dy));
      }
      if (to) {
        const [yr, mo, dy] = to.split('-').map(Number);
        filter.date.$lte = new Date(Date.UTC(yr, mo - 1, dy, 23, 59, 59, 999));
      }
    }
    const data = await Attendance.find(filter).populate('staffId').sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const { staffId, date, status } = req.body;
    if (!staffId || !date || !status) {
      return res.status(400).json({ success: false, message: 'staffId, date, and status are required' });
    }

    // Parse as YYYY-MM-DD to avoid timezone shifting and store as UTC midnight
    const [yr, mo, dy] = date.split('-').map(Number);
    const attendanceDate = new Date(Date.UTC(yr, mo - 1, dy));

    // Upsert the attendance record
    const record = await Attendance.findOneAndUpdate(
      { staffId, date: attendanceDate },
      { status },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getSalaryReport = async (req, res) => {
  try {
    const { monthKey } = req.query; // Expects 'YYYY-MM'
    if (!monthKey) {
      return res.status(400).json({ success: false, message: 'monthKey query parameter (YYYY-MM) is required' });
    }

    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const staffList = await Staff.find({}).sort({ name: 1 });
    const report = [];

    for (let s of staffList) {
      const attendanceList = await Attendance.find({
        staffId: s._id,
        date: { $gte: start, $lt: end }
      });

      let presentCount = 0;
      let halfDayCount = 0;
      let absentCount = 0;
      let calculatedSalary = 0;

      for (let att of attendanceList) {
        if (att.status === 'present') {
          presentCount++;
          calculatedSalary += getDailyWageForDate(s, att.date);
        } else if (att.status === 'half-day') {
          halfDayCount++;
          calculatedSalary += getDailyWageForDate(s, att.date) * 0.5;
        } else if (att.status === 'absent') {
          absentCount++;
        }
      }

      report.push({
        staff: s,
        presentDays: presentCount,
        halfDays: halfDayCount,
        absentDays: absentCount,
        calculatedSalary: calculatedSalary
      });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Salary Payments
exports.paySalary = async (req, res) => {
  try {
    const { staffId, staffName, monthKey, amount, paymentMethod, paidDate, note } = req.body;
    if (!staffId || !staffName || !monthKey || !amount) {
      return res.status(400).json({ success: false, message: 'staffId, staffName, monthKey, and amount are required' });
    }

    // Check if salary already paid for this staff in this month
    const existing = await SalaryPayment.findOne({ staffId, monthKey });
    if (existing) {
      return res.status(400).json({ success: false, message: `Salary for ${staffName} has already been paid for ${monthKey}` });
    }

    const payment = await SalaryPayment.create({
      staffId,
      staffName,
      monthKey,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'cash',
      paidDate: paidDate ? new Date(paidDate) : new Date(),
      note: note || ''
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getSalaryPayments = async (req, res) => {
  try {
    const { monthKey } = req.query;
    const filter = {};
    if (monthKey) filter.monthKey = monthKey;

    const data = await SalaryPayment.find(filter).sort({ paidDate: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSalaryPayment = async (req, res) => {
  try {
    const payment = await SalaryPayment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Salary payment not found' });
    res.json({ success: true, message: 'Salary payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.migrateAttendanceDates = async () => {
  try {
    const Staff = require('../models/Staff');
    const Attendance = require('../models/Attendance');
    const records = await Attendance.find({});
    console.log(`[Migration] Checking ${records.length} attendance records for timezone normalization...`);

    let migratedCount = 0;
    let deletedCount = 0;

    for (let record of records) {
      if (!record.date) continue;
      const dateObj = new Date(record.date);
      // Convert to Asia/Kolkata local date string YYYY-MM-DD
      const localDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      
      // Construct the canonical UTC midnight date
      const [yr, mo, dy] = localDateStr.split('-').map(Number);
      const canonicalDate = new Date(Date.UTC(yr, mo - 1, dy));

      if (record.date.getTime() !== canonicalDate.getTime()) {
        // Check if there is already a record for this staff and canonical date
        const existing = await Attendance.findOne({
          staffId: record.staffId,
          date: canonicalDate
        });

        if (existing) {
          console.log(`[Migration] Duplicate found for staff ${record.staffId} on ${localDateStr}. Deleting duplicate record.`);
          await Attendance.deleteOne({ _id: record._id });
          deletedCount++;
        } else {
          console.log(`[Migration] Migrating record ${record._id} from ${record.date.toISOString()} to ${canonicalDate.toISOString()}`);
          record.date = canonicalDate;
          await record.save();
          migratedCount++;
        }
      }
    }
    console.log(`[Migration] Done. Migrated: ${migratedCount}, Deleted duplicates: ${deletedCount}`);
  } catch (err) {
    console.error('[Migration] Failed during database self-healing:', err);
  }
};
