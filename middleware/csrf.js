const csrf = require('csurf');

/**
 * Session-based CSRF protection (stores the secret in req.session rather than
 * a separate cookie, so it relies on the express-session middleware already
 * configured in app.js).
 *
 * Token lookup order (csurf default): req.body._csrf, then req.query._csrf,
 * then the csrf-token/xsrf-token/x-csrf-token headers. That means:
 *  - Plain (urlencoded) admin forms carry it as a hidden <input>.
 *  - multipart/form-data forms (image uploads) carry it as a query string
 *    param on the form's `action` URL, since multer hasn't parsed the body
 *    yet when this middleware runs.
 *  - JSON fetch() calls from admin.js send it via the `CSRF-Token` header.
 */
const csrfProtection = csrf({ cookie: false });

/** Exposes the token to views as `csrfToken` once csrfProtection has run. */
function attachCsrfToken(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
}

module.exports = { csrfProtection, attachCsrfToken };
