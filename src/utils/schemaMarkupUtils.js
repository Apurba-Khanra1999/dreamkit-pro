/**
 * Schema.org & Google Rich Results JSON-LD Generation & Validation Utilities
 * Follows Google Search Central Structured Data Guidelines.
 */

export const SCHEMA_TYPES = [
  {
    id: 'Article',
    name: 'Article / Blog Post',
    category: 'Content',
    description: 'News articles, blog posts, and technical writeups eligible for Google Top Stories carousel and rich headlines.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/article'
  },
  {
    id: 'Product',
    name: 'Product & Offers',
    category: 'E-commerce',
    description: 'E-commerce items eligible for Google Shopping, price badges, in-stock indicators, and star ratings.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/product'
  },
  {
    id: 'FAQPage',
    name: 'FAQ Page',
    category: 'Content',
    description: 'Frequently Asked Questions accordion snippets appearing directly in Google search results.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage'
  },
  {
    id: 'LocalBusiness',
    name: 'Local Business',
    category: 'Business',
    description: 'Physical stores, restaurants, or offices appearing in Google Maps, local pack, and Knowledge Graph.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/local-business'
  },
  {
    id: 'Organization',
    name: 'Organization / Company',
    category: 'Business',
    description: 'Company logos, social media handles, official websites, and contact points in Google Knowledge Panel.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/organization'
  },
  {
    id: 'HowTo',
    name: 'How-To Guide',
    category: 'Tutorials',
    description: 'Step-by-step instructional guides with images, estimated time, and cost.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/how-to'
  },
  {
    id: 'BreadcrumbList',
    name: 'Breadcrumb Hierarchy',
    category: 'Navigation',
    description: 'Clear page path hierarchy (e.g. Books > Science Fiction > Dune) in Google search snippets.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb'
  },
  {
    id: 'JobPosting',
    name: 'Job Posting',
    category: 'Jobs',
    description: 'Job vacancies appearing in Google for Jobs search portal with salary, location, and employment type.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/job-posting'
  },
  {
    id: 'Event',
    name: 'Event',
    category: 'Events',
    description: 'Concerts, conferences, webinars, and festivals with date, location, and ticket booking links.',
    googleDoc: 'https://developers.google.com/search/docs/appearance/structured-data/event'
  },
  {
    id: 'Person',
    name: 'Person / Author',
    category: 'Profile',
    description: 'Author biographical data, job title, affiliated organization, and social profile links.',
    googleDoc: 'https://schema.org/Person'
  }
];

