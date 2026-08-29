const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const pageController = require('../controllers/pageController');
const categoryController = require('../controllers/categoryController');
const galleryController = require('../controllers/galleryController');
const projectController = require('../controllers/projectController');
const testimonialController = require('../controllers/testimonialController');
const enquiryController = require('../controllers/enquiryController');
const { handleValidation } = require('../middleware/validation');
const upload = require('../middleware/upload');
const SiteSettings = require('../models/SiteSettings');

router.get('/', pageController.home);
router.get('/about', pageController.about);
router.get('/categories', categoryController.publicList);
router.get('/gallery', galleryController.publicList);
router.get('/custom-moorti', pageController.customMoorti);
router.get('/temple-projects', projectController.publicList);
router.get('/temple-projects/:slug', projectController.publicDetail);
router.get('/services', pageController.services);
router.get('/our-process', pageController.process_);
router.get('/testimonials', testimonialController.publicList);
router.get('/contact', pageController.contact);
router.get('/faq', pageController.faq);
router.get('/privacy-policy', pageController.privacy);
router.get('/terms-and-conditions', pageController.terms);
router.get('/thank-you', pageController.thankYou);

// Request a Quote
router.get('/request-quote', enquiryController.quoteForm);
router.post(
  '/request-quote',
  upload.array('referenceImages', 5),
  [
    body('name').trim().notEmpty().withMessage('Please enter your name.'),
    body('phone').trim().notEmpty().withMessage('Please enter a phone number.'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email.'),
  ],
  handleValidation,
  enquiryController.submitEnquiry
);

// Contact form (shares the enquiry pipeline so it shows up in admin too)
router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Please enter your name.'),
    body('phone').trim().notEmpty().withMessage('Please enter a phone number.'),
    body('message').trim().notEmpty().withMessage('Please enter a message.'),
  ],
  handleValidation,
  enquiryController.submitEnquiry
);

// SEO: sitemap + robots
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const Project = require('../models/Project');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const staticPaths = [
      '/', '/about', '/products', '/categories', '/gallery', '/custom-moorti',
      '/temple-projects', '/services', '/our-process', '/testimonials',
      '/contact', '/request-quote', '/faq', '/privacy-policy', '/terms-and-conditions',
    ];

    const [products, projects] = await Promise.all([
      Product.find({ published: true }).select('slug updatedAt').lean(),
      Project.find({ published: true }).select('slug updatedAt').lean(),
    ]);

    const urls = [
      ...staticPaths.map((p) => ({ loc: `${baseUrl}${p}` })),
      ...products.map((p) => ({ loc: `${baseUrl}/products/${p.slug}`, lastmod: p.updatedAt })),
      ...projects.map((p) => ({ loc: `${baseUrl}/temple-projects/${p.slug}`, lastmod: p.updatedAt })),
    ];

    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`
  )
  .join('\n')}
</urlset>`);
  } catch (err) {
    next(err);
  }
});

router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

module.exports = router;
