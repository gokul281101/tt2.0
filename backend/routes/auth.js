const router = require('express').Router();
const { login, getMe, updatePassword, resetDatabase, seedDatabase } = require('../controllers/authController');
const protect = require('../middleware/auth');
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.post('/reset', protect, resetDatabase);
router.post('/seed', protect, seedDatabase);
module.exports = router;
