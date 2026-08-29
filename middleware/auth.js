const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const COOKIE_NAME = 'vmk_admin_token';

function signToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

/** Protects admin pages/APIs. Redirects HTML requests, 401s JSON/API requests. */
async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');

    if (!token) return unauthorized(req, res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.active) return unauthorized(req, res);

    req.admin = admin;
    res.locals.admin = admin;
    return next();
  } catch (err) {
    return unauthorized(req, res);
  }
}

function unauthorized(req, res) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  return res.redirect('/admin/login');
}

module.exports = { requireAdmin, signToken, setAuthCookie, clearAuthCookie, COOKIE_NAME };
