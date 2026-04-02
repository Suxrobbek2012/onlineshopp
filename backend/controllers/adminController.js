const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const News = require('../models/News');
const Coupon = require('../models/Coupon');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.find().select('finalPrice status')
    ]);

    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.finalPrice, 0);

    const ordersByStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, stats: { totalUsers, totalProducts, totalOrders, revenue: +revenue.toFixed(2), ordersByStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Coupon management
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Validate coupon (public)
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon || (coupon.expiresAt && coupon.expiresAt < new Date()) || coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }
    res.json({ success: true, discount: coupon.discount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
