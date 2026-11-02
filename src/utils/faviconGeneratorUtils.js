/**
 * Favicon & App Icon Generator Utilities
 * 100% In-Browser Multi-Platform Favicon & App Icon Generation
 */

export const FAVICON_PRESETS = [
  {
    id: 'ico',
    name: 'Classic Multi-Res Favicon',
    filename: 'favicon.ico',
    width: 48,
    height: 48,
    embeddedSizes: [16, 32, 48],
    format: 'image/x-icon',
    category: 'browser',
    platform: 'Desktop Browsers',
    description: 'Universal fallback for Chrome, Firefox, Edge, Safari, and desktop bookmarks.',
    isPrimary: true,
  },
  {
    id: 'png_16',
    name: 'Browser Tab Favicon (Small)',
    filename: 'favicon-16x16.png',
    width: 16,
    height: 16,
    format: 'image/png',
    category: 'browser',
    platform: 'Standard Tabs',
    description: 'Classic 16x16 browser tab favicon for standard display density.',
  },
  {
    id: 'png_32',
    name: 'Browser Tab Favicon (Standard)',
    filename: 'favicon-32x32.png',
    width: 32,
    height: 32,
    format: 'image/png',
    category: 'browser',
    platform: 'Retina Tabs & Taskbar',
    description: 'Standard 32x32 favicon for high-DPI retina browser tabs & taskbar.',
    isPrimary: true,
  },
  {
    id: 'png_48',
    name: 'Desktop Shortcut Icon',
    filename: 'favicon-48x48.png',
    width: 48,
    height: 48,
    format: 'image/png',
    category: 'browser',
    platform: 'Desktop / Bookmarks',
    description: 'Recommended size for site bookmark tiles and desktop link shortcuts.',
  },
  {
    id: 'png_96',
    name: 'Google TV / High-Res Favicon',
    filename: 'favicon-96x96.png',
    width: 96,
    height: 96,
    format: 'image/png',
    category: 'browser',
    platform: 'High-Res Displays',
    description: 'High-definition icon for modern smart screens and desktop launchers.',
  },
  {
    id: 'apple_180',
    name: 'Apple Touch Icon (Standard)',
    filename: 'apple-touch-icon.png',
    width: 180,
    height: 180,
    format: 'image/png',
    category: 'ios',
    platform: 'iPhone & iPad Home Screen',
    description: 'Universal Apple touch icon used when saved to iPhone/iPad home screen.',
    isPrimary: true,
  },
  {
    id: 'apple_152',
    name: 'Apple Touch Icon (iPad)',
    filename: 'apple-touch-icon-152x152.png',
    width: 152,
    height: 152,
    format: 'image/png',
    category: 'ios',
    platform: 'iPad Retina',
    description: 'Optimized touch icon for iPad and iPad mini Retina displays.',
  },
  {
    id: 'apple_167',
    name: 'Apple Touch Icon (iPad Pro)',
    filename: 'apple-touch-icon-167x167.png',
    width: 167,
    height: 167,
    format: 'image/png',
    category: 'ios',
    platform: 'iPad Pro',
    description: 'Touch icon calibrated for 10.5", 11", and 12.9" iPad Pro displays.',
  },
  {
    id: 'apple_120',
    name: 'Apple Touch Icon (iPhone)',
    filename: 'apple-touch-icon-120x120.png',
    width: 120,
    height: 120,
    format: 'image/png',
    category: 'ios',
    platform: 'iPhone Spotlight',
    description: 'Spotlight search and settings icon for iOS.',
  },
  {
    id: 'android_192',
    name: 'Android Chrome / PWA Icon',
    filename: 'android-chrome-192x192.png',
    width: 192,
    height: 192,
    format: 'image/png',
    category: 'android',
    platform: 'Android Home Screen',
    description: 'Progressive Web App launch icon displayed on Android home screen.',
    isPrimary: true,
  },
  {
    id: 'android_512',
    name: 'Android PWA Splash / Store',
    filename: 'android-chrome-512x512.png',
    width: 512,
    height: 512,
    format: 'image/png',
    category: 'android',
    platform: 'PWA Splash Screen',
    description: 'Hi-res PWA splash loading icon and Play Store web installation badge.',
    isPrimary: true,
  },
  {
    id: 'android_maskable_192',
    name: 'Android Maskable Icon (192)',
    filename: 'android-chrome-maskable-192x192.png',
    width: 192,
    height: 192,
    format: 'image/png',
    category: 'android',
    platform: 'Adaptive Icon (PWA)',
    description: 'Adaptive maskable icon designed with safe zone margin for Android OEMs.',
  },
  {
    id: 'android_maskable_512',
    name: 'Android Maskable Icon (512)',
    filename: 'android-chrome-maskable-512x512.png',
    width: 512,
    height: 512,
    format: 'image/png',
    category: 'android',
    platform: 'Adaptive Icon (High-Res)',
    description: 'High-resolution adaptive maskable icon for Android 12+ theme engines.',
  },
  {
    id: 'mstile_150',
    name: 'Windows Medium Tile',
    filename: 'mstile-150x150.png',
    width: 150,
    height: 150,
    format: 'image/png',
    category: 'windows',
    platform: 'Windows Start Menu',
    description: 'Square tile icon used in Windows 10/11 Start menu pinned sites.',
  },
  {
    id: 'mstile_310',
    name: 'Windows Large Tile',
    filename: 'mstile-310x310.png',
    width: 310,
    height: 310,
    format: 'image/png',
    category: 'windows',
    platform: 'Windows Start Screen',
    description: 'Large square tile icon for Windows browserconfig integration.',
  },
];