export const SCHEMA_PRESETS = {
  Article: {
    headline: 'Building High-Performance Web Applications with Vite and React',
    description: 'A comprehensive engineering guide on reducing bundle sizes, optimizing Core Web Vitals, and leveraging modern bundlers.',
    image: 'https://example.com/images/vite-guide.jpg',
    datePublished: '2026-10-30',
    dateModified: '2026-10-30',
    authorType: 'Person',
    authorName: 'Elena Rostova',
    authorUrl: 'https://example.com/authors/elena',
    publisherName: 'DreamKit Engineering',
    publisherLogo: 'https://example.com/logo.png',
    url: 'https://example.com/blog/vite-performance-guide'
  },
  Product: {
    name: 'Ultra Wireless Noise-Cancelling Headphones Pro',
    description: 'Premium wireless headphones featuring active noise cancellation, 40-hour battery life, and spatial audio.',
    image: 'https://example.com/images/headphones-pro.jpg',
    brand: 'AcousticLab',
    sku: 'AL-NC-900',
    price: '299.99',
    currency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://example.com/products/wireless-headphones-pro',
    hasRating: true,
    ratingValue: '4.9',
    reviewCount: '184'
  },
  FAQPage: {
    faqs: [
      {
        question: 'Is DreamKit completely client-side and private?',
        answer: 'Yes, 100% of the tools in DreamKit execute entirely in your web browser. No data, files, or tokens ever leave your machine.'
      },
      {
        question: 'Does DreamKit support offline usage as a PWA?',
        answer: 'Yes, DreamKit registers a service worker that caches application assets, allowing you to format, encode, and inspect code without an active internet connection.'
      },
      {
        question: 'How do I generate an RFC-compliant XML sitemap?',
        answer: 'Navigate to the XML Sitemap Generator tool in the SEO suite, paste your page URLs, configure change frequencies, and click Download.'
      }
    ]
  },
  LocalBusiness: {
    name: 'Artisan Coffee Roasters & Bakery',
    image: 'https://example.com/photos/storefront.jpg',
    telephone: '+1-555-019-2834',
    email: 'hello@artisancoffee.example',
    priceRange: '$$',
    streetAddress: '142 Market Street, Suite 100',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94102',
    addressCountry: 'US',
    url: 'https://artisancoffee.example',
    latitude: 37.7749,
    longitude: -122.4194
  },
  Organization: {
    name: 'DreamKit Technologies Inc.',
    url: 'https://dreamkit.dev',
    logo: 'https://dreamkit.dev/assets/logo.png',
    description: 'Empowering software engineers with privacy-first, in-browser developer utilities.',
    email: 'contact@dreamkit.dev',
    socials: [
      'https://github.com/dreamkit',
      'https://twitter.com/dreamkit_dev',
      'https://linkedin.com/company/dreamkit'
    ]
  },
  HowTo: {
    name: 'How to Build an RFC 9562 UUID v7 Generator',
    description: 'Learn how to generate millisecond-ordered UUID v7 identifiers using JavaScript Web Cryptography API.',
    totalTime: 'PT15M',
    estimatedCost: '0 USD',
    steps: [
      {
        name: 'Obtain Current Timestamp',
        text: 'Retrieve the 48-bit Unix epoch millisecond timestamp using Date.now().'
      },
      {
        name: 'Generate Cryptographic Randomness',
        text: 'Populate the remaining 74 bits with crypto.getRandomValues().'
      },
      {
        name: 'Apply Version & Variant Bits',
        text: 'Set version bits to 0111 (version 7) and variant bits to 10xx (RFC 4122 / 9562).'
      }
    ]
  },
  BreadcrumbList: {
    breadcrumbs: [
      { name: 'Home', url: 'https://example.com/' },
      { name: 'Documentation', url: 'https://example.com/docs' },
      { name: 'Developer Tools', url: 'https://example.com/docs/tools' },
      { name: 'Schema Markup Suite', url: 'https://example.com/docs/tools/schema' }
    ]
  },
  JobPosting: {
    title: 'Senior Frontend Engineer (React & TypeScript)',
    description: 'We are seeking an experienced frontend developer to build lightning-fast web applications and high-fidelity developer suites.',
    companyName: 'DreamKit Labs',
    employmentType: 'FULL_TIME',
    datePosted: '2026-10-30',
    validThrough: '2026-12-31',
    streetAddress: '500 Howard St',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94105',
    addressCountry: 'US',
    salaryMin: '160000',
    salaryMax: '210000',
    salaryCurrency: 'USD'
  },
  Event: {
    name: 'Global Developer Summit 2026',
    description: 'Annual gathering of cloud architects, security engineers, and open-source maintainers.',
    startDate: '2026-11-15T09:00:00-08:00',
    endDate: '2026-11-16T17:00:00-08:00',
    locationName: 'Moscone Center West',
    streetAddress: '747 Howard St',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94103',
    addressCountry: 'US',
    price: '299',
    currency: 'USD',
    organizerName: 'TechConf Global'
  },
  Person: {
    name: 'Elena Rostova',
    jobTitle: 'Principal Software Architect',
    worksFor: 'DreamKit Labs',
    url: 'https://example.com/elena',
    image: 'https://example.com/photos/elena.jpg',
    sameAs: [
      'https://github.com/elena-rostova',
      'https://twitter.com/elena_codes'
    ]
  }
};

/**
 * Builds the canonical Schema.org JSON-LD object for a given schema type.
 */
