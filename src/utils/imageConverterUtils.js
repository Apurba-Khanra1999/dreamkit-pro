/**
 * In-browser Image Format Converter Utilities
 * High-performance conversions between WebP, PNG, JPEG, ICO (Favicon), BMP, SVG, and Base64 Data URL.
 * 100% Client-Side with zero server telemetry.
 */

// Format metadata and definitions
export const FORMAT_OPTIONS = [
  {
    id: 'webp',
    name: 'WebP',
    mime: 'image/webp',
    ext: 'webp',
    badge: 'Recommended',
    description: 'Modern web standard, 30% smaller than JPEG, supports transparency.',
    supportsQuality: true,
    supportsAlpha: true,
  },
  {
    id: 'png',
    name: 'PNG',
    mime: 'image/png',
    ext: 'png',
    badge: 'Lossless',
    description: 'Lossless 32-bit RGBA with full alpha channel transparency support.',
    supportsQuality: false,
    supportsAlpha: true,
  },
  {
    id: 'jpeg',
    name: 'JPEG / JPG',
    mime: 'image/jpeg',
    ext: 'jpg',
    badge: 'Universal',
    description: 'Universal compatibility across all devices and email clients.',
    supportsQuality: true,
    supportsAlpha: false,
  },
  {
    id: 'ico',
    name: 'ICO (Favicon)',
    mime: 'image/x-icon',
    ext: 'ico',
    badge: 'Multi-Res',
    description: 'Standard Windows & browser favicon bundle (16×16, 32×32, 48×48).',
    supportsQuality: false,
    supportsAlpha: true,
  },
  {
    id: 'svg',
    name: 'SVG (Vector Wrap)',
    mime: 'image/svg+xml',
    ext: 'svg',
    badge: 'Scalable',
    description: 'Responsive SVG wrapper with embedded raster data and viewBox.',
    supportsQuality: false,
    supportsAlpha: true,
  },
  {
    id: 'bmp',
    name: 'BMP',
    mime: 'image/bmp',
    ext: 'bmp',
    badge: 'Uncompressed',
    description: 'Classic 32-bit uncompressed Windows bitmap format.',
    supportsQuality: false,
    supportsAlpha: true,
  },
  {
    id: 'base64',
    name: 'Base64 Data URI',
    mime: 'text/plain',
    ext: 'txt',
    badge: 'Code Embed',
    description: 'Ready-to-paste Base64 string, HTML <img> tag, and CSS background snippet.',
    supportsQuality: true,
    supportsAlpha: true,
  },
];

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Load image from file, blob, or URL
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanUp = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanUp();
      resolve(img);
    };

    img.onerror = (err) => {
      cleanUp();
      reject(new Error(err?.message || 'Failed to load image.'));
    };

    if (typeof src === 'string') {
      img.src = src;
    } else if (src instanceof Blob || src instanceof File) {
      img.src = URL.createObjectURL(src);
    } else {
      reject(new Error('Invalid image source type'));
    }
  });
}

/**
 * Check if canvas image contains any transparent pixels
 */
export function checkTransparency(ctx, width, height) {
  try {
    const sampleWidth = Math.min(width, 200);
    const sampleHeight = Math.min(height, 200);
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imgData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
  } catch {
    // Cross-origin fallback
  }
  return false;
}

/**
 * Generate standard ICO binary file containing multiple PNG resolutions
 */
