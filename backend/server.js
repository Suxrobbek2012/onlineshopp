if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('.env') });
}
cs = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('expreslimit');
const connectDB = require('./config/db');

const app = express();

// DB — har so'rovda (s)
ync (req, res, next) => {
  await connectDB();
  next();
});

appolicy: false }));
);

const globalLimiders: false });
const authLimiter   = rateLimit60*1000, max: 20 });
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.r);

app.use;
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
'uploads')));

app.use('/api/auth',     require(utes/auth'));
app.use('/api/users',    reers'));
app.use('/a
app.use('/api/orders',  
app.use('/api/cart',   t'));
app.use('/api/news',     require('./routes/news'));
appquire('./routes/admin'));
pon);

app.get('/api/health', (req Date() }));
app.use((r
app.use((err, req, res, next) => {
  console.error(err.stack);
r.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
f (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  // Bot faqat local da
  if (process.env.NODE_ENV !== 'production') {
t/bot').initBot();
  }
}

module.exports = app;
