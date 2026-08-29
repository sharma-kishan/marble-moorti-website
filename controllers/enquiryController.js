const Enquiry = require('../models/Enquiry');
const Product = require('../models/Product');
const { processImageToBase64, toDataUri } = require('../services/imageService');

const PAGE_SIZE = 20;

function decorate(enquiry) {
  return {
    ...enquiry,
    referenceImages: (enquiry.referenceImages || []).map((img) => ({
      ...img,
      thumbUrl: toDataUri(img.thumbnail),
      mediumUrl: toDataUri(img.medium),
    })),
  };
}

/* -------------------------------- PUBLIC -------------------------------- */

/** Renders the standalone "Request a Quote" page, optionally pre-filled from a product page. */
async function quoteForm(req, res, next) {
  try {
    let product = null;
    if (req.query.product) {
      product = await Product.findOne({ slug: req.query.product, published: true }).lean();
    }
    res.render('quote', {
      title: 'Request a Quote',
      meta: {
        title: 'Request a Quote | Custom & Ready Marble Statues',
        description: 'Tell us about the marble statue you need and our team will get back to you with a quote.',
        canonical: `${process.env.BASE_URL || ''}/request-quote`,
      },
      product,
    });
  } catch (err) {
    next(err);
  }
}

async function submitEnquiry(req, res, next) {
  try {
    const body = req.body;

    const referenceImages = [];
    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i += 1) {
        const file = req.files[i];
        // eslint-disable-next-line no-await-in-loop
        referenceImages.push(
          await processImageToBase64(file.buffer, file.mimetype, 'gallery', { alt: 'Reference image', order: i })
        );
      }
    }

    const enquiryId = await Enquiry.generateEnquiryId();

    const enquiry = await Enquiry.create({
      enquiryId,
      name: body.name,
      phone: body.phone,
      whatsapp: body.whatsapp,
      email: body.email,
      country: body.country,
      city: body.city,
      product: body.productId || undefined,
      productName: body.product || body.productName || '',
      category: body.category || undefined,
      height: body.height,
      quantity: Number(body.quantity) || 1,
      marblePreference: body.marblePreference,
      requiredDate: body.requiredDate || undefined,
      deliveryLocation: body.deliveryLocation,
      message: body.message,
      referenceImages,
      source: body.source || 'website',
    });

    if (req.originalUrl.startsWith('/api/')) {
      return res.status(201).json({ success: true, enquiryId: enquiry.enquiryId });
    }

    req.flash('success', `Thank you! Your enquiry has been received. Your reference ID is ${enquiry.enquiryId}. Our team will contact you shortly.`);
    return res.redirect('/thank-you?ref=' + enquiry.enquiryId);
  } catch (err) {
    next(err);
  }
}

/* -------------------------------- ADMIN -------------------------------- */

async function adminList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      filter.$or = [
        { name: { $regex: req.query.q, $options: 'i' } },
        { phone: { $regex: req.query.q, $options: 'i' } },
        { email: { $regex: req.query.q, $options: 'i' } },
        { enquiryId: { $regex: req.query.q, $options: 'i' } },
      ];
    }

    const [enquiries, total, newCount] = await Promise.all([
      Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate('product', 'name')
        .lean(),
      Enquiry.countDocuments(filter),
      Enquiry.countDocuments({ status: 'New' }),
    ]);

    res.render('admin/enquiries/list', {
      title: 'Enquiries',
      layout: 'layouts/admin',
      enquiries,
      total,
      newCount,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      statuses: Enquiry.STATUSES,
      filters: req.query,
    });
  } catch (err) {
    next(err);
  }
}

async function adminView(req, res, next) {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('product', 'name slug')
      .populate('adminNotes.addedBy', 'name')
      .lean();
    if (!enquiry) return res.status(404).render('404', { title: 'Enquiry Not Found', layout: false });

    res.render('admin/enquiries/detail', {
      title: `Enquiry ${enquiry.enquiryId}`,
      layout: 'layouts/admin',
      enquiry: decorate(enquiry),
      statuses: Enquiry.STATUSES,
    });
  } catch (err) {
    next(err);
  }
}

async function adminUpdateStatus(req, res, next) {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false });
    enquiry.status = req.body.status;
    await enquiry.save();
    if (req.originalUrl.startsWith('/api/')) return res.json({ success: true, status: enquiry.status });
    req.flash('success', 'Enquiry status updated.');
    res.redirect(`/admin/enquiries/${enquiry._id}`);
  } catch (err) {
    next(err);
  }
}

async function adminAddNote(req, res, next) {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).render('404', { title: 'Enquiry Not Found', layout: false });
    if (req.body.note && req.body.note.trim()) {
      enquiry.adminNotes.push({ note: req.body.note.trim(), addedBy: req.admin?._id });
      await enquiry.save();
      req.flash('success', 'Note added.');
    }
    res.redirect(`/admin/enquiries/${enquiry._id}`);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    req.flash('success', 'Enquiry deleted.');
    res.redirect('/admin/enquiries');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  quoteForm,
  submitEnquiry,
  adminList,
  adminView,
  adminUpdateStatus,
  adminAddNote,
  adminDelete,
};