export function buildSchemaJsonLd(type, data) {
  const base = {
    '@context': 'https://schema.org',
    '@type': type
  };

  switch (type) {
    case 'Article':
      return {
        ...base,
        headline: data.headline || '',
        description: data.description || '',
        image: data.image ? [data.image] : [],
        datePublished: data.datePublished || '',
        dateModified: data.dateModified || data.datePublished || '',
        author: {
          '@type': data.authorType || 'Person',
          name: data.authorName || '',
          ...(data.authorUrl ? { url: data.authorUrl } : {})
        },
        publisher: {
          '@type': 'Organization',
          name: data.publisherName || '',
          ...(data.publisherLogo ? { logo: { '@type': 'ImageObject', url: data.publisherLogo } } : {})
        },
        ...(data.url ? { mainEntityOfPage: { '@type': 'WebPage', '@id': data.url } } : {})
      };

    case 'Product': {
      const prod = {
        ...base,
        name: data.name || '',
        description: data.description || '',
        ...(data.image ? { image: [data.image] } : {}),
        ...(data.brand ? { brand: { '@type': 'Brand', name: data.brand } } : {}),
        ...(data.sku ? { sku: data.sku } : {}),
        offers: {
          '@type': 'Offer',
          price: data.price || '0.00',
          priceCurrency: data.currency || 'USD',
          availability: data.availability || 'https://schema.org/InStock',
          ...(data.url ? { url: data.url } : {})
        }
      };

      if (data.hasRating && data.ratingValue) {
        prod.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: parseFloat(data.ratingValue) || 5.0,
          reviewCount: parseInt(data.reviewCount, 10) || 1
        };
      }

      return prod;
    }

    case 'FAQPage':
      return {
        ...base,
        mainEntity: (data.faqs || []).map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer
          }
        }))
      };

    case 'LocalBusiness':
      return {
        ...base,
        name: data.name || '',
        ...(data.image ? { image: data.image } : {}),
        ...(data.telephone ? { telephone: data.telephone } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.priceRange ? { priceRange: data.priceRange } : {}),
        ...(data.url ? { url: data.url } : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.streetAddress || '',
          addressLocality: data.addressLocality || '',
          addressRegion: data.addressRegion || '',
          postalCode: data.postalCode || '',
          addressCountry: data.addressCountry || ''
        },
        ...(data.latitude && data.longitude ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude)
          }
        } : {})
      };

    case 'Organization':
      return {
        ...base,
        name: data.name || '',
        url: data.url || '',
        ...(data.logo ? { logo: data.logo } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.socials && data.socials.length > 0 ? { sameAs: data.socials.filter(Boolean) } : {})
      };

    case 'HowTo':
      return {
        ...base,
        name: data.name || '',
        description: data.description || '',
        ...(data.totalTime ? { totalTime: data.totalTime } : {}),
        ...(data.estimatedCost ? { estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: data.estimatedCost } } : {}),
        step: (data.steps || []).map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.name,
          text: s.text
        }))
      };

    case 'BreadcrumbList':
      return {
        ...base,
        itemListElement: (data.breadcrumbs || []).map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.url
        }))
      };

    case 'JobPosting':
      return {
        ...base,
        title: data.title || '',
        description: data.description || '',
        datePosted: data.datePosted || '',
        ...(data.validThrough ? { validThrough: data.validThrough } : {}),
        employmentType: data.employmentType || 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: data.companyName || ''
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.streetAddress || '',
            addressLocality: data.addressLocality || '',
            addressRegion: data.addressRegion || '',
            postalCode: data.postalCode || '',
            addressCountry: data.addressCountry || ''
          }
        },
        ...(data.salaryMin && data.salaryMax ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: data.salaryCurrency || 'USD',
            value: {
              '@type': 'QuantitativeValue',
              minValue: parseFloat(data.salaryMin),
              maxValue: parseFloat(data.salaryMax),
              unitText: 'YEAR'
            }
          }
        } : {})
      };

    case 'Event':
      return {
        ...base,
        name: data.name || '',
        description: data.description || '',
        startDate: data.startDate || '',
        ...(data.endDate ? { endDate: data.endDate } : {}),
        location: {
          '@type': 'Place',
          name: data.locationName || '',
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.streetAddress || '',
            addressLocality: data.addressLocality || '',
            addressRegion: data.addressRegion || '',
            postalCode: data.postalCode || '',
            addressCountry: data.addressCountry || ''
          }
        },
        ...(data.price ? {
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.currency || 'USD',
            availability: 'https://schema.org/InStock',
            url: data.ticketUrl || ''
          }
        } : {}),
        ...(data.organizerName ? {
          organizer: {
            '@type': 'Organization',
            name: data.organizerName
          }
        } : {})
      };

    case 'Person':
      return {
        ...base,
        name: data.name || '',
        ...(data.jobTitle ? { jobTitle: data.jobTitle } : {}),
        ...(data.worksFor ? { worksFor: { '@type': 'Organization', name: data.worksFor } } : {}),
        ...(data.url ? { url: data.url } : {}),
        ...(data.image ? { image: data.image } : {}),
        ...(data.sameAs && data.sameAs.length > 0 ? { sameAs: data.sameAs.filter(Boolean) } : {})
      };

    default:
      return base;
  }
}

