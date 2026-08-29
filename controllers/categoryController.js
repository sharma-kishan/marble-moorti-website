const slugify = require('slugify');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { processImageToBase64, toDataUri } = require('../services/imageService');
const { buildMeta } = require('../services/seoService');

async function makeUniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Category.exists({ slug, _id: { $ne: excludeId } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function decorate(cat) {
  return { ...cat, imageUrl: cat.image ? toDataUri(cat.image.thumbnail) : '' };
}

/* -------------------------------- PUBLIC -------------------------------- */

async function publicList(req, res, next) {
  try {
    const categories = await Category.find({ published: true }).sort({ order: 1 }).lean();
    const grouped = categories.reduce((acc, cat) => {
      acc[cat.group] = acc[cat.group] || [];
      acc[cat.group].push(decorate(cat));
      return acc;
    }, {});

    res.render('categories', {
      title: 'Statue Categories',
      meta: buildMeta({
        title: 'Marble Statue Categories',
        description: 'Explore Hindu deities, Jain statues, temple statues and custom marble art categories.',
        path: '/categories',
        settings: res.locals.settings,
      }),
      grouped,
    });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------- ADMIN -------------------------------- */

async function adminList(req, res, next) {
  try {
    const categories = await Category.find().sort({ order: 1 }).lean();
    const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.render('admin/categories/list', {
      title: 'Categories',
      layout: 'layouts/admin',
      categories: categories.map((c) => ({ ...decorate(c), productCount: countMap[String(c._id)] || 0 })),
    });
  } catch (err) {
    next(err);
  }
}

async function adminNewForm(req, res) {
  res.render('admin/categories/form', { title: 'Add Category', layout: 'layouts/admin', category: null });
}

async function adminEditForm(req, res, next) {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) return res.status(404).render('404', { title: 'Category Not Found', layout: false });
    res.render('admin/categories/form', {
      title: 'Edit Category',
      layout: 'layouts/admin',
      category: decorate(category),
    });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const body = req.body;
    const slug = await makeUniqueSlug(body.name);
    let image = null;
    if (req.file) {
      image = await processImageToBase64(req.file.buffer, req.file.mimetype, 'general', { alt: body.name });
    }
    await Category.create({
      name: body.name,
      slug,
      group: body.group,
      description: body.description,
      image,
      published: body.published === 'on',
      order: Number(body.order) || 0,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    });
    req.flash('success', 'Category created.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).render('404', { title: 'Category Not Found', layout: false });
    const body = req.body;

    if (body.name && body.name !== category.name) {
      category.slug = await makeUniqueSlug(body.name, category._id);
    }

    Object.assign(category, {
      name: body.name,
      group: body.group,
      description: body.description,
      published: body.published === 'on',
      order: Number(body.order) || 0,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    });

    if (req.file) {
      category.image = await processImageToBase64(req.file.buffer, req.file.mimetype, 'general', {
        alt: body.name,
      });
    }

    await category.save();
    req.flash('success', 'Category updated.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const inUse = await Product.exists({ category: req.params.id });
    if (inUse) {
      req.flash('error', 'Cannot delete a category that still has products. Reassign those products first.');
      return res.redirect('/admin/categories');
    }
    await Category.findByIdAndDelete(req.params.id);
    req.flash('success', 'Category deleted.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
}

module.exports = { publicList, adminList, adminNewForm, adminEditForm, adminCreate, adminUpdate, adminDelete };
