const { validationResult } = require('express-validator');

/** Runs after express-validator chains; returns 400 JSON or re-renders forms with flash errors. */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  req.flash?.('error', errors.array().map((e) => e.msg).join(' '));
  return res.redirect('back');
}

module.exports = { handleValidation };
