const express = require('express');
const router = express.Router();
const { authUser, getUserProfile } = require('../controllers/authController');
const protect = require('../middleware/auth');

router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
