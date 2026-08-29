const { ImageValidationError } = require('../services/imageService');

function notFoundHandler(req, res) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  return res.status(404).render('404', {
    title: 'Page Not Found',
    layout: false,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  if (err instanceof ImageValidationError) statusCode = 400;
  if (err.name === 'ValidationError') statusCode = 400; // mongoose
  if (err.name === 'CastError') statusCode = 400;
  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }
  if (err.name === 'MulterError') statusCode = 400;
  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Your session has expired or this form was already submitted. Please refresh the page and try again.';
  }

  if (!isProd) {
    console.error(err);
  } else if (statusCode >= 500) {
    console.error('Server error:', message);
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(isProd ? {} : { stack: err.stack }),
    });
  }

  if (statusCode >= 500) {
    return res.status(statusCode).render('500', {
      title: 'Server Error',
      layout: false,
    });
  }

  req.flash?.('error', message);
  return res.redirect('back');
}

module.exports = { notFoundHandler, errorHandler };
