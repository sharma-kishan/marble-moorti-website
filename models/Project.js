const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    location: { type: String, default: '' },
    projectType: { type: String, default: '' }, // e.g. "Temple Installation"
    description: { type: String, default: '' },
    statueSize: { type: String, default: '' },
    marbleType: { type: String, default: '' },
    completionDate: { type: Date },
    servicesProvided: [{ type: String }],
    images: { type: [ImageSchema], default: [] },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ published: 1, order: 1 });

module.exports = mongoose.model('Project', ProjectSchema);
