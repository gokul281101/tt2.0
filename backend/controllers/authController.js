const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/password
exports.updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset
exports.resetDatabase = async (req, res) => {
  try {
    const Income = require('../models/Income');
    const Expense = require('../models/Expense');
    const Purchase = require('../models/Purchase');
    const CommitmentPayment = require('../models/CommitmentPayment');
    const PersonalExpense = require('../models/PersonalExpense');
    const Debt = require('../models/Debt');
    const Attendance = require('../models/Attendance');

    await Promise.all([
      Income.deleteMany(),
      Expense.deleteMany(),
      Purchase.deleteMany(),
      CommitmentPayment.deleteMany(),
      PersonalExpense.deleteMany(),
      Debt.deleteMany(),
      Attendance.deleteMany()
    ]);

    res.json({ success: true, message: 'Database reset completed! Cleared all transaction logs.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/seed
exports.seedDatabase = async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    
    exec(`node "${path.join(__dirname, '..', 'seed.js')}"`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ success: false, message: 'Seeding failed: ' + error.message });
      }
      res.json({ success: true, message: 'Database seeded successfully with sample records!' });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
