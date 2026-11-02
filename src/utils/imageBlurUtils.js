/**
 * In-browser Image Blur Utilities
 * Gaussian Blur, Motion Blur, Radial Zoom Blur, Pixelate/Mosaic Censor,
 * Tilt-Shift Miniature, and Selective Region Privacy Masking.
 * 100% Client-Side with zero server telemetry.
 */

export const BLUR_TYPES = [
  {
    id: 'gaussian',
    name: 'Gaussian Blur',
    description: 'Smooth, natural camera lens softening with adjustable radius.',
    tag: 'Standard',
  },
  {
    id: 'pixelate',
    name: 'Pixelate / Mosaic (Censor)',
    description: 'Quantizes image into blocky pixels. Ideal for censoring faces, license plates, and confidential text.',
    tag: 'Privacy Censor',
  },
  {
    id: 'motion',
    name: 'Directional Motion Blur',
    description: 'Simulates high-speed movement along an adjustable directional angle.',
    tag: 'Action Pan',
  },
  {
    id: 'radial',
    name: 'Zoom / Radial Blur',
    description: 'Blurs outward in a dramatic warp burst from a central focal point.',
    tag: 'Radial Burst',
  },
  {
    id: 'tilt_shift',
    name: 'Linear Tilt-Shift',
    description: 'Simulates miniature macro photography with a sharp horizontal focus band and blurred top/bottom.',
    tag: 'Miniature',
  },
  {
    id: 'depth_of_field',
    name: 'Radial Depth of Field',
    description: 'Keeps a central circular subject in sharp focus while smoothly blurring the surrounding background.',
    tag: 'Portrait Bokeh',
  },
];

export const BLUR_MODES = [
  { id: 'full', name: 'Entire Image', desc: 'Apply blur across the entire canvas.' },
  { id: 'region', name: 'Selective Box (Censor)', desc: 'Blur only the selected area (e.g. faces, license plates).' },
  { id: 'invert_region', name: 'Invert (Keep Box Sharp)', desc: 'Keep the selected subject sharp while blurring the background.' },
  { id: 'tilt_shift', name: 'Tilt-Shift Band', desc: 'Linear depth-of-field with sharp horizontal focus band.' },
  { id: 'depth_of_field', name: 'Circular Bokeh Focus', desc: 'Radial depth-of-field radiating outward from center.' },
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
 * Render a blurred version of the image onto a target canvas using hardware-accelerated canvas filter
 */
export function renderBlurredCanvas(img, width, height, radius = 20) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply CSS canvas filter
  ctx.filter = `blur(${Math.max(1, radius)}px)`;
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';

  return canvas;
}

/**
 * Render a pixelated/mosaic version of the image onto a target canvas
 */
export function renderPixelatedCanvas(img, width, height, pixelSize = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const pSize = Math.max(2, Math.round(pixelSize));
  const scaledW = Math.max(1, Math.round(width / pSize));
  const scaledH = Math.max(1, Math.round(height / pSize));

  // Temporary downscaled canvas
  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = scaledW;
  smallCanvas.height = scaledH;
  const smallCtx = smallCanvas.getContext('2d');
  if (!smallCtx) throw new Error('Canvas 2D context unavailable');

  smallCtx.drawImage(img, 0, 0, scaledW, scaledH);

  // Disable smoothing for sharp mosaic blocks
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(smallCanvas, 0, 0, scaledW, scaledH, 0, 0, width, height);

  return canvas;
}

/**
 * Render directional motion blur onto a target canvas
 */
export function renderMotionBlurCanvas(img, width, height, distance = 30, angle = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const rad = (angle * Math.PI) / 180;
  const totalSteps = Math.max(5, Math.min(25, Math.round(distance / 2)));
  const dx = (Math.cos(rad) * distance) / totalSteps;
  const dy = (Math.sin(rad) * distance) / totalSteps;

  ctx.globalAlpha = 1 / totalSteps;

  for (let i = -Math.floor(totalSteps / 2); i <= Math.floor(totalSteps / 2); i++) {
    ctx.drawImage(img, i * dx, i * dy, width, height);
  }

  ctx.globalAlpha = 1.0;
  return canvas;
}