export async function createIcoBlob(sourceCanvas, sizes = [16, 32, 48]) {
  const pngEntries = [];
  for (const size of sizes) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, size, size);

    const blob = await new Promise(res => tempCanvas.toBlob(res, 'image/png'));
    if (!blob) continue;

    const arrayBuffer = await blob.arrayBuffer();
    pngEntries.push({ size, data: new Uint8Array(arrayBuffer) });
  }

  const count = pngEntries.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const entry of pngEntries) totalSize += entry.data.length;

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // ICONDIR Header
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type 1 = icon (.ico)
  view.setUint16(4, count, true); // number of icons

  let offset = headerSize;
  for (let i = 0; i < count; i++) {
    const entry = pngEntries[i];
    const entryOffset = 6 + i * 16;
    buffer[entryOffset + 0] = entry.size >= 256 ? 0 : entry.size;
    buffer[entryOffset + 1] = entry.size >= 256 ? 0 : entry.size;
    buffer[entryOffset + 2] = 0; // color palette
    buffer[entryOffset + 3] = 0; // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // 32 bpp
    view.setUint32(entryOffset + 8, entry.data.length, true); // size of PNG data
    view.setUint32(entryOffset + 12, offset, true); // offset of PNG data

    buffer.set(entry.data, offset);
    offset += entry.data.length;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Generate standard 32-bit BMP binary file
 */
export function createBmpBlob(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const imgData = ctx.getImageData(0, 0, width, height);
  const rgbaData = imgData.data;

  const rowSize = width * 4;
  const imageSize = rowSize * height;
  const fileSize = 54 + imageSize;

  const buffer = new Uint8Array(fileSize);
  const view = new DataView(buffer.buffer);

  // File Header
  buffer[0] = 0x42; // 'B'
  buffer[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true); // pixel data offset

  // DIB Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // top-down
  view.setUint16(26, 1, true);
  view.setUint16(28, 32, true); // 32 bpp
  view.setUint32(30, 0, true); // BI_RGB
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // RGBA to BGRA
  let offset = 54;
  for (let i = 0; i < rgbaData.length; i += 4) {
    buffer[offset + 0] = rgbaData[i + 2]; // Blue
    buffer[offset + 1] = rgbaData[i + 1]; // Green
    buffer[offset + 2] = rgbaData[i + 0]; // Red
    buffer[offset + 3] = rgbaData[i + 3]; // Alpha
    offset += 4;
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Generate SVG file wrapping raster data
 */
export function createSvgBlob(dataUri, width, height) {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <image width="${width}" height="${height}" xlink:href="${dataUri}" />
</svg>`;
  return new Blob([svgContent], { type: 'image/svg+xml' });
}

/**
 * Convert any image into the target format
 * @param {File|Blob|string} source
 * @param {string} targetFormatId 'webp' | 'png' | 'jpeg' | 'ico' | 'svg' | 'bmp' | 'base64'
 * @param {Object} options { quality, backgroundColor, icoSizes }
 * @returns {Promise<Object>}
 */
export async function convertImage(source, targetFormatId = 'webp', options = {}) {
  const startTime = performance.now();
  const {
    quality = 0.9,
    backgroundColor = '#ffffff',
    icoSizes = [16, 32, 48],
  } = options;

  const originalName = source.name || 'image';
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const originalSize = source.size || 0;

  // Load image
  const img = await loadImage(source);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If converting to JPEG or when backgroundColor is defined and not transparent
  if (targetFormatId === 'jpeg' || (backgroundColor && backgroundColor !== 'transparent')) {
    ctx.fillStyle = backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const hasTransparency = checkTransparency(ctx, width, height);

  let outputBlob = null;
  let outputUrl = null;
  let base64String = null;
  let outputExt = 'png';
  let mimeType = 'image/png';

  const clampedQuality = Math.max(0.01, Math.min(1.0, quality));

  if (targetFormatId === 'webp') {
    outputExt = 'webp';
    mimeType = 'image/webp';
    outputBlob = await new Promise(r => canvas.toBlob(r, mimeType, clampedQuality));
    outputUrl = URL.createObjectURL(outputBlob);
  } else if (targetFormatId === 'jpeg') {
    outputExt = 'jpg';
    mimeType = 'image/jpeg';
    outputBlob = await new Promise(r => canvas.toBlob(r, mimeType, clampedQuality));
    outputUrl = URL.createObjectURL(outputBlob);
  } else if (targetFormatId === 'png') {
    outputExt = 'png';
    mimeType = 'image/png';
    outputBlob = await new Promise(r => canvas.toBlob(r, mimeType));
    outputUrl = URL.createObjectURL(outputBlob);
  } else if (targetFormatId === 'ico') {
    outputExt = 'ico';
    mimeType = 'image/x-icon';
    outputBlob = await createIcoBlob(canvas, icoSizes);
    outputUrl = URL.createObjectURL(outputBlob);
  } else if (targetFormatId === 'bmp') {
    outputExt = 'bmp';
    mimeType = 'image/bmp';
    outputBlob = createBmpBlob(canvas);
    outputUrl = URL.createObjectURL(outputBlob);
  } else if (targetFormatId === 'svg') {
    outputExt = 'svg';
    mimeType = 'image/svg+xml';
    const pngDataUri = canvas.toDataURL('image/png');
    outputBlob = createSvgBlob(pngDataUri, width, height);
    outputUrl = URL.createObjectURL(outputBlob);
  } else if (targetFormatId === 'base64') {
    outputExt = 'txt';
    mimeType = 'text/plain';
    base64String = canvas.toDataURL('image/png');
    outputBlob = new Blob([base64String], { type: 'text/plain' });
    outputUrl = URL.createObjectURL(outputBlob);
  }

  if (!base64String && canvas) {
    try {
      base64String = canvas.toDataURL(mimeType === 'image/x-icon' || mimeType === 'image/bmp' ? 'image/png' : mimeType, clampedQuality);
    } catch {
      // ignore
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const convertedSize = outputBlob ? outputBlob.size : 0;
  const savedBytes = originalSize > 0 ? originalSize - convertedSize : 0;
  const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

  const outputFileName = `${baseName}.${outputExt}`;

  const htmlSnippet = `<img src="${base64String}" alt="${outputFileName}" width="${width}" height="${height}" />`;
  const cssSnippet = `.custom-image {\n  background-image: url("${base64String}");\n  width: ${width}px;\n  height: ${height}px;\n}`;

  return {
    blob: outputBlob,
    url: outputUrl,
    base64: base64String,
    name: outputFileName,
    format: targetFormatId,
    mimeType,
    originalSize,
    convertedSize,
    savedBytes,
    savedPercentage,
    width,
    height,
    hasTransparency,
    durationMs,
    htmlSnippet,
    cssSnippet,
  };
}

/**
 * Generate synthetic sample files for testing
 */
export async function createConverterSampleImage(type = 'logo') {
  const width = 1200;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample.png';

  if (type === 'logo') {
    // Transparent PNG logo with smooth glowing gradients
    filename = 'dreamkit-badge-logo.png';
    ctx.clearRect(0, 0, width, height);

    // Glowing badge shield
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 280, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(width / 2 - 280, height / 2 - 280, width / 2 + 280, height / 2 + 280);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fill();

    // Central geometric icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 110px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('{ }', width / 2, height / 2);
    ctx.restore();
  } else if (type === 'photo') {
    filename = 'golden-hour-landscape.jpg';
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#ea580c');
    grad.addColorStop(0.4, '#db2777');
    grad.addColorStop(0.8, '#4f46e5');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sun
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, 90, 0, Math.PI * 2);
    ctx.fill();

    // Foreground mountains
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.7);
    ctx.lineTo(width * 0.3, height * 0.5);
    ctx.lineTo(width * 0.6, height * 0.75);
    ctx.lineTo(width, height * 0.55);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  } else {
    filename = 'vector-circuit-art.png';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 40 + i * 25, 0, Math.PI * 1.5);
      ctx.stroke();
    }
  }

  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const blob = await new Promise(r => canvas.toBlob(r, mime, 0.95));
  return new File([blob], filename, { type: mime, lastModified: Date.now() });
}

/**
 * Trigger file download
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
