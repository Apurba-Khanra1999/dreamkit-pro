/**
 * SVG Optimizer & SVG Editor Utilities
 * 100% In-Browser SVG Manipulation, Optimization, Color Inspection, and Code Conversion
 */

export const OPTIMIZER_PRESETS = [
  {
    id: 'balanced',
    name: 'Balanced (Recommended)',
    title: 'Balanced (Recommended)',
    description: 'Safe cleanup of editor metadata, comments, redundant groups, and 2-decimal precision.',
    options: {
      removeXmlDecl: true,
      removeDoctype: true,
      removeComments: true,
      removeMetadata: true,
      removeEditorData: true,
      removeEmptyContainers: true,
      collapseRedundantGroups: true,
      cleanupDefaultAttrs: true,
      roundNumbers: true,
      precision: 2,
      minifyWhitespace: true,
      ensureViewBox: true,
    },
  },
  {
    id: 'aggressive',
    name: 'Maximum Compression',
    title: 'Maximum Compression',
    description: 'Aggressive optimization: 1-decimal rounding, deep group unwrapping, and compact minification.',
    options: {
      removeXmlDecl: true,
      removeDoctype: true,
      removeComments: true,
      removeMetadata: true,
      removeEditorData: true,
      removeEmptyContainers: true,
      collapseRedundantGroups: true,
      cleanupDefaultAttrs: true,
      roundNumbers: true,
      precision: 1,
      minifyWhitespace: true,
      ensureViewBox: true,
    },
  },
  {
    id: 'safe',
    name: 'Lossless Safe',
    title: 'Lossless Safe',
    description: 'Strips only XML comments, editor headers, and metadata without touching coordinate precision.',
    options: {
      removeXmlDecl: true,
      removeDoctype: true,
      removeComments: true,
      removeMetadata: true,
      removeEditorData: true,
      removeEmptyContainers: true,
      collapseRedundantGroups: false,
      cleanupDefaultAttrs: false,
      roundNumbers: false,
      precision: 3,
      minifyWhitespace: false,
      ensureViewBox: true,
    },
  },
];

export const DEFAULT_OPTIMIZER_OPTIONS = OPTIMIZER_PRESETS[0].options;

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Parse SVG string into a DOM Document
 */
export function parseSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') {
    throw new Error('SVG input must be a non-empty string.');
  }

  // Basic cleanup of non-printable control characters before parse
  const cleanInput = svgString.trim().replace(/^[\uFEFF\xA0]+/, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanInput, 'image/svg+xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    const errorText = parserError.textContent || 'Syntax error parsing SVG markup.';
    throw new Error(errorText.slice(0, 200));
  }

  const svgElement = doc.querySelector('svg');
  if (!svgElement) {
    throw new Error('No root <svg> element found in the input document.');
  }

  return { doc, svgElement };
}

/**
 * Serialize DOM Document back to SVG string
 */
export function serializeSvg(docOrElement) {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(docOrElement);
}

/**
 * Round numbers in path data `d="..."` or coordinate strings
 */
export function roundNumbersInString(str, decimals = 2) {
  if (!str) return str;
  // Match floating point numbers (including signs and scientific notations)
  return str.replace(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g, (match) => {
    const val = parseFloat(match);
    if (isNaN(val)) return match;
    // Format to precision and remove trailing zeros
    const rounded = Number(val.toFixed(decimals));
    return rounded.toString();
  });
}

/**
 * Clean and round path data specifically
 */
