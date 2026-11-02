/**
 * In-browser Image Resizer & Cropper Utilities
 * HTML5 Canvas transformations, aspect ratio mathematics, and dimension presets.
 */

/**
 * Format bytes into readable string
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
 * Common Standard Dimension Presets
 */
export const DIMENSION_PRESETS = [
  // Social Media
  { id: 'yt_thumb', label: 'YouTube Thumbnail', category: 'social', width: 1280, height: 720, ratio: '16:9' },
  { id: 'yt_banner', label: 'YouTube Channel Banner', category: 'social', width: 2560, height: 1440, ratio: '16:9' },
  { id: 'ig_square', label: 'Instagram Square Post', category: 'social', width: 1080, height: 1080, ratio: '1:1' },
  { id: 'ig_portrait', label: 'Instagram Portrait (4:5)', category: 'social', width: 1080, height: 1350, ratio: '4:5' },
  { id: 'ig_story', label: 'Instagram Story / Reel / TikTok', category: 'social', width: 1080, height: 1920, ratio: '9:16' },
  { id: 'x_post', label: 'X (Twitter) Post', category: 'social', width: 1200, height: 675, ratio: '16:9' },
  { id: 'x_header', label: 'X (Twitter) Header Banner', category: 'social', width: 1500, height: 500, ratio: '3:1' },
  { id: 'fb_cover', label: 'Facebook Page Cover', category: 'social', width: 820, height: 312, ratio: '2.6:1' },
  { id: 'li_banner', label: 'LinkedIn Background Banner', category: 'social', width: 1584, height: 396, ratio: '4:1' },
  
  // Web & Screen Display
  { id: 'screen_4k', label: '4K Ultra HD', category: 'web', width: 3840, height: 2160, ratio: '16:9' },
  { id: 'screen_fhd', label: 'Full HD (1080p)', category: 'web', width: 1920, height: 1080, ratio: '16:9' },
  { id: 'screen_hd', label: 'HD (720p)', category: 'web', width: 1280, height: 720, ratio: '16:9' },
  { id: 'blog_hero', label: 'Blog Hero Image (OG)', category: 'web', width: 1200, height: 630, ratio: '1.91:1' },
  { id: 'email_banner', label: 'Email Newsletter Banner', category: 'web', width: 600, height: 250, ratio: '2.4:1' },
  { id: 'thumb_medium', label: 'Web Thumbnail Medium', category: 'web', width: 400, height: 300, ratio: '4:3' },
  { id: 'thumb_small', label: 'Web Thumbnail Small', category: 'web', width: 200, height: 200, ratio: '1:1' },
  { id: 'favicon_512', label: 'PWA Icon / App Store', category: 'web', width: 512, height: 512, ratio: '1:1' },
  { id: 'favicon_64', label: 'Favicon High-DPI (64px)', category: 'web', width: 64, height: 64, ratio: '1:1' },
  { id: 'favicon_32', label: 'Favicon Standard (32px)', category: 'web', width: 32, height: 32, ratio: '1:1' },
];

/**
 * Aspect Ratio Presets for Cropping
 */
export const ASPECT_RATIO_PRESETS = [
  { id: 'free', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1 (Square)', ratio: 1 },
  { id: '16:9', label: '16:9 (Landscape)', ratio: 16 / 9 },
  { id: '9:16', label: '9:16 (Story / Reel)', ratio: 9 / 16 },
  { id: '4:3', label: '4:3 (Photo)', ratio: 4 / 3 },
  { id: '3:2', label: '3:2 (35mm Classic)', ratio: 3 / 2 },
  { id: '4:5', label: '4:5 (Social Portrait)', ratio: 4 / 5 },
  { id: '2:1', label: '2:1 (Header)', ratio: 2 },
];

/**
 * Load an HTML Image element from File, Blob, or URL
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
      reject(new Error(err?.message || 'Failed to decode image.'));
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
 * Convert canvas to blob wrapped in Promise
 */
export function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image blob from canvas'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Resize Image with precise pixel bounds and fitting modes
 * @param {HTMLImageElement} img
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function resizeImage(img, options = {}) {
  const {
    targetWidth,
    targetHeight,
    mode = 'fit', // 'fit' (proportional), 'stretch' (exact), 'pad' (letterbox), 'cover' (center-cropped)
    padColor = 'transparent',
    smoothing = true,
    format = 'image/png',
    quality = 0.92,
  } = options;

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  let finalWidth = Math.max(1, Math.round(targetWidth || origWidth));
  let finalHeight = Math.max(1, Math.round(targetHeight || origHeight));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = smoothing;
  if (smoothing) {
    ctx.imageSmoothingQuality = 'high';
  }

  if (mode === 'stretch') {
    // Exact stretch
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
  } else if (mode === 'cover') {
    // Fill bounds, center-crop excess
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    const scale = Math.max(finalWidth / origWidth, finalHeight / origHeight);
    const sw = finalWidth / scale;
    const sh = finalHeight / scale;
    const sx = (origWidth - sw) / 2;
    const sy = (origHeight - sh) / 2;

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, finalWidth, finalHeight);
  } else if (mode === 'pad') {
    // Letterbox / pillarbox inside target dimensions
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    const scale = Math.min(finalWidth / origWidth, finalHeight / origHeight);
    const renderWidth = Math.round(origWidth * scale);
    const renderHeight = Math.round(origHeight * scale);
    const offsetX = Math.round((finalWidth - renderWidth) / 2);
    const offsetY = Math.round((finalHeight - renderHeight) / 2);

    if (padColor !== 'transparent') {
      ctx.fillStyle = padColor;
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    } else if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
  } else {
    // 'fit' mode: maintain aspect ratio, canvas size equals scaled dimensions
    const scale = Math.min(finalWidth / origWidth, finalHeight / origHeight);
    finalWidth = Math.max(1, Math.round(origWidth * scale));
    finalHeight = Math.max(1, Math.round(origHeight * scale));

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
  }

  const blob = await canvasToBlob(canvas, format, quality);
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: canvas.width,
    height: canvas.height,
    originalWidth: origWidth,
    originalHeight: origHeight,
    size: blob.size,
    format,
  };
}

