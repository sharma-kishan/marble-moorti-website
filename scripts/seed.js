/**
 * Seeds the database with sample categories, products, testimonials, and a
 * temple project — all clearly marked as demo data where applicable — plus
 * a default admin account from environment variables.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const sharp = require('sharp');
const slugify = require('slugify');

const connectDatabase = require('../config/database');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Gallery = require('../models/Gallery');
const Project = require('../models/Project');
const Testimonial = require('../models/Testimonial');
const SiteSettings = require('../models/SiteSettings');
const { processImageToBase64 } = require('../services/imageService');

/** Generates a simple solid-colour placeholder image so seeding never depends on network access. */
async function placeholderBuffer(hex, width = 1200, height = 1200) {
  const rgb = hexToRgb(hex);
  return sharp({
    create: { width, height, channels: 3, background: rgb },
  })
    .png()
    .toBuffer();
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

async function placeholderImage(hex, kind, alt) {
  const buffer = await placeholderBuffer(hex);
  return processImageToBase64(buffer, 'image/png', kind, { alt });
}

async function uniqueSlug(Model, name) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin account already exists (${email}) — skipping.`);
    return;
  }
  const passwordHash = await Admin.hashPassword(process.env.ADMIN_PASSWORD || 'change_this_password');
  await Admin.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email,
    passwordHash,
    role: 'superadmin',
  });
  console.log(`Created default admin account: ${email}`);
}

async function seedSettings() {
  const settings = await SiteSettings.getSiteSettings();
  settings.whatsapp = settings.whatsapp || process.env.WHATSAPP_NUMBER || '';
  settings.phone = settings.phone || process.env.BUSINESS_PHONE || '';
  settings.email = settings.email || process.env.BUSINESS_EMAIL || '';
  await settings.save();
  console.log('Site settings ready. Fill in remaining business details from /admin/settings.');
}

const CATEGORY_DEFS = [
  { name: 'Ganesh Murti', group: 'Hindu Deities', color: '#C9A24B' },
  { name: 'Radha Krishna', group: 'Hindu Deities', color: '#9C7A2E' },
  { name: 'Shiva', group: 'Hindu Deities', color: '#3B2A1E' },
  { name: 'Durga Mata', group: 'Hindu Deities', color: '#A6812F' },
  { name: 'Lakshmi Mata', group: 'Hindu Deities', color: '#D8BE7A' },
  { name: 'Jain Tirthankar', group: 'Jain Statues', color: '#8A7F6E' },
  { name: 'Temple Idols', group: 'Temple Statues', color: '#2A2520' },
  { name: 'Custom Portrait Sculptures', group: 'Custom Marble Art', color: '#B79A5E' },
];

const PRODUCT_DEFS = [
  {
    name: 'Marble Ganesh Murti — Seated',
    category: 'Ganesh Murti',
    marbleType: 'Makrana White',
    shortDescription: 'A serene seated Ganesh murti, hand-carved from Makrana white marble with fine detailing.',
    featured: true,
  },
  {
    name: 'Radha Krishna Marble Statue — Under the Kadamba',
    category: 'Radha Krishna',
    marbleType: 'Makrana White',
    shortDescription: 'Radha Krishna carved in a classic pose, finished with a smooth polish suitable for home temples.',
    featured: true,
  },
  {
    name: 'Shiva Marble Statue — Meditative Pose',
    category: 'Shiva',
    marbleType: 'Italian Marble',
    shortDescription: 'A meditative Shiva statue in Italian marble, carved with traditional iconography.',
    featured: false,
  },
  {
    name: 'Durga Mata Marble Murti — Mahishasura Mardini',
    category: 'Durga Mata',
    marbleType: 'Makrana White',
    shortDescription: 'Durga Mata in her Mahishasura Mardini form, hand-finished with fine ornamentation.',
    featured: true,
  },
  {
    name: 'Lakshmi Mata Marble Murti',
    category: 'Lakshmi Mata',
    marbleType: 'Makrana Pink',
    shortDescription: 'A graceful Lakshmi murti in Makrana pink marble, ideal for home and temple worship.',
    featured: false,
  },
  {
    name: 'Jain Tirthankar Marble Statue — Padmasana',
    category: 'Jain Tirthankar',
    marbleType: 'Makrana White',
    shortDescription: 'A Tirthankar statue seated in padmasana, carved with the calm expression traditional to Jain iconography.',
    featured: true,
  },
];

async function seedCategories() {
  const map = {};
  for (const def of CATEGORY_DEFS) {
    // eslint-disable-next-line no-await-in-loop
    let category = await Category.findOne({ name: def.name });
    if (!category) {
      // eslint-disable-next-line no-await-in-loop
      const slug = await uniqueSlug(Category, def.name);
      // eslint-disable-next-line no-await-in-loop
      const image = await placeholderImage(def.color, 'general', def.name);
      // eslint-disable-next-line no-await-in-loop
      category = await Category.create({ name: def.name, slug, group: def.group, image, published: true });
      console.log(`Seeded category: ${def.name}`);
    }
    map[def.name] = category;
  }
  return map;
}

async function seedProducts(categoryMap) {
  for (const def of PRODUCT_DEFS) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Product.findOne({ name: def.name });
    if (existing) continue;

    // eslint-disable-next-line no-await-in-loop
    const slug = await uniqueSlug(Product, def.name);
    // eslint-disable-next-line no-await-in-loop
    const image = await placeholderImage(categoryMap[def.category]?.image?.thumbnail ? '#C9A24B' : '#C9A24B', 'product', def.name);

    // eslint-disable-next-line no-await-in-loop
    await Product.create({
      name: def.name,
      slug,
      category: categoryMap[def.category]._id,
      shortDescription: def.shortDescription,
      description: `${def.shortDescription} This is demo content — replace it with your own product description from the admin panel.`,
      craftsmanship: 'Hand carved and finished by artisans in Jaipur using traditional chisel work, followed by hand polishing.',
      marbleType: def.marbleType,
      availableSizes: ['12 inch', '24 inch', 'Custom'],
      finish: 'Hand-polished',
      customizationAvailable: true,
      images: [image],
      featured: def.featured,
      published: true,
    });
    console.log(`Seeded product: ${def.name}`);
  }
}

async function seedGallery() {
  const count = await Gallery.countDocuments();
  if (count > 0) return;

  const items = [
    { title: 'Hand carving in progress', category: 'Carving Process', color: '#3B2A1E' },
    { title: 'Workshop floor', category: 'Workshop', color: '#8A7F6E' },
    { title: 'Finished Ganesh murti', category: 'Finished Statues', color: '#C9A24B' },
    { title: 'Temple installation', category: 'Installation', category2: true, color: '#2A2520' },
  ];

  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const image = await placeholderImage(item.color, 'gallery', item.title);
    // eslint-disable-next-line no-await-in-loop
    await Gallery.create({ title: item.title, category: item.category, image, published: true });
  }
  console.log('Seeded sample gallery images.');
}

async function seedProjects() {
  const count = await Project.countDocuments();
  if (count > 0) return;

  const slug = await uniqueSlug(Project, 'Sample Temple Installation');
  const image = await placeholderImage('#3B2A1E', 'gallery', 'Sample Temple Installation');
  await Project.create({
    title: 'Sample Temple Installation',
    slug,
    location: 'Demo Location',
    projectType: 'Temple Installation',
    description:
      'This is placeholder demo content for a temple project case study. Replace it with a real completed project from the admin panel.',
    statueSize: '5 feet',
    marbleType: 'Makrana White',
    servicesProvided: ['Carving', 'Finishing', 'Installation'],
    images: [image],
    published: true,
  });
  console.log('Seeded sample temple project (demo data).');
}

async function seedTestimonials() {
  const count = await Testimonial.countDocuments();
  if (count > 0) return;

  const samples = [
    { name: 'Demo Customer 1', location: 'Demo City', review: 'This is placeholder demo testimonial content — replace with real customer reviews.', rating: 5 },
    { name: 'Demo Customer 2', location: 'Demo City', review: 'This is placeholder demo testimonial content — replace with real customer reviews.', rating: 5 },
  ];
  for (const s of samples) {
    // eslint-disable-next-line no-await-in-loop
    await Testimonial.create({ ...s, published: true, isDemoData: true });
  }
  console.log('Seeded sample testimonials (marked as demo data).');
}

async function run() {
  await connectDatabase();

  await seedSettings();
  await seedAdmin();
  const categoryMap = await seedCategories();
  await seedProducts(categoryMap);
  await seedGallery();
  await seedProjects();
  await seedTestimonials();

  console.log('\nSeeding complete.');
  console.log('NOTE: Category/product/gallery images are solid-colour placeholders generated locally.');
  console.log('Replace them with real photography from the admin panel before going live.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
