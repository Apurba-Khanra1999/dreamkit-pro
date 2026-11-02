/**
 * QR Code Generator Utilities
 * Pure client-side QR generation, multi-format payloads, custom visual canvas/SVG rendering,
 * optical contrast analysis, and multi-format exports.
 */
import QRCode from 'qrcode';

// =============================================================================
// CONTENT FORMATTERS (RFC & Standard Protocols)
// =============================================================================

/**
 * Format URL with automatic protocol prefixing
 */
export function formatQrUrl(url) {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z]+:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Format Wi-Fi Configuration (ZXing standard)
 */
export function formatQrWifi({ ssid = '', password = '', encryption = 'WPA', hidden = false }) {
  const cleanSsid = (ssid || '').replace(/([\\;,:"])/g, '\\$1');
  const cleanPass = (password || '').replace(/([\\;,:"])/g, '\\$1');
  return `WIFI:T:${encryption};S:${cleanSsid};P:${cleanPass};H:${hidden ? 'true' : 'false'};;`;
}

/**
 * Format vCard Contact Card (vCard 3.0 RFC 6350)
 */
export function formatQrVCard({
  firstName = '',
  lastName = '',
  org = '',
  title = '',
  phone = '',
  email = '',
  url = '',
  address = '',
  note = ''
}) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (lastName || firstName) {
    lines.push(`N:${lastName};${firstName};;;`);
    lines.push(`FN:${[firstName, lastName].filter(Boolean).join(' ')}`);
  }
  if (org) lines.push(`ORG:${org}`);
  if (title) lines.push(`TITLE:${title}`);
  if (phone) lines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
  if (email) lines.push(`EMAIL;TYPE=PREF,INTERNET:${email}`);
  if (url) lines.push(`URL:${formatQrUrl(url)}`);
  if (address) lines.push(`ADR:;;${address};;;;`);
  if (note) lines.push(`NOTE:${note}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Format Email (mailto RFC 6068)
 */
export function formatQrEmail({ email = '', subject = '', body = '' }) {
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${email.trim()}${query}`;
}

/**
 * Format SMS (SMSTO standard)
 */
export function formatQrSms({ phone = '', message = '' }) {
  const cleanPhone = (phone || '').trim();
  return `SMSTO:${cleanPhone}:${message || ''}`;
}

/**
 * Format Phone Dialer (tel standard)
 */
export function formatQrPhone(phone = '') {
  return `tel:${(phone || '').trim()}`;
}

/**
 * Format Geolocation (geo URI RFC 5870)
 */
export function formatQrGeo({ lat = 0, lng = 0 }) {
  return `geo:${lat},${lng}`;
}

/**
 * Format Cryptocurrency Payment URI (BIP-21 / EIP-681)
 */
export function formatQrCrypto({ currency = 'bitcoin', address = '', amount = '', label = '' }) {
  const cleanAddr = (address || '').trim();
  const params = [];
  if (amount) {
    if (currency === 'ethereum') params.push(`value=${amount}`);
    else params.push(`amount=${amount}`);
  }
  if (label) params.push(`label=${encodeURIComponent(label)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';

  if (currency === 'ethereum') return `ethereum:${cleanAddr}${query}`;
  if (currency === 'solana') return `solana:${cleanAddr}${query}`;
  return `bitcoin:${cleanAddr}${query}`;
}

/**
 * Format Calendar Event (iCalendar / vEvent)
 */
export function formatQrEvent({ title = '', location = '', start = '', end = '', description = '' }) {
  const formatUtcDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = ['BEGIN:VEVENT'];
  if (title) lines.push(`SUMMARY:${title}`);
  if (location) lines.push(`LOCATION:${location}`);
  if (start) lines.push(`DTSTART:${formatUtcDate(start)}`);
  if (end) lines.push(`DTEND:${formatUtcDate(end)}`);
  if (description) lines.push(`DESCRIPTION:${description}`);
  lines.push('END:VEVENT');
  return lines.join('\n');
}

// =============================================================================
// CONTRAST & READABILITY DIAGNOSTICS
// =============================================================================

export function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function getRelativeLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculate optical contrast ratio between foreground and background
 */
export function calculateContrastRatio(fgHex, bgHex) {
  if (!fgHex || !bgHex || bgHex === 'transparent') {
    return { ratio: 21, label: 'High Contrast (Optimal)', status: 'optimal' };
  }
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const rounded = Number(ratio.toFixed(2));

  if (rounded >= 7) {
    return { ratio: rounded, label: 'Optimal Contrast (Fast Scan)', status: 'optimal' };
  } else if (rounded >= 4.5) {
    return { ratio: rounded, label: 'Good Contrast', status: 'good' };
  } else if (rounded >= 3) {
    return { ratio: rounded, label: 'Low Contrast (May fail in dim light)', status: 'warning' };
  } else {
    return { ratio: rounded, label: 'Insufficient Contrast (Likely unreadable)', status: 'error' };
  }
}

// =============================================================================
// FINDER PATTERN (CORNER EYES) DETECTION
// =============================================================================

/**
 * Check if a cell coordinate belongs to one of the three 7x7 corner finder patterns
 */
export function isFinderCell(r, c, size) {
  // Top-left finder
  if (r <= 6 && c <= 6) return true;
  // Top-right finder
  if (r <= 6 && c >= size - 7) return true;
  // Bottom-left finder
  if (r >= size - 7 && c <= 6) return true;
  return false;
}

/**
 * Returns which eye a cell belongs to: 'tl' (top-left), 'tr' (top-right), 'bl' (bottom-left), or null
 */
export function getFinderLocation(r, c, size) {
  if (r <= 6 && c <= 6) return 'tl';
  if (r <= 6 && c >= size - 7) return 'tr';
  if (r >= size - 7 && c <= 6) return 'bl';
  return null;
}

// =============================================================================
// CUSTOM CANVAS RENDERER
// =============================================================================

/**
 * Render custom-styled QR code onto HTML5 Canvas
 */
export async function renderCustomQrCanvas(canvas, contentText, options = {}) {
  if (!canvas || !contentText) return;

  const {
    errorCorrectionLevel = 'H',
    margin = 3,
    canvasSize = 1024,
    dotStyle = 'rounded', // 'square' | 'dots' | 'rounded' | 'extra-rounded'
    eyeStyle = 'rounded', // 'square' | 'rounded' | 'circle'
    fgColor = '#0f172a',
    bgColor = '#ffffff',
    gradient = null, // { type: 'diagonal'|'horizontal'|'vertical', start: '#...', end: '#...' }
    eyeColor = null, // optional separate color for corner eyes
    logoImage = null, // HTMLImageElement or ImageBitmap or null
    logoSizePercent = 22, // 10% - 26%
    logoBadgeShape = 'rounded' // 'circle' | 'rounded' | 'square'
  } = options;

  const qr = QRCode.create(contentText, { errorCorrectionLevel });
  const moduleCount = qr.modules.size;
  const totalGrid = moduleCount + margin * 2;
  const cellSize = canvasSize / totalGrid;

  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // 1. Draw Background
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }

  // 2. Prepare Module Fill Style (Solid or Linear Gradient)
  let fillStyle = fgColor;
  if (gradient && gradient.start && gradient.end) {
    let grad;
    if (gradient.type === 'horizontal') {
      grad = ctx.createLinearGradient(0, 0, canvasSize, 0);
    } else if (gradient.type === 'vertical') {
      grad = ctx.createLinearGradient(0, 0, 0, canvasSize);
    } else {
      // diagonal
      grad = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
    }
    grad.addColorStop(0, gradient.start);
    grad.addColorStop(1, gradient.end);
    fillStyle = grad;
  }

  // 3. Calculate Logo Safe Clearing Zone in center
  let logoMinCell = -1;
  let logoMaxCell = -1;
  if (logoImage) {
    const reservedCells = Math.floor(moduleCount * (logoSizePercent / 100));
    const midCell = Math.floor(moduleCount / 2);
    const halfReserved = Math.floor(reservedCells / 2);
    logoMinCell = midCell - halfReserved;
    logoMaxCell = midCell + halfReserved;
  }

  // 4. Render Data Modules (Skipping Finder patterns and Logo safe clearing zone)
  ctx.fillStyle = fillStyle;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Skip finder pattern cells (rendered separately with custom eye styles)
      if (isFinderCell(r, c, moduleCount)) continue;

      // Skip center logo zone
      if (logoImage && r >= logoMinCell && r <= logoMaxCell && c >= logoMinCell && c <= logoMaxCell) {
        continue;
      }

      if (qr.modules.get(r, c)) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;

        if (dotStyle === 'dots') {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else if (dotStyle === 'rounded') {
          const radius = cellSize * 0.28;
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, radius);
          ctx.fill();
        } else if (dotStyle === 'extra-rounded') {
          const radius = cellSize * 0.48;
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, radius);
          ctx.fill();
        } else {
          // square
          ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellSize), Math.ceil(cellSize));
        }
      }
    }
  }

  // 5. Render 3 Corner Finder Eyes (Top-Left, Top-Right, Bottom-Left)
  const eyeFill = eyeColor || fillStyle;
  const eyePositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  for (const pos of eyePositions) {
    const eyeX = (pos.c + margin) * cellSize;
    const eyeY = (pos.r + margin) * cellSize;
    const eyeSize = cellSize * 7;

    ctx.fillStyle = eyeFill;

    if (eyeStyle === 'circle') {
      // Outer ring
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, eyeSize / 2 - cellSize, 0, Math.PI * 2, true);
      ctx.fill();

      // Inner center dot
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, (cellSize * 3) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeStyle === 'rounded') {
      // Outer rounded frame
      ctx.beginPath();
      ctx.roundRect(eyeX, eyeY, eyeSize, eyeSize, cellSize * 1.5);
      ctx.roundRect(eyeX + cellSize, eyeY + cellSize, eyeSize - cellSize * 2, eyeSize - cellSize * 2, cellSize * 0.75);
      ctx.fill('evenodd');

      // Inner rounded center
      ctx.beginPath();
      ctx.roundRect(eyeX + cellSize * 2, eyeY + cellSize * 2, cellSize * 3, cellSize * 3, cellSize * 0.75);
      ctx.fill();
    } else {
      // Square standard
      ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
      ctx.clearRect(eyeX + cellSize, eyeY + cellSize, eyeSize - cellSize * 2, eyeSize - cellSize * 2);
      if (bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(eyeX + cellSize, eyeY + cellSize, eyeSize - cellSize * 2, eyeSize - cellSize * 2);
        ctx.fillStyle = eyeFill;
      }
      ctx.fillRect(eyeX + cellSize * 2, eyeY + cellSize * 2, cellSize * 3, cellSize * 3);
    }
  }

  // 6. Draw Center Logo Overlay if provided
  if (logoImage) {
    const logoPx = Math.round(canvasSize * (logoSizePercent / 100));
    const logoX = (canvasSize - logoPx) / 2;
    const logoY = (canvasSize - logoPx) / 2;
    const padding = Math.max(4, Math.round(logoPx * 0.12));

    // Draw background badge
    ctx.save();
    ctx.fillStyle = bgColor === 'transparent' ? '#ffffff' : bgColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = Math.round(canvasSize * 0.015);
    ctx.shadowOffsetY = Math.round(canvasSize * 0.005);

    if (logoBadgeShape === 'circle') {
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, logoPx / 2 + padding, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const radius = logoBadgeShape === 'square' ? 0 : Math.round(logoPx * 0.2);
      ctx.beginPath();
      ctx.roundRect(
        logoX - padding,
        logoY - padding,
        logoPx + padding * 2,
        logoPx + padding * 2,
        radius
      );
      ctx.fill();
    }
    ctx.restore();

    // Draw logo image
    try {
      ctx.drawImage(logoImage, logoX, logoY, logoPx, logoPx);
    } catch {
      // fallback if image not fully decoded
    }
  }

  return {
    moduleCount,
    cellSize,
    version: qr.version,
    errorCorrectionLevel: qr.errorCorrectionLevel.level
  };
}

// =============================================================================
// VECTOR SVG GENERATOR
// =============================================================================

/**
 * Generate scalable vector SVG string matching custom styles
 */
export function generateCustomQrSvg(contentText, options = {}) {
  if (!contentText) return '';

  const {
    errorCorrectionLevel = 'H',
    margin = 3,
    size = 1024,
    dotStyle = 'rounded',
    eyeStyle = 'rounded',
    fgColor = '#0f172a',
    bgColor = '#ffffff',
    gradient = null,
    eyeColor = null
  } = options;

  const qr = QRCode.create(contentText, { errorCorrectionLevel });
  const moduleCount = qr.modules.size;
  const totalGrid = moduleCount + margin * 2;
  const cellSize = size / totalGrid;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n`;

  // Gradients
  if (gradient && gradient.start && gradient.end) {
    let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '0%';
    if (gradient.type === 'vertical') { x2 = '0%'; y2 = '100%'; }
    else if (gradient.type === 'diagonal') { x2 = '100%'; y2 = '100%'; }

    svg += `  <defs>\n    <linearGradient id="qrGrad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">\n`;
    svg += `      <stop offset="0%" stop-color="${gradient.start}" />\n`;
    svg += `      <stop offset="100%" stop-color="${gradient.end}" />\n`;
    svg += `    </linearGradient>\n  </defs>\n`;
  }

  // Background
  if (bgColor && bgColor !== 'transparent') {
    svg += `  <rect width="${size}" height="${size}" fill="${bgColor}" />\n`;
  }

  const fill = gradient ? 'url(#qrGrad)' : fgColor;
  svg += `  <g fill="${fill}">\n`;

  // Render Data Modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderCell(r, c, moduleCount)) continue;

      if (qr.modules.get(r, c)) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;

        if (dotStyle === 'dots') {
          const cx = (x + cellSize / 2).toFixed(2);
          const cy = (y + cellSize / 2).toFixed(2);
          const rad = ((cellSize / 2) * 0.9).toFixed(2);
          svg += `    <circle cx="${cx}" cy="${cy}" r="${rad}" />\n`;
        } else if (dotStyle === 'rounded' || dotStyle === 'extra-rounded') {
          const rxRatio = dotStyle === 'extra-rounded' ? 0.48 : 0.28;
          const rx = (cellSize * rxRatio).toFixed(2);
          svg += `    <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" rx="${rx}" ry="${rx}" />\n`;
        } else {
          svg += `    <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" />\n`;
        }
      }
    }
  }
  svg += `  </g>\n`;

  // Render Finder Eyes
  const eyeFill = eyeColor || fill;
  const eyePositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  svg += `  <g fill="${eyeFill}">\n`;
  for (const pos of eyePositions) {
    const eyeX = (pos.c + margin) * cellSize;
    const eyeY = (pos.r + margin) * cellSize;
    const eyeSize = cellSize * 7;

    if (eyeStyle === 'circle') {
      const cx = (eyeX + eyeSize / 2).toFixed(2);
      const cy = (eyeY + eyeSize / 2).toFixed(2);
      const rOuter = (eyeSize / 2).toFixed(2);
      const rInner = (eyeSize / 2 - cellSize).toFixed(2);
      const rCenter = ((cellSize * 3) / 2).toFixed(2);

      svg += `    <path fill-rule="evenodd" d="M ${cx} ${(eyeY).toFixed(2)} A ${rOuter} ${rOuter} 0 1 0 ${cx} ${(eyeY + eyeSize).toFixed(2)} A ${rOuter} ${rOuter} 0 1 0 ${cx} ${(eyeY).toFixed(2)} Z M ${cx} ${(eyeY + cellSize).toFixed(2)} A ${rInner} ${rInner} 0 1 1 ${cx} ${(eyeY + eyeSize - cellSize).toFixed(2)} A ${rInner} ${rInner} 0 1 1 ${cx} ${(eyeY + cellSize).toFixed(2)} Z" />\n`;
      svg += `    <circle cx="${cx}" cy="${cy}" r="${rCenter}" />\n`;
    } else if (eyeStyle === 'rounded') {
      const rxOuter = (cellSize * 1.5).toFixed(2);
      const rxInner = (cellSize * 0.75).toFixed(2);
      svg += `    <rect x="${eyeX.toFixed(2)}" y="${eyeY.toFixed(2)}" width="${eyeSize.toFixed(2)}" height="${eyeSize.toFixed(2)}" rx="${rxOuter}" ry="${rxOuter}" fill="${eyeFill}" />\n`;
      svg += `    <rect x="${(eyeX + cellSize).toFixed(2)}" y="${(eyeY + cellSize).toFixed(2)}" width="${(eyeSize - cellSize * 2).toFixed(2)}" height="${(eyeSize - cellSize * 2).toFixed(2)}" rx="${rxInner}" ry="${rxInner}" fill="${bgColor === 'transparent' ? '#ffffff' : bgColor}" />\n`;
      svg += `    <rect x="${(eyeX + cellSize * 2).toFixed(2)}" y="${(eyeY + cellSize * 2).toFixed(2)}" width="${(cellSize * 3).toFixed(2)}" height="${(cellSize * 3).toFixed(2)}" rx="${rxInner}" ry="${rxInner}" fill="${eyeFill}" />\n`;
    } else {
      // Square
      svg += `    <rect x="${eyeX.toFixed(2)}" y="${eyeY.toFixed(2)}" width="${eyeSize.toFixed(2)}" height="${eyeSize.toFixed(2)}" fill="${eyeFill}" />\n`;
      svg += `    <rect x="${(eyeX + cellSize).toFixed(2)}" y="${(eyeY + cellSize).toFixed(2)}" width="${(eyeSize - cellSize * 2).toFixed(2)}" height="${(eyeSize - cellSize * 2).toFixed(2)}" fill="${bgColor === 'transparent' ? '#ffffff' : bgColor}" />\n`;
      svg += `    <rect x="${(eyeX + cellSize * 2).toFixed(2)}" y="${(eyeY + cellSize * 2).toFixed(2)}" width="${(cellSize * 3).toFixed(2)}" height="${(cellSize * 3).toFixed(2)}" fill="${eyeFill}" />\n`;
    }
  }
  svg += `  </g>\n</svg>`;

  return svg;
}

// =============================================================================
// EXPORT & DOWNLOAD HELPERS
// =============================================================================

export function downloadCanvasImage(canvas, filename = 'qrcode', format = 'png', quality = 0.95) {
  if (!canvas) return;
  const mimeMap = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp'
  };
  const mime = mimeMap[format] || 'image/png';
  const dataUrl = canvas.toDataURL(mime, quality);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadSvgFile(svgString, filename = 'qrcode') {
  if (!svgString) return;
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyCanvasToClipboard(canvas) {
  if (!canvas) throw new Error('Canvas not available');
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob'));
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

// =============================================================================
// CURATED STYLE PRESETS
// =============================================================================

export const STYLE_PRESETS = [
  {
    id: 'corporate',
    name: 'Clean Corporate',
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    dotStyle: 'square',
    eyeStyle: 'square',
    gradient: null,
  },
  {
    id: 'emerald',
    name: 'Emerald Minimal',
    fgColor: '#059669',
    bgColor: '#f0fdf4',
    dotStyle: 'rounded',
    eyeStyle: 'rounded',
    gradient: null,
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Neon',
    fgColor: '#06b6d4',
    bgColor: '#0b0f19',
    dotStyle: 'dots',
    eyeStyle: 'circle',
    gradient: { type: 'diagonal', start: '#06b6d4', end: '#ec4899' },
  },
  {
    id: 'sunset',
    name: 'Sunset Coral',
    fgColor: '#ea580c',
    bgColor: '#fff7ed',
    dotStyle: 'extra-rounded',
    eyeStyle: 'rounded',
    gradient: { type: 'diagonal', start: '#ea580c', end: '#e11d48' },
  },
  {
    id: 'amethyst',
    name: 'Royal Purple',
    fgColor: '#4f46e5',
    bgColor: '#faf5ff',
    dotStyle: 'rounded',
    eyeStyle: 'rounded',
    gradient: { type: 'diagonal', start: '#4f46e5', end: '#9333ea' },
  },
  {
    id: 'midnight',
    name: 'Obsidian Dark',
    fgColor: '#f8fafc',
    bgColor: '#111622',
    dotStyle: 'rounded',
    eyeStyle: 'rounded',
    gradient: null,
  }
];

// Content Type Options
export const CONTENT_TYPES = [
  { id: 'url', label: 'Website URL', icon: 'Link' },
  { id: 'text', label: 'Plain Text', icon: 'FileText' },
  { id: 'wifi', label: 'Wi-Fi Network', icon: 'Wifi' },
  { id: 'vcard', label: 'vCard Contact', icon: 'User' },
  { id: 'email', label: 'Email Message', icon: 'Mail' },
  { id: 'sms', label: 'SMS Text', icon: 'MessageSquare' },
  { id: 'phone', label: 'Phone Call', icon: 'Phone' },
  { id: 'geo', label: 'Location Map', icon: 'MapPin' },
  { id: 'crypto', label: 'Crypto Payment', icon: 'Coins' },
  { id: 'event', label: 'Calendar Event', icon: 'Calendar' },
];

// Preset Overlay Icons for Center Badge
export const PRESET_LOGOS = [
  {
    id: 'link',
    label: 'Link',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>`
  },
  {
    id: 'mail',
    label: 'Email',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
  },
  {
    id: 'phone',
    label: 'Phone',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
  },
  {
    id: 'user',
    label: 'User',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  },
  {
    id: 'shield',
    label: 'Shield',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`
  },
  {
    id: 'globe',
    label: 'Globe',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
  },
  {
    id: 'sparkles',
    label: 'Magic',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
  }
];
