const rateLimit = require('express-rate-limit');

// Tighter limit than the general API limiter, to slow down credential
// stuffing / brute force attempts against the admin login form.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again in a few minutes.',
  handler: (req, res) => {
    req.flash?.('error', 'Too many login attempts. Please try again in a few minutes.');
    res.status(429).redirect('/admin/login');
  },
});

module.exports = loginLimiter;
