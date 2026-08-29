const mongoose = require('mongoose');
const { ImageSchema } = require('./schemas/ImageSchema');

/**
 * Singleton document holding every configurable piece of business
 * information referenced throughout the brief (#29). Use
 * SiteSettings.getSiteSettings() to fetch it — creates sensible
 * empty defaults on first run instead of fabricating facts.
 */
const SiteSettingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: 'Vishnu Moorti Kala Centre' },
    tagline: { type: String, default: 'Fine Marble Art • Jaipur' },
    logo: { type: ImageSchema, default: null },

    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    googleMapsEmbedUrl: { type: String, default: '' },

    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    heroHeadline: { type: String, default: 'Timeless Devotion, Carved in Marble' },
    heroSubtext: {
      type: String,
      default:
        'Handcrafted marble murtis and sacred sculptures from Jaipur, created with generations of craftsmanship.',
    },
    heroImage: { type: ImageSchema, default: null },

    // Trust statistics shown on the homepage. Left blank by default —
    // real figures must be entered by the business owner (brief #38).
    stats: {
      yearsOfCraftsmanship: { type: String, default: '' },
      murtisCrafted: { type: String, default: '' },
      templesServed: { type: String, default: '' },
      statesDelivered: { type: String, default: '' },
      internationalDelivery: { type: Boolean, default: false },
    },

    footerText: { type: String, default: '' },

    seoDefaults: {
      titleSuffix: { type: String, default: 'Vishnu Moorti Kala Centre | Jaipur' },
      description: {
        type: String,
        default:
          'Handcrafted marble murtis, temple statues and custom marble sculptures from Jaipur, India.',
      },
    },
  },
  { timestamps: true }
);

SiteSettingsSchema.statics.getSiteSettings = async function getSiteSettings() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);
