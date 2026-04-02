const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, ctrl.getOrders);
router.post('/', protect, ctrl.placeOrder);
router.put('/:id', protect, adminOnly, ctrl.updateOrderStatus);

module.exports = router;
