const multer = require('multer');

// Uploaded files are held only in memory long enough to be compressed and
// converted to Base64 by imageService — never written to disk, per the
// "no local image uploads as permanent storage" requirement.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}. Use JPEG, PNG, or WebP.`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 }, // generous pre-compression ceiling
});

module.exports = upload;
