const express = require('express');
const router = express.Router();
const personalCtrl = require('../controllers/personalExpenseController');
const auth = require('../middleware/auth');

router.get('/', auth, personalCtrl.getAll);
router.post('/', auth, personalCtrl.create);
router.put('/:id', auth, personalCtrl.update);
router.delete('/:id', auth, personalCtrl.remove);

module.exports = router;
