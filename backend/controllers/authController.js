const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { notifyNewUser } = require('../bot/notifications');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { fullName, username, phone, countryCode, password, age, email } = req.body;

    const exists = await User.findOne({ $or: [{ username }, { phone }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Username or phone already in use' });
    }

    const user = await User.create({ fullName, username, phone, countryCode, password, age, email });
    const token = signToken(user._id);

    // Notify admin about new user
    try { await notifyNewUser(user); } catch (_) {}

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = username or phone
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Please provide credentials' });

    const user = await User.findOne({
      $or: [{ username: identifier.toLowerCase() }, { phone: identifier }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account is banned' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('favorites');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
