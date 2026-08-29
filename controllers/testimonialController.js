const Testimonial = require('../models/Testimonial');
const { processImageToBase64, toDataUri } = require('../services/imageService');
const { buildMeta } = require('../services/seoService');

function decorate(t) {
  return { ...t, photoUrl: t.photo ? toDataUri(t.photo.thumbnail) : '' };
}

/* -------------------------------- PUBLIC -------------------------------- */

async function publicList(req, res, next) {
  try {
    const testimonials = await Testimonial.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.render('testimonials', {
      title: 'Testimonials',
      meta: buildMeta({
        title: 'Customer Testimonials',
        description: 'What temples, priests, and homeowners say about our handcrafted marble statues.',
        path: '/testimonials',
        settings: res.locals.settings,
      }),
      testimonials: testimonials.map(decorate),
    });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------- ADMIN -------------------------------- */

async function adminList(req, res, next) {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 }).lean();
    res.render('admin/testimonials/list', {
      title: 'Testimonials',
      layout: 'layouts/admin',
      testimonials: testimonials.map(decorate),
    });
  } catch (err) {
    next(err);
  }
}

async function adminNewForm(req, res) {
  res.render('admin/testimonials/form', { title: 'Add Testimonial', layout: 'layouts/admin', testimonial: null });
}

async function adminEditForm(req, res, next) {
  try {
    const testimonial = await Testimonial.findById(req.params.id).lean();
    if (!testimonial) return res.status(404).render('404', { title: 'Testimonial Not Found', layout: false });
    res.render('admin/testimonials/form', {
      title: 'Edit Testimonial',
      layout: 'layouts/admin',
      testimonial: decorate(testimonial),
    });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const body = req.body;
    let photo = null;
    if (req.file) {
      photo = await processImageToBase64(req.file.buffer, req.file.mimetype, 'general', { alt: body.name });
    }
    await Testimonial.create({
      name: body.name,
      location: body.location,
      rating: Number(body.rating) || 5,
      review: body.review,
      photo,
      published: body.published === 'on',
      order: Number(body.order) || 0,
    });
    req.flash('success', 'Testimonial added.');
    res.redirect('/admin/testimonials');
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).render('404', { title: 'Testimonial Not Found', layout: false });
    const body = req.body;
    Object.assign(testimonial, {
      name: body.name,
      location: body.location,
      rating: Number(body.rating) || 5,
      review: body.review,
      published: body.published === 'on',
      order: Number(body.order) || 0,
    });
    if (req.file) {
      testimonial.photo = await processImageToBase64(req.file.buffer, req.file.mimetype, 'general', {
        alt: body.name,
      });
    }
    await testimonial.save();
    req.flash('success', 'Testimonial updated.');
    res.redirect('/admin/testimonials');
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    req.flash('success', 'Testimonial deleted.');
    res.redirect('/admin/testimonials');
  } catch (err) {
    next(err);
  }
}

module.exports = { publicList, adminList, adminNewForm, adminEditForm, adminCreate, adminUpdate, adminDelete };