/**
 * Render radial/zoom blur onto a target canvas
 */
export function renderRadialBlurCanvas(img, width, height, strength = 0.2, centerX = 0.5, centerY = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const totalSteps = 16;
  const cx = width * centerX;
  const cy = height * centerY;

  ctx.drawImage(img, 0, 0, width, height);
  ctx.globalAlpha = 1 / totalSteps;

  for (let i = 1; i <= totalSteps; i++) {
    const scale = 1 + (strength * (i / totalSteps));
    const drawW = width * scale;
    const drawH = height * scale;
    const drawX = cx - (drawW * centerX);
    const drawY = cy - (drawH * centerY);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  ctx.globalAlpha = 1.0;
  return canvas;
}

/**
 * Apply Image Blur with chosen type, mode, and settings
 * @param {HTMLImageElement|File|Blob} sourceImage
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function applyImageBlur(sourceImage, options = {}) {
  const startTime = performance.now();
  const img = sourceImage instanceof HTMLImageElement ? sourceImage : await loadImage(sourceImage);

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const {
    type = 'gaussian', // 'gaussian' | 'pixelate' | 'motion' | 'radial' | 'tilt_shift' | 'depth_of_field'
    mode = 'full', // 'full' | 'region' | 'invert_region' | 'tilt_shift' | 'depth_of_field'
    radius = 20, // 1 to 100 px
    pixelSize = 16, // 2 to 64 px
    motionDistance = 30, // 5 to 100 px
    motionAngle = 0, // -180 to +180 deg
    radialStrength = 0.2, // 0.05 to 0.5
    focusCenter = { x: 0.5, y: 0.5 },
    region = null, // { x: 100, y: 100, width: 200, height: 200 }
    tiltBandSize = 30, // % of height
    tiltFeather = 120, // px
    format = 'image/png',
    quality = 0.92,
  } = options;

  // 1. Generate full blurred version according to blur type
  let blurCanvas = null;
  if (type === 'pixelate') {
    blurCanvas = renderPixelatedCanvas(img, width, height, pixelSize);
  } else if (type === 'motion') {
    blurCanvas = renderMotionBlurCanvas(img, width, height, motionDistance, motionAngle);
  } else if (type === 'radial') {
    blurCanvas = renderRadialBlurCanvas(img, width, height, radialStrength, focusCenter.x, focusCenter.y);
  } else {
    // Standard Gaussian blur
    blurCanvas = renderBlurredCanvas(img, width, height, radius);
  }

  // 2. Final composition canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 3. Composite according to application mode
  if (mode === 'full') {
    // Mode: Full Canvas Blur
    ctx.drawImage(blurCanvas, 0, 0, width, height);
  } else if (mode === 'region' && region) {
    // Mode: Selective Privacy Censor Box (inside region blurred)
    ctx.drawImage(img, 0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.width, region.height);
    ctx.clip();
    ctx.drawImage(blurCanvas, 0, 0, width, height);
    ctx.restore();
  } else if (mode === 'invert_region' && region) {
    // Mode: Invert Selection (blur outside, keep inside box sharp)
    ctx.drawImage(blurCanvas, 0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.width, region.height);
    ctx.clip();
    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();
  } else if (mode === 'tilt_shift' || type === 'tilt_shift') {
    // Mode: Linear Tilt-Shift Miniature
    ctx.drawImage(img, 0, 0, width, height);

    // Create mask canvas with linear gradient
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Mask canvas context unavailable');

    const focusY = height * focusCenter.y;
    const bandHeight = (height * (tiltBandSize / 100));
    const feather = Math.max(20, tiltFeather);

    const grad = maskCtx.createLinearGradient(0, 0, 0, height);
    const topBlurStop = Math.max(0, (focusY - (bandHeight / 2) - feather) / height);
    const topFocusStop = Math.max(0, (focusY - (bandHeight / 2)) / height);
    const bottomFocusStop = Math.min(1, (focusY + (bandHeight / 2)) / height);
    const bottomBlurStop = Math.min(1, (focusY + (bandHeight / 2) + feather) / height);

    grad.addColorStop(0, 'rgba(0,0,0,1)'); // Top fully blurred
    grad.addColorStop(Math.min(1, topBlurStop), 'rgba(0,0,0,1)');
    grad.addColorStop(Math.min(1, topFocusStop), 'rgba(0,0,0,0)'); // Top focus sharp
    grad.addColorStop(Math.min(1, bottomFocusStop), 'rgba(0,0,0,0)'); // Bottom focus sharp
    grad.addColorStop(Math.min(1, bottomBlurStop), 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,1)'); // Bottom fully blurred

    maskCtx.fillStyle = grad;
    maskCtx.fillRect(0, 0, width, height);

    // Composite blurred image masked by linear gradient
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.drawImage(blurCanvas, 0, 0, width, height);

    ctx.drawImage(maskCanvas, 0, 0, width, height);
  } else if (mode === 'depth_of_field' || type === 'depth_of_field') {
    // Mode: Radial Depth-of-Field (Circular focus)
    ctx.drawImage(img, 0, 0, width, height);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Mask canvas context unavailable');

    const cx = width * focusCenter.x;
    const cy = height * focusCenter.y;
    const innerRadius = Math.max(10, Math.min(width, height) * 0.18);
    const outerRadius = Math.max(innerRadius + 50, Math.min(width, height) * 0.45);

    const radGrad = maskCtx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    radGrad.addColorStop(0, 'rgba(0,0,0,0)'); // Sharp center
    radGrad.addColorStop(1, 'rgba(0,0,0,1)'); // Blurred border

    maskCtx.fillStyle = radGrad;
    maskCtx.fillRect(0, 0, width, height);

    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.drawImage(blurCanvas, 0, 0, width, height);

    ctx.drawImage(maskCanvas, 0, 0, width, height);
  } else {
    // Default fallback
    ctx.drawImage(blurCanvas, 0, 0, width, height);
  }

  const blob = await canvasToBlob(canvas, format, quality);
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  let ext = 'png';
  if (format === 'image/jpeg') ext = 'jpg';
  if (format === 'image/webp') ext = 'webp';

  const origName = sourceImage.name || 'image.jpg';
  const baseName = origName.substring(0, origName.lastIndexOf('.')) || origName;
  const outputFileName = `${baseName}-blurred-${type}.${ext}`;

  return {
    blob,
    url,
    name: outputFileName,
    width,
    height,
    size: blob.size,
    durationMs,
  };
}

/**
 * Generate synthetic colorful demo images for instant testing
 */
export async function createBlurSampleImage(type = 'cityscape') {
  const width = 1400;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample-city-street.jpg';

  if (type === 'cityscape') {
    filename = 'cityscape-street-traffic.jpg';

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.6, '#1e293b');
    sky.addColorStop(1, '#334155');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.45);

    // City skyline buildings
    const bColors = ['#1e1b4b', '#312e81', '#1e293b', '#0f172a', '#4338ca'];
    for (let x = 0; x < width; x += 90) {
      const bH = 200 + Math.sin(x * 0.1) * 120 + ((x * 13) % 180);
      ctx.fillStyle = bColors[(x / 90) % bColors.length];
      ctx.fillRect(x, height * 0.45 - bH, 85, bH);

      // Lit windows
      ctx.fillStyle = '#fef08a';
      for (let wy = height * 0.45 - bH + 20; wy < height * 0.45 - 20; wy += 35) {
        for (let wx = x + 12; wx < x + 75; wx += 22) {
          if ((wx + wy) % 3 === 0) {
            ctx.fillRect(wx, wy, 8, 14);
          }
        }
      }
    }

    // Road / Asphalt
    const road = ctx.createLinearGradient(0, height * 0.45, 0, height);
    road.addColorStop(0, '#1e293b');
    road.addColorStop(1, '#0f172a');
    ctx.fillStyle = road;
    ctx.fillRect(0, height * 0.45, width, height * 0.55);

    // Road yellow lane dividers
    ctx.fillStyle = '#facc15';
    for (let y = height * 0.5; y < height; y += 70) {
      ctx.fillRect(width * 0.5 - 6, y, 12, 40);
    }

    // Red Car (Subject in focus)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(width * 0.38, height * 0.56, 340, 160, 24);
    } else {
      ctx.rect(width * 0.38, height * 0.56, 340, 160);
    }
    ctx.fill();

    // Car Windshield
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(width * 0.42, height * 0.58, 260, 60, 12);
    } else {
      ctx.rect(width * 0.42, height * 0.58, 260, 60);
    }
    ctx.fill();

    // Simulated License Plate (Perfect for Privacy Censor Box demo!)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width * 0.46, height * 0.69, 120, 32);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.46, height * 0.69, 120, 32);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CA-789-DK', width * 0.46 + 60, height * 0.69 + 16);
  } else if (type === 'portrait') {
    filename = 'portrait-bokeh-subject.jpg';

    // Colorful bokeh background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#831843');
    bg.addColorStop(0.5, '#4c1d95');
    bg.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Bokeh background circles
    const bokehColors = ['#f472b6', '#c084fc', '#38bdf8', '#fbbf24', '#34d399'];
    for (let i = 0; i < 40; i++) {
      const bx = ((i * 179) % width);
      const by = ((i * 241) % height);
      const br = 30 + ((i * 37) % 80);
      ctx.fillStyle = bokehColors[i % bokehColors.length];
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Center Portrait Subject
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, 180, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Smile
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(width * 0.44, height * 0.42, 16, 0, Math.PI * 2);
    ctx.arc(width * 0.56, height * 0.42, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.48, 60, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    filename = 'confidential-api-keys.jpg';

    // Dark IDE / Code Terminal
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Header tab
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, 55);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(30, 28, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(55, 28, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(80, 28, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('production.env — Confidential Secrets', 115, 33);

    // Code lines
    ctx.font = '20px "Courier New", monospace';
    const lines = [
      { text: '// PRODUCTION CLOUD CREDENTIALS', color: '#64748b' },
      { text: 'AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"', color: '#38bdf8' },
      { text: 'AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"', color: '#f43f5e' },
      { text: 'STRIPE_API_SECRET = "sk_live_51MzQ4bXYZ9876543210abcdef"', color: '#f59e0b' },
      { text: 'DATABASE_URL = "postgres://admin:SuperSecret2026!@prod-db.internal:5432"', color: '#4ade80' },
      { text: 'JWT_SIGNING_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.secret"', color: '#c084fc' },
      { text: '// SENSITIVE USER DATA', color: '#64748b' },
      { text: 'ADMIN_EMAIL = "superadmin@enterprise-cloud.internal"', color: '#e2e8f0' },
      { text: 'CREDIT_CARD_TEST = "4532-7589-2145-9874  EXP: 12/28  CVV: 849"', color: '#fb7185' },
    ];

    let startY = 120;
    lines.forEach((l) => {
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, 50, startY);
      startY += 55;
    });
  }

  // Sample watermark / badge banner
  ctx.save();
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.fillText('DreamKit Image Blur Test Canvas', width / 2, height - 45);
  ctx.font = '16px monospace';
  ctx.fillText(`${width} × ${height} px • Ready for Gaussian, Motion, and Privacy Blur`, width / 2, height - 18);
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
