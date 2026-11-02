/**
 * Google SERP & Social Snippet Preview Utilities
 * Provides pixel-based truncation, SEO diagnostic scoring, and meta tag generation.
 */

// Average character widths in Arial 20px (Google Desktop title font)
const ARIAL_20PX_WIDTHS = {
  ' ': 5.5, '!': 6.0, '"': 7.5, '#': 11.0, '$': 11.0, '%': 17.5, '&': 13.5, "'": 4.0,
  '(': 6.5, ')': 6.5, '*': 7.5, '+': 11.5, ',': 5.5, '-': 6.5, '.': 5.5, '/': 5.5,
  '0': 11.0, '1': 11.0, '2': 11.0, '3': 11.0, '4': 11.0, '5': 11.0, '6': 11.0, '7': 11.0,
  '8': 11.0, '9': 11.0, ':': 5.5, ';': 5.5, '<': 11.5, '=': 11.5, '>': 11.5, '?': 11.0,
  '@': 20.0, 'A': 13.5, 'B': 13.5, 'C': 14.5, 'D': 14.5, 'E': 13.5, 'F': 12.0, 'G': 15.5,
  'H': 14.5, 'I': 5.5, 'J': 10.0, 'K': 13.5, 'L': 11.0, 'M': 18.0, 'N': 14.5, 'O': 15.5,
  'P': 13.5, 'Q': 15.5, 'R': 14.5, 'S': 13.5, 'T': 12.0, 'U': 14.5, 'V': 13.5, 'W': 19.5,
  'X': 13.5, 'Y': 13.5, 'Z': 12.0, '[': 5.5, '\\': 5.5, ']': 5.5, '^': 9.0, '_': 11.0,
  '`': 6.5, 'a': 11.0, 'b': 11.0, 'c': 10.0, 'd': 11.0, 'e': 11.0, 'f': 5.5, 'g': 11.0,
  'h': 11.0, 'i': 4.5, 'j': 4.5, 'k': 10.0, 'l': 4.5, 'm': 16.5, 'n': 11.0, 'o': 11.0,
  'p': 11.0, 'q': 11.0, 'r': 7.0, 's': 10.0, 't': 5.5, 'u': 11.0, 'v': 10.0, 'w': 14.5,
  'x': 10.0, 'y': 10.0, 'z': 10.0, '{': 6.5, '|': 5.5, '}': 6.5, '~': 11.5
};

export const MAX_DESKTOP_TITLE_PIXELS = 600;
export const MAX_MOBILE_TITLE_PIXELS = 600;
export const OPTIMAL_TITLE_CHARS = { min: 50, max: 60 };
export const OPTIMAL_DESC_CHARS = { min: 120, max: 158 };

/**
 * Calculates accurate pixel width of a title in Arial 20px.
 * Uses browser canvas when available, falling back to weighted character lookup.
 */
export function calculateTitlePixels(text) {
  if (!text) return 0;

  // Try Canvas measurement in browser
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '20px Arial, sans-serif';
        return Math.round(ctx.measureText(text).width);
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback calculation using weighted character map
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    total += ARIAL_20PX_WIDTHS[char] || 11.0;
  }
  return Math.round(total);
}

/**
 * Truncates text by pixel width for Google SERP title.
 */
export function truncateByPixels(text, maxPixels = MAX_DESKTOP_TITLE_PIXELS) {
  if (!text) return '';
  const currentPx = calculateTitlePixels(text);
  if (currentPx <= maxPixels) return text;

  let truncated = '';
  const ellipsisPx = calculateTitlePixels(' ...');
  const allowedPx = maxPixels - ellipsisPx;

  for (let i = 0; i < text.length; i++) {
    const nextStr = truncated + text[i];
    if (calculateTitlePixels(nextStr) > allowedPx) {
      break;
    }
    truncated = nextStr;
  }

  return truncated.trim() + ' ...';
}

/**
 * Truncates meta description by character count (160 on desktop, 120 on mobile).
 */
export function truncateDescription(desc, maxChars = 160) {
  if (!desc) return '';
  if (desc.length <= maxChars) return desc;

  // Cut at last space before maxChars
  const sub = desc.slice(0, maxChars - 3);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > maxChars - 25) {
    return sub.slice(0, lastSpace) + ' ...';
  }
  return sub.trim() + ' ...';
}

