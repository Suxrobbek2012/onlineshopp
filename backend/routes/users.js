const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, adminOnly, ctrl.getAllUsers);
router.get('/:id', protect, ctrl.getUser);
router.put('/:id', protect, upload.single('avatar'), ctrl.updateUser);
router.delete('/:id', protect, ctrl.deleteUser);
router.put('/:id/ban', protect, adminOnly, ctrl.banUser);
router.post('/:id/favorites/:productId', protect, ctrl.toggleFavorite);

module.exports = router;
