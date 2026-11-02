/**
 * In-browser Image Compressor & Bulk Packaging Utilities
 * Uses HTML5 Canvas API and zero-dependency client-side PKZip generator.
 */

// CRC-32 Lookup Table for fast calculation in PKZip
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

export function crc32(uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < uint8Array.length; i++) {
    crc = CRC_TABLE[(crc ^ uint8Array[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Format bytes into human readable string (KB, MB, GB)
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
 * Get MIME type from file extension or format name
 */
export function getMimeType(format, fallbackMime = 'image/webp') {
  if (!format || format === 'original') return fallbackMime;
  const map = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
  };
  return map[format.toLowerCase()] || format;
}

/**
 * Get file extension for MIME type
 */
export function getExtensionForMime(mimeType) {
  switch (mimeType) {
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'webp';
  }
}

/**
 * Calculate target dimensions maintaining aspect ratio
 */
export function calculateDimensions(origWidth, origHeight, options = {}) {
  const { scale = 100, maxWidth = null, maxHeight = null } = options;

  let width = origWidth;
  let height = origHeight;

  // Percentage scaling
  if (scale && scale !== 100) {
    const factor = Math.max(1, Math.min(100, scale)) / 100;
    width = Math.round(origWidth * factor);
    height = Math.round(origHeight * factor);
  }

  // Max width constraint
  if (maxWidth && maxWidth > 0 && width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  // Max height constraint
  if (maxHeight && maxHeight > 0 && height > maxHeight) {
    const ratio = maxHeight / height;
    height = maxHeight;
    width = Math.round(width * ratio);
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

/**
 * Load an image from a File, Blob, or URL
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
      reject(new Error(err?.message || 'Failed to load image into memory'));
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
 * Compress a single image Blob/File with specified options
 * @param {File|Blob} file
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function compressImage(file, options = {}) {
  const startTime = performance.now();
  const {
    quality = 0.8,
    format = 'original',
    scale = 100,
    maxWidth = null,
    maxHeight = null,
  } = options;

  const originalMime = file.type || 'image/jpeg';
  const targetMime = format === 'original' 
    ? (originalMime === 'image/png' || originalMime === 'image/jpeg' || originalMime === 'image/webp' ? originalMime : 'image/webp')
    : getMimeType(format, originalMime);

  // Load image into HTML Image object
  const img = await loadImage(file);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // Calculate target dimensions
  const { width: targetWidth, height: targetHeight } = calculateDimensions(
    origWidth,
    origHeight,
    { scale, maxWidth, maxHeight }
  );

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not supported in this browser.');
  }

  // Smooth rendering for resizing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If converting to JPEG, fill canvas with white background to handle transparency nicely
  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Convert to Blob with quality setting
  const clampedQuality = Math.max(0.01, Math.min(1.0, quality));
  const compressedBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas image compression failed.'));
        }
      },
      targetMime,
      clampedQuality
    );
  });

  const durationMs = Math.round(performance.now() - startTime);

  // Determine output file name
  const originalName = file.name || 'image.jpg';
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const newExt = getExtensionForMime(targetMime);
  const outputFileName = `${baseName}-compressed.${newExt}`;

  const originalSize = file.size;
  const compressedSize = compressedBlob.size;
  const savedBytes = originalSize - compressedSize;
  const savedPercentage = originalSize > 0 
    ? Math.round((savedBytes / originalSize) * 100) 
    : 0;

  return {
    blob: compressedBlob,
    url: URL.createObjectURL(compressedBlob),
    name: outputFileName,
    format: targetMime,
    originalSize,
    compressedSize,
    savedBytes,
    savedPercentage,
    originalWidth: origWidth,
    originalHeight: origHeight,
    width: targetWidth,
    height: targetHeight,
    durationMs,
  };
}

/**
 * Zero-dependency pure JavaScript in-browser PKZip builder (Store method: uncompressed)
 * Fast, robust, creates valid standard .zip archives readable by all operating systems.
 * @param {Array<{ name: string, blob: Blob }>} files
 * @returns {Promise<Blob>}
 */
export async function createZipArchive(files) {
  const fileEntries = [];
  let totalDataLength = 0;

  const textEncoder = new TextEncoder();

  // Convert blobs to ArrayBuffers and calculate CRC32
  for (const f of files) {
    const arrayBuffer = await f.blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const nameBytes = textEncoder.encode(f.name);
    const checksum = crc32(data);

    fileEntries.push({
      name: f.name,
      nameBytes,
      data,
      crc: checksum,
      size: data.length,
    });

    totalDataLength += 30 + nameBytes.length + data.length; // Local file header + data
  }

  // Calculate size needed for Central Directory and End of Central Directory
  let centralDirLength = 0;
  for (const entry of fileEntries) {
    centralDirLength += 46 + entry.nameBytes.length;
  }
  const endOfCentralDirLength = 22;

  const totalZipSize = totalDataLength + centralDirLength + endOfCentralDirLength;
  const zipBuffer = new Uint8Array(totalZipSize);
  const view = new DataView(zipBuffer.buffer);

  let offset = 0;
  const localHeaderOffsets = [];

  // 1. Write Local File Headers + File Data
  for (const entry of fileEntries) {
    localHeaderOffsets.push(offset);

    // Signature 0x04034b50
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 10, true); // Version needed to extract (1.0)
    view.setUint16(offset + 6, 0, true); // General purpose bit flag
    view.setUint16(offset + 8, 0, true); // Compression method (0 = store)
    view.setUint16(offset + 10, 0, true); // File last mod time
    view.setUint16(offset + 12, 0, true); // File last mod date
    view.setUint32(offset + 14, entry.crc, true); // CRC-32
    view.setUint32(offset + 18, entry.size, true); // Compressed size
    view.setUint32(offset + 22, entry.size, true); // Uncompressed size
    view.setUint16(offset + 26, entry.nameBytes.length, true); // File name length
    view.setUint16(offset + 28, 0, true); // Extra field length

    offset += 30;

    // File Name
    zipBuffer.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;

    // File Data
    zipBuffer.set(entry.data, offset);
    offset += entry.data.length;
  }

  // 2. Write Central Directory Headers
  const centralDirStartOffset = offset;
  for (let i = 0; i < fileEntries.length; i++) {
    const entry = fileEntries[i];
    const localOffset = localHeaderOffsets[i];

    // Signature 0x02014b50
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true); // Version made by (2.0)
    view.setUint16(offset + 6, 10, true); // Version needed to extract (1.0)
    view.setUint16(offset + 8, 0, true); // General purpose bit flag
    view.setUint16(offset + 10, 0, true); // Compression method (0 = store)
    view.setUint16(offset + 12, 0, true); // Mod time
    view.setUint16(offset + 14, 0, true); // Mod date
    view.setUint32(offset + 16, entry.crc, true); // CRC-32
    view.setUint32(offset + 20, entry.size, true); // Compressed size
    view.setUint32(offset + 24, entry.size, true); // Uncompressed size
    view.setUint16(offset + 28, entry.nameBytes.length, true); // File name length
    view.setUint16(offset + 30, 0, true); // Extra field length
    view.setUint16(offset + 32, 0, true); // File comment length
    view.setUint16(offset + 34, 0, true); // Disk number start
    view.setUint16(offset + 36, 0, true); // Internal file attributes
    view.setUint32(offset + 38, 0, true); // External file attributes
    view.setUint32(offset + 42, localOffset, true); // Relative offset of local header

    offset += 46;

    // File Name
    zipBuffer.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  // Signature 0x06054b50
  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 4, 0, true); // Disk number
  view.setUint16(offset + 6, 0, true); // Disk with central directory
  view.setUint16(offset + 8, fileEntries.length, true); // Number of central dir records on this disk
  view.setUint16(offset + 10, fileEntries.length, true); // Total central dir records
  view.setUint32(offset + 12, centralDirLength, true); // Size of central directory
  view.setUint32(offset + 16, centralDirStartOffset, true); // Offset of start of central directory
  view.setUint16(offset + 20, 0, true); // ZIP comment length

  return new Blob([zipBuffer], { type: 'application/zip' });
}

/**
 * Generate a synthetic high-resolution sample image for testing
 * @param {string} type 'landscape' | 'minimal' | 'texture' | 'badge'
 * @param {number} width
 * @param {number} height
 * @returns {Promise<File>}
 */
export async function createSampleImage(type = 'landscape', width = 1600, height = 1000) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }

  // Draw background gradient based on theme
  let grad;
  let filename = 'sample.jpg';

  if (type === 'landscape') {
    filename = 'photo-mountain-sunset.jpg';
    grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#f97316'); // Vibrant orange
    grad.addColorStop(0.35, '#ec4899'); // Pink
    grad.addColorStop(0.7, '#6366f1'); // Indigo
    grad.addColorStop(1, '#0f172a'); // Slate dark
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing sun
    const sunGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.45, 180);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.5, '#f59e0b');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, 180, 0, Math.PI * 2);
    ctx.fill();

    // Mountain ranges (detailed silhouette for compression testing)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.65);
    ctx.lineTo(width * 0.2, height * 0.48);
    ctx.lineTo(width * 0.45, height * 0.68);
    ctx.lineTo(width * 0.7, height * 0.42);
    ctx.lineTo(width * 0.9, height * 0.6);
    ctx.lineTo(width, height * 0.5);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Foreground ridge
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.8);
    ctx.lineTo(width * 0.35, height * 0.72);
    ctx.lineTo(width * 0.65, height * 0.84);
    ctx.lineTo(width, height * 0.75);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Specular stars/noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 80; i++) {
      const rx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
      const ry = (Math.cos(i * 389) * 0.5 + 0.5) * (height * 0.4);
      ctx.fillRect(rx, ry, 2, 2);
    }
  } else if (type === 'minimal') {
    filename = 'vector-brand-art.png';
    grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Geometric rings & cards
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 14;
    for (let r = 100; r <= 350; r += 70) {
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === 'texture') {
    filename = 'texture-high-res-grid.jpg';
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Fine grid pattern to test high-frequency compression artifacts
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else {
    filename = 'marketing-hero-banner.jpg';
    grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#0d9488');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Add sample label watermark
  ctx.save();
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.fillText('DreamKit High-Resolution Sample Image', width / 2, height / 2 - 20);
  ctx.font = '20px monospace';
  ctx.fillText(`${width} x ${height} px • High Color Spectrum • In-Browser Native`, width / 2, height / 2 + 25);
  ctx.restore();

  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.95));
  return new File([blob], filename, { type: mime, lastModified: Date.now() });
}

/**
 * Trigger browser file download
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
