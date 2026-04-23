const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');

const canAccessUser = (req, userId) =>
  req.user.role === 'admin' || req.user._id.toString() === userId.toString();

const normalizeUserResponse = (user) => {
  const plain = user.toObject ? user.toObject() : user;
  return {
    ...plain,
    id: plain._id?.toString?.() || plain.id
  };
};

// GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: normalizeUserResponse(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { fullName, username, phone, countryCode, age, email, newPassword } = req.body;
    const updateData = { fullName, username, phone, countryCode, age, email };

    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      updateData.avatar = `data:${req.file.mimetype};base64,${b64}`;
    }
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12);

    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    if (updateData.username || updateData.phone) {
      const duplicateQuery = { _id: { $ne: req.params.id }, $or: [] };
      if (updateData.username) duplicateQuery.$or.push({ username: String(updateData.username).toLowerCase() });
      if (updateData.phone) duplicateQuery.$or.push({ phone: updateData.phone });

      if (duplicateQuery.$or.length) {
        const duplicate = await User.findOne(duplicateQuery);
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'Username or phone already in use' });
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: normalizeUserResponse(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/users/:id/ban  (admin)
exports.banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: req.body.isBanned },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: normalizeUserResponse(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users  (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, users: users.map(normalizeUserResponse) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/:id/favorites/:productId
exports.toggleFavorite = async (req, res) => {
  try {
    if (!canAccessUser(req, req.params.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const product = await Product.findById(req.params.productId).select('_id');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const pid = req.params.productId;
    const idx = user.favorites.findIndex((favorite) => favorite.toString() === pid);
    if (idx === -1) user.favorites.push(product._id);
    else user.favorites.splice(idx, 1);

    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
