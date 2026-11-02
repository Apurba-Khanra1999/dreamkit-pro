/**
 * In-browser Image to Grayscale & Monochrome Conversion Utilities
 * Supports BT.709, BT.601, Average, Lightness, Channel Isolation,
 * Floyd-Steinberg Dithering, Threshold Binarization, Tone Grading,
 * Vignette, Film Grain, and Luminance Histogram Calculation.
 * 100% Client-Side with zero server telemetry.
 */

export const GRAYSCALE_METHODS = [
  {
    id: 'rec709',
    name: 'ITU-R BT.709 (Luminance)',
    description: 'Human eye weighted (0.2126 R + 0.7152 G + 0.0722 B). Industry standard for modern displays.',
    tag: 'Recommended',
  },
  {
    id: 'bt601',
    name: 'ITU-R BT.601 (NTSC / Classic)',
    description: 'Classic NTSC formula (0.299 R + 0.587 G + 0.114 B). Warm filmic luminance.',
    tag: 'Classic',
  },
  {
    id: 'average',
    name: 'Arithmetic Average',
    description: 'Uniform mean of red, green, and blue channels (R + G + B) / 3.',
    tag: 'Uniform',
  },
  {
    id: 'lightness',
    name: 'Lightness (HSL Midrange)',
    description: 'Average of maximum and minimum color channel (Max + Min) / 2.',
    tag: 'Desaturate',
  },
  {
    id: 'max_channel',
    name: 'Maximum Channel (Decompose)',
    description: 'Takes the maximum RGB channel for bright, airy highlights.',
    tag: 'High-Key',
  },
  {
    id: 'min_channel',
    name: 'Minimum Channel (Decompose)',
    description: 'Takes the minimum RGB channel for moody, deep shadows.',
    tag: 'Low-Key',
  },
  {
    id: 'red_channel',
    name: 'Red Channel Only',
    description: 'Simulates red lens filter / infrared photography. Darkens blue skies, brightens foliage.',
    tag: 'Red Filter',
  },
  {
    id: 'green_channel',
    name: 'Green Channel Only',
    description: 'Emphasizes nature foliage and balances skin tones.',
    tag: 'Green Filter',
  },
  {
    id: 'blue_channel',
    name: 'Blue Channel Only',
    description: 'Accentuates atmospheric haze and creates high-contrast portrait drama.',
    tag: 'Blue Filter',
  },
  {
    id: 'threshold',
    name: 'High-Contrast Threshold',
    description: 'Hard binarization into pure black (0) and pure white (255) at configurable cutoff.',
    tag: 'Binary',
  },
  {
    id: 'dither',
    name: 'Floyd-Steinberg Dithering',
    description: 'Classic 1-bit error diffusion halftoning for vintage newspaper and print aesthetics.',
    tag: '1-Bit Dither',
  },
];

export const TONING_PRESETS = [
  { id: 'none', name: 'Neutral B&W', r: 1.0, g: 1.0, b: 1.0, previewBg: '#94a3b8' },
  { id: 'sepia', name: 'Warm Sepia', r: 1.15, g: 0.95, b: 0.78, previewBg: '#b45309' },
  { id: 'cyanotype', name: 'Cyanotype Blue', r: 0.55, g: 0.85, b: 1.22, previewBg: '#0284c7' },
  { id: 'selenium', name: 'Selenium Silver', r: 0.94, g: 0.96, b: 1.08, previewBg: '#64748b' },
  { id: 'emerald', name: 'Noir Jade', r: 0.72, g: 1.12, b: 0.86, previewBg: '#059669' },
  { id: 'amber', name: 'Antique Amber', r: 1.25, g: 1.05, b: 0.68, previewBg: '#d97706' },
  { id: 'rose', name: 'Vintage Rose', r: 1.18, g: 0.92, b: 1.02, previewBg: '#e11d48' },
];

