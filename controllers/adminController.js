const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Gallery = require('../models/Gallery');
const Testimonial = require('../models/Testimonial');
const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const { signToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

function loginForm(req, res) {
  if (req.admin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', layout: 'layouts/admin-auth' });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email?.toLowerCase().trim() }).select('+passwordHash');

    if (!admin || !admin.active) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/admin/login');
    }

    const valid = await admin.comparePassword(password || '');
    if (!valid) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/admin/login');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = signToken(admin);
    setAuthCookie(res, token);

    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  res.redirect('/admin/login');
}

async function dashboard(req, res, next) {
  try {
    const [
      totalProducts,
      totalCategories,
      totalGalleryImages,
      totalTestimonials,
      totalProjects,
      totalEnquiries,
      newEnquiries,
      recentEnquiries,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Gallery.countDocuments(),
      Testimonial.countDocuments(),
      Project.countDocuments(),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'New' }),
      Enquiry.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      layout: 'layouts/admin',
      stats: {
        totalProducts,
        totalCategories,
        totalGalleryImages,
        totalTestimonials,
        totalProjects,
        totalEnquiries,
        newEnquiries,
      },
      recentEnquiries,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { loginForm, login, logout, dashboard };
