const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/expenseController');
const protect = require('../middleware/auth');
router.route('/').get(protect, getAll).post(protect, create);
router.route('/:id').put(protect, update).delete(protect, remove);
module.exports = router;