/**
 * Format bytes into readable string (KB, MB, GB)
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
 * Convert image to grayscale with fine-tuned tone grading, dithering, and toning
 * @param {HTMLImageElement|File|Blob} sourceImage
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function convertToGrayscale(sourceImage, options = {}) {
  const startTime = performance.now();
  const img = sourceImage instanceof HTMLImageElement ? sourceImage : await loadImage(sourceImage);

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const {
    method = 'rec709',
    intensity = 100, // 0 to 100% desaturation
    contrast = 0, // -100 to +100
    brightness = 0, // -100 to +100
    gamma = 1.0, // 0.2 to 2.5
    thresholdValue = 128, // 0 to 255 for threshold method
    toning = 'none', // 'none', 'sepia', 'cyanotype', etc.
    customTint = null, // { r: 1.0, g: 1.0, b: 1.0 }
    vignette = 0, // 0 to 100%
    filmGrain = 0, // 0 to 100%
    format = 'image/png',
    quality = 0.92,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Draw source image
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // Resolve toning multipliers
  let toneR = 1.0;
  let toneG = 1.0;
  let toneB = 1.0;

  if (toning === 'custom' && customTint) {
    toneR = customTint.r ?? 1.0;
    toneG = customTint.g ?? 1.0;
    toneB = customTint.b ?? 1.0;
  } else {
    const preset = TONING_PRESETS.find(p => p.id === toning) || TONING_PRESETS[0];
    toneR = preset.r;
    toneG = preset.g;
    toneB = preset.b;
  }

  // Pre-calculate contrast factor
  // contrast in [-100, 100]: factor in [0, ~3]
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const intensityRatio = Math.max(0, Math.min(1, intensity / 100));
  const vignetteRatio = Math.max(0, Math.min(1, vignette / 100));
  const filmGrainRatio = Math.max(0, Math.min(1, filmGrain / 100));
  const grainAmp = filmGrainRatio * 40; // max +/- 40 noise amplitude

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistSq = centerX * centerX + centerY * centerY;

  // 256-bin histogram
  const histogram = new Uint32Array(256);

  // --- SPECIAL CASE: FLOYD-STEINBERG DITHERING ---
  if (method === 'dither') {
    // 1. Create a 2D float grayscale buffer
    const grayBuffer = new Float32Array(width * height);
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Use Rec.709 for initial luminance
      let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Apply contrast & brightness
      if (contrast !== 0) {
        lum = (cFactor * (lum - 128)) + 128;
      }
      if (brightness !== 0) {
        lum += brightness;
      }
      if (gamma !== 1.0) {
        lum = 255 * Math.pow(Math.max(0, Math.min(1, lum / 255)), 1 / gamma);
      }

      grayBuffer[i / 4] = Math.max(0, Math.min(255, lum));
    }

    // 2. Error diffusion pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = grayBuffer[idx];
        const newVal = oldVal < thresholdValue ? 0 : 255;
        grayBuffer[idx] = newVal;
        const err = oldVal - newVal;

        if (x + 1 < width) {
          grayBuffer[idx + 1] += err * (7 / 16);
        }
        if (x - 1 >= 0 && y + 1 < height) {
          grayBuffer[(y + 1) * width + (x - 1)] += err * (3 / 16);
        }
        if (y + 1 < height) {
          grayBuffer[(y + 1) * width + x] += err * (5 / 16);
        }
        if (x + 1 < width && y + 1 < height) {
          grayBuffer[(y + 1) * width + (x + 1)] += err * (1 / 16);
        }
      }
    }

    // 3. Write back dithered pixels with toning & blend
    for (let i = 0; i < len; i += 4) {
      const origR = data[i];
      const origG = data[i + 1];
      const origB = data[i + 2];

      const dVal = grayBuffer[i / 4];
      const finalR = Math.max(0, Math.min(255, Math.round(dVal * toneR)));
      const finalG = Math.max(0, Math.min(255, Math.round(dVal * toneG)));
      const finalB = Math.max(0, Math.min(255, Math.round(dVal * toneB)));

      const outR = Math.round(origR + (finalR - origR) * intensityRatio);
      const outG = Math.round(origG + (finalG - origG) * intensityRatio);
      const outB = Math.round(origB + (finalB - origB) * intensityRatio);

      data[i] = outR;
      data[i + 1] = outG;
      data[i + 2] = outB;

      const lumBin = Math.min(255, Math.max(0, Math.round(0.2126 * outR + 0.7152 * outG + 0.0722 * outB)));
      histogram[lumBin]++;
    }
  } else {
    // --- STANDARD GRAYSCALE PASS (BT.709, BT.601, Average, Lightness, Channels, Threshold) ---
    for (let i = 0; i < len; i += 4) {
      const origR = data[i];
      const origG = data[i + 1];
      const origB = data[i + 2];

      let gray = 0;

      switch (method) {
        case 'bt601':
          gray = 0.299 * origR + 0.587 * origG + 0.114 * origB;
          break;
        case 'average':
          gray = (origR + origG + origB) / 3;
          break;
        case 'lightness':
          gray = (Math.max(origR, origG, origB) + Math.min(origR, origG, origB)) / 2;
          break;
        case 'max_channel':
          gray = Math.max(origR, origG, origB);
          break;
        case 'min_channel':
          gray = Math.min(origR, origG, origB);
          break;
        case 'red_channel':
          gray = origR;
          break;
        case 'green_channel':
          gray = origG;
          break;
        case 'blue_channel':
          gray = origB;
          break;
        case 'threshold': {
          const lum = 0.2126 * origR + 0.7152 * origG + 0.0722 * origB;
          gray = lum < thresholdValue ? 0 : 255;
          break;
        }
        case 'rec709':
        default:
          gray = 0.2126 * origR + 0.7152 * origG + 0.0722 * origB;
          break;
      }

      // Apply contrast adjustment
      if (contrast !== 0 && method !== 'threshold') {
        gray = (cFactor * (gray - 128)) + 128;
      }

      // Apply brightness adjustment
      if (brightness !== 0 && method !== 'threshold') {
        gray += brightness;
      }

      // Apply gamma correction
      if (gamma !== 1.0 && method !== 'threshold') {
        gray = 255 * Math.pow(Math.max(0, Math.min(1, gray / 255)), 1 / gamma);
      }

      // Clamp intermediate grayscale
      gray = Math.max(0, Math.min(255, gray));

      // Apply tone tinting
      let resR = gray * toneR;
      let resG = gray * toneG;
      let resB = gray * toneB;

      // Apply Vignette if enabled
      if (vignetteRatio > 0) {
        const pixelIdx = i / 4;
        const px = pixelIdx % width;
        const py = Math.floor(pixelIdx / width);
        const dx = px - centerX;
        const dy = py - centerY;
        const distSq = dx * dx + dy * dy;
        const falloff = 1 - (distSq / maxDistSq) * vignetteRatio * 0.85;
        resR *= Math.max(0.1, falloff);
        resG *= Math.max(0.1, falloff);
        resB *= Math.max(0.1, falloff);
      }

      // Apply Film Grain if enabled
      if (grainAmp > 0) {
        const noise = (Math.random() - 0.5) * grainAmp;
        resR += noise;
        resG += noise;
        resB += noise;
      }

      // Blend with original color based on intensity slider
      const finalR = Math.max(0, Math.min(255, Math.round(origR + (resR - origR) * intensityRatio)));
      const finalG = Math.max(0, Math.min(255, Math.round(origG + (resG - origG) * intensityRatio)));
      const finalB = Math.max(0, Math.min(255, Math.round(origB + (resB - origB) * intensityRatio)));

      data[i] = finalR;
      data[i + 1] = finalG;
      data[i + 2] = finalB;

      // Histogram bin
      const bin = Math.min(255, Math.max(0, Math.round(0.2126 * finalR + 0.7152 * finalG + 0.0722 * finalB)));
      histogram[bin]++;
    }
  }

  // Put processed image data back onto canvas
  ctx.putImageData(imgData, 0, 0);

  const blob = await canvasToBlob(canvas, format, quality);
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  let ext = 'png';
  if (format === 'image/jpeg') ext = 'jpg';
  if (format === 'image/webp') ext = 'webp';

  const origName = sourceImage.name || 'image.jpg';
  const baseName = origName.substring(0, origName.lastIndexOf('.')) || origName;
  const outputFileName = `${baseName}-grayscale-${method}.${ext}`;

  return {
    blob,
    url,
    name: outputFileName,
    width,
    height,
    size: blob.size,
    histogram: Array.from(histogram),
    durationMs,
  };
}

/**
 * Generate synthetic colorful demo images for instant testing
 */