export function roundPathData(d, decimals = 2) {
  if (!d) return d;
  return d
    .replace(/([a-df-z])/gi, ' $1 ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g, (match) => {
      const val = parseFloat(match);
      if (isNaN(val)) return match;
      return Number(val.toFixed(decimals)).toString();
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Run Full SVG Optimization Pipeline
 */
export function optimizeSvg(svgString, userOptions = {}) {
  const options = { ...DEFAULT_OPTIMIZER_OPTIONS, ...userOptions };
  const origSize = new Blob([svgString]).size;

  let { doc, svgElement } = parseSvg(svgString);

  let strippedCount = 0;
  let elementCountBefore = doc.getElementsByTagName('*').length;

  // 1. Ensure viewBox if missing
  if (options.ensureViewBox) {
    const hasViewBox = svgElement.hasAttribute('viewBox');
    if (!hasViewBox) {
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');
      if (widthAttr && heightAttr) {
        const w = parseFloat(widthAttr);
        const h = parseFloat(heightAttr);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
      }
    }
  }

  // 2. Remove XML Comments
  if (options.removeComments) {
    const iterator = doc.createNodeIterator(doc, NodeFilter.SHOW_COMMENT);
    let commentNode = iterator.nextNode();
    const commentsToRemove = [];
    while (commentNode) {
      commentsToRemove.push(commentNode);
      commentNode = iterator.nextNode();
    }
    for (const c of commentsToRemove) {
      c.parentNode?.removeChild(c);
      strippedCount++;
    }
  }

  // 3. Remove Metadata elements (<metadata>, <desc>, <title>)
  if (options.removeMetadata) {
    const metaTags = ['metadata', 'desc'];
    for (const tag of metaTags) {
      const elements = Array.from(doc.getElementsByTagName(tag));
      for (const el of elements) {
        el.parentNode?.removeChild(el);
        strippedCount++;
      }
    }
  }

  // 4. Remove Editor junk (Inkscape, Adobe Illustrator, Corel, Figma, Sketch)
  if (options.removeEditorData) {
    const editorPrefixes = [
      'inkscape',
      'sodipodi',
      'sketch',
      'figma',
      'adobe',
      'illustrator',
      'i',
      'graph',
    ];

    // Remove editor-specific elements (e.g., <sodipodi:namedview>)
    const allElements = Array.from(doc.getElementsByTagName('*'));
    for (const el of allElements) {
      const tagName = el.tagName.toLowerCase();
      if (editorPrefixes.some(p => tagName.startsWith(`${p}:`))) {
        el.parentNode?.removeChild(el);
        strippedCount++;
        continue;
      }

      // Remove editor attributes
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        const isEditorAttr =
          editorPrefixes.some(p => attrName.startsWith(`${p}:`) || attrName.startsWith(`xmlns:${p}`)) ||
          attrName.startsWith('data-name') ||
          attrName.startsWith('data-testid');

        if (isEditorAttr) {
          el.removeAttribute(attr.name);
          strippedCount++;
        }
      }
    }
  }

  // 5. Cleanup default attributes
  if (options.cleanupDefaultAttrs) {
    if (svgElement.getAttribute('version') === '1.1' || svgElement.getAttribute('version') === '1.0') {
      svgElement.removeAttribute('version');
    }
    const allElements = Array.from(doc.getElementsByTagName('*'));
    for (const el of allElements) {
      if (el.getAttribute('x') === '0') el.removeAttribute('x');
      if (el.getAttribute('y') === '0') el.removeAttribute('y');
    }
  }

  // 6. Remove Empty Containers (Empty <g>, <defs>, <clipPath>)
  if (options.removeEmptyContainers) {
    let removedAny = true;
    while (removedAny) {
      removedAny = false;
      const containers = Array.from(doc.querySelectorAll('g, defs, clipPath, mask, pattern'));
      for (const el of containers) {
        if (el.children.length === 0 && !el.textContent.trim()) {
          el.parentNode?.removeChild(el);
          strippedCount++;
          removedAny = true;
        }
      }
    }
  }

  // 7. Collapse Redundant Groups
  if (options.collapseRedundantGroups) {
    const groups = Array.from(doc.querySelectorAll('g'));
    for (const g of groups) {
      // If group has no attributes or only an ID and has exactly 1 child element
      if (g.attributes.length === 0 && g.children.length === 1) {
        const child = g.firstElementChild;
        g.parentNode?.replaceChild(child, g);
        strippedCount++;
      }
    }
  }

  // 8. Round Number Coordinates (Path data, dimensions, transforms)
  if (options.roundNumbers) {
    const precision = Math.max(0, Math.min(4, Number(options.precision) || 2));
    const allElements = Array.from(doc.getElementsByTagName('*'));

    for (const el of allElements) {
      // Round path data d attribute
      if (el.tagName.toLowerCase() === 'path' && el.hasAttribute('d')) {
        const origD = el.getAttribute('d');
        const roundedD = roundPathData(origD, precision);
        el.setAttribute('d', roundedD);
      }

      // Round polygon / polyline points
      if (['polygon', 'polyline'].includes(el.tagName.toLowerCase()) && el.hasAttribute('points')) {
        const points = el.getAttribute('points');
        el.setAttribute('points', roundNumbersInString(points, precision));
      }

      // Round common coordinate attributes
      const coordAttrs = ['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height'];
      for (const attr of coordAttrs) {
        if (el.hasAttribute(attr)) {
          const val = el.getAttribute(attr);
          if (/^[-+]?\d*\.?\d+$/.test(val.trim())) {
            const num = parseFloat(val);
            if (!isNaN(num)) {
              el.setAttribute(attr, Number(num.toFixed(precision)).toString());
            }
          }
        }
      }

      // Round transform coordinates
      if (el.hasAttribute('transform')) {
        const tf = el.getAttribute('transform');
        el.setAttribute('transform', roundNumbersInString(tf, precision));
      }
    }

    // Round viewBox
    if (svgElement.hasAttribute('viewBox')) {
      const vb = svgElement.getAttribute('viewBox');
      svgElement.setAttribute('viewBox', roundNumbersInString(vb, precision));
    }
  }

  // 9. Serialize & Format / Minify
  let serialized = serializeSvg(svgElement);

  // Strip xml declaration if requested
  if (options.removeXmlDecl) {
    serialized = serialized.replace(/<\?xml[\s\S]*?\?>/gi, '').trim();
  }
  // Strip doctype if requested
  if (options.removeDoctype) {
    serialized = serialized.replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();
  }

  let finalSvgString = serialized;
  if (options.minifyWhitespace) {
    finalSvgString = minifySvgCode(serialized);
  }

  const optSize = new Blob([finalSvgString]).size;
  const savedBytes = Math.max(0, origSize - optSize);
  const reductionPct = origSize > 0 ? ((savedBytes / origSize) * 100).toFixed(1) : '0.0';
  const elementCountAfter = doc.getElementsByTagName('*').length;

  return {
    svg: finalSvgString,
    origSize,
    optSize,
    savedBytes,
    reductionPct: Number(reductionPct),
    elementCountBefore,
    elementCountAfter,
    strippedCount,
  };
}

/**
 * Minify SVG markup into a single compact line
 */
export function minifySvgCode(svgString) {
  if (!svgString) return '';
  return svgString
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/(\r\n|\n|\r)/gm, '')
    .trim();
}

