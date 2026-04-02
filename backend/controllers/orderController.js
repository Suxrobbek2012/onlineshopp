const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { notifyOrderPlaced, notifyOrderStatus, notifyLowStock } = require('../bot/notifications');

// GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const orders = await Order.find(filter).populate('user', 'fullName username').sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders
exports.placeOrder = async (req, res) => {
  try {
    const { promoCode, shippingAddress, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Build order items
    const items = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.finalPrice || item.product.price,
      quantity: item.quantity
    }));

    let totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let discountAmount = 0;

    // Apply promo code
    if (promoCode) {
      const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && coupon.usedCount < coupon.maxUses) {
        discountAmount = +(totalPrice * coupon.discount / 100).toFixed(2);
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const finalPrice = +(totalPrice - discountAmount).toFixed(2);

    const order = await Order.create({
      user: req.user._id,
      items,
      totalPrice: +totalPrice.toFixed(2),
      promoCode: promoCode || '',
      discount: discountAmount,
      finalPrice,
      shippingAddress,
      notes
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    // Reduce stock & check low stock
    for (const item of order.items) {
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        await prod.save();
        if (prod.stock <= 3) {
          try { await notifyLowStock(prod); } catch (_) {}
        }
      }
    }

    // Telegram notification
    try { await notifyOrderPlaced(req.user, order); } catch (_) {}

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/orders/:id  (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('user', 'fullName telegramId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Telegram notification
    try { await notifyOrderStatus(order); } catch (_) {}

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
