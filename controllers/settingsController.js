const SiteSettings = require('../models/SiteSettings');
const { processImageToBase64, toDataUri } = require('../services/imageService');

async function editForm(req, res, next) {
  try {
    const settings = await SiteSettings.getSiteSettings();
    const plain = settings.toObject();
    res.render('admin/settings', {
      title: 'Website Settings',
      layout: 'layouts/admin',
      settings: {
        ...plain,
        logoUrl: plain.logo ? toDataUri(plain.logo.thumbnail) : '',
        heroImageUrl: plain.heroImage ? toDataUri(plain.heroImage.medium) : '',
      },
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const settings = await SiteSettings.getSiteSettings();
    const body = req.body;

    settings.businessName = body.businessName;
    settings.tagline = body.tagline;
    settings.phone = body.phone;
    settings.whatsapp = body.whatsapp;
    settings.email = body.email;
    settings.address = body.address;
    settings.workingHours = body.workingHours;
    settings.googleMapsEmbedUrl = body.googleMapsEmbedUrl;
    settings.social = {
      instagram: body.instagram,
      facebook: body.facebook,
      youtube: body.youtube,
    };
    settings.heroHeadline = body.heroHeadline;
    settings.heroSubtext = body.heroSubtext;
    settings.stats = {
      yearsOfCraftsmanship: body.yearsOfCraftsmanship,
      murtisCrafted: body.murtisCrafted,
      templesServed: body.templesServed,
      statesDelivered: body.statesDelivered,
      internationalDelivery: body.internationalDelivery === 'on',
    };
    settings.footerText = body.footerText;
    settings.seoDefaults = {
      titleSuffix: body.titleSuffix,
      description: body.seoDescription,
    };

    if (req.files?.logo?.[0]) {
      const file = req.files.logo[0];
      settings.logo = await processImageToBase64(file.buffer, file.mimetype, 'general', { alt: 'Logo' });
    }
    if (req.files?.heroImage?.[0]) {
      const file = req.files.heroImage[0];
      settings.heroImage = await processImageToBase64(file.buffer, file.mimetype, 'hero', { alt: 'Hero' });
    }

    await settings.save();
    req.flash('success', 'Settings updated.');
    res.redirect('/admin/settings');
  } catch (err) {
    next(err);
  }
}

module.exports = { editForm, update };
