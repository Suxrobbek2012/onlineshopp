const News = require('../models/News');

// GET /api/news
exports.getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [articles, total] = await Promise.all([
      News.find({ isPublished: true }).populate('author', 'fullName').sort('-createdAt').skip(skip).limit(Number(limit)),
      News.countDocuments({ isPublished: true })
    ]);
    res.json({ success: true, total, articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/news/:id
exports.getNewsById = async (req, res) => {
  try {
    const article = await News.findById(req.params.id).populate('author', 'fullName');
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/news  (admin)
exports.createNews = async (req, res) => {
  try {
    const data = { ...req.body, author: req.user._id };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const article = await News.create(data);
    res.status(201).json({ success: true, article });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/news/:id  (admin)
exports.updateNews = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const article = await News.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/news/:id  (admin)
exports.deleteNews = async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
