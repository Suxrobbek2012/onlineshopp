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

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // O'chirilgan mahsulotlarni savatchadan tozala
    const validItems = cart.items.filter(item => item.product && item.product._id);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }
    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Stock tekshiruvi (ixtiyoriy — stock 0 bo'lsa ham buyurtma qabul qilinadi)
    // for (const item of validItems) {
    //   if (item.quantity > item.product.stock) { ... }
    // }

    const items = validItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.finalPrice || item.product.price,
      quantity: item.quantity
    }));

    const totalPrice = +items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    let discountAmount = 0;

    if (promoCode) {
      const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && coupon.usedCount < coupon.maxUses) {
        discountAmount = +(totalPrice * coupon.discount / 100).toFixed(2);
      }
    }

    const finalPrice = +(totalPrice - discountAmount).toFixed(2);

    const order = await Order.create({
      user: req.user._id,
      items,
      totalPrice,
      promoCode: promoCode || '',
      discount: discountAmount,
      finalPrice,
      shippingAddress,
      notes
    });

    cart.items = [];
    await cart.save();

    if (promoCode) {
      await Coupon.updateOne(
        {
          code: promoCode.toUpperCase(),
          isActive: true,
          $expr: { $lt: ['$usedCount', '$maxUses'] }
        },
        { $inc: { usedCount: 1 } }
      );
    }

    const lowStockProducts = [];
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();

      if (product.stock <= 3) lowStockProducts.push(product);
    }

    await Promise.all(lowStockProducts.map(async (product) => {
      try { await notifyLowStock(product); } catch (_) {}
    }));

    try { await notifyOrderPlaced(req.user, order); } catch (_) {}

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/orders/:id  (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('user', 'fullName username telegramId');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    try { await notifyOrderStatus(order); } catch (_) {}

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
