if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); } catch(_) {}
}

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

// DB — har so'rovda (Vercel serverless)
app.use(async (req, res, next) => {
  try { await connectDB(); } catch(_) {}
  next();
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' }, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/login',    rateLimit({ windowMs: 15*60*1000, max: 20 }));
app.use('/api/auth/register', rateLimit({ windowMs: 15*60*1000, max: 20 }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/news',     require('./routes/news'));
app.use('/api/admin',    require('./routes/admin'));
app.post('/api/coupons/validate', require('./controllers/adminController').validateCoupon);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// Local da ishga tushirish
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    try { require('./bot/bot').initBot(); } catch(e) { console.log('Bot error:', e.message); }
  });
}

module.exports = app;
