const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const productController = require('../controllers/productController');
const galleryController = require('../controllers/galleryController');
const enquiryController = require('../controllers/enquiryController');
const { handleValidation } = require('../middleware/validation');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const Category = require('../models/Category');
const Project = require('../models/Project');
const Testimonial = require('../models/Testimonial');
const SiteSettings = require('../models/SiteSettings');
const Admin = require('../models/Admin');
const { signToken, setAuthCookie } = require('../middleware/auth');

/* Public read APIs */
router.get('/products', productController.apiList);

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({ published: true }).sort({ order: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

router.get('/gallery', galleryController.apiList);

router.get('/projects', async (req, res, next) => {
  try {
    const projects = await Project.find({ published: true }).sort({ order: 1 }).lean();
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

router.get('/testimonials', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ published: true }).sort({ order: 1 }).lean();
    res.json({ success: true, data: testimonials });
  } catch (err) {
    next(err);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSiteSettings();
    // Never leak internal fields through the public API — this is public
    // business info only, per "no sensitive info through public APIs" (#32).
    const { businessName, tagline, phone, whatsapp, email, address, workingHours, social, stats } = settings;
    res.json({ success: true, data: { businessName, tagline, phone, whatsapp, email, address, workingHours, social, stats } });
  } catch (err) {
    next(err);
  }
});

/* Contact / enquiry submission via API */
router.post(
  '/contact',
  upload.array('referenceImages', 5),
  [
    body('name').trim().notEmpty(),
    body('phone').trim().notEmpty(),
  ],
  handleValidation,
  enquiryController.submitEnquiry
);

router.post(
  '/enquiries',
  upload.array('referenceImages', 5),
  [
    body('name').trim().notEmpty(),
    body('phone').trim().notEmpty(),
  ],
  handleValidation,
  enquiryController.submitEnquiry
);

/* Admin auth */
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email?.toLowerCase().trim() }).select('+passwordHash');
    if (!admin || !admin.active || !(await admin.comparePassword(password || ''))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    admin.lastLoginAt = new Date();
    await admin.save();
    const token = signToken(admin);
    setAuthCookie(res, token);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

/* Admin-protected JSON endpoints (used by admin panel's fetch() calls).
   These carry their CSRF token via the CSRF-Token header (see public/js/admin.js)
   rather than a form field, since they're plain fetch() calls, not <form> posts. */
const { csrfProtection } = require('../middleware/csrf');
router.use('/admin', requireAdmin, csrfProtection);

router.patch('/admin/products/:id/publish', productController.adminTogglePublish);
router.delete('/admin/products/:id/images/:imageId', productController.adminDeleteImage);
router.post('/admin/gallery/reorder', galleryController.adminReorder);
router.patch('/admin/enquiries/:id/status', enquiryController.adminUpdateStatus);

module.exports = router;
