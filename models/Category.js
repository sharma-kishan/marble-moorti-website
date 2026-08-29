const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    group: {
      type: String,
      enum: ['Hindu Deities', 'Jain Statues', 'Temple Statues', 'Custom Marble Art'],
      default: 'Hindu Deities',
    },
    description: { type: String, default: '' },
    image: { type: ImageSchema, default: null },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

CategorySchema.index({ published: 1, order: 1 });

module.exports = mongoose.model('Category', CategorySchema);
