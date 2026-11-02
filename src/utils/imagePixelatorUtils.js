/**
 * In-browser Image Pixelator & 8-Bit Retro Mosaic Utilities
 * Supports Square, Circular Halftone, Diamond, and Hexagon cell geometry,
 * along with iconic retro palettes (Pico-8, Game Boy, CGA, C64, Cyberpunk),
 * grid line overlays, and selective privacy censor box modes.
 * 100% Client-Side with zero server telemetry.
 */

export const PIXEL_SHAPES = {
  square: {
    id: 'square',
    label: 'Classic Square',
    description: 'Standard 8-bit & 16-bit blocky arcade pixels.',
  },
  circle: {
    id: 'circle',
    label: 'Circular Dot Matrix',
    description: 'Halftone polka dot mosaic with soft spacing.',
  },
  diamond: {
    id: 'diamond',
    label: 'Diamond / Rhombus',
    description: '45-degree angled isometric mosaic tiles.',
  },
  hexagon: {
    id: 'hexagon',
    label: 'Honeycomb Hexagon',
    description: 'Cellular hexagonal tessellation.',
  },
};

export const RETRO_PALETTES = {
  original: {
    id: 'original',
    label: 'Original Truecolor',
    description: 'Preserves original 24-bit RGB photo colors.',
    tag: 'Full Color',
    colors: null,
    rgb: null,
  },
  pico8: {
    id: 'pico8',
    label: 'Pico-8 Fantasy Console',
    description: 'Iconic 16-color palette of the Pico-8 virtual console.',
    tag: '16-Color',
    colors: [
      '#000000', '#1d2b53', '#7e2553', '#008751',
      '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
      '#ff004d', '#ffa300', '#ffec27', '#00e436',
      '#29adff', '#83769c', '#ff77a8', '#ffccaa'
    ],
    rgb: [
      [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
      [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
      [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
      [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170]
    ],
  },
  gameboy: {
    id: 'gameboy',
    label: 'Game Boy 1989',
    description: 'Classic 4-shade pea-soup green palette from the original Nintendo Game Boy.',
    tag: '4-Color Green',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    rgb: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15]
    ],
  },
  cga: {
    id: 'cga',
    label: 'CGA Mode 1',
    description: 'IBM PC 1981 retro palette: Black, Cyan, Magenta, and White.',
    tag: '4-Color Retro',
    colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff'],
    rgb: [
      [0, 0, 0],
      [85, 255, 255],
      [255, 85, 255],
      [255, 255, 255]
    ],
  },
  c64: {
    id: 'c64',
    label: 'Commodore 64',
    description: 'The distinct 16-color analog palette of the best-selling computer.',
    tag: '16-Color CRT',
    colors: [
      '#000000', '#ffffff', '#880000', '#aaffee',
      '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
      '#dd8855', '#664400', '#ff7777', '#333333',
      '#777777', '#aaff66', '#0088ff', '#bbbbbb'
    ],
    rgb: [
      [0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238],
      [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119],
      [221, 136, 85], [102, 68, 0], [255, 119, 119], [51, 51, 51],
      [119, 119, 119], [170, 255, 102], [0, 136, 255], [187, 187, 187]
    ],
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: 'Cyberpunk Neon',
    description: 'High-energy 16-color synthwave palette with electric purples and cyans.',
    tag: '16-Color Synth',
    colors: [
      '#090d16', '#ff007f', '#00f0ff', '#ffe600',
      '#7127ef', '#ff4b2b', '#22c55e', '#f43f5e',
      '#a855f7', '#0ea5e9', '#f59e0b', '#ec4899',
      '#14b8a6', '#8b5cf6', '#fb7185', '#ffffff'
    ],
    rgb: [
      [9, 13, 22], [255, 0, 127], [0, 240, 255], [255, 230, 0],
      [113, 39, 239], [255, 75, 43], [34, 197, 94], [244, 63, 94],
      [168, 85, 247], [14, 165, 233], [245, 158, 11], [236, 72, 153],
      [20, 184, 166], [139, 92, 246], [251, 113, 133], [255, 255, 255]
    ],
  },
  mono_1bit: {
    id: 'mono_1bit',
    label: '1-Bit Monochrome',
    description: 'Binary Black and White with threshold matching.',
    tag: '2-Color B&W',
    colors: ['#000000', '#ffffff'],
    rgb: [
      [0, 0, 0],
      [255, 255, 255]
    ],
  },
};

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
 * Helper to load image via FileReader data URL as resilient fallback
 */
function loadViaFileReader(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      return reject(new Error('FileReader is unavailable in this environment'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image from data URL.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file as data URL.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Load HTMLImageElement from File, Blob, ImageBitmap, HTMLCanvasElement, or URL
 * @param {HTMLImageElement|ImageBitmap|HTMLCanvasElement|File|Blob|string} src
 * @returns {Promise<HTMLImageElement|ImageBitmap|HTMLCanvasElement>}
 */
export function loadImage(src) {
  // If already an HTMLImageElement
  if (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement) {
    if (src.complete && src.naturalWidth > 0) {
      return Promise.resolve(src);
    }
    return new Promise((resolve, reject) => {
      const onLoad = () => {
        src.removeEventListener('load', onLoad);
        src.removeEventListener('error', onError);
        resolve(src);
      };
      const onError = () => {
        src.removeEventListener('load', onLoad);
        src.removeEventListener('error', onError);
        reject(new Error('Failed to decode image element.'));
      };
      src.addEventListener('load', onLoad);
      src.addEventListener('error', onError);
    });
  }

  // If already an HTMLCanvasElement or ImageBitmap
  if (
    (typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap)
  ) {
    return Promise.resolve(src);
  }

  // If File or Blob
  if (src instanceof Blob || src instanceof File) {
    return new Promise((resolve, reject) => {
      let objectUrl = null;
      try {
        objectUrl = URL.createObjectURL(src);
      } catch {
        loadViaFileReader(src).then(resolve).catch(reject);
        return;
      }

      const img = new Image();
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        setTimeout(() => {
          try {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          } catch {}
        }, 10000);
        resolve(img);
      };

      img.onerror = () => {
        cleanup();
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch {}
        loadViaFileReader(src)
          .then(resolve)
          .catch(() => {
            reject(new Error('Failed to decode image: file may be corrupted or unsupported.'));
          });
      };

      img.src = objectUrl;
    });
  }

  // If string URL (data:, blob:, http:, or relative)
  if (typeof src === 'string') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const isRemote = src.startsWith('http://') || src.startsWith('https://');

      if (isRemote) {
        img.crossOrigin = 'anonymous';
      }

      const cleanUp = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanUp();
        resolve(img);
      };

      img.onerror = () => {
        cleanUp();
        if (isRemote && img.crossOrigin) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => {
            reject(new Error('Failed to decode image from remote URL.'));
          };
          fallbackImg.src = src;
          return;
        }

        reject(new Error('Failed to decode image. URL may be invalid, revoked, or unsupported.'));
      };

      img.src = src;
    });
  }

  return Promise.reject(new Error('Invalid image source type: expected File, Blob, Image, Canvas, or URL string.'));
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
 * Find closest color in palette using perceptual weighted Euclidean RGB distance
 * Human eyes are most sensitive to green, then red, then blue.
 */