/**
 * Formats a schema object into an embeddable HTML script tag.
 */
export function formatJsonLdScript(schemaObj) {
  const json = JSON.stringify(schemaObj, null, 2);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

/**
 * Deep validator and inspector for JSON-LD schemas.
 * Validates syntax, context, recognized types, and Google Rich Results required & recommended fields.
 */
export function validateSchemaMarkup(inputCode = '') {
  const result = {
    isValid: false,
    score: 100,
    extractedType: 'Unknown',
    parsedJson: null,
    errors: [],
    warnings: [],
    passed: [],
    nodeCount: 0,
    googleTestUrl: ''
  };

  if (!inputCode || !inputCode.trim()) {
    result.errors.push({ field: 'Input', message: 'Schema markup code is empty.' });
    result.score = 0;
    return result;
  }

  // 1. Extract JSON from <script type="application/ld+json"> if present
  let cleanJsonStr = inputCode.trim();
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
  const scriptMatch = cleanJsonStr.match(scriptRegex);

  if (scriptMatch && scriptMatch[1]) {
    cleanJsonStr = scriptMatch[1].trim();
  }

  // 2. Parse JSON
  let schema = null;
  try {
    schema = JSON.parse(cleanJsonStr);
    result.parsedJson = schema;
  } catch (err) {
    result.errors.push({
      field: 'JSON Syntax',
      message: `Invalid JSON syntax: ${err.message}`
    });
    result.score = 0;
    return result;
  }

  // Handle @graph array or single object
  let root = schema;
  if (schema['@graph'] && Array.isArray(schema['@graph']) && schema['@graph'].length > 0) {
    root = schema['@graph'][0];
  } else if (Array.isArray(schema) && schema.length > 0) {
    root = schema[0];
  }

  // 3. Validate @context
  const context = root['@context'];
  if (!context) {
    result.errors.push({ field: '@context', message: 'Missing mandatory "@context" attribute. Expected "https://schema.org".' });
    result.score -= 30;
  } else if (!/https?:\/\/schema\.org/i.test(String(context))) {
    result.warnings.push({ field: '@context', message: `Context is "${context}". Recommended standard is "https://schema.org".` });
    result.score -= 10;
  } else {
    result.passed.push({ field: '@context', message: `Valid Schema.org context ("${context}")` });
  }

  // 4. Validate @type
  const type = root['@type'];
  if (!type) {
    result.errors.push({ field: '@type', message: 'Missing mandatory "@type" attribute.' });
    result.score -= 30;
    result.extractedType = 'None';
  } else {
    result.extractedType = Array.isArray(type) ? type.join(', ') : String(type);
    result.passed.push({ field: '@type', message: `Declared Schema type: ${result.extractedType}` });
  }

  // Count nodes
  result.nodeCount = countJsonNodes(schema);

  // 5. Type-Specific Google Rich Results rules
  const mainType = String(type);

  switch (mainType) {
    case 'Article':
    case 'NewsArticle':
    case 'BlogPosting':
      checkField(root, 'headline', 'Headline is required for Google Article rich snippets.', true, result);
      checkField(root, 'image', 'An image is strongly recommended for Google Discover and Top Stories carousel.', false, result);
      checkField(root, 'datePublished', 'datePublished is required for search engines to establish publication freshness.', true, result);
      checkField(root, 'author', 'Author details (name, @type) are required for Google E-E-A-T signals.', true, result);
      checkField(root, 'publisher', 'Publisher organization is recommended for branding in Google search results.', false, result);
      break;

    case 'Product':
      checkField(root, 'name', 'Product name is required.', true, result);
      checkField(root, 'image', 'Product image is required for Google Shopping and search image thumbnails.', true, result);
      checkField(root, 'offers', 'Offers with price and priceCurrency are required for Google Shopping snippets.', true, result);
      checkField(root, 'brand', 'Brand name is recommended for Google Product search listings.', false, result);
      if (root.aggregateRating) {
        checkField(root.aggregateRating, 'ratingValue', 'aggregateRating.ratingValue must be provided for star ratings.', true, result);
        checkField(root.aggregateRating, 'reviewCount', 'aggregateRating.reviewCount or ratingCount is required.', false, result);
      }
      break;

    case 'FAQPage':
      if (!root.mainEntity || !Array.isArray(root.mainEntity) || root.mainEntity.length === 0) {
        result.errors.push({ field: 'mainEntity', message: 'FAQPage requires a "mainEntity" array containing Question objects.' });
        result.score -= 25;
      } else {
        result.passed.push({ field: 'mainEntity', message: `FAQPage contains ${root.mainEntity.length} Question items.` });
        root.mainEntity.forEach((q, idx) => {
          if (!q.name) {
            result.errors.push({ field: `mainEntity[${idx}].name`, message: `Question #${idx + 1} is missing the question text ("name").` });
            result.score -= 10;
          }
          if (!q.acceptedAnswer || !q.acceptedAnswer.text) {
            result.errors.push({ field: `mainEntity[${idx}].acceptedAnswer`, message: `Question #${idx + 1} is missing an acceptedAnswer with text.` });
            result.score -= 10;
          }
        });
      }
      break;

    case 'LocalBusiness':
    case 'Restaurant':
    case 'Store':
      checkField(root, 'name', 'Business name is required.', true, result);
      checkField(root, 'address', 'PostalAddress is required for Google Local Maps integration.', true, result);
      checkField(root, 'telephone', 'Telephone number is recommended for local direct dialing.', false, result);
      checkField(root, 'image', 'Image of the business is recommended for Google Maps card display.', false, result);
      break;

    case 'BreadcrumbList':
      if (!root.itemListElement || !Array.isArray(root.itemListElement) || root.itemListElement.length === 0) {
        result.errors.push({ field: 'itemListElement', message: 'BreadcrumbList requires an "itemListElement" array of ListItem nodes.' });
        result.score -= 25;
      } else {
        result.passed.push({ field: 'itemListElement', message: `Breadcrumbs hierarchy contains ${root.itemListElement.length} items.` });
      }
      break;

    case 'JobPosting':
      checkField(root, 'title', 'Job title is required.', true, result);
      checkField(root, 'description', 'Job description HTML or text is required for Google for Jobs.', true, result);
      checkField(root, 'datePosted', 'datePosted is required for Google for Jobs expiration and freshness.', true, result);
      checkField(root, 'hiringOrganization', 'hiringOrganization is required.', true, result);
      checkField(root, 'jobLocation', 'jobLocation (PostalAddress) is required for location-based job matching.', true, result);
      break;

    case 'Event':
      checkField(root, 'name', 'Event name is required.', true, result);
      checkField(root, 'startDate', 'startDate is required for Google Event scheduling.', true, result);
      checkField(root, 'location', 'Event location is required.', true, result);
      break;

    case 'Organization':
      checkField(root, 'name', 'Organization name is required.', true, result);
      checkField(root, 'url', 'Official organization URL is required for Knowledge Graph association.', true, result);
      checkField(root, 'logo', 'Logo URL is strongly recommended for Google Knowledge Graph display.', false, result);
      break;

    default:
      // Generic check
      if (root.name || root.headline) {
        result.passed.push({ field: 'name/headline', message: `Identified primary entity name: "${root.name || root.headline}"` });
      }
      break;
  }

  // Google Rich Results Test URL
  result.googleTestUrl = `https://search.google.com/test/rich-results`;
  result.score = Math.max(0, Math.min(100, result.score));
  result.isValid = result.errors.length === 0;

  return result;
}

function checkField(node, fieldName, message, isRequired, result) {
  if (node && node[fieldName] !== undefined && node[fieldName] !== '' && node[fieldName] !== null) {
    result.passed.push({ field: fieldName, message: `Field "${fieldName}" is present and populated.` });
  } else {
    if (isRequired) {
      result.errors.push({ field: fieldName, message });
      result.score -= 15;
    } else {
      result.warnings.push({ field: fieldName, message });
      result.score -= 5;
    }
  }
}

function countJsonNodes(obj) {
  if (typeof obj !== 'object' || obj === null) return 1;
  let count = 1;
  for (const key of Object.keys(obj)) {
    count += countJsonNodes(obj[key]);
  }
  return count;
}
