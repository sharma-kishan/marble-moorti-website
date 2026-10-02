const Product = require('../models/Product');
const Category = require('../models/Category');
const Testimonial = require('../models/Testimonial');
const Project = require('../models/Project');
const Gallery = require('../models/Gallery');
const { toDataUri } = require('../services/imageService');
const { buildMeta, localBusinessSchema } = require('../services/seoService');
const { decorateProductThumb } = require('./productController');

function buildHeroSlides(settings, featuredProducts) {
  const slides = [];
  if (settings.heroImage) slides.push(toDataUri(settings.heroImage.medium));
  featuredProducts.forEach((product) => {
    if (slides.length >= 5) return;
    const images = (product.images || []).slice().sort((a, b) => a.order - b.order);
    const primary = images[0];
    if (!primary) return;
    const url = toDataUri(primary.medium);
    if (url && !slides.includes(url)) slides.push(url);
  });
  return slides;
}

async function home(req, res, next) {
  try {
    const settings = res.locals.settings;

    const [featuredProducts, categories, testimonials, projects, galleryPreview] = await Promise.all([
      Product.find({ published: true, featured: true }).sort({ createdAt: -1 }).limit(8).lean(),
      Category.find({ published: true }).sort({ order: 1 }).limit(10).lean(),
      Testimonial.find({ published: true }).sort({ order: 1 }).limit(6).lean(),
      Project.find({ published: true }).sort({ order: 1 }).limit(3).lean(),
      Gallery.find({ published: true }).sort({ order: 1 }).limit(8).lean(),
    ]);

    res.render('home', {
      title: settings.heroHeadline || 'Vishnu Moorti Kala Centre',
      meta: buildMeta({
        title: `${settings.businessName} — ${settings.tagline}`,
        description: settings.seoDefaults?.description,
        path: '/',
        settings,
      }),
      structuredData: [localBusinessSchema(settings)],
      featuredProducts: featuredProducts.map(decorateProductThumb),
      categories: categories.map((c) => ({ ...c, imageUrl: c.image ? toDataUri(c.image.thumbnail) : '' })),
      testimonials: testimonials.map((t) => ({ ...t, photoUrl: t.photo ? toDataUri(t.photo.thumbnail) : '' })),
      projects: projects.map((p) => {
        const img = (p.images || []).sort((a, b) => a.order - b.order)[0];
        return { ...p, coverUrl: img ? toDataUri(img.medium) : '' };
      }),
      galleryPreview: galleryPreview.map((g) => ({ ...g, thumbUrl: toDataUri(g.image.thumbnail) })),
      heroImageUrl: settings.heroImage ? toDataUri(settings.heroImage.medium) : '',
      heroSlides: buildHeroSlides(settings, featuredProducts),
    });
  } catch (err) {
    next(err);
  }
}

function about(req, res) {
  res.render('about', {
    title: 'About Us',
    meta: buildMeta({
      title: 'About Us',
      description: 'Learn about our marble craftsmanship heritage from Jaipur, Rajasthan.',
      path: '/about',
      settings: res.locals.settings,
    }),
  });
}

function customMoorti(req, res) {
  res.render('custom-moorti', {
    title: 'Custom Moorti',
    meta: buildMeta({
      title: 'Custom Marble Moorti | Made to Order',
      description: 'Commission a custom marble murti — choose the deity, marble type, size and finish.',
      path: '/custom-moorti',
      settings: res.locals.settings,
    }),
  });
}

function services(req, res) {
  res.render('services', {
    title: 'Services',
    meta: buildMeta({
      title: 'Services',
      description: 'Marble statue manufacturing, custom moorti carving, temple installation and shipping services.',
      path: '/services',
      settings: res.locals.settings,
    }),
  });
}

function process_(req, res) {
  res.render('process', {
    title: 'Our Process',
    meta: buildMeta({
      title: 'Our Process',
      description: 'From requirement discussion to installation — how each marble murti is crafted.',
      path: '/our-process',
      settings: res.locals.settings,
    }),
  });
}

function contact(req, res) {
  res.render('contact', {
    title: 'Contact Us',
    meta: buildMeta({
      title: 'Contact Us',
      description: 'Get in touch with our Jaipur workshop for marble statue enquiries.',
      path: '/contact',
      settings: res.locals.settings,
    }),
  });
}

function faq(req, res) {
  res.render('faq', {
    title: 'Frequently Asked Questions',
    meta: buildMeta({
      title: 'FAQ',
      description: 'Answers to common questions about marble statues, customization, and shipping.',
      path: '/faq',
      settings: res.locals.settings,
    }),
  });
}

function privacy(req, res) {
  res.render('privacy', {
    title: 'Privacy Policy',
    meta: buildMeta({ title: 'Privacy Policy', path: '/privacy-policy', settings: res.locals.settings }),
  });
}

function terms(req, res) {
  res.render('terms', {
    title: 'Terms & Conditions',
    meta: buildMeta({ title: 'Terms & Conditions', path: '/terms-and-conditions', settings: res.locals.settings }),
  });
}

function thankYou(req, res) {
  res.render('thank-you', {
    title: 'Thank You',
    meta: buildMeta({ title: 'Thank You', path: '/thank-you', settings: res.locals.settings }),
    ref: req.query.ref || '',
  });
}

module.exports = { home, about, customMoorti, services, process_, contact, faq, privacy, terms, thankYou };
