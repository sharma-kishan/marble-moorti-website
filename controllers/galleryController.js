const Gallery = require('../models/Gallery');
const { processImageToBase64, toDataUri } = require('../services/imageService');
const { buildMeta } = require('../services/seoService');

const PAGE_SIZE = 24;

function decorate(item) {
  return {
    ...item,
    thumbUrl: toDataUri(item.image.thumbnail),
    mediumUrl: toDataUri(item.image.medium),
  };
}

/* -------------------------------- PUBLIC -------------------------------- */

async function publicList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { published: true };
    if (req.query.category) filter.category = req.query.category;

    const [images, total] = await Promise.all([
      Gallery.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Gallery.countDocuments(filter),
    ]);

    res.render('gallery', {
      title: 'Gallery',
      meta: buildMeta({
        title: 'Marble Craftsmanship Gallery',
        description: 'Workshop, carving process, temple installations and finished marble statues from Jaipur.',
        path: '/gallery',
        settings: res.locals.settings,
      }),
      images: images.map(decorate),
      categories: Gallery.schema.path('category').enumValues,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      activeCategory: req.query.category || '',
    });
  } catch (err) {
    next(err);
  }
}

async function apiList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { published: true };
    if (req.query.category) filter.category = req.query.category;

    const [images, total] = await Promise.all([
      Gallery.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Gallery.countDocuments(filter),
    ]);

    res.json({ success: true, data: images.map(decorate), pagination: { page, total } });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------- ADMIN -------------------------------- */

async function adminList(req, res, next) {
  try {
    const images = await Gallery.find().sort({ order: 1, createdAt: -1 }).lean();
    res.render('admin/gallery/list', {
      title: 'Gallery',
      layout: 'layouts/admin',
      images: images.map(decorate),
      categories: Gallery.schema.path('category').enumValues,
    });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const body = req.body;
    if (!req.files || !req.files.length) {
      req.flash('error', 'Please choose at least one image to upload.');
      return res.redirect('/admin/gallery');
    }

    const docs = [];
    for (let i = 0; i < req.files.length; i += 1) {
      const file = req.files[i];
      // eslint-disable-next-line no-await-in-loop
      const image = await processImageToBase64(file.buffer, file.mimetype, 'gallery', {
        alt: body.title,
      });
      docs.push({
        title: body.title || file.originalname,
        category: body.category,
        description: body.description,
        image,
        published: body.published === 'on',
        order: Number(body.order) || 0,
      });
    }

    await Gallery.insertMany(docs);
    req.flash('success', `${docs.length} image(s) added to gallery.`);
    res.redirect('/admin/gallery');
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false });
    const body = req.body;
    Object.assign(item, {
      title: body.title,
      category: body.category,
      description: body.description,
      published: body.published === 'on',
      order: Number(body.order) || 0,
    });
    if (req.file) {
      item.image = await processImageToBase64(req.file.buffer, req.file.mimetype, 'gallery', {
        alt: body.title,
      });
    }
    await item.save();
    req.flash('success', 'Gallery image updated.');
    res.redirect('/admin/gallery');
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function adminReorder(req, res, next) {
  try {
    const { order } = req.body; // array of { id, order }
    await Promise.all(
      order.map((item) => Gallery.findByIdAndUpdate(item.id, { order: item.order }))
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { publicList, apiList, adminList, adminCreate, adminUpdate, adminDelete, adminReorder };
