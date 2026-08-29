const slugify = require('slugify');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { processImageToBase64, toDataUri } = require('../services/imageService');
const { buildMeta, productSchema, breadcrumbSchema } = require('../services/seoService');

const PAGE_SIZE = 12;

async function makeUniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug, _id: { $ne: excludeId } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/* ------------------------------- PUBLIC ------------------------------- */

async function publicList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const { q, category, marbleType, sort } = req.query;

    const filter = { published: true };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (marbleType) filter.marbleType = marbleType;

    const sortMap = {
      newest: { createdAt: -1 },
      featured: { featured: -1, createdAt: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };
    const sortOrder = sortMap[sort] || sortMap.featured;

    const [products, total, categories] = await Promise.all([
      Product.find(filter)
        .sort(sortOrder)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate('category', 'name slug')
        .lean(),
      Product.countDocuments(filter),
      Category.find({ published: true }).sort({ order: 1 }).lean(),
    ]);

    const productsWithImages = products.map(decorateProductThumb);

    res.render('products', {
      title: 'Marble Statues & Murtis Collection',
      meta: buildMeta({
        title: 'Marble Statues & Murtis Collection',
        description:
          'Browse handcrafted marble Hindu deities, Jain statues, and custom temple sculptures from Jaipur.',
        path: '/products',
        settings: res.locals.settings,
      }),
      products: productsWithImages,
      categories,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
}

async function publicDetail(req, res, next) {
  try {
    const product = await Product.findOne({ slug: req.params.slug, published: true })
      .populate('category', 'name slug')
      .lean();

    if (!product) return res.status(404).render('404', { title: 'Product Not Found', layout: false });

    product.images = (product.images || [])
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        ...img,
        mediumUrl: toDataUri(img.medium),
        thumbUrl: toDataUri(img.thumbnail),
        originalUrl: toDataUri(img.original),
      }));

    const related = await Product.find({
      category: product.category?._id,
      published: true,
      _id: { $ne: product._id },
    })
      .limit(4)
      .lean();

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    res.render('product-detail', {
      title: product.seoTitle || product.name,
      meta: buildMeta({
        title: product.seoTitle || product.name,
        description: product.seoDescription || product.shortDescription,
        path: `/products/${product.slug}`,
        settings: res.locals.settings,
      }),
      product,
      related: related.map(decorateProductThumb),
      structuredData: [
        productSchema(product, baseUrl),
        breadcrumbSchema(
          [
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: product.name, path: `/products/${product.slug}` },
          ],
          baseUrl
        ),
      ],
    });
  } catch (err) {
    next(err);
  }
}

function decorateProductThumb(product) {
  const images = (product.images || []).sort((a, b) => a.order - b.order);
  const primary = images[0];
  return {
    ...product,
    thumbUrl: primary ? toDataUri(primary.thumbnail) : '',
  };
}

/* -------------------------------- API --------------------------------- */

async function apiList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { published: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.marbleType) filter.marbleType = req.query.marbleType;
    if (req.query.q) filter.$text = { $search: req.query.q };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .sort({ featured: -1, createdAt: -1 })
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products.map(decorateProductThumb),
      pagination: { page, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------- ADMIN -------------------------------- */

async function adminList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 20;
    const filter = {};
    if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.render('admin/products/list', {
      title: 'Products',
      layout: 'layouts/admin',
      products: products.map(decorateProductThumb),
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      q: req.query.q || '',
    });
  } catch (err) {
    next(err);
  }
}

async function adminNewForm(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.render('admin/products/form', {
      title: 'Add Product',
      layout: 'layouts/admin',
      product: null,
      categories,
    });
  } catch (err) {
    next(err);
  }
}

async function adminEditForm(req, res, next) {
  try {
    const [product, categories] = await Promise.all([
      Product.findById(req.params.id).lean(),
      Category.find().sort({ name: 1 }).lean(),
    ]);
    if (!product) return res.status(404).render('404', { title: 'Product Not Found', layout: false });

    product.images = (product.images || []).map((img) => ({
      ...img,
      thumbUrl: toDataUri(img.thumbnail),
    }));

    res.render('admin/products/form', {
      title: 'Edit Product',
      layout: 'layouts/admin',
      product,
      categories,
    });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const body = req.body;
    const slug = await makeUniqueSlug(body.name);

    const images = [];
    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i += 1) {
        const file = req.files[i];
        // eslint-disable-next-line no-await-in-loop
        const processed = await processImageToBase64(file.buffer, file.mimetype, 'product', {
          alt: body.name,
          order: i,
        });
        images.push(processed);
      }
    }

    const product = await Product.create({
      name: body.name,
      slug,
      category: body.category,
      subcategory: body.subcategory,
      shortDescription: body.shortDescription,
      description: body.description,
      craftsmanship: body.craftsmanship,
      marbleType: body.marbleType,
      availableSizes: splitLines(body.availableSizes),
      dimensions: {
        height: body.height,
        width: body.width,
        depth: body.depth,
      },
      finish: body.finish,
      customizationAvailable: body.customizationAvailable === 'on',
      deliveryInfo: body.deliveryInfo,
      images,
      featured: body.featured === 'on',
      published: body.published === 'on',
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    });

    req.flash('success', `Product "${product.name}" created.`);
    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render('404', { title: 'Product Not Found', layout: false });

    const body = req.body;

    if (body.name && body.name !== product.name) {
      product.slug = await makeUniqueSlug(body.name, product._id);
    }

    Object.assign(product, {
      name: body.name,
      subcategory: body.subcategory,
      category: body.category,
      shortDescription: body.shortDescription,
      description: body.description,
      craftsmanship: body.craftsmanship,
      marbleType: body.marbleType,
      availableSizes: splitLines(body.availableSizes),
      dimensions: { height: body.height, width: body.width, depth: body.depth },
      finish: body.finish,
      customizationAvailable: body.customizationAvailable === 'on',
      deliveryInfo: body.deliveryInfo,
      featured: body.featured === 'on',
      published: body.published === 'on',
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    });

    if (req.files && req.files.length) {
      const startOrder = product.images.length;
      for (let i = 0; i < req.files.length; i += 1) {
        const file = req.files[i];
        // eslint-disable-next-line no-await-in-loop
        const processed = await processImageToBase64(file.buffer, file.mimetype, 'product', {
          alt: body.name,
          order: startOrder + i,
        });
        product.images.push(processed);
      }
    }

    await product.save();
    req.flash('success', `Product "${product.name}" updated.`);
    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
}

async function adminDeleteImage(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found.' });
    product.images = product.images.filter((img) => String(img._id) !== req.params.imageId);
    await product.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'Product deleted.');
    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
}

async function adminTogglePublish(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false });
    product.published = !product.published;
    await product.save();
    res.json({ success: true, published: product.published });
  } catch (err) {
    next(err);
  }
}

function splitLines(text) {
  if (!text) return [];
  return text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  publicList,
  publicDetail,
  apiList,
  adminList,
  adminNewForm,
  adminEditForm,
  adminCreate,
  adminUpdate,
  adminDelete,
  adminDeleteImage,
  adminTogglePublish,
  decorateProductThumb,
};
