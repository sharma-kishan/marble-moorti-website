const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

const STATUSES = ['New', 'Contacted', 'Quotation Sent', 'In Discussion', 'Confirmed', 'Completed', 'Cancelled'];

const EnquirySchema = new mongoose.Schema(
  {
    enquiryId: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    country: { type: String, default: '' },
    city: { type: String, default: '' },

    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' }, // free-text fallback if not a catalog item
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    height: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    marblePreference: { type: String, default: '' },
    requiredDate: { type: Date },
    deliveryLocation: { type: String, default: '' },
    message: { type: String, default: '', maxlength: 2000 },

    referenceImages: { type: [ImageSchema], default: [] },

    status: { type: String, enum: STATUSES, default: 'New' },
    adminNotes: [
      {
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      },
    ],

    source: { type: String, default: 'website' },
  },
  { timestamps: true }
);

EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ name: 'text', phone: 'text', email: 'text', productName: 'text' });

EnquirySchema.statics.STATUSES = STATUSES;

// Generates a human-friendly, sortable enquiry ID like VMK-20260823-0007
EnquirySchema.statics.generateEnquiryId = async function generateEnquiryId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await this.countDocuments({
    enquiryId: { $regex: `^VMK-${datePart}-` },
  });
  const seq = String(countToday + 1).padStart(4, '0');
  return `VMK-${datePart}-${seq}`;
};

module.exports = mongoose.model('Enquiry', EnquirySchema);
