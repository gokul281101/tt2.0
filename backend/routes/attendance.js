const express = require('express');
const router = express.Router();
const attendanceCtrl = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

// Staff
router.get('/staff', auth, attendanceCtrl.getAllStaff);
router.post('/staff', auth, attendanceCtrl.createStaff);
router.put('/staff/:id', auth, attendanceCtrl.updateStaff);
router.delete('/staff/:id', auth, attendanceCtrl.removeStaff);

// Attendance
router.get('/', auth, attendanceCtrl.getAttendance);
router.post('/', auth, attendanceCtrl.saveAttendance);
router.get('/salary', auth, attendanceCtrl.getSalaryReport);

// Salaries Payments History
router.post('/salaries/pay', auth, attendanceCtrl.paySalary);
router.get('/salaries/payments', auth, attendanceCtrl.getSalaryPayments);
router.delete('/salaries/payments/:id', auth, attendanceCtrl.deleteSalaryPayment);

module.exports = router;
