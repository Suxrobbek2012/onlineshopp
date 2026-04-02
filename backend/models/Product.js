const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  discount:    { type: Number, default: 0, min: 0, max: 100 }, // percentage
  category:    { type: String, required: true, trim: true },
  image:       { type: String, default: '' },
  images:      [{ type: String }],
  stock:       { type: Number, default: 0, min: 0 },
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  isFeatured:  { type: Boolean, default: false },
  isOnSale:    { type: Boolean, default: false },
  saleEndsAt:  { type: Date, default: null },
  tags:        [{ type: String }]
}, { timestamps: true });

// Virtual: discounted price
productSchema.virtual('finalPrice').get(function() {
  if (this.discount > 0) {
    return +(this.price * (1 - this.discount / 100)).toFixed(2);
  }
  return this.price;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
