const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    review: { type: String, required: true, maxlength: 1000 },
    photo: { type: ImageSchema, default: null },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isDemoData: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TestimonialSchema.index({ published: 1, order: 1 });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
