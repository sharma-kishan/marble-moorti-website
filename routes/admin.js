const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const galleryController = require('../controllers/galleryController');
const projectController = require('../controllers/projectController');
const testimonialController = require('../controllers/testimonialController');
const enquiryController = require('../controllers/enquiryController');
const settingsController = require('../controllers/settingsController');

const { requireAdmin } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');
const upload = require('../middleware/upload');
const loginLimiter = require('../middleware/loginLimiter');
const { csrfProtection, attachCsrfToken } = require('../middleware/csrf');

/* CSRF protection applies to the whole /admin router, including the login
   form. See middleware/csrf.js for how multipart forms and fetch() calls
   carry their token. */
router.use(csrfProtection, attachCsrfToken);

/* Auth (public within /admin) */
router.get('/login', adminController.loginForm);
router.post(
  '/login',
  loginLimiter,
  [body('email').trim().notEmpty(), body('password').notEmpty()],
  handleValidation,
  adminController.login
);
router.post('/logout', adminController.logout);

/* Everything below requires authentication */
router.use(requireAdmin);

router.get('/', adminController.dashboard);

/* Products */
router.get('/products', productController.adminList);
router.get('/products/new', productController.adminNewForm);
router.post(
  '/products',
  upload.array('images', 10),
  [body('name').trim().notEmpty().withMessage('Product name is required.'), body('category').notEmpty().withMessage('Category is required.')],
  handleValidation,
  productController.adminCreate
);
router.get('/products/:id/edit', productController.adminEditForm);
router.post('/products/:id', upload.array('images', 10), productController.adminUpdate);
router.post('/products/:id/delete', productController.adminDelete);

/* Categories */
router.get('/categories', categoryController.adminList);
router.get('/categories/new', categoryController.adminNewForm);
router.post(
  '/categories',
  upload.single('image'),
  [body('name').trim().notEmpty().withMessage('Category name is required.')],
  handleValidation,
  categoryController.adminCreate
);
router.get('/categories/:id/edit', categoryController.adminEditForm);
router.post('/categories/:id', upload.single('image'), categoryController.adminUpdate);
router.post('/categories/:id/delete', categoryController.adminDelete);

/* Gallery */
router.get('/gallery', galleryController.adminList);
router.post('/gallery', upload.array('images', 20), galleryController.adminCreate);
router.post('/gallery/:id', upload.single('image'), galleryController.adminUpdate);
router.post('/gallery/:id/delete', galleryController.adminDelete);

/* Temple Projects */
router.get('/projects', projectController.adminList);
router.get('/projects/new', projectController.adminNewForm);
router.post(
  '/projects',
  upload.array('images', 15),
  [body('title').trim().notEmpty().withMessage('Project title is required.')],
  handleValidation,
  projectController.adminCreate
);
router.get('/projects/:id/edit', projectController.adminEditForm);
router.post('/projects/:id', upload.array('images', 15), projectController.adminUpdate);
router.post('/projects/:id/delete', projectController.adminDelete);

/* Testimonials */
router.get('/testimonials', testimonialController.adminList);
router.get('/testimonials/new', testimonialController.adminNewForm);
router.post(
  '/testimonials',
  upload.single('photo'),
  [body('name').trim().notEmpty(), body('review').trim().notEmpty()],
  handleValidation,
  testimonialController.adminCreate
);
router.get('/testimonials/:id/edit', testimonialController.adminEditForm);
router.post('/testimonials/:id', upload.single('photo'), testimonialController.adminUpdate);
router.post('/testimonials/:id/delete', testimonialController.adminDelete);

/* Enquiries */
router.get('/enquiries', enquiryController.adminList);
router.get('/enquiries/:id', enquiryController.adminView);
router.post('/enquiries/:id/status', enquiryController.adminUpdateStatus);
router.post('/enquiries/:id/notes', enquiryController.adminAddNote);
router.post('/enquiries/:id/delete', enquiryController.adminDelete);

/* Settings */
router.get('/settings', settingsController.editForm);
router.post(
  '/settings',
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'heroImage', maxCount: 1 }]),
  settingsController.update
);

module.exports = router;
