const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.getCart);
router.post('/', protect, ctrl.addToCart);
router.put('/:itemId', protect, ctrl.updateCartItem);
router.delete('/:itemId', protect, ctrl.removeCartItem);

module.exports = router;