export const GRADIENT_PALETTES = [
  { id: 'indigo_violet', name: 'Royal Indigo', colors: ['#4f46e5', '#7c3aed'], angle: 135 },
  { id: 'emerald_teal', name: 'Emerald Ocean', colors: ['#059669', '#0d9488'], angle: 135 },
  { id: 'sunset_orange', name: 'Sunset Amber', colors: ['#ea580c', '#f59e0b'], angle: 135 },
  { id: 'rose_fuchsia', name: 'Neon Rose', colors: ['#e11d48', '#c026d3'], angle: 135 },
  { id: 'cyan_blue', name: 'Electric Cyan', colors: ['#0284c7', '#2563eb'], angle: 135 },
  { id: 'obsidian_dark', name: 'Obsidian Slate', colors: ['#1e293b', '#0f172a'], angle: 135 },
  { id: 'aurora_borealis', name: 'Aurora Borealis', colors: ['#06b6d4', '#10b981', '#6366f1'], angle: 135 },
];

export const FONT_OPTIONS = [
  { id: 'sans', name: 'Modern Sans', family: 'system-ui, -apple-system, sans-serif' },
  { id: 'display', name: 'Outfit / Display', family: "'Outfit', 'Inter', system-ui, sans-serif" },
  { id: 'mono', name: 'JetBrains Mono', family: "'JetBrains Mono', 'Menlo', 'Courier New', monospace" },
  { id: 'serif', name: 'Editorial Serif', family: "'Georgia', 'Playfair Display', serif" },
  { id: 'bold_impact', name: 'Ultra Bold', family: "'Arial Black', 'Impact', sans-serif" },
];

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
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.95) {
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
 * Helper to load image via FileReader data URL as resilient fallback
 */
function loadViaFileReader(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      return reject(new Error('FileReader is unavailable'));
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
 * Load HTMLImageElement from File, Blob, Canvas, or URL string
 * Resilient against revoked URLs, without invalid CORS on local blobs
 */
export function loadImage(src) {
  if (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement) {
    if (src.complete && src.naturalWidth > 0) return Promise.resolve(src);
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

  if (
    (typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap)
  ) {
    return Promise.resolve(src);
  }

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
        loadViaFileReader(src).then(resolve).catch(() => {
          reject(new Error('Failed to decode source image: file may be corrupted or unsupported.'));
        });
      };

      img.src = objectUrl;
    });
  }

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
            reject(new Error('Failed to decode source image from remote URL.'));
          };
          fallbackImg.src = src;
          return;
        }
        reject(new Error('Failed to decode source image from URL.'));
      };

      img.src = src;
    });
  }

  return Promise.reject(new Error('Invalid image source type'));
}

