require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const News = require('../models/News');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  // Admin user
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    await User.create({
      fullName: 'Admin User', username: 'admin', phone: '9001234567',
      countryCode: '+998', password: 'admin123', age: 30, role: 'admin'
    });
    console.log('✅ Admin created: admin / admin123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // Delete old products and re-seed with images
  await Product.deleteMany({});

  await Product.insertMany([
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life and crystal clear sound.',
      price: 99.99, discount: 20, category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      isFeatured: true, isOnSale: true, stock: 50, rating: 4.5, reviewCount: 120,
      tags: ['headphones', 'wireless', 'audio']
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight and comfortable running shoes with advanced cushioning technology.',
      price: 79.99, discount: 0, category: 'Footwear',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      isFeatured: true, stock: 30, rating: 4.2, reviewCount: 85,
      tags: ['shoes', 'running', 'sport']
    },
    {
      name: 'Smart Watch',
      description: 'Track your fitness, heart rate, sleep and stay connected with this premium smartwatch.',
      price: 199.99, discount: 15, category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      isOnSale: true, isFeatured: true, stock: 20, rating: 4.7, reviewCount: 200,
      tags: ['watch', 'smartwatch', 'fitness']
    },
    {
      name: 'Leather Jacket',
      description: 'Classic genuine leather jacket with modern cut. Perfect for any occasion.',
      price: 149.99, discount: 0, category: 'Clothing',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
      isFeatured: true, stock: 15, rating: 4.0, reviewCount: 60,
      tags: ['jacket', 'leather', 'fashion']
    },
    {
      name: 'Coffee Maker',
      description: 'Brew the perfect cup every morning with this programmable coffee maker.',
      price: 59.99, discount: 10, category: 'Home',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
      isOnSale: true, stock: 40, rating: 4.3, reviewCount: 95,
      tags: ['coffee', 'kitchen', 'home']
    },
    {
      name: 'Yoga Mat',
      description: 'Premium non-slip yoga mat with alignment lines. 6mm thick for extra comfort.',
      price: 29.99, discount: 0, category: 'Sports',
      image: 'https://images.unsplash.com/photo-1601925228008-f5e4c5e5e5e5?w=400&h=400&fit=crop',
      stock: 100, rating: 4.6, reviewCount: 150,
      tags: ['yoga', 'fitness', 'sport']
    },
    {
      name: 'Backpack',
      description: 'Durable 30L travel backpack with laptop compartment and USB charging port.',
      price: 49.99, discount: 25, category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      isOnSale: true, isFeatured: true, stock: 60, rating: 4.4, reviewCount: 110,
      tags: ['backpack', 'travel', 'bag']
    },
    {
      name: 'Sunglasses',
      description: 'Polarized UV400 protection sunglasses with stylish frame.',
      price: 39.99, discount: 0, category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
      isFeatured: true, stock: 80, rating: 4.1, reviewCount: 70,
      tags: ['sunglasses', 'fashion', 'accessories']
    },
    {
      name: 'iPhone 15 Case',
      description: 'Slim protective case for iPhone 15 with military-grade drop protection.',
      price: 19.99, discount: 30, category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop',
      isOnSale: true, stock: 200, rating: 4.3, reviewCount: 340,
      tags: ['iphone', 'case', 'phone']
    },
    {
      name: 'Denim Jeans',
      description: 'Classic slim-fit denim jeans. Comfortable stretch fabric for all-day wear.',
      price: 59.99, discount: 0, category: 'Clothing',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
      stock: 45, rating: 4.2, reviewCount: 88,
      tags: ['jeans', 'denim', 'clothing']
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Waterproof portable Bluetooth speaker with 360° sound and 12-hour battery.',
      price: 49.99, discount: 20, category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
      isOnSale: true, isFeatured: true, stock: 35, rating: 4.5, reviewCount: 175,
      tags: ['speaker', 'bluetooth', 'audio']
    },
    {
      name: 'Sneakers',
      description: 'Trendy casual sneakers with memory foam insole. Available in multiple colors.',
      price: 69.99, discount: 0, category: 'Footwear',
      image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop',
      isFeatured: true, stock: 55, rating: 4.4, reviewCount: 132,
      tags: ['sneakers', 'casual', 'shoes']
    },
    {
      name: 'Desk Lamp',
      description: 'LED desk lamp with adjustable brightness and color temperature. USB charging port included.',
      price: 34.99, discount: 15, category: 'Home',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
      isOnSale: true, stock: 70, rating: 4.3, reviewCount: 92,
      tags: ['lamp', 'desk', 'home', 'led']
    },
    {
      name: 'Water Bottle',
      description: 'Insulated stainless steel water bottle. Keeps drinks cold 24h, hot 12h.',
      price: 24.99, discount: 0, category: 'Sports',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
      stock: 120, rating: 4.7, reviewCount: 210,
      tags: ['bottle', 'water', 'sport', 'fitness']
    },
    {
      name: 'Wallet',
      description: 'Slim genuine leather bifold wallet with RFID blocking technology.',
      price: 29.99, discount: 10, category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
      isOnSale: true, stock: 90, rating: 4.2, reviewCount: 65,
      tags: ['wallet', 'leather', 'accessories']
    },
    {
      name: 'T-Shirt',
      description: '100% organic cotton premium t-shirt. Soft, breathable and durable.',
      price: 24.99, discount: 0, category: 'Clothing',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      stock: 150, rating: 4.0, reviewCount: 45,
      tags: ['tshirt', 'cotton', 'clothing']
    }
  ]);
  console.log('✅ Sample products created with images');

  // Sample news
  await News.deleteMany({});
  const admin = await User.findOne({ username: 'admin' });
  await News.insertMany([
    {
      title: 'Yozgi chegirma boshlandi!',
      content: 'Tanlangan mahsulotlarda 50% gacha chegirma. Elektronika, kiyim-kechak va boshqa ko\'plab mahsulotlarda katta chegirmalar sizni kutmoqda. Faqat cheklangan vaqt uchun!',
      excerpt: 'Tanlangan mahsulotlarda 50% gacha chegirma.',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
      author: admin._id
    },
    {
      title: 'Yangi kuz kolleksiyasi keldi!',
      content: 'Kuz mavsumi uchun yangi kolleksiyamizni ko\'ring. Zamonaviy uslub va yuqori sifat birlashgan mahsulotlar sizni kutmoqda. Moda va hayot tarzi bo\'yicha eng so\'nggi tendentsiyalar.',
      excerpt: 'Kuz mavsumi uchun yangi kolleksiyamizni ko\'ring.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
      author: admin._id
    },
    {
      title: 'Bepul yetkazib berish!',
      description: 'Bu hafta sonu barcha buyurtmalar uchun bepul yetkazib berish. Promo kod kerak emas!',
      content: 'Bu hafta sonu — 30 dollardan yuqori barcha buyurtmalarga bepul yetkazib berish. Promo kod kerak emas! Faqat buyurtma bering va biz sizga yetkazib beramiz.',
      excerpt: '30 dollardan yuqori buyurtmalarga bepul yetkazib berish.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop',
      author: admin._id
    },
    {
      title: 'Yangi elektronika mahsulotlari',
      content: 'Eng so\'nggi smartfonlar, noutbuklar, quloqchinlar va boshqa elektronika mahsulotlari do\'konimizda. Sifat kafolati bilan.',
      excerpt: 'Eng so\'nggi elektronika mahsulotlari do\'konimizda.',
      image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=400&fit=crop',
      author: admin._id
    }
  ]);
  console.log('✅ Sample news created with images');

  console.log('🌱 Seed complete!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