/**
 * Pretty-print SVG markup with indentation
 */
export function formatSvgCode(svgString, indentSize = 2) {
  if (!svgString) return '';
  const indent = ' '.repeat(indentSize);
  let formatted = '';
  let pad = 0;

  // Normalize tokens
  const clean = svgString.replace(/>\s*</g, '>\n<').trim();
  const lines = clean.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.match(/^<\/\w/)) {
      pad = Math.max(0, pad - 1);
    }

    formatted += indent.repeat(pad) + line + '\n';

    if (line.match(/^<\w[^>]*[^/]>.*$/) && !line.startsWith('<!--')) {
      pad++;
    }
  }

  return formatted.trim();
}

/**
 * Extract all unique colors used in an SVG (fills, strokes, stop-colors)
 */
export function extractSvgColors(svgString) {
  if (!svgString) return [];
  const colorSet = new Set();

  try {
    const { doc } = parseSvg(svgString);
    const elements = Array.from(doc.getElementsByTagName('*'));

    const colorAttrs = ['fill', 'stroke', 'stop-color', 'flood-color'];

    for (const el of elements) {
      for (const attr of colorAttrs) {
        if (el.hasAttribute(attr)) {
          const val = el.getAttribute(attr)?.trim();
          if (val && val !== 'none' && val !== 'currentColor' && !val.startsWith('url(')) {
            colorSet.add(normalizeColor(val));
          }
        }
      }

      // Check inline style attribute
      if (el.hasAttribute('style')) {
        const style = el.getAttribute('style') || '';
        const fillMatch = style.match(/fill:\s*([^;]+)/i);
        if (fillMatch && fillMatch[1] && fillMatch[1] !== 'none' && !fillMatch[1].startsWith('url(')) {
          colorSet.add(normalizeColor(fillMatch[1]));
        }
        const strokeMatch = style.match(/stroke:\s*([^;]+)/i);
        if (strokeMatch && strokeMatch[1] && strokeMatch[1] !== 'none' && !strokeMatch[1].startsWith('url(')) {
          colorSet.add(normalizeColor(strokeMatch[1]));
        }
      }
    }
  } catch {
    // Regex fallback if XML parse has edge-case issues
    const colorRegex = /(?:fill|stroke|stop-color)=["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)["']/gi;
    let match;
    while ((match = colorRegex.exec(svgString)) !== null) {
      if (match[1] && match[1] !== 'none' && match[1] !== 'currentColor') {
        colorSet.add(normalizeColor(match[1]));
      }
    }
  }

  return Array.from(colorSet).filter(Boolean);
}

/**
 * Normalize color string into standard hex lowercase if possible
 */
function normalizeColor(color) {
  const c = color.trim().toLowerCase();
  if (c.startsWith('#')) {
    if (c.length === 4) {
      return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
    }
    return c;
  }
  return c;
}

/**
 * Replace a specific color throughout an SVG string
 */
export function replaceSvgColor(svgString, fromColor, toColor) {
  if (!svgString || !fromColor || !toColor) return svgString;

  const normalizedFrom = fromColor.trim().toLowerCase();
  const normalizedTo = toColor.trim();

  // Escape special regex characters
  const escaped = normalizedFrom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(["':=\\s])(${escaped})([;"'\\s])`, 'gi');

  return svgString.replace(regex, `$1${normalizedTo}$3`);
}

/**
 * Recolor entire SVG into a single monochromatic brand theme
 */
export function recolorSvgMonochrome(svgString, themeHex = '#4f46e5') {
  if (!svgString) return svgString;
  try {
    if (typeof DOMParser !== 'undefined') {
      const { doc, svgElement } = parseSvg(svgString);
      const elements = Array.from(doc.getElementsByTagName('*'));

      for (const el of elements) {
        if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
          el.setAttribute('fill', themeHex);
        }
        if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
          el.setAttribute('stroke', themeHex);
        }
        if (el.hasAttribute('stop-color')) {
          el.setAttribute('stop-color', themeHex);
        }
      }
      return serializeSvg(svgElement);
    }
  } catch {
    // fallback to regex below
  }

  // Fallback regex replacement
  return svgString
    .replace(/(fill=["'])(?!none|transparent|url)([^"']+)(["'])/gi, `$1${themeHex}$3`)
    .replace(/(stroke=["'])(?!none|transparent|url)([^"']+)(["'])/gi, `$1${themeHex}$3`)
    .replace(/(stop-color=["'])([^"']+)(["'])/gi, `$1${themeHex}$3`);
}

/**
 * Invert all hex colors in an SVG for Dark Mode adaptation
 */
export function invertSvgColors(svgString) {
  if (!svgString) return svgString;
  return svgString.replace(/#([0-9a-fA-F]{6})/g, (_, hex) => {
    const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16).padStart(2, '0');
    const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16).padStart(2, '0');
    const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  });
}

