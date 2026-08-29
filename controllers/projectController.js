const slugify = require('slugify');
const Project = require('../models/Project');
const { processImageToBase64, toDataUri } = require('../services/imageService');
const { buildMeta } = require('../services/seoService');

async function makeUniqueSlug(title, excludeId) {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Project.exists({ slug, _id: { $ne: excludeId } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function decorate(project) {
  const images = (project.images || []).sort((a, b) => a.order - b.order);
  return {
    ...project,
    coverUrl: images[0] ? toDataUri(images[0].medium) : '',
    images: images.map((img) => ({ ...img, mediumUrl: toDataUri(img.medium) })),
  };
}

/* -------------------------------- PUBLIC -------------------------------- */

async function publicList(req, res, next) {
  try {
    const projects = await Project.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.render('projects', {
      title: 'Temple Projects',
      meta: buildMeta({
        title: 'Temple Projects & Large Marble Installations',
        description: 'A portfolio of temple statue installations and large-scale marble projects across India and abroad.',
        path: '/temple-projects',
        settings: res.locals.settings,
      }),
      projects: projects.map(decorate),
    });
  } catch (err) {
    next(err);
  }
}

async function publicDetail(req, res, next) {
  try {
    const project = await Project.findOne({ slug: req.params.slug, published: true }).lean();
    if (!project) return res.status(404).render('404', { title: 'Project Not Found', layout: false });
    res.render('project-detail', {
      title: project.title,
      meta: buildMeta({
        title: project.title,
        description: project.description,
        path: `/temple-projects/${project.slug}`,
        settings: res.locals.settings,
      }),
      project: decorate(project),
    });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------- ADMIN -------------------------------- */

async function adminList(req, res, next) {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
    res.render('admin/projects/list', { title: 'Temple Projects', layout: 'layouts/admin', projects: projects.map(decorate) });
  } catch (err) {
    next(err);
  }
}

async function adminNewForm(req, res) {
  res.render('admin/projects/form', { title: 'Add Project', layout: 'layouts/admin', project: null });
}

async function adminEditForm(req, res, next) {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).render('404', { title: 'Project Not Found', layout: false });
    res.render('admin/projects/form', { title: 'Edit Project', layout: 'layouts/admin', project: decorate(project) });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const body = req.body;
    const slug = await makeUniqueSlug(body.title);
    const images = [];
    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i += 1) {
        const file = req.files[i];
        // eslint-disable-next-line no-await-in-loop
        images.push(await processImageToBase64(file.buffer, file.mimetype, 'gallery', { alt: body.title, order: i }));
      }
    }
    await Project.create({
      title: body.title,
      slug,
      location: body.location,
      projectType: body.projectType,
      description: body.description,
      statueSize: body.statueSize,
      marbleType: body.marbleType,
      completionDate: body.completionDate || undefined,
      servicesProvided: splitLines(body.servicesProvided),
      images,
      published: body.published === 'on',
      order: Number(body.order) || 0,
    });
    req.flash('success', 'Project created.');
    res.redirect('/admin/projects');
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).render('404', { title: 'Project Not Found', layout: false });
    const body = req.body;

    if (body.title && body.title !== project.title) {
      project.slug = await makeUniqueSlug(body.title, project._id);
    }

    Object.assign(project, {
      title: body.title,
      location: body.location,
      projectType: body.projectType,
      description: body.description,
      statueSize: body.statueSize,
      marbleType: body.marbleType,
      completionDate: body.completionDate || undefined,
      servicesProvided: splitLines(body.servicesProvided),
      published: body.published === 'on',
      order: Number(body.order) || 0,
    });

    if (req.files && req.files.length) {
      const startOrder = project.images.length;
      for (let i = 0; i < req.files.length; i += 1) {
        const file = req.files[i];
        // eslint-disable-next-line no-await-in-loop
        project.images.push(
          await processImageToBase64(file.buffer, file.mimetype, 'gallery', { alt: body.title, order: startOrder + i })
        );
      }
    }

    await project.save();
    req.flash('success', 'Project updated.');
    res.redirect('/admin/projects');
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await Project.findByIdAndDelete(req.params.id);
    req.flash('success', 'Project deleted.');
    res.redirect('/admin/projects');
  } catch (err) {
    next(err);
  }
}

function splitLines(text) {
  if (!text) return [];
  return text.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
}

module.exports = { publicList, publicDetail, adminList, adminNewForm, adminEditForm, adminCreate, adminUpdate, adminDelete };
