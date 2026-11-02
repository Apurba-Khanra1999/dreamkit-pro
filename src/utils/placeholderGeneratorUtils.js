/**
 * Utilities for Placeholder Image Generator
 * 100% Client-Side Vector SVG and HTML5 Canvas Engine
 */

export const IMAGE_DIMENSION_PRESETS = [
  { id: '1920x1080', label: '1920 × 1080 (Full HD 16:9)', width: 1920, height: 1080, category: 'screens' },
  { id: '1280x720', label: '1280 × 720 (HD 16:9)', width: 1280, height: 720, category: 'screens' },
  { id: '1200x630', label: '1200 × 630 (Social OpenGraph)', width: 1200, height: 630, category: 'social' },
  { id: '1080x1080', label: '1080 × 1080 (Square 1:1)', width: 1080, height: 1080, category: 'social' },
  { id: '1080x1920', label: '1080 × 1920 (Story / Reel 9:16)', width: 1080, height: 1920, category: 'social' },
  { id: '800x600', label: '800 × 600 (Standard 4:3)', width: 800, height: 600, category: 'web' },
  { id: '600x400', label: '600 × 400 (Classic 3:2)', width: 600, height: 400, category: 'web' },
  { id: '400x300', label: '400 × 300 (Card Thumbnail)', width: 400, height: 300, category: 'web' },
  { id: '300x250', label: '300 × 250 (Medium Rectangle Ad)', width: 300, height: 250, category: 'ads' },
  { id: '728x90', label: '728 × 90 (Leaderboard Banner)', width: 728, height: 90, category: 'ads' },
  { id: '160x600', label: '160 × 600 (Skyscraper Ad)', width: 160, height: 600, category: 'ads' },
  { id: '393x852', label: '393 × 852 (Mobile Screen Mockup)', width: 393, height: 852, category: 'screens' }
];

export const IMAGE_COLOR_PALETTES = [
  { id: 'slate', name: 'Slate Dark', start: '#1e293b', end: '#0f172a', text: '#f8fafc', subText: '#94a3b8' },
  { id: 'indigo', name: 'Vibrant Indigo', start: '#4f46e5', end: '#3b82f6', text: '#ffffff', subText: '#c7d2fe' },
  { id: 'violet', name: 'Neon Purple', start: '#7c3aed', end: '#c026d3', text: '#ffffff', subText: '#f5d0fe' },
  { id: 'ocean', name: 'Oceanic Blue', start: '#0284c7', end: '#06b6d4', text: '#ffffff', subText: '#bae6fd' },
  { id: 'sunset', name: 'Sunset Coral', start: '#f43f5e', end: '#fb923c', text: '#ffffff', subText: '#fed7aa' },
  { id: 'emerald', name: 'Emerald Forest', start: '#059669', end: '#10b981', text: '#ffffff', subText: '#a7f3d0' },
  { id: 'amber', name: 'Amber Glow', start: '#d97706', end: '#f59e0b', text: '#ffffff', subText: '#fde68a' },
  { id: 'light_gray', name: 'Minimal Light', start: '#f1f5f9', end: '#e2e8f0', text: '#0f172a', subText: '#64748b' },
  { id: 'pure_dark', name: 'True Black', start: '#000000', end: '#18181b', text: '#ffffff', subText: '#71717a' },
  { id: 'rose_gold', name: 'Rose Gold', start: '#e11d48', end: '#f472b6', text: '#ffffff', subText: '#fbcfe8' }
];

export const IMAGE_PATTERNS = [
  { id: 'none', label: 'Plain / Smooth' },
  { id: 'grid', label: 'Graph Grid' },
  { id: 'crosshair', label: 'Wireframe Cross & Reticle' },
  { id: 'dots', label: 'Dot Matrix' },
  { id: 'stripes', label: 'Diagonal Stripes' },
  { id: 'checkerboard', label: 'Checkerboard' }
];

/**
 * Escapes XML / SVG strings
 */
export function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Standalone SVG Vector Markup for Placeholder Images
 */
