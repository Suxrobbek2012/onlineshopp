const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/categories', ctrl.getCategories);
router.get('/', ctrl.getProducts);
router.get('/:id', ctrl.getProduct);
router.post('/', protect, adminOnly, upload.single('image'), ctrl.createProduct);
router.put('/:id', protect, adminOnly, upload.single('image'), ctrl.updateProduct);
router.delete('/:id', protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
