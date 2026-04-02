const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username min 3 chars'),
  body('phone').trim().notEmpty().withMessage('Phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Valid age required'),
  validate
], ctrl.register);

router.post('/login', ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.get('/me', protect, ctrl.getMe);

module.exports = router;
