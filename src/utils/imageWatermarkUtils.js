/**
 * In-browser Image Watermark Utilities
 * Custom text, logo overlays, 9-point anchor positioning, full-grid diagonal tiling, and batch processing.
 * 100% Client-Side with zero server telemetry.
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
 * Load HTMLImageElement from File, Blob, or URL
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
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob from canvas'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Calculate anchor (X, Y) from 9-point grid
 */
export function calculateAnchor(position, canvasWidth, canvasHeight, itemWidth, itemHeight, margin) {
  const halfW = itemWidth / 2;
  const halfH = itemHeight / 2;

  switch (position) {
    case 'nw': // Top-Left
      return { x: margin + halfW, y: margin + halfH };
    case 'n': // Top-Center
      return { x: canvasWidth / 2, y: margin + halfH };
    case 'ne': // Top-Right
      return { x: canvasWidth - margin - halfW, y: margin + halfH };
    case 'w': // Center-Left
      return { x: margin + halfW, y: canvasHeight / 2 };
    case 'c': // Center
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    case 'e': // Center-Right
      return { x: canvasWidth - margin - halfW, y: canvasHeight / 2 };
    case 'sw': // Bottom-Left
      return { x: margin + halfW, y: canvasHeight - margin - halfH };
    case 's': // Bottom-Center
      return { x: canvasWidth / 2, y: canvasHeight - margin - halfH };
    case 'se': // Bottom-Right
    default:
      return { x: canvasWidth - margin - halfW, y: canvasHeight - margin - halfH };
  }
}

/**
 * Apply Watermark onto image canvas
 * @param {HTMLImageElement|File|Blob} sourceImage
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function applyWatermark(sourceImage, options = {}) {
  const startTime = performance.now();
  const img = sourceImage instanceof HTMLImageElement ? sourceImage : await loadImage(sourceImage);

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  const {
    type = 'text', // 'text' | 'image'
    // Text watermark options
    text = '© DreamKit Studio',
    fontSize = 36,
    fontFamily = 'Inter, sans-serif',
    fontWeight = 'bold',
    color = '#ffffff',
    opacity = 0.75,
    hasShadow = true,
    shadowColor = '#000000',
    hasBadge = false,
    badgeColor = 'rgba(0, 0, 0, 0.45)',
    // Logo watermark options
    logoSource = null,
    logoScale = 20, // percentage of image width
    logoOpacity = 0.8,
    // Layout options
    layout = 'position', // 'position' | 'tile'
    position = 'se', // 'nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'
    margin = 35,
    rotation = 0, // degrees
    tileGapX = 160,
    tileGapY = 160,
    tileAngle = -30,
    // Export options
    format = 'image/png',
    quality = 0.92,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = origWidth;
  canvas.height = origHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw base image
  ctx.drawImage(img, 0, 0, origWidth, origHeight);

  // 2. Prepare Watermark Item (Text or Image)
  let logoImg = null;
  if (type === 'image' && logoSource) {
    logoImg = logoSource instanceof HTMLImageElement ? logoSource : await loadImage(logoSource);
  }

  // Draw Text Function
  const renderTextItem = (renderCtx, x, y, angle) => {
    renderCtx.save();
    renderCtx.translate(x, y);
    renderCtx.rotate((angle * Math.PI) / 180);
    renderCtx.globalAlpha = Math.max(0.01, Math.min(1.0, opacity));

    renderCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    renderCtx.textAlign = 'center';
    renderCtx.textBaseline = 'middle';

    const metrics = renderCtx.measureText(text);
    const textW = metrics.width;
    const textH = fontSize * 1.2;

    // Optional background badge pill
    if (hasBadge) {
      renderCtx.fillStyle = badgeColor;
      const paddingX = fontSize * 0.45;
      const paddingY = fontSize * 0.25;
      const pillW = textW + paddingX * 2;
      const pillH = textH + paddingY * 2;
      const radius = pillH / 2;

      renderCtx.beginPath();
      if (typeof renderCtx.roundRect === 'function') {
        renderCtx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, radius);
      } else {
        renderCtx.rect(-pillW / 2, -pillH / 2, pillW, pillH);
      }
      renderCtx.fill();
    }

    // Optional text shadow
    if (hasShadow) {
      renderCtx.shadowColor = shadowColor;
      renderCtx.shadowBlur = Math.round(fontSize * 0.25);
      renderCtx.shadowOffsetX = 2;
      renderCtx.shadowOffsetY = 2;
    } else {
      renderCtx.shadowColor = 'transparent';
    }

    renderCtx.fillStyle = color;
    renderCtx.fillText(text, 0, 0);
    renderCtx.restore();
  };

  // Draw Logo Function
  const renderLogoItem = (renderCtx, x, y, angle) => {
    if (!logoImg) return;
    const origLogoW = logoImg.naturalWidth || logoImg.width;
    const origLogoH = logoImg.naturalHeight || logoImg.height;

    const targetLogoW = Math.max(10, Math.round(origWidth * (logoScale / 100)));
    const targetLogoH = Math.max(10, Math.round(targetLogoW * (origLogoH / origLogoW)));

    renderCtx.save();
    renderCtx.translate(x, y);
    renderCtx.rotate((angle * Math.PI) / 180);
    renderCtx.globalAlpha = Math.max(0.01, Math.min(1.0, logoOpacity));

    if (hasShadow) {
      renderCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      renderCtx.shadowBlur = 12;
      renderCtx.shadowOffsetX = 3;
      renderCtx.shadowOffsetY = 3;
    }

    renderCtx.drawImage(
      logoImg,
      -targetLogoW / 2,
      -targetLogoH / 2,
      targetLogoW,
      targetLogoH
    );
    renderCtx.restore();
  };

  // 3. Render according to Layout (Position vs Tile)
  if (layout === 'tile') {
    // Full Grid Diagonal Tiled Pattern
    ctx.save();
    // Rotate canvas coordinate space from center
    ctx.translate(origWidth / 2, origHeight / 2);
    ctx.rotate((tileAngle * Math.PI) / 180);

    const diag = Math.sqrt(origWidth * origWidth + origHeight * origHeight);
    let stepX = 200;
    let stepY = 120;

    if (type === 'text') {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      stepX = Math.max(80, metrics.width + tileGapX);
      stepY = Math.max(60, fontSize + tileGapY);
    } else if (logoImg) {
      const origLogoW = logoImg.naturalWidth || logoImg.width;
      const targetLogoW = Math.max(10, Math.round(origWidth * (logoScale / 100)));
      stepX = Math.max(80, targetLogoW + tileGapX);
      stepY = Math.max(60, (targetLogoW * (logoImg.naturalHeight / origLogoW)) + tileGapY);
    }

    // Step across expanded diagonal bounds
    for (let x = -diag; x <= diag; x += stepX) {
      for (let y = -diag; y <= diag; y += stepY) {
        if (type === 'text') {
          renderTextItem(ctx, x, y, 0);
        } else {
          renderLogoItem(ctx, x, y, 0);
        }
      }
    }
    ctx.restore();
  } else {
    // Single 9-point anchor placement
    let itemW = 200;
    let itemH = 60;

    if (type === 'text') {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      itemW = metrics.width;
      itemH = fontSize * 1.2;
    } else if (logoImg) {
      const origLogoW = logoImg.naturalWidth || logoImg.width;
      const origLogoH = logoImg.naturalHeight || logoImg.height;
      itemW = Math.max(10, Math.round(origWidth * (logoScale / 100)));
      itemH = Math.max(10, Math.round(itemW * (origLogoH / origLogoW)));
    }

    const { x, y } = calculateAnchor(position, origWidth, origHeight, itemW, itemH, margin);

    if (type === 'text') {
      renderTextItem(ctx, x, y, rotation);
    } else {
      renderLogoItem(ctx, x, y, rotation);
    }
  }

  const blob = await canvasToBlob(canvas, format, quality);
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  let ext = 'png';
  if (format === 'image/jpeg') ext = 'jpg';
  if (format === 'image/webp') ext = 'webp';

  const origName = sourceImage.name || 'image.jpg';
  const baseName = origName.substring(0, origName.lastIndexOf('.')) || origName;
  const outputFileName = `${baseName}-watermarked.${ext}`;

  return {
    blob,
    url,
    name: outputFileName,
    width: origWidth,
    height: origHeight,
    size: blob.size,
    format,
    durationMs,
  };
}

/**
 * Generate synthetic sample logos for instant testing
 */