/**
 * Parses and formats target URL into breadcrumbs format (e.g. "https://example.com › blog › post").
 */
export function formatBreadcrumbs(urlStr) {
  if (!urlStr) return { domain: 'example.com', path: '', full: 'https://example.com' };

  try {
    let clean = urlStr.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    const domain = parsed.hostname.replace(/^www\./i, '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const breadcrumb = pathParts.length > 0 ? pathParts.join(' › ') : '';

    return {
      domain,
      path: breadcrumb,
      full: clean,
      protocol: parsed.protocol.replace(':', '')
    };
  } catch {
    return {
      domain: 'example.com',
      path: '',
      full: urlStr || 'https://example.com'
    };
  }
}

/**
 * Comprehensive SEO Diagnostic Checklist and Quality Scoring.
 */
export function calculateSeoScore({ title = '', description = '', url = '', keyword = '' }) {
  const checks = [];
  let score = 100;

  const titlePx = calculateTitlePixels(title);
  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const kw = keyword.trim().toLowerCase();

  // 1. Title Pixel Width Check
  if (titlePx === 0) {
    checks.push({
      id: 'title_empty',
      label: 'Title Tag is Empty',
      status: 'error',
      message: 'Add a title to show up in search results.',
      deduction: 25
    });
    score -= 25;
  } else if (titlePx > MAX_DESKTOP_TITLE_PIXELS) {
    const diff = titlePx - MAX_DESKTOP_TITLE_PIXELS;
    checks.push({
      id: 'title_too_wide',
      label: 'Title Exceeds Google 600px Display Limit',
      status: 'warning',
      message: `Title is ${titlePx}px wide (${diff}px too long) and will be cut off with an ellipsis ("...") on desktop.`,
      deduction: 15
    });
    score -= 15;
  } else if (titleLen < OPTIMAL_TITLE_CHARS.min) {
    checks.push({
      id: 'title_short',
      label: 'Title is Too Short',
      status: 'info',
      message: `Title is ${titleLen} characters. Aim for 50–60 characters to maximize click-through rate.`,
      deduction: 10
    });
    score -= 10;
  } else {
    checks.push({
      id: 'title_optimal',
      label: 'Title Length is Optimal',
      status: 'success',
      message: `Title is ${titleLen} characters (${titlePx}px), fitting within Google's 600px limit.`
    });
  }

  // 2. Meta Description Check
  if (descLen === 0) {
    checks.push({
      id: 'desc_empty',
      label: 'Meta Description is Missing',
      status: 'error',
      message: 'Search engines will automatically extract arbitrary text from your page body.',
      deduction: 25
    });
    score -= 25;
  } else if (descLen > OPTIMAL_DESC_CHARS.max) {
    checks.push({
      id: 'desc_too_long',
      label: 'Meta Description Exceeds Recommended Length',
      status: 'warning',
      message: `Description is ${descLen} characters (exceeds ${OPTIMAL_DESC_CHARS.max}). Mobile and desktop may truncate with an ellipsis.`,
      deduction: 10
    });
    score -= 10;
  } else if (descLen < OPTIMAL_DESC_CHARS.min) {
    checks.push({
      id: 'desc_short',
      label: 'Meta Description Could Be More Descriptive',
      status: 'info',
      message: `Description is ${descLen} characters. Expanding to 120–158 characters provides richer context for searchers.`,
      deduction: 5
    });
    score -= 5;
  } else {
    checks.push({
      id: 'desc_optimal',
      label: 'Meta Description Length is Optimal',
      status: 'success',
      message: `Description is ${descLen} characters, ideal for both desktop and mobile snippet viewports.`
    });
  }

  // 3. Keyword Inclusion Checks (if keyword specified)
  if (kw) {
    const titleHasKw = title.toLowerCase().includes(kw);
    const descHasKw = description.toLowerCase().includes(kw);
    const urlHasKw = url.toLowerCase().includes(kw.replace(/\s+/g, '-'));

    if (titleHasKw) {
      checks.push({
        id: 'kw_title',
        label: 'Target Keyword in Title Tag',
        status: 'success',
        message: `Keyword "${keyword}" appears in the title tag.`
      });
    } else {
      checks.push({
        id: 'kw_title_missing',
        label: 'Keyword Missing from Title Tag',
        status: 'warning',
        message: `Including "${keyword}" in your title significantly boosts search relevance.`,
        deduction: 15
      });
      score -= 15;
    }

    if (descHasKw) {
      checks.push({
        id: 'kw_desc',
        label: 'Target Keyword in Meta Description',
        status: 'success',
        message: `Google will bold "${keyword}" when users search for this term.`
      });
    } else {
      checks.push({
        id: 'kw_desc_missing',
        label: 'Keyword Missing from Meta Description',
        status: 'info',
        message: `Adding "${keyword}" to the meta description encourages higher click-throughs through bold match highlighting.`,
        deduction: 5
      });
      score -= 5;
    }

    if (urlHasKw) {
      checks.push({
        id: 'kw_url',
        label: 'Target Keyword in URL Slug',
        status: 'success',
        message: `Keyword appears in the URL path.`
      });
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    checks,
    titlePx,
    titleLen,
    descLen
  };
}

/**
 * Generates production-ready HTML Meta Tags & Social Open Graph / Twitter Card code.
 */
export function generateMetaTags({
  title = '',
  description = '',
  url = '',
  siteName = '',
  imageUrl = '',
  publishedDate = '',
  author = ''
}) {
  const cleanUrl = url.trim() || 'https://example.com';
  const cleanTitle = title.trim();
  const cleanDesc = description.trim();
  const cleanSite = siteName.trim() || 'My Website';
  const cleanImg = imageUrl.trim() || 'https://example.com/og-image.jpg';

  const html = `<!-- Primary Meta Tags -->
<title>${cleanTitle}</title>
<meta name="title" content="${cleanTitle}">
<meta name="description" content="${cleanDesc}">
<link rel="canonical" href="${cleanUrl}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${cleanUrl}">
<meta property="og:site_name" content="${cleanSite}">
<meta property="og:title" content="${cleanTitle}">
<meta property="og:description" content="${cleanDesc}">
<meta property="og:image" content="${cleanImg}">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${cleanUrl}">
<meta name="twitter:title" content="${cleanTitle}">
<meta name="twitter:description" content="${cleanDesc}">
<meta name="twitter:image" content="${cleanImg}">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${cleanTitle}",
  "description": "${cleanDesc}",
  "url": "${cleanUrl}"${publishedDate ? `,\n  "datePublished": "${publishedDate}"` : ''}${author ? `,\n  "author": {\n    "@type": "Person",\n    "name": "${author}"\n  }` : ''}
}
</script>`;

  return html;
}

/**
 * Preset Examples for quick loading.
 */
export const SERP_PRESETS = [
  {
    name: 'SaaS Platform',
    title: 'DreamKit - All-in-One Developer Utilities Suite & Code Toolkit',
    description: 'Transform, format, encode, inspect, and benchmark code instantly in your browser. 100% private, client-side, zero tracking developer toolkit.',
    url: 'https://dreamkit.dev',
    keyword: 'developer toolkit',
    siteName: 'DreamKit',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop',
    rating: 4.9,
    reviewsCount: 312,
    sitelinks: [
      { title: 'JSON Formatter', url: 'https://dreamkit.dev/formatter' },
      { title: 'UUID Generator', url: 'https://dreamkit.dev/uuid' },
      { title: 'Regex Tester', url: 'https://dreamkit.dev/regex' },
      { title: 'JWT Decoder', url: 'https://dreamkit.dev/jwt' }
    ]
  },
  {
    name: 'Tech Blog Guide',
    title: 'The Complete Guide to Modern Web Performance Optimization (2026)',
    description: 'Master Core Web Vitals, sub-second LCP, edge computing, and asset caching strategies to build lightning-fast web applications that rank on Google.',
    url: 'https://blog.example.com/guides/web-performance-optimization',
    keyword: 'web performance',
    siteName: 'Engineering Insights',
    publishedDate: 'Oct 30, 2026',
    author: 'Elena Rostova',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    rating: 4.8,
    reviewsCount: 89
  },
  {
    name: 'E-commerce Product',
    title: 'Pro Wireless Mechanical Keyboard - RGB Hot-Swappable 75%',
    description: 'Experience ultra-low 1ms latency, custom lubed linear switches, and aluminum chassis. Compatible with Mac and Windows. Free worldwide shipping.',
    url: 'https://shop.example.com/keyboards/pro-wireless-75',
    keyword: 'mechanical keyboard',
    siteName: 'KeebStudio',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&h=630&fit=crop',
    rating: 4.9,
    reviewsCount: 1420
  }
];
