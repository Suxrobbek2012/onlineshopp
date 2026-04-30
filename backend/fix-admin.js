// Admin parolini yangilash uchun script
// Ishlatish: node fix-admin.js <yangi_parol>
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const newPassword = process.argv[2] || 'admin123';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  let admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    admin = await User.create({
      fullName: 'Admin', username: 'admin', phone: '9001234567',
      countryCode: '+998', password: newPassword, age: 30,
      role: 'admin', isBanned: false
    });
    console.log('Admin yaratildi:', admin.username, '| parol:', newPassword);
  } else {
    admin.password = newPassword;
    admin.isBanned = false;
    admin.role = 'admin';
    await admin.save();
    console.log('Admin yangilandi:', admin.username, '| parol:', newPassword);
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
