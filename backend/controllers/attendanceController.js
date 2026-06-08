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
    effDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
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
      const effDate = req.body.effectiveDate ? new Date(req.body.effectiveDate) : new Date();
      effDate.setHours(0, 0, 0, 0);

      const existingIdx = staff.wageHistory.findIndex(entry => {
        const entryDate = new Date(entry.effectiveDate);
        entryDate.setHours(0, 0, 0, 0);
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
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59);
        filter.date.$lte = t;
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

    const attendanceDate = new Date(date);
    // Reset date to midnight to make uniform day comparison
    attendanceDate.setHours(0, 0, 0, 0);

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
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

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