/**
 * Apply Crop and transformations (Rotation & Flips)
 * @param {HTMLImageElement} img
 * @param {Object} cropRect { x, y, width, height } in original image coordinates
 * @param {Object} transformOpts { rotation: 0|90|180|270, flipH: boolean, flipV: boolean, format, quality }
 * @returns {Promise<Object>}
 */
export async function cropAndTransformImage(img, cropRect, transformOpts = {}) {
  const {
    rotation = 0, // degrees: 0, 90, 180, 270
    flipH = false,
    flipV = false,
    format = 'image/png',
    quality = 0.92,
  } = transformOpts;

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // 1. Create intermediate canvas to handle rotation & flips
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isPerpendicular = normalizedRotation === 90 || normalizedRotation === 270;

  const transformedCanvas = document.createElement('canvas');
  transformedCanvas.width = isPerpendicular ? origHeight : origWidth;
  transformedCanvas.height = isPerpendicular ? origWidth : origHeight;

  const tCtx = transformedCanvas.getContext('2d');
  if (!tCtx) throw new Error('Canvas 2D context unavailable');

  tCtx.imageSmoothingEnabled = true;
  tCtx.imageSmoothingQuality = 'high';

  // Apply transformation matrix from center
  tCtx.translate(transformedCanvas.width / 2, transformedCanvas.height / 2);
  tCtx.rotate((normalizedRotation * Math.PI) / 180);
  tCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  tCtx.drawImage(img, -origWidth / 2, -origHeight / 2);

  // 2. Extract the cropped rect from the transformed canvas
  const cropX = Math.max(0, Math.min(transformedCanvas.width - 1, Math.round(cropRect.x)));
  const cropY = Math.max(0, Math.min(transformedCanvas.height - 1, Math.round(cropRect.y)));
  const cropW = Math.max(1, Math.min(transformedCanvas.width - cropX, Math.round(cropRect.width)));
  const cropH = Math.max(1, Math.min(transformedCanvas.height - cropY, Math.round(cropRect.height)));

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = cropW;
  outputCanvas.height = cropH;

  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) throw new Error('Canvas 2D context unavailable');

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  if (format === 'image/jpeg') {
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, cropW, cropH);
  }

  outCtx.drawImage(
    transformedCanvas,
    cropX, cropY, cropW, cropH,
    0, 0, cropW, cropH
  );

  const blob = await canvasToBlob(outputCanvas, format, quality);
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: cropW,
    height: cropH,
    size: blob.size,
    format,
  };
}

/**
 * Generate synthetic sample image for testing
 */
export async function createEditorSampleImage(type = 'photo') {
  const width = 1600;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample-image.jpg';

  if (type === 'photo') {
    filename = 'photo-sunset-horizon.jpg';
    // Sunset gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(0.35, '#ec4899');
    grad.addColorStop(0.7, '#6366f1');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing sun
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, 90, 0, Math.PI * 2);
    ctx.fill();

    // Ocean horizon reflection
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    // Island silhouette
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.65, width * 0.35, 70, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'art') {
    filename = 'vector-abstract-geometry.png';
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Geometric rings & cards
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 16;
    for (let r = 120; r <= 380; r += 80) {
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    filename = 'pixel-retro-canvas.png';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Retro grid
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const tileSize = 50;
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        if ((x + y) % (tileSize * 3) === 0) {
          ctx.fillStyle = colors[((x * 7 + y * 13) % colors.length)];
          ctx.fillRect(x + 5, y + 5, tileSize - 10, tileSize - 10);
        }
      }
    }
  }

  // Label watermark
  ctx.save();
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText('DreamKit High-Resolution Sample Image', width / 2, height / 2 - 20);
  ctx.font = '22px monospace';
  ctx.fillText(`${width} x ${height} px • Ready for Resizing & Cropping`, width / 2, height / 2 + 25);
  ctx.restore();

  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
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
