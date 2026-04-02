const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName:     { type: String, required: true, trim: true },
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, required: true },
  countryCode:  { type: String, default: '+998' },
  password:     { type: String, required: true, minlength: 6 },
  age:          { type: Number, required: true, min: 1, max: 120 },
  email:        { type: String, lowercase: true, trim: true, default: '' },
  avatar:       { type: String, default: '' },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  isBanned:     { type: Boolean, default: false },
  telegramId:   { type: String, default: '' },
  favorites:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  rememberToken:{ type: String, default: '' }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
