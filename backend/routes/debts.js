const express = require('express');
const router = express.Router();
const debtCtrl = require('../controllers/debtController');
const auth = require('../middleware/auth');

router.get('/', auth, debtCtrl.getAll);
router.post('/', auth, debtCtrl.create);
router.put('/:id', auth, debtCtrl.update);
router.delete('/:id', auth, debtCtrl.remove);
router.post('/:id/pay', auth, debtCtrl.pay);
router.delete('/:id/payments/:paymentId', auth, debtCtrl.deletePayment);

module.exports = router;
