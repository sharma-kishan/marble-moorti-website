const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Marble Murtis',
        'Temple Projects',
        'Workshop',
        'Carving Process',
        'Finished Statues',
        'Installation',
        'International Projects',
      ],
      default: 'Marble Murtis',
    },
    description: { type: String, default: '' },
    // Each gallery image is its own document (see #3 in the brief) so listing
    // pages can page through images without loading hundreds of Base64 blobs.
    image: { type: ImageSchema, required: true },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GallerySchema.index({ published: 1, category: 1, order: 1 });

module.exports = mongoose.model('Gallery', GallerySchema);