export async function createGrayscaleSampleImage(type = 'landscape') {
  const width = 1400;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample-landscape.jpg';

  if (type === 'landscape') {
    filename = 'sunset-mountain-lake.jpg';

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    sky.addColorStop(0, '#0284c7'); // Rich blue
    sky.addColorStop(0.35, '#ec4899'); // Vibrant magenta
    sky.addColorStop(0.7, '#f97316'); // Golden orange
    sky.addColorStop(1, '#facc15'); // Warm yellow
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.7);

    // Glowing sun
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.42, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distant mountains (Purplish red)
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    ctx.lineTo(width * 0.2, height * 0.42);
    ctx.lineTo(width * 0.45, height * 0.58);
    ctx.lineTo(width * 0.7, height * 0.38);
    ctx.lineTo(width, height * 0.65);
    ctx.lineTo(width, height * 0.7);
    ctx.closePath();
    ctx.fill();

    // Foreground mountains (Deep blue-green)
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    ctx.lineTo(width * 0.3, height * 0.52);
    ctx.lineTo(width * 0.6, height * 0.68);
    ctx.lineTo(width * 0.85, height * 0.48);
    ctx.lineTo(width, height * 0.7);
    ctx.closePath();
    ctx.fill();

    // Lake reflection
    const water = ctx.createLinearGradient(0, height * 0.7, 0, height);
    water.addColorStop(0, '#f97316');
    water.addColorStop(0.4, '#0f766e');
    water.addColorStop(1, '#0f172a');
    ctx.fillStyle = water;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);

    // Water ripple highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    for (let y = height * 0.72; y < height; y += 18) {
      ctx.beginPath();
      ctx.moveTo(width * 0.2, y);
      ctx.lineTo(width * 0.8, y);
      ctx.stroke();
    }
  } else if (type === 'portrait') {
    filename = 'portrait-studio-palette.jpg';

    // Studio backdrop gradient
    const bg = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 700);
    bg.addColorStop(0, '#9333ea');
    bg.addColorStop(0.5, '#4338ca');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Golden warm disc representing subject
    const subject = ctx.createRadialGradient(width / 2, height * 0.45, 40, width / 2, height * 0.45, 260);
    subject.addColorStop(0, '#ffedd5');
    subject.addColorStop(0.4, '#fed7aa');
    subject.addColorStop(0.8, '#f97316');
    subject.addColorStop(1, '#c2410c');
    ctx.fillStyle = subject;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, 220, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant neon accents
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, 250, 0.4, 2.8);
    ctx.stroke();

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.45, 280, 3.4, 5.8);
    ctx.stroke();
  } else {
    filename = 'colorful-geometric-abstract.jpg';

    // Bold primary and secondary color geometric blocks
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const cols = 6;
    const rows = 4;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colorIdx = (r * cols + c) % colors.length;
        ctx.fillStyle = colors[colorIdx];
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);

        // Nested circle
        ctx.fillStyle = colors[(colorIdx + 3) % colors.length];
        ctx.beginPath();
        ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, Math.min(cellW, cellH) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Sample watermark / badge banner
  ctx.save();
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.fillText('DreamKit Grayscale Color Test Canvas', width / 2, height - 50);
  ctx.font = '16px monospace';
  ctx.fillText(`${width} × ${height} px • Multi-spectrum test pattern`, width / 2, height - 22);
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