export async function createSampleLogo(type = 'badge') {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.clearRect(0, 0, 400, 400);

  if (type === 'badge') {
    // Verified Seal Logo
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#ec4899');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(200, 200, 145, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VERIFIED', 200, 185);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('★ DREAMKIT ★', 200, 225);
  } else if (type === 'copyright') {
    // Copyright Shield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(200, 200, 150, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 110px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('©', 200, 195);
  } else {
    // Red Stamp
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 120, 340, 160);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 36px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CONFIDENTIAL', 200, 180);
    ctx.font = 'bold 18px monospace';
    ctx.fillText('DO NOT DISTRIBUTE', 200, 220);
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  return new File([blob], `logo-${type}.png`, { type: 'image/png' });
}

/**
 * Generate synthetic sample base background images
 */
export async function createSampleBaseImage(type = 'landscape') {
  const width = 1600;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample-photo.jpg';

  if (type === 'landscape') {
    filename = 'mountain-lake-sunset.jpg';
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
    ctx.arc(width * 0.5, height * 0.45, 120, 0, Math.PI * 2);
    ctx.fill();

    // Silhouette mountains
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.7);
    ctx.lineTo(width * 0.25, height * 0.5);
    ctx.lineTo(width * 0.5, height * 0.75);
    ctx.lineTo(width * 0.75, height * 0.45);
    ctx.lineTo(width, height * 0.65);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  } else {
    filename = 'abstract-brand-showcase.jpg';
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#0d9488');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 14;
    for (let r = 80; r <= 360; r += 70) {
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Sample watermark text
  ctx.save();
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.fillText('DreamKit Sample Photography Portfolio', width / 2, height / 2 - 20);
  ctx.font = '20px monospace';
  ctx.fillText(`${width} × ${height} px • Ready for Watermarking`, width / 2, height / 2 + 25);
  ctx.restore();

  const mime = 'image/jpeg';
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