/**
 * Generate standard ICO binary file containing multiple PNG resolutions
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {number[]} sizes
 * @returns {Promise<Blob>}
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

  if (pngEntries.length === 0) {
    throw new Error('Failed to create PNG layers for ICO file.');
  }

  const count = pngEntries.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const entry of pngEntries) totalSize += entry.data.length;

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // ICONDIR Header
  view.setUint16(0, 0, true); // reserved (must be 0)
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
 * Draw background shape (Squircle, Circle, Rounded, Hexagon, or None)
 */
export function drawShapePath(ctx, width, height, shape = 'none', radius = 22) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
  } else if (shape === 'squircle' || shape === 'rounded') {
    const r = Math.min(width, height) * (radius / 100);
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, width, height, r);
    } else {
      ctx.rect(0, 0, width, height);
    }
  } else if (shape === 'hexagon') {
    const r = width / 2;
    const cx = width / 2;
    const cy = height / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else {
    ctx.rect(0, 0, width, height);
  }
}

/**
 * Render Master Favicon Canvas
 * Handles both Image mode and Text/Emoji Monogram mode
 */
export async function renderMasterCanvas(options = {}) {
  const {
    targetSize = 512,
    mode = 'image', // 'image' | 'text'
    sourceImage = null, // HTMLImageElement or source
    text = '⚡',
    fontFamily = "'Outfit', system-ui, sans-serif",
    fontSize = 58, // percentage 20 - 90
    textColor = '#ffffff',
    textShadow = true,
    padding = 10, // percentage 0 - 40
    bgType = 'gradient', // 'transparent' | 'color' | 'gradient'
    bgColor = '#4f46e5',
    gradientColors = ['#4f46e5', '#7c3aed'],
    gradientAngle = 135,
    shape = 'squircle', // 'none' | 'squircle' | 'rounded' | 'circle' | 'hexagon'
    radius = 22, // corner radius percentage
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background
  if (bgType !== 'transparent') {
    ctx.save();
    drawShapePath(ctx, targetSize, targetSize, shape, radius);
    ctx.clip();

    if (bgType === 'color') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
    } else if (bgType === 'gradient') {
      const angleRad = (gradientAngle * Math.PI) / 180;
      const x1 = targetSize / 2 - (Math.cos(angleRad) * targetSize) / 2;
      const y1 = targetSize / 2 - (Math.sin(angleRad) * targetSize) / 2;
      const x2 = targetSize / 2 + (Math.cos(angleRad) * targetSize) / 2;
      const y2 = targetSize / 2 + (Math.sin(angleRad) * targetSize) / 2;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      if (gradientColors.length === 2) {
        grad.addColorStop(0, gradientColors[0]);
        grad.addColorStop(1, gradientColors[1]);
      } else {
        gradientColors.forEach((c, idx) => {
          grad.addColorStop(idx / (gradientColors.length - 1), c);
        });
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetSize, targetSize);
    }

    // Subtle inner bevel gloss on shapes
    if (shape !== 'none') {
      const gloss = ctx.createLinearGradient(0, 0, 0, targetSize * 0.4);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
      gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(0, 0, targetSize, targetSize * 0.4);
    }

    ctx.restore();
  }

  // 2. Render Icon / Content
  const padRatio = Math.max(0, Math.min(45, padding)) / 100;
  const innerSize = targetSize * (1 - padRatio * 2);

  if (mode === 'image' && sourceImage) {
    const img = sourceImage instanceof HTMLImageElement && sourceImage.complete && sourceImage.naturalWidth > 0
      ? sourceImage
      : await loadImage(sourceImage);

    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;

    // Preserve aspect ratio inside inner bounding box
    const scale = Math.min(innerSize / sw, innerSize / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (targetSize - dw) / 2;
    const dy = (targetSize - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
  } else if (mode === 'text') {
    // Text or Emoji Monogram Rendering
    const calculatedFontPx = Math.round(targetSize * (fontSize / 100));
    ctx.font = `bold ${calculatedFontPx}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (textShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = targetSize * 0.04;
      ctx.shadowOffsetY = targetSize * 0.02;
    }

    ctx.fillStyle = textColor;
    // Align vertical center with micro-adjustment for optical baseline
    const opticalY = targetSize / 2 + calculatedFontPx * 0.03;
    ctx.fillText(text, targetSize / 2, opticalY);

    ctx.shadowColor = 'transparent';
  }

  return canvas;
}

/**
 * Generate a complete package of multi-platform favicon and app icon assets
 */
export async function generateFaviconPackage(options = {}, appMetadata = {}, onProgress = null) {
  const masterCanvas = await renderMasterCanvas({
    targetSize: 512,
    ...options,
  });

  const appName = (appMetadata.name || 'DreamKit App').trim();
  const shortName = (appMetadata.shortName || appName.slice(0, 12)).trim();
  const themeColor = appMetadata.themeColor || '#4f46e5';
  const bgColor = appMetadata.bgColor || '#ffffff';

  const generatedItems = [];
  const totalPresets = FAVICON_PRESETS.length;

  for (let i = 0; i < totalPresets; i++) {
    const preset = FAVICON_PRESETS[i];
    if (onProgress) onProgress({ current: i + 1, total: totalPresets, currentName: preset.name });

    let blob = null;
    let url = null;

    if (preset.id === 'ico') {
      blob = await createIcoBlob(masterCanvas, preset.embeddedSizes);
    } else {
      const iconCanvas = document.createElement('canvas');
      iconCanvas.width = preset.width;
      iconCanvas.height = preset.height;
      const ictx = iconCanvas.getContext('2d');
      if (ictx) {
        ictx.imageSmoothingEnabled = true;
        ictx.imageSmoothingQuality = 'high';

        // For maskable icons, provide safe zone margin
        if (preset.id.includes('maskable')) {
          const safeScale = 0.82;
          const sw = preset.width * safeScale;
          const sh = preset.height * safeScale;
          const sx = (preset.width - sw) / 2;
          const sy = (preset.height - sh) / 2;
          ictx.fillStyle = themeColor;
          ictx.fillRect(0, 0, preset.width, preset.height);
          ictx.drawImage(masterCanvas, sx, sy, sw, sh);
        } else {
          ictx.drawImage(masterCanvas, 0, 0, preset.width, preset.height);
        }

        blob = await canvasToBlob(iconCanvas, 'image/png');
      }
    }

    if (blob) {
      url = URL.createObjectURL(blob);
      generatedItems.push({
        preset,
        name: preset.filename,
        width: preset.width,
        height: preset.height,
        format: preset.format,
        size: blob.size,
        blob,
        url,
      });
    }
  }

  // 1. Generate site.webmanifest
  const manifestData = {
    name: appName,
    short_name: shortName,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/android-chrome-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android-chrome-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    theme_color: themeColor,
    background_color: bgColor,
    display: 'standalone',
  };
  const manifestText = JSON.stringify(manifestData, null, 2);

  // 2. Generate browserconfig.xml
  const browserConfigXml = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/mstile-150x150.png"/>
            <square310x310logo src="/mstile-310x310.png"/>
            <TileColor>${themeColor}</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

  // 3. Generate HTML <head> code
  const htmlHeadSnippet = `<!-- Favicons & App Icons (Place in your HTML <head>) -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">

<!-- Apple iOS Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png">

<!-- Android & Progressive Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">

<!-- Windows Metro Tile -->
<meta name="msapplication-TileColor" content="${themeColor}">
<meta name="msapplication-config" content="/browserconfig.xml">`;

  // 4. Instructions Readme
  const readmeText = `========================================================================
FAVICON & APP ICON PACKAGE FOR: ${appName.toUpperCase()}
Generated with DreamKit Favicon & App Icon Generator
========================================================================

QUICK INSTALLATION:
1. Extract all image files and manifests to your website's root public directory:
   e.g. /public/ or document root /var/www/html/

2. Copy and paste the following snippet into the <head> of your HTML or layout.jsx:

${htmlHeadSnippet}

INCLUDED ASSETS:
- favicon.ico (Multi-resolution 16x16, 32x32, 48x48)
- favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, favicon-96x96.png
- apple-touch-icon.png (180x180), apple-touch-icon-152x152.png, apple-touch-icon-167x167.png
- android-chrome-192x192.png, android-chrome-512x512.png
- android-chrome-maskable-192x192.png, android-chrome-maskable-512x512.png
- mstile-150x150.png, mstile-310x310.png
- site.webmanifest (PWA configuration)
- browserconfig.xml (Windows Tile configuration)

All icons rendered with 100% in-browser client-side precision.
`;

  return {
    masterCanvas,
    items: generatedItems,
    manifestText,
    browserConfigXml,
    htmlHeadSnippet,
    readmeText,
    themeColor,
    bgColor,
    appName,
    shortName,
  };
}

/**
 * Generate colorful synthetic sample icons for instant testing
 */
export async function createFaviconSample(type = 'lightning') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let filename = 'sample-icon.png';

  if (type === 'lightning') {
    filename = 'tech-spark-icon.png';
    // Dark indigo squircle
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#4338ca');
    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, 110);
    else ctx.rect(0, 0, size, size);
    ctx.fill();

    // Subtle cyan ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 200, 0, Math.PI * 2);
    ctx.stroke();

    // Electric Lightning Bolt
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(size * 0.54, size * 0.16);
    ctx.lineTo(size * 0.28, size * 0.52);
    ctx.lineTo(size * 0.48, size * 0.52);
    ctx.lineTo(size * 0.42, size * 0.84);
    ctx.lineTo(size * 0.72, size * 0.46);
    ctx.lineTo(size * 0.52, size * 0.46);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'fintech') {
    filename = 'fintech-diamond-icon.png';
    // Emerald ocean gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#047857');
    grad.addColorStop(1, '#059669');
    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, 110);
    else ctx.rect(0, 0, size, size);
    ctx.fill();

    // Geometric Diamond
    ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
    ctx.shadowBlur = 30;

    // Top facets
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.22);
    ctx.lineTo(size * 0.76, size * 0.42);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.22);
    ctx.lineTo(size * 0.24, size * 0.42);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Bottom facets
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(size * 0.24, size * 0.42);
    ctx.lineTo(size * 0.5, size * 0.78);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(size * 0.76, size * 0.42);
    ctx.lineTo(size * 0.5, size * 0.78);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'studio') {
    filename = 'creative-studio-icon.png';
    // Sunset Neon gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#701a75');
    grad.addColorStop(0.5, '#c026d3');
    grad.addColorStop(1, '#f97316');
    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, 110);
    else ctx.rect(0, 0, size, size);
    ctx.fill();

    // Concentric modern lens rings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 130, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 60, 0, Math.PI * 2);
    ctx.fill();

    // Flash dot
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(size * 0.74, size * 0.26, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    filename = 'minimal-monogram-icon.png';
    // Obsidian black glass
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, 110);
    else ctx.rect(0, 0, size, size);
    ctx.fill();

    // Gold borders
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 6;
    if (ctx.roundRect) ctx.roundRect(24, 24, size - 48, size - 48, 90);
    else ctx.rect(24, 24, size - 48, size - 48);
    ctx.stroke();

    // Monogram "DK"
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 210px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
    ctx.shadowBlur = 24;
    ctx.fillText('DK', size / 2, size / 2 + 10);
  }

  const mime = 'image/png';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  return new File([blob], filename, { type: mime, lastModified: Date.now() });
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
