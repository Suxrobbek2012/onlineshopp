const Product = require('../models/Product');

const coerceBoolean = (value) => value === true || value === 'true' || value === 'on';

const buildProductPayload = (body) => {
  const data = { ...body };

  ['price', 'discount', 'stock', 'rating', 'reviewCount'].forEach((field) => {
    if (data[field] !== undefined && data[field] !== '') data[field] = Number(data[field]);
  });

  ['isFeatured', 'isOnSale'].forEach((field) => {
    if (data[field] !== undefined) data[field] = coerceBoolean(data[field]);
  });

  if (typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  Object.keys(data).forEach((key) => {
    if (data[key] === '' || data[key] === undefined) delete data[key];
  });

  return data;
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, rating, search, sort, featured, sale, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = { $regex: category, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (rating) filter.rating = { $gte: Number(rating) };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
    if (featured === 'true') filter.isFeatured = true;
    if (sale === 'true') filter.isOnSale = true;

    const sortMap = {
      newest: '-createdAt',
      oldest: 'createdAt',
      price_asc: 'price',
      price_desc: '-price',
      popular: '-reviewCount',
      rating: '-rating'
    };
    const sortBy = sortMap[sort] || '-createdAt';

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const skip = (numericPage - 1) * numericLimit;
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(numericLimit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page: numericPage,
      pages: Math.ceil(total / numericLimit),
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products  (admin)
exports.createProduct = async (req, res) => {
  try {
    const data = buildProductPayload(req.body);
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      data.image = `data:${req.file.mimetype};base64,${b64}`;
    } else if (req.body.imageUrl) {
      data.image = req.body.imageUrl;
    }
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id  (admin)
exports.updateProduct = async (req, res) => {
  try {
    const data = buildProductPayload(req.body);
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      data.image = `data:${req.file.mimetype};base64,${b64}`;
    } else if (req.body.imageUrl) {
      data.image = req.body.imageUrl;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id  (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