export function generatePlaceholderImageSvg(options = {}) {
  const {
    width = 800,
    height = 600,
    text = '',
    subText = '',
    showDimensions = true,
    paletteId = 'indigo',
    customStartColor = null,
    customEndColor = null,
    customTextColor = null,
    gradientAngle = 135,
    pattern = 'grid',
    borderWidth = 0,
    borderColor = '#ffffff',
    borderRadius = 0,
    fontFamily = 'Inter, -apple-system, sans-serif',
    fontSize = null
  } = options;

  const w = Math.max(20, Math.min(4000, parseInt(width, 10) || 800));
  const h = Math.max(20, Math.min(4000, parseInt(height, 10) || 600));

  const palette = IMAGE_COLOR_PALETTES.find((p) => p.id === paletteId) || IMAGE_COLOR_PALETTES[1];
  const startColor = customStartColor || palette.start;
  const endColor = customEndColor || palette.end;
  const textColor = customTextColor || palette.text;
  const subTextColor = palette.subText;

  // Primary label
  let primaryLabel = text.trim();
  if (!primaryLabel && showDimensions) {
    primaryLabel = `${w} × ${h}`;
  } else if (!primaryLabel) {
    primaryLabel = 'Placeholder';
  }

  // Calculated Font Sizes
  const minDim = Math.min(w, h);
  const calculatedFontSize = fontSize || Math.max(14, Math.round(minDim * 0.08));
  const calculatedSubFontSize = Math.max(11, Math.round(calculatedFontSize * 0.42));

  // Gradient Coordinate Calculations
  const angleRad = ((gradientAngle - 90) * Math.PI) / 180;
  const x1 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
  const y1 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
  const x2 = Math.round(50 - Math.cos(angleRad) * 50) + '%';
  const y2 = Math.round(50 - Math.sin(angleRad) * 50) + '%';

  // Pattern Definitions
  let patternDefs = '';
  let patternOverlay = '';

  if (pattern === 'grid') {
    patternDefs = `
      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${textColor}" stroke-width="1" stroke-opacity="0.12" />
      </pattern>`;
    patternOverlay = `<rect width="${w}" height="${h}" fill="url(#gridPattern)" rx="${borderRadius}" />`;
  } else if (pattern === 'dots') {
    patternDefs = `
      <pattern id="dotPattern" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="1.5" fill="${textColor}" fill-opacity="0.16" />
      </pattern>`;
    patternOverlay = `<rect width="${w}" height="${h}" fill="url(#dotPattern)" rx="${borderRadius}" />`;
  } else if (pattern === 'stripes') {
    patternDefs = `
      <pattern id="stripePattern" width="28" height="28" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="28" stroke="${textColor}" stroke-width="3" stroke-opacity="0.1" />
      </pattern>`;
    patternOverlay = `<rect width="${w}" height="${h}" fill="url(#stripePattern)" rx="${borderRadius}" />`;
  } else if (pattern === 'crosshair') {
    patternOverlay = `
      <g stroke="${textColor}" stroke-opacity="0.2" stroke-width="1.5">
        <line x1="0" y1="0" x2="${w}" y2="${h}" />
        <line x1="${w}" y1="0" x2="0" y2="${h}" />
        <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.22}" fill="none" stroke-dasharray="6,4" />
        <line x1="${w / 2}" y1="${h / 2 - 25}" x2="${w / 2}" y2="${h / 2 + 25}" stroke-width="2" />
        <line x1="${w / 2 - 25}" y1="${h / 2}" x2="${w / 2 + 25}" y2="${h / 2}" stroke-width="2" />
      </g>`;
  } else if (pattern === 'checkerboard') {
    patternDefs = `
      <pattern id="checkerPattern" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="${textColor}" fill-opacity="0.08" />
        <rect x="16" y="16" width="16" height="16" fill="${textColor}" fill-opacity="0.08" />
      </pattern>`;
    patternOverlay = `<rect width="${w}" height="${h}" fill="url(#checkerPattern)" rx="${borderRadius}" />`;
  }

  // Border markup
  const borderMarkup =
    borderWidth > 0
      ? `<rect x="${borderWidth / 2}" y="${borderWidth / 2}" width="${w - borderWidth}" height="${h - borderWidth}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" rx="${Math.max(0, borderRadius - borderWidth / 2)}" />`
      : '';

  // Center vertical offset
  const hasSubtitle = Boolean(subText && subText.trim());
  const mainY = hasSubtitle ? h / 2 - calculatedSubFontSize * 0.7 : h / 2;
  const subY = h / 2 + calculatedFontSize * 0.75;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bgGrad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${startColor}" />
      <stop offset="100%" stop-color="${endColor}" />
    </linearGradient>${patternDefs}
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${w}" height="${h}" fill="url(#bgGrad)" rx="${borderRadius}" />

  <!-- Pattern Overlay -->
  ${patternOverlay}

  <!-- Typography Labels -->
  <g text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}">
    <text x="${w / 2}" y="${mainY}" font-size="${calculatedFontSize}px" font-weight="700" fill="${textColor}" filter="url(#textShadow)" letter-spacing="0.02em">
      ${escapeXml(primaryLabel)}
    </text>
    ${
      hasSubtitle
        ? `<text x="${w / 2}" y="${subY}" font-size="${calculatedSubFontSize}px" font-weight="500" fill="${subTextColor}" letter-spacing="0.05em" opacity="0.9">
      ${escapeXml(subText.trim())}
    </text>`
        : ''
    }
  </g>

  <!-- Outer Border -->
  ${borderMarkup}
</svg>`;
}

/**
 * Convert SVG string to Data URI (escaped for direct use in <img src="...">)
 */
export function svgToDataUri(svgString) {
  if (!svgString) return '';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Render SVG to an HTML Canvas element
 */
export function renderSvgToCanvas(svgString, width, height) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Canvas rendering requires browser DOM.'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to acquire 2D canvas context.'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas);
    };
    img.onerror = (err) => {
      reject(err || new Error('Failed to load SVG into image element.'));
    };

    img.src = svgToDataUri(svgString);
  });
}

/**
 * Download a blob or file to the user's computer
 */
export function triggerFileDownload(blobOrUrl, filename) {
  if (typeof document === 'undefined') return;
  const a = document.createElement('a');
  let url = blobOrUrl;
  let isObjectUrl = false;

  if (blobOrUrl instanceof Blob) {
    url = URL.createObjectURL(blobOrUrl);
    isObjectUrl = true;
  }

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (isObjectUrl) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
