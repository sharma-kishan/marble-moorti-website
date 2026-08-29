/**
 * Small helpers for building consistent per-page SEO metadata and
 * Schema.org structured data. Views pass the result straight into
 * partials/head.ejs.
 */

function buildMeta({ title, description, path, settings, image }) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const suffix = settings?.seoDefaults?.titleSuffix || '';
  const fullTitle = suffix && !title.includes(suffix) ? `${title} | ${suffix}` : title;

  return {
    title: fullTitle,
    description: description || settings?.seoDefaults?.description || '',
    canonical: `${baseUrl}${path || ''}`,
    image: image || '',
    baseUrl,
  };
}

function localBusinessSchema(settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings?.businessName || 'Vishnu Moorti Kala Centre',
    description: settings?.seoDefaults?.description || '',
    telephone: settings?.phone || undefined,
    email: settings?.email || undefined,
    address: settings?.address
      ? { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: 'Jaipur', addressRegion: 'Rajasthan', addressCountry: 'IN' }
      : undefined,
    sameAs: [settings?.social?.instagram, settings?.social?.facebook, settings?.social?.youtube].filter(Boolean),
  };
}

function productSchema(product, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    category: product.subcategory || undefined,
    url: `${baseUrl}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/products/${product.slug}`,
    },
  };
}

function breadcrumbSchema(items, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

module.exports = { buildMeta, localBusinessSchema, productSchema, breadcrumbSchema };