/**
 * Convert all hex colors in an SVG to Grayscale values
 */
export function grayscaleSvgColors(svgString) {
  if (!svgString) return svgString;
  return svgString.replace(/#([0-9a-fA-F]{6})/g, (_, hex) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Rec. 709 luminance
    const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b).toString(16).padStart(2, '0');
    return `#${gray}${gray}${gray}`;
  });
}

/**
 * Convert SVG string to a React JSX Component
 */
export function svgToReactJsx(svgString, componentName = 'SvgIcon') {
  if (!svgString) return '';

  const cleanName = componentName.replace(/[^a-zA-Z0-9_]/g, '') || 'SvgIcon';

  // Attribute mapping from kebab-case to camelCase
  const attrMap = {
    class: 'className',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-miterlimit': 'strokeMiterlimit',
    'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset',
    'stroke-opacity': 'strokeOpacity',
    'fill-rule': 'fillRule',
    'fill-opacity': 'fillOpacity',
    'clip-rule': 'clipRule',
    'clip-path': 'clipPath',
    'stop-color': 'stopColor',
    'stop-opacity': 'stopOpacity',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'text-anchor': 'textAnchor',
    'dominant-baseline': 'dominantBaseline',
    'xmlns:xlink': 'xmlnsXlink',
    'xlink:href': 'xlinkHref',
    'color-interpolation-filters': 'colorInterpolationFilters',
    'filter-units': 'filterUnits',
    'mask-units': 'maskUnits',
  };

  let jsx = svgString;

  // Replace attribute names
  for (const [kebab, camel] of Object.entries(attrMap)) {
    const reg = new RegExp(`\\b${kebab}=`, 'g');
    jsx = jsx.replace(reg, `${camel}=`);
  }

  // Inject {...props} into root <svg>
  jsx = jsx.replace(/<svg\b([^>]*)>/, '<svg $1 {...props}>');

  // Format code
  const formattedSvg = formatSvgCode(jsx, 2);

  return `import React from 'react';

export default function ${cleanName}(props) {
  return (
    ${formattedSvg.split('\n').join('\n    ')}
  );
}
`;
}