function findNearestPaletteColor(r, g, b, paletteRgb) {
  if (!paletteRgb || !paletteRgb.length) return [r, g, b];

  let minD = Infinity;
  let best = paletteRgb[0];

  for (let i = 0; i < paletteRgb.length; i++) {
    const c = paletteRgb[i];
    const dr = r - c[0];
    const dg = g - c[1];
    const db = b - c[2];
    const d = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;

    if (d < minD) {
      minD = d;
      best = c;
    }
  }

  return best;
}

/**
 * Convert color hex string to rgba with opacity
 */
function formatGridStroke(color, opacity = 0.25) {
  if (!color) return `rgba(0, 0, 0, ${opacity})`;
  if (color.startsWith('rgba') || color.startsWith('rgb')) return color;
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length === 6) {
    const num = parseInt(hex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/**
 * Apply Image Pixelation with custom shape, palette, and region controls
 * @param {HTMLImageElement|File|Blob|string} sourceImage
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function pixelateImage(sourceImage, options = {}) {
  const startTime = performance.now();
  const img = sourceImage instanceof HTMLImageElement ? sourceImage : await loadImage(sourceImage);

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const {
    pixelSize = 16,
    shape = 'square',
    palette = 'original',
    format = 'image/png',
    quality = 0.92,
  } = options;

  const mode = options.mode || options.applyMode || 'full';
  const showGrid = options.showGrid ?? options.grid ?? false;
  const rawGridColor = options.gridColor || '#000000';
  const gridOpacity = Number(options.gridOpacity ?? 0.25);
  const strokeColor = formatGridStroke(rawGridColor, gridOpacity);

  const contrast = Number(options.contrast || 0);
  const saturation = Number(options.saturation || 0);

  // 1. Offscreen source sample canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Canvas 2D context unavailable');

  srcCtx.drawImage(img, 0, 0, width, height);
  const srcImageData = srcCtx.getImageData(0, 0, width, height);
  const srcData = srcImageData.data;

  // 2. Final rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = false;

  // If region or invert_region mode, draw the original sharp image first
  if (mode === 'region' || mode === 'invert_region') {
    ctx.drawImage(img, 0, 0, width, height);
  }

  // Pre-calculate target bounding region
  let targetRegion = null;
  const rawRegion = options.region || options.regionBox;
  if (mode !== 'full' && rawRegion) {
    // Check if rawRegion is in percentages (0..100)
    if (options.regionBox || (rawRegion.x <= 100 && rawRegion.y <= 100 && rawRegion.width <= 100 && rawRegion.height <= 100 && width > 100)) {
      targetRegion = {
        x: Math.round((rawRegion.x / 100) * width),
        y: Math.round((rawRegion.y / 100) * height),
        width: Math.round((rawRegion.width / 100) * width),
        height: Math.round((rawRegion.height / 100) * height),
      };
    } else {
      targetRegion = {
        x: Math.round(rawRegion.x),
        y: Math.round(rawRegion.y),
        width: Math.round(rawRegion.width),
        height: Math.round(rawRegion.height),
      };
    }
  }

  // Palette lookup
  const targetPaletteObj = RETRO_PALETTES[palette] || null;
  const paletteRgb = targetPaletteObj ? targetPaletteObj.rgb : null;

  // Pre-calculate contrast factor
  const clampedContrast = Math.max(-50, Math.min(100, contrast));
  const cFactor = (259 * (clampedContrast + 255)) / (255 * (259 - clampedContrast));
  const satFactor = 1 + (saturation / 100);

  const step = Math.max(2, Math.round(pixelSize));
  let pixelCount = 0;

  // Region bounds check helper
  const isInsideRegion = (x, y) => {
    if (!targetRegion) return true;
    return (
      x >= targetRegion.x &&
      x <= targetRegion.x + targetRegion.width &&
      y >= targetRegion.y &&
      y <= targetRegion.y + targetRegion.height
    );
  };

  // Iterate across grid cells
  if (shape === 'hexagon') {
    // Hexagonal Honeycomb grid
    const r = step / 2;
    const h = r * Math.sqrt(3);
    const colStep = 1.5 * r;
    const rowStep = h;

    for (let col = 0, x = 0; x < width + r; col++, x += colStep) {
      const yOffset = (col % 2 === 1) ? (h / 2) : 0;
      for (let y = yOffset; y < height + h; y += rowStep) {
        const sampleX = Math.min(width - 1, Math.max(0, Math.round(x)));
        const sampleY = Math.min(height - 1, Math.max(0, Math.round(y)));

        if (mode === 'region' && !isInsideRegion(sampleX, sampleY)) continue;
        if (mode === 'invert_region' && isInsideRegion(sampleX, sampleY)) continue;

        // Subsample cell average around the hexagon center
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;
        const subR = Math.max(1, Math.floor(r / 3));

        for (let dy = -subR; dy <= subR; dy += Math.max(1, Math.floor(subR / 2))) {
          for (let dx = -subR; dx <= subR; dx += Math.max(1, Math.floor(subR / 2))) {
            const px = Math.min(width - 1, Math.max(0, sampleX + dx));
            const py = Math.min(height - 1, Math.max(0, sampleY + dy));
            const sIdx = (py * width + px) * 4;
            sumR += srcData[sIdx];
            sumG += srcData[sIdx + 1];
            sumB += srcData[sIdx + 2];
            count++;
          }
        }

        let red = count > 0 ? Math.round(sumR / count) : srcData[(sampleY * width + sampleX) * 4];
        let green = count > 0 ? Math.round(sumG / count) : srcData[(sampleY * width + sampleX) * 4 + 1];
        let blue = count > 0 ? Math.round(sumB / count) : srcData[(sampleY * width + sampleX) * 4 + 2];

        // Contrast adjustment
        if (contrast !== 0) {
          red = Math.max(0, Math.min(255, (cFactor * (red - 128)) + 128));
          green = Math.max(0, Math.min(255, (cFactor * (green - 128)) + 128));
          blue = Math.max(0, Math.min(255, (cFactor * (blue - 128)) + 128));
        }

        // Saturation adjustment
        if (saturation !== 0) {
          const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
          red = Math.max(0, Math.min(255, gray + (red - gray) * satFactor));
          green = Math.max(0, Math.min(255, gray + (green - gray) * satFactor));
          blue = Math.max(0, Math.min(255, gray + (blue - gray) * satFactor));
        }

        if (paletteRgb) {
          const matched = findNearestPaletteColor(red, green, blue, paletteRgb);
          red = matched[0];
          green = matched[1];
          blue = matched[2];
        }

        ctx.fillStyle = `rgb(${red},${green},${blue})`;

        // Draw regular hexagon
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const hx = x + r * Math.cos(angle);
          const hy = y + r * Math.sin(angle);
          if (a === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();

        if (showGrid) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        pixelCount++;
      }
    }
  } else {
    // Standard Orthogonal Grid (Square, Circle, Diamond)
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const cellW = Math.min(step, width - x);
        const cellH = Math.min(step, height - y);

        const sampleX = Math.min(width - 1, x + Math.floor(cellW / 2));
        const sampleY = Math.min(height - 1, y + Math.floor(cellH / 2));

        if (mode === 'region' && !isInsideRegion(sampleX, sampleY)) continue;
        if (mode === 'invert_region' && isInsideRegion(sampleX, sampleY)) continue;

        // Subsample cell average across the block
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;
        const subStep = Math.max(1, Math.floor(cellW / 4));

        for (let sy = y; sy < y + cellH; sy += subStep) {
          for (let sx = x; sx < x + cellW; sx += subStep) {
            const sIdx = (sy * width + sx) * 4;
            sumR += srcData[sIdx];
            sumG += srcData[sIdx + 1];
            sumB += srcData[sIdx + 2];
            count++;
          }
        }

        let red = count > 0 ? Math.round(sumR / count) : srcData[(sampleY * width + sampleX) * 4];
        let green = count > 0 ? Math.round(sumG / count) : srcData[(sampleY * width + sampleX) * 4 + 1];
        let blue = count > 0 ? Math.round(sumB / count) : srcData[(sampleY * width + sampleX) * 4 + 2];

        // Contrast adjustment
        if (contrast !== 0) {
          red = Math.max(0, Math.min(255, (cFactor * (red - 128)) + 128));
          green = Math.max(0, Math.min(255, (cFactor * (green - 128)) + 128));
          blue = Math.max(0, Math.min(255, (cFactor * (blue - 128)) + 128));
        }

        // Saturation adjustment
        if (saturation !== 0) {
          const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
          red = Math.max(0, Math.min(255, gray + (red - gray) * satFactor));
          green = Math.max(0, Math.min(255, gray + (green - gray) * satFactor));
          blue = Math.max(0, Math.min(255, gray + (blue - gray) * satFactor));
        }

        if (paletteRgb) {
          const matched = findNearestPaletteColor(red, green, blue, paletteRgb);
          red = matched[0];
          green = matched[1];
          blue = matched[2];
        }

        ctx.fillStyle = `rgb(${red},${green},${blue})`;

        if (shape === 'circle') {
          // Circular Polka Dot Halftone
          // In censor region mode, fill background block first so privacy is 100% maintained
          if (mode === 'region') {
            ctx.fillRect(x, y, cellW, cellH);
          }

          const radius = Math.max(1, (Math.min(cellW, cellH) / 2) - 0.5);
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, radius, 0, Math.PI * 2);
          ctx.fill();

          if (showGrid) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else if (shape === 'diamond') {
          // Diamond / Rhombus Tile
          if (mode === 'region') {
            ctx.fillRect(x, y, cellW, cellH);
          }

          ctx.beginPath();
          ctx.moveTo(x + cellW / 2, y);
          ctx.lineTo(x + cellW, y + cellH / 2);
          ctx.lineTo(x + cellW / 2, y + cellH);
          ctx.lineTo(x, y + cellH / 2);
          ctx.closePath();
          ctx.fill();

          if (showGrid) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else {
          // Standard Square Block
          ctx.fillRect(x, y, cellW, cellH);

          if (showGrid) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellW, cellH);
          }
        }

        pixelCount++;
      }
    }
  }

  const blob = await canvasToBlob(canvas, format, quality);
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  let ext = 'png';
  if (format === 'image/jpeg') ext = 'jpg';
  if (format === 'image/webp') ext = 'webp';

  const origName = (sourceImage && sourceImage.name) || 'image.jpg';
  const baseName = origName.substring(0, origName.lastIndexOf('.')) || origName;
  const outputFileName = `${baseName}-pixelated-${shape}-${palette}.${ext}`;

  return {
    blob,
    url,
    name: outputFileName,
    width,
    height,
    size: blob.size,
    pixelCount,
    durationMs,
  };
}

/**
 * Generate synthetic colorful demo images for instant testing
 */
export async function createPixelatorSampleImage(type = 'arcade') {
  const width = 1400;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample-arcade-character.jpg';

  if (type === 'arcade') {
    filename = 'retro-arcade-character.jpg';

    // Space arcade gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#312e81');
    bg.addColorStop(1, '#4c1d95');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Glowing stars
    const starColors = ['#fde047', '#38bdf8', '#f472b6', '#4ade80'];
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 197) % width);
      const sy = ((i * 263) % height);
      ctx.fillStyle = starColors[i % starColors.length];
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Retro Arcade Space Ship / Robot Icon
    const cx = width / 2;
    const cy = height * 0.45;

    // Body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - 160, cy - 140, 320, 260, 30);
    } else {
      ctx.rect(cx - 160, cy - 140, 320, 260);
    }
    ctx.fill();

    // Visor
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - 120, cy - 90, 240, 90, 20);
    } else {
      ctx.rect(cx - 120, cy - 90, 240, 90);
    }
    ctx.fill();

    // Antenna
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 140);
    ctx.lineTo(cx, cy - 220);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy - 230, 24, 0, Math.PI * 2);
    ctx.fill();

    // Thruster Flames
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy + 120);
    ctx.lineTo(cx - 50, cy + 220);
    ctx.lineTo(cx, cy + 120);
    ctx.lineTo(cx + 50, cy + 220);
    ctx.lineTo(cx + 100, cy + 120);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'cyberpunk') {
    filename = 'cyberpunk-neon-city.jpg';

    // Dark cyberpunk horizon
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#090d16');
    sky.addColorStop(0.5, '#2e1065');
    sky.addColorStop(1, '#0284c7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Neon grid sun
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 160, 0, Math.PI * 2);
    ctx.fill();

    // Neon horizontal grid lines across the sun
    ctx.fillStyle = '#090d16';
    for (let y = height * 0.42; y < height * 0.65; y += 16) {
      ctx.fillRect(width * 0.35, y, width * 0.3, 5);
    }

    // Grid Floor
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.65);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  } else {
    filename = 'id-card-confidential.jpg';

    // ID Badge Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(width * 0.25, height * 0.15, width * 0.5, height * 0.7, 24);
    } else {
      ctx.rect(width * 0.25, height * 0.15, width * 0.5, height * 0.7);
    }
    ctx.fill();

    // Badge Banner
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(width * 0.25, height * 0.15, width * 0.5, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SECURITY CLEARANCE BADGE', width * 0.5, height * 0.15 + 48);

    // Face Photo Box (Ideal for Privacy Censor Box demo)
    ctx.fillStyle = '#fdba74';
    ctx.beginPath();
    ctx.arc(width * 0.38, height * 0.48, 70, 0, Math.PI * 2);
    ctx.fill();

    // ID Details
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('NAME: DR. ALEX MORGAN', width * 0.48, height * 0.42);
    ctx.fillText('ACCESS ID: DK-9874-CONF', width * 0.48, height * 0.48);
    ctx.fillText('PASSPORT: X8892147M', width * 0.48, height * 0.54);
    ctx.fillText('DEPARTMENT: AI QUANTUM', width * 0.48, height * 0.60);
  }

  // Footer Banner
  ctx.save();
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.fillText('DreamKit Pixelator Demo Test Canvas', width / 2, height - 40);
  ctx.font = '16px monospace';
  ctx.fillText(`${width} × ${height} px • Ready for 8-bit, Pico-8, and Mosaic Pixelation`, width / 2, height - 16);
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
