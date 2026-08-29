const sharp = require('sharp');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Post-compression byte ceilings, per brief section 3.
const LIMITS = {
  product: 3 * 1024 * 1024,
  gallery: 2 * 1024 * 1024,
  hero: 3 * 1024 * 1024,
  general: 2 * 1024 * 1024,
};

const VARIANTS = {
  thumbnail: { width: 400, quality: 70 },
  medium: { width: 900, quality: 78 },
  original: { width: 1800, quality: 85 },
};

class ImageValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImageValidationError';
    this.statusCode = 400;
  }
}

function assertMimeType(mimeType) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageValidationError(
      `Unsupported image type "${mimeType}". Please upload JPEG, PNG, or WebP.`
    );
  }
}

/**
 * Resizes a single variant and returns { data, mimeType } with data as
 * a raw Base64 string (no "data:" prefix — that's added at render time).
 */
async function buildVariant(buffer, { width, quality }) {
  const output = await sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  return { data: output.toString('base64'), mimeType: 'image/webp' };
}

/**
 * Converts an uploaded image buffer into the thumbnail/medium/original
 * Base64 trio used across every model in this project.
 *
 * @param {Buffer} buffer - raw uploaded file bytes
 * @param {string} mimeType - the uploaded file's original MIME type
 * @param {'product'|'gallery'|'hero'|'general'} kind - selects the size limit
 * @param {{ alt?: string, order?: number }} meta
 */
async function processImageToBase64(buffer, mimeType, kind = 'general', meta = {}) {
  assertMimeType(mimeType);

  const limit = LIMITS[kind] || LIMITS.general;

  const [thumbnail, medium, original] = await Promise.all([
    buildVariant(buffer, VARIANTS.thumbnail),
    buildVariant(buffer, VARIANTS.medium),
    buildVariant(buffer, VARIANTS.original),
  ]);

  const originalBytes = Buffer.byteLength(original.data, 'base64');
  if (originalBytes > limit) {
    throw new ImageValidationError(
      `Image is too large even after compression (${(originalBytes / 1024 / 1024).toFixed(
        1
      )}MB). Maximum allowed is ${(limit / 1024 / 1024).toFixed(1)}MB. Please upload a smaller image.`
    );
  }

  return {
    thumbnail,
    medium,
    original,
    alt: meta.alt || '',
    order: meta.order || 0,
  };
}

/** Builds a data: URI for rendering an image variant in a view. */
function toDataUri(variant) {
  if (!variant || !variant.data) return '';
  return `data:${variant.mimeType};base64,${variant.data}`;
}

module.exports = {
  processImageToBase64,
  toDataUri,
  ImageValidationError,
  ALLOWED_MIME_TYPES,
  LIMITS,
};