/**
 * Convert SVG string to Data URI and Base64 Data URL
 */
export function svgToDataUri(svgString) {
  const utf8Uri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  const base64Str = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgString)))
    : Buffer.from(svgString).toString('base64');
  const base64Uri = `data:image/svg+xml;base64,${base64Str}`;

  return {
    utf8Uri,
    base64Uri,
    cssBackground: `background-image: url("${utf8Uri}");`,
  };
}

/**
 * Rasterize SVG onto HTML5 Canvas at any scale factor
 */
export async function renderSvgToCanvas(svgString, scale = 2, bgColor = null) {
  return new Promise((resolve, reject) => {
    const { svgElement } = parseSvg(svgString);

    // Determine dimensions from viewBox or width/height
    let w = 512;
    let h = 512;

    if (svgElement.hasAttribute('viewBox')) {
      const parts = svgElement.getAttribute('viewBox').trim().split(/[\s,]+/);
      if (parts.length === 4) {
        w = parseFloat(parts[2]) || 512;
        h = parseFloat(parts[3]) || 512;
      }
    } else if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      w = parseFloat(svgElement.getAttribute('width')) || 512;
      h = parseFloat(svgElement.getAttribute('height')) || 512;
    }

    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas 2D context unavailable'));

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(blobUrl);
      resolve({ canvas, width: targetW, height: targetH });
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to rasterize SVG image onto canvas.'));
    };

    img.src = blobUrl;
  });
}

/**
 * Rasterize SVG to PNG Blob
 */
export async function svgToPngBlob(svgString, scale = 2) {
  const { canvas } = await renderSvgToCanvas(svgString, scale, null);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob from SVG canvas'));
    }, 'image/png');
  });
}

/**
 * Rasterize SVG to JPEG Blob
 */
export async function svgToJpegBlob(svgString, scale = 2, bgColor = '#ffffff') {
  const { canvas } = await renderSvgToCanvas(svgString, scale, bgColor);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create JPEG blob from SVG canvas'));
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Rasterize SVG to WebP Blob
 */
export async function svgToWebpBlob(svgString, scale = 2) {
  const { canvas } = await renderSvgToCanvas(svgString, scale, null);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create WebP blob from SVG canvas'));
    }, 'image/webp', 0.95);
  });
}

/**
 * Trigger file download in browser
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Curated Library of Diverse Demonstration SVGs
 */
