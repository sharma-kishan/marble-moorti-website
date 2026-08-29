const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: String, default: '' },

    shortDescription: { type: String, default: '', maxlength: 300 },
    description: { type: String, default: '' },
    craftsmanship: { type: String, default: '' },

    marbleType: {
      type: String,
      enum: ['Makrana White', 'Makrana Pink', 'Italian Marble', 'Green Marble', 'Black Marble', 'Other'],
      default: 'Makrana White',
    },
    availableSizes: [{ type: String }], // e.g. ["12 inch", "24 inch", "Custom"]
    dimensions: {
      height: { type: String, default: '' },
      width: { type: String, default: '' },
      depth: { type: String, default: '' },
    },
    finish: { type: String, default: '' },
    customizationAvailable: { type: Boolean, default: true },
    deliveryInfo: { type: String, default: '' },

    images: { type: [ImageSchema], default: [] },

    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },

    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', shortDescription: 'text', description: 'text' });
ProductSchema.index({ published: 1, featured: 1 });
ProductSchema.index({ category: 1, published: 1 });
ProductSchema.index({ marbleType: 1 });

// Primary image convenience accessor (first by `order`)
ProductSchema.virtual('primaryImage').get(function getPrimaryImage() {
  if (!this.images || this.images.length === 0) return null;
  return [...this.images].sort((a, b) => a.order - b.order)[0];
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
