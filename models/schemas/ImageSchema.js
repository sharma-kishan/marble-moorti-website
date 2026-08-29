const mongoose = require('mongoose');

/**
 * Shared sub-schema for a Base64-encoded image, stored directly in MongoDB.
 * We keep three resolutions so listing pages never have to ship full-res
 * originals: thumbnail (grid/cards), medium (detail page), original (zoom).
 */
const ImageVariantSchema = new mongoose.Schema(
  {
    data: { type: String, required: true }, // raw Base64 string, no data: prefix
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

const ImageSchema = new mongoose.Schema(
  {
    thumbnail: { type: ImageVariantSchema, required: true },
    medium: { type: ImageVariantSchema, required: true },
    original: { type: ImageVariantSchema, required: true },
    alt: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

module.exports = { ImageSchema, ImageVariantSchema };