export const SAMPLE_SVGS = [
  {
    id: 'bloated_export',
    title: 'Bloated Vector Export (Test Optimizer)',
    description: 'Realistic Illustrator/Inkscape export containing XML comments, deep nested groups, metadata, and 12-decimal floating points to demonstrate 50%+ compression.',
    svg: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) and Adobe Illustrator CS6 -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/" version="1.1" width="512px" height="512px" viewBox="0.000000 0.000000 512.000000 512.000000" enable-background="new 0 0 512 512" xml:space="preserve" data-name="Layer 1" data-testid="svg-root">
  <metadata id="metadata12938">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <cc:Work xmlns:cc="http://creativecommons.org/ns#" rdf:about="">
        <dc:format xmlns:dc="http://purl.org/dc/elements/1.1/">image/svg+xml</dc:format>
        <dc:type xmlns:dc="http://purl.org/dc/elements/1.1/" rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
        <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Vector Export</dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="1.4" inkscape:cx="256.00000" inkscape:cy="256.00000" inkscape:current-layer="layer1"/>
  <!-- Background Shape -->
  <g id="layer1" inkscape:groupmode="layer" inkscape:label="Background">
    <g id="nested_empty_wrapper">
      <rect x="0.000000" y="0.000000" width="512.000000" height="512.000000" rx="96.000000" ry="96.000000" fill="#4F46E5" inkscape:connector-curvature="0" style="fill:#4f46e5;stroke:none;"/>
    </g>
  </g>
  <!-- Empty redundant group to test cleaner -->
  <g id="empty_container_test" inkscape:label="Unused Group"></g>
  <!-- Main Vector Glyph with excessive decimal coordinates -->
  <g id="glyph_group" inkscape:groupmode="layer" inkscape:label="Artwork">
    <!-- Lightning Core -->
    <path d="M 280.491827401 64.129384910 L 160.849204812 280.938472910 L 256.000000000 280.938472910 L 224.184729104 448.394829104 L 352.928472910 232.093847291 L 256.000000000 232.093847291 Z" fill="#FDE047" stroke="#FFFFFF" stroke-width="8.000000" stroke-linejoin="round" inkscape:connector-curvature="0"/>
    <!-- Concentric accent ring -->
    <circle cx="256.000000" cy="256.000000" r="192.000000" fill="none" stroke="#A5B4FC" stroke-width="12.000000" stroke-dasharray="24.000000, 16.000000" opacity="0.650000"/>
  </g>
</svg>`,
  },
  {
    id: 'rocket_illustration',
    title: 'Space Rocket Launch (Illustration)',
    description: 'Vibrant modern vector illustration with gradients, clouds, exhaust fire, and celestial stars.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="60%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#312E81"/>
    </linearGradient>
    <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="50%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
    <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="40%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="64" fill="url(#skyGrad)"/>
  <!-- Stars -->
  <circle cx="90" cy="80" r="3" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="420" cy="110" r="4" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="120" cy="380" r="3" fill="#FFFFFF" opacity="0.7"/>
  <circle cx="410" cy="400" r="3.5" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="256" cy="60" r="2.5" fill="#FFFFFF" opacity="0.6"/>
  <!-- Fire Jet -->
  <path d="M226 350 Q256 470 256 490 Q256 470 286 350 Z" fill="url(#fireGrad)"/>
  <path d="M238 350 Q256 430 256 445 Q256 430 274 350 Z" fill="#FEF08A"/>
  <!-- Left Fin -->
  <path d="M216 310 L160 360 L216 350 Z" fill="#E11D48"/>
  <!-- Right Fin -->
  <path d="M296 310 L352 360 L296 350 Z" fill="#BE123C"/>
  <!-- Rocket Fuselage -->
  <path d="M256 90 C220 180 216 280 216 350 L296 350 C296 280 292 180 256 90 Z" fill="url(#rocketBody)"/>
  <!-- Nosecone Red Tip -->
  <path d="M256 90 C240 130 232 165 230 180 L282 180 C280 165 272 130 256 90 Z" fill="#E11D48"/>
  <!-- Porthole Window -->
  <circle cx="256" cy="225" r="32" fill="#0EA5E9" stroke="#E2E8F0" stroke-width="8"/>
  <circle cx="266" cy="215" r="10" fill="#FFFFFF" opacity="0.6"/>
</svg>`,
  },
  {
    id: 'isometric_cube',
    title: 'Isometric Tech Cube (Geometric)',
    description: 'Precision isometric vector artwork featuring 3D gradients and glowing edges.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="topFace" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <linearGradient id="leftFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0369A1"/>
      <stop offset="100%" stop-color="#082F49"/>
    </linearGradient>
    <linearGradient id="rightFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0C4A6E"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="48" fill="#0B132B"/>
  <g transform="translate(256, 256)">
    <!-- Top Face -->
    <polygon points="0,-140 120,-70 0,0 -120,-70" fill="url(#topFace)" stroke="#7DD3FC" stroke-width="3"/>
    <!-- Left Face -->
    <polygon points="-120,-70 0,0 0,140 -120,70" fill="url(#leftFace)" stroke="#38BDF8" stroke-width="3"/>
    <!-- Right Face -->
    <polygon points="0,0 120,-70 120,70 0,140" fill="url(#rightFace)" stroke="#0284C7" stroke-width="3"/>
    <!-- Inner Core Hexagon -->
    <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" fill="#F43F5E" opacity="0.85"/>
  </g>
</svg>`,
  },
  {
    id: 'feather_shield',
    title: 'Cyber Security Shield (Icon)',
    description: 'Clean line-art vector icon with dual-tone strokes and shield security badge.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="m9 12 2 2 4-4" stroke="#34D399" stroke-width="2.5"/>
</svg>`,
  },
];
