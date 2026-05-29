const router = require('express').Router();
const { getAll, create, update, remove, markPaid, getPaymentHistory } = require('../controllers/commitmentController');
const protect = require('../middleware/auth');
router.route('/').get(protect, getAll).post(protect, create);
router.route('/:id').put(protect, update).delete(protect, remove);
router.post('/:id/pay', protect, markPaid);
router.get('/:id/history', protect, getPaymentHistory);
module.exports = router;
