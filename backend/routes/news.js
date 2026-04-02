const router = require('express').Router();
const ctrl = require('../controllers/newsController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.getNews);
router.get('/:id', ctrl.getNewsById);
router.post('/', protect, adminOnly, upload.single('image'), ctrl.createNews);
router.put('/:id', protect, adminOnly, upload.single('image'), ctrl.updateNews);
router.delete('/:id', protect, adminOnly, ctrl.deleteNews);

module.exports = router;
