# Vishnu Moorti Kala Centre — Website & Admin Panel

A production-ready website and admin panel for a marble statue / moorti manufacturing business in Jaipur, Rajasthan. Built with Node.js, Express, MongoDB (Mongoose), and server-rendered EJS templates. All images are compressed with `sharp` and stored as Base64 strings directly in MongoDB — there is no dependency on S3, Cloudinary, or local disk storage for uploads.

---

## 1. Requirements

- Node.js 18 or later
- A MongoDB database (local install or a hosted service such as MongoDB Atlas)

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure MongoDB

Make sure MongoDB is running and reachable. For a local install:

```bash
mongod --dbpath /path/to/your/data/directory
```

Or use a hosted connection string from MongoDB Atlas — either works, since the app only needs a `MONGODB_URI`.

## 4. Configure Environment Variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on (default `3000`) |
| `BASE_URL` | Public URL of the site, used for canonical links, sitemap, and structured data |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign admin auth tokens — set this to a long random string |
| `SESSION_SECRET` | Secret used for session/flash messages |
| `COOKIE_SECURE` | Set to `true` in production behind HTTPS |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed/create-admin scripts to create the first admin account |
| `WHATSAPP_NUMBER`, `BUSINESS_PHONE`, `BUSINESS_EMAIL` | Optional starting values for Site Settings |

**Never commit your `.env` file.**

## 5. Create the Admin User

Two options:

```bash
# Option A — creates the admin using ADMIN_EMAIL / ADMIN_PASSWORD from .env
npm run create-admin

# Option B — pass values directly
node scripts/createAdmin.js --email owner@yourdomain.com --password "SomeStrongPassword!" --name "Owner"
```

Running it again with the same email updates that admin's password rather than creating a duplicate.

## 6. Seed the Database (optional but recommended for first run)

```bash
npm run seed
```

This creates:
- Sample categories, products, gallery images, a temple project, and testimonials — all clearly demo content, using solid-colour placeholder images generated locally (no external downloads required)
- The default admin account, if one doesn't already exist
- A `SiteSettings` document so the site has sensible starting values

**Replace all placeholder images and demo copy from the admin panel before going live.** No real business facts (years of operation, statue counts, temples served, etc.) are ever fabricated by this script — those fields stay blank until you fill them in at `/admin/settings`.

## 7. Run in Development

```bash
npm run dev
```

Uses `nodemon` to restart on file changes. Visit:
- Website: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## 8. Run in Production

```bash
NODE_ENV=production npm start
```

Recommended production setup:
- Run behind a process manager (`pm2`, `systemd`, or your host's equivalent)
- Put Nginx or another reverse proxy in front, terminating HTTPS
- Set `COOKIE_SECURE=true` once HTTPS is active
- Set `BASE_URL` to your real domain so canonical URLs, sitemap.xml, and structured data are correct

## 9. How Base64 Images Work

Every uploaded image (product photos, gallery images, category images, testimonial photos, logo, hero image, and quote-request reference images) goes through the same pipeline:

1. `multer` receives the file in memory (never written to disk).
2. The MIME type is validated (`image/jpeg`, `image/png`, `image/webp` only).
3. `sharp` generates three resized WebP variants — thumbnail (~400px), medium (~900px), and original (~1800px) — each compressed for its use case.
4. Each variant is stored as a raw Base64 string, alongside its MIME type, directly inside the relevant MongoDB document.
5. Views render them as `data:image/webp;base64,...` URIs, always choosing the smallest variant that fits the context (thumbnails on listing/grid pages, medium on detail pages, original for the lightbox/zoom view).

If a processed image would still exceed the configured size ceiling (3MB for products/hero, 2MB for gallery/general), the upload is rejected with a clear error rather than silently saved — see `services/imageService.js` for the exact limits.

Gallery images are stored one-per-document (not embedded arrays inside a single document) specifically so listing pages can paginate without loading hundreds of Base64 blobs at once.

## 10. Changing Business Information

Everything specific to the business — name, logo, phone, WhatsApp, email, address, working hours, social links, Google Maps embed, homepage hero content and trust statistics, footer text, and SEO defaults — is editable from **Admin → Website Settings** (`/admin/settings`). Nothing is hardcoded in the templates, and no statistic is invented: if a field like "Years of Craftsmanship" is left blank, the homepage simply omits that statistic rather than showing a placeholder number.

---

## Project Structure

```
marble-moorti-website/
├── app.js                 # Express app configuration
├── server.js               # Entry point — connects DB, starts server
├── config/database.js      # MongoDB connection
├── models/                 # Mongoose schemas (Admin, Product, Category, Gallery,
│                            #   Project, Testimonial, Enquiry, SiteSettings)
├── controllers/             # Route handlers (public + admin + JSON API)
├── routes/                  # public.js, products.js, admin.js, api.js
├── middleware/               # auth, upload, validation, errorHandler, loginLimiter
├── services/                 # imageService (Base64 pipeline), seoService
├── views/                    # EJS templates: layouts/, partials/, public pages, admin/
├── public/                   # css/, js/ — static assets served directly
├── scripts/                  # seed.js, createAdmin.js
└── .env.example
```

## Key Workflows

- **Admin login:** `/admin/login` — JWT is issued and stored in an httpOnly cookie; sessions last 7 days.
- **Product CRUD:** `/admin/products` — create, edit, publish/unpublish, delete, manage per-image removal.
- **Category / Gallery / Temple Projects / Testimonials CRUD:** same pattern under `/admin/<section>`.
- **Enquiries:** every "Request a Quote" and "Contact" form submission is saved with an auto-generated ID (e.g. `VMK-20260823-0001`), visible and manageable at `/admin/enquiries`, including status changes and internal notes.
- **Public REST API:** `/api/products`, `/api/categories`, `/api/gallery`, `/api/projects`, `/api/testimonials`, `/api/settings` (public-safe fields only), plus `/api/enquiries` and `/api/contact` for programmatic submissions.
- **SEO:** `/sitemap.xml` and `/robots.txt` are generated dynamically; every page sets canonical URLs, Open Graph/Twitter tags, and relevant Schema.org structured data (LocalBusiness, Product, BreadcrumbList).

## Security Notes

- Passwords are hashed with bcrypt (12 rounds).
- Admin routes are protected by JWT-in-httpOnly-cookie middleware; the login endpoint is separately rate-limited.
- Helmet sets a Content-Security-Policy and standard security headers.
- `express-mongo-sanitize` strips Mongo operator injection attempts from input.
- The entire admin panel (`/admin/*` pages and their matching `/api/admin/*` fetch endpoints) is protected by session-based CSRF tokens (`csurf`). Regular forms carry the token as a hidden field; file-upload forms carry it in the form action's query string (since the token must be readable before multer parses the multipart body); `fetch()` calls from the admin panel send it via a `CSRF-Token` header. The public quote/contact forms are intentionally left token-free since they're anonymous, unauthenticated submissions — worst case there is enquiry spam, not a state-changing attack on a logged-in session.
- File uploads are validated by MIME type and size before processing; nothing is ever written to disk.
- The public API only ever returns non-sensitive Site Settings fields — enquiry details, admin notes, and credentials are never exposed outside the authenticated admin routes.
