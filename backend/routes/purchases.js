const router = require('express').Router();
const { getAll, create, update, remove, getSummary } = require('../controllers/purchaseController');
const protect = require('../middleware/auth');
router.get('/summary', protect, getSummary);
router.route('/').get(protect, getAll).post(protect, create);
router.route('/:id').put(protect, update).delete(protect, remove);
module.exports = router;
