import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_SIGNATURE_HISTORY_KEY = 'dreamkit_pdf_signature_history';

/**
 * Safely clone an ArrayBuffer or Uint8Array so it is never detached by PDF.js workers
 */
export function cloneBuffer(input) {
  if (!input) return new ArrayBuffer(0);
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.length);
    copy.set(input);
    return copy.buffer;
  }
  if (input instanceof ArrayBuffer) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input));
    return copy.buffer;
  }
  return new ArrayBuffer(0);
}

/**
 * Safely create a Uint8Array copy that can be transferred without affecting source data
 */
export function toTransferableUint8Array(input) {
  if (!input) return new Uint8Array(0);
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.length);
    copy.set(input);
    return copy;
  }
  if (input instanceof ArrayBuffer) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input));
    return copy;
  }
  return new Uint8Array(0);
}

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
 * Curated Cursive Handwriting Fonts for Typed Signatures
 */
export const SIGNATURE_STYLES = [
  { id: 'style_elegant', name: 'Elegant Script', font: 'italic 52px "Brush Script MT", "Great Vibes", cursive' },
  { id: 'style_modern', name: 'Modern Signature', font: 'italic 46px "Dancing Script", "Lucida Handwriting", cursive' },
  { id: 'style_formal', name: 'Classic Formal', font: 'italic 48px "Snell Roundhand", "Apple Chancery", cursive' },
  { id: 'style_executive', name: 'Executive Flow', font: 'italic 50px "Caveat", "Segoe Script", cursive' }
];

/**
 * Ink Color Presets
 */
export const INK_COLORS = [
  { id: 'blue', name: 'Classic Blue', hex: '#1d4ed8' },
  { id: 'navy', name: 'Dark Navy', hex: '#0f172a' },
  { id: 'black', name: 'Pure Black', hex: '#000000' },
  { id: 'red', name: 'Document Red', hex: '#b91c1c' }
];

/**
 * Auto-trim transparent borders from an HTML canvas
 * Returns a new canvas cropped tightly around the signature strokes
 */
export function trimCanvasBoundingBox(sourceCanvas, padding = 12) {
  if (!sourceCanvas) return null;
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If canvas is completely blank
  if (maxX === -1) {
    return sourceCanvas;
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(w, maxX + padding);
  maxY = Math.min(h, maxY + padding);

  const croppedW = maxX - minX;
  const croppedH = maxY - minY;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedW;
  croppedCanvas.height = croppedH;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (croppedCtx) {
    croppedCtx.drawImage(sourceCanvas, minX, minY, croppedW, croppedH, 0, 0, croppedW, croppedH);
  }

  return croppedCanvas;
}

/**
 * Generate Typed Signature as a transparent PNG data URL
 */
export function generateTypedSignatureDataUrl(name = 'Alex Morgan', fontStyle = SIGNATURE_STYLES[0].font, color = '#1d4ed8') {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 250;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = fontStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.trim() || 'Signature', 400, 125);

  const trimmed = trimCanvasBoundingBox(canvas, 16);
  const url = trimmed ? trimmed.toDataURL('image/png') : canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  if (trimmed && trimmed !== canvas) {
    trimmed.width = 0;
    trimmed.height = 0;
  }
  return url;
}

/**
 * Clean up uploaded image signature by removing white/light paper background
 */
export function removeImageBackground(imageElement, threshold = 220) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth || imageElement.width || 400;
  canvas.height = imageElement.naturalHeight || imageElement.height || 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(imageElement, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // If pixel is near white or very light gray
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0; // Make fully transparent
    } else {
      // Enhance darker ink contrast slightly
      data[i + 3] = Math.min(255, data[i + 3] + 40);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const trimmed = trimCanvasBoundingBox(canvas, 10);
  const url = trimmed ? trimmed.toDataURL('image/png') : canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return url;
}

/**
 * Generate Official Digital Signature Badge / Certificate Stamp
 */
export function generateDigitalStampDataUrl({
  name = 'Alex Morgan',
  role = 'Authorized Signatory',
  reason = 'Verification & Approval',
  color = '#1d4ed8'
}) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 600, 180);

  // Background box with rounded corners
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 4, 592, 172, 10);
  ctx.fill();
  ctx.stroke();

  // Left Icon Badge Box
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(16, 16, 68, 148, 8);
  ctx.fill();

  // Checkmark in badge box
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', 50, 90);

  // Text details on right
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const certId = 'DK-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`Digitally Signed by: ${name}`, 104, 45);

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`Role / Title: ${role}`, 104, 75);
  ctx.fillText(`Date: ${dateStr}`, 104, 103);
  ctx.fillText(`Reason: ${reason} • Cert ID: ${certId}`, 104, 131);

  const url = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return url;
}

/**
 * Load PDF file information, inspect page count, dimensions
 */
export async function getPdfInfoForSigning(rawBuffer, filename = 'document.pdf') {
  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  const pagesInfo = [];
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    pagesInfo.push({
      pageNumber: i + 1,
      width: Math.round(width),
      height: Math.round(height)
    });
  }

  return {
    name: filename,
    size: safeBuffer.byteLength,
    formattedSize: formatBytes(safeBuffer.byteLength),
    pageCount,
    pages: pagesInfo,
    firstPageWidth: pagesInfo[0]?.width || 595,
    firstPageHeight: pagesInfo[0]?.height || 842,
    buffer: safeBuffer
  };
}

/**
 * Render a single page thumbnail using PDF.js without detaching source buffer
 */
export async function renderPdfPageToCanvas(arrayBuffer, pageNum = 1, scale = 1.0) {
  if (typeof document === 'undefined') return null;
  try {
    const safeBuffer = cloneBuffer(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: toTransferableUint8Array(safeBuffer)
    });
    const pdf = await loadingTask.promise;
    if (pageNum < 1 || pageNum > pdf.numPages) return null;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const width = canvas.width;
    const height = canvas.height;
    canvas.width = 0;
    canvas.height = 0;

    return { dataUrl, width, height };
  } catch (err) {
    console.error('Failed to render page thumbnail:', err);
    return null;
  }
}

/**
 * Convert any image data (dataUrl or Blob) to PNG Uint8Array for PDF embedding
 */
export async function imageSourceToPngBytes(imageSource) {
  if (!imageSource) return null;
  if (imageSource instanceof Uint8Array || imageSource instanceof ArrayBuffer) {
    return new Uint8Array(imageSource);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 400;
      canvas.height = img.naturalHeight || img.height || 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(new Uint8Array(reader.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to decode signature image'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      reject(new Error('Unsupported image format'));
    }
  });
}

/**
 * Embed placed signatures onto the PDF document using PDF-Lib (100% Client-Side)
 *
 * @param {ArrayBuffer} rawBuffer - Source PDF buffer
 * @param {Array} signatures - Array of signature placements:
 *   [{
 *      pageNumber: 3,
 *      imageSource: dataUrl,
 *      xPct: 0.55,       // X coordinate as fraction of page width (0.0 - 1.0)
 *      yPct: 0.72,       // Y coordinate as fraction of page height (from top! 0.0 - 1.0)
 *      widthPct: 0.28,   // Width as fraction of page width
 *      heightPct: 0.09,  // Height as fraction of page height
 *      includeDate: true,
 *      dateText: 'Signed: 2026-11-02'
 *   }]
 */
export async function applySignaturesToPdf(rawBuffer, signatures = [], onProgress = null) {
  if (!signatures || signatures.length === 0) {
    throw new Error('Please place at least one signature on the document before saving.');
  }

  const safeBuffer = cloneBuffer(rawBuffer);
  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  let fontRegular = null;
  let fontBold = null;

  for (let i = 0; i < signatures.length; i++) {
    const item = signatures[i];
    const pageIndex = Math.max(0, Math.min(totalPages - 1, (item.pageNumber || 1) - 1));
    const page = pdfDoc.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    if (onProgress) {
      const percent = Math.round(((i + 1) / signatures.length) * 100);
      onProgress({
        current: i + 1,
        total: signatures.length,
        percent,
        stage: `Embedding signature on page ${pageIndex + 1}...`
      });
    }

    // Embed signature image bytes
    const pngBytes = await imageSourceToPngBytes(item.imageSource);
    if (!pngBytes) continue;

    let embeddedImage = null;
    try {
      embeddedImage = await pdfDoc.embedPng(pngBytes);
    } catch {
      embeddedImage = await pdfDoc.embedJpg(pngBytes);
    }

    // Calculate dimensions in PDF points
    const sigWidth = pageWidth * (item.widthPct || 0.25);
    const sigHeight = pageHeight * (item.heightPct || 0.08);

    // Coordinate translation:
    // User interface gives (xPct, yPct) where yPct is measured from TOP (0.0 = top of page)
    // In PDF coordinate system, (0, 0) is at BOTTOM-LEFT!
    const sigX = pageWidth * item.xPct;
    const sigY = pageHeight - (pageHeight * item.yPct) - sigHeight;

    // Draw signature image
    page.drawImage(embeddedImage, {
      x: sigX,
      y: sigY,
      width: sigWidth,
      height: sigHeight,
      opacity: 0.98
    });

    // Optional date or signer metadata text stamp beneath signature
    if (item.includeDate && item.dateText) {
      if (!fontRegular) fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      if (!fontBold) fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const dateStr = item.dateText.trim();
      const fontSize = Math.max(7, Math.min(10, sigHeight * 0.16));
      page.drawText(dateStr, {
        x: sigX,
        y: Math.max(8, sigY - fontSize - 3),
        size: fontSize,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.35)
      });
    }
  }

  const signedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    pdfBytes: signedPdfBytes,
    size: signedPdfBytes.byteLength,
    formattedSize: formatBytes(signedPdfBytes.byteLength),
    originalSize: safeBuffer.byteLength,
    formattedOriginalSize: formatBytes(safeBuffer.byteLength),
    pageCount: totalPages,
    signaturesAppliedCount: signatures.length
  };
}

/**
 * Generate a 3-page Business Services Agreement & NDA with signature lines on the last page
 */
export async function generateSampleContractPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- Page 1: Master Services Agreement ---
  const p1 = pdfDoc.addPage([595, 842]);
  p1.drawRectangle({ x: 0, y: 730, width: 595, height: 112, color: rgb(0.08, 0.12, 0.22) });
  p1.drawText('MASTER SERVICES AGREEMENT & NDA', { x: 45, y: 795, size: 20, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Effective Date: November 2026 • Contract Ref: MSA-2026-DK', { x: 45, y: 765, size: 11, font, color: rgb(0.7, 0.8, 0.95) });

  p1.drawText('1. Purpose and Scope of Agreement', { x: 45, y: 690, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p1.drawText(
    'This Master Services Agreement ("Agreement") is entered into between DreamKit Systems ("Provider")\n' +
    'and the Client identified on the execution page. The purpose is to establish the legal framework\n' +
    'governing professional software development, document automation, and security consulting.',
    { x: 45, y: 660, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  p1.drawText('2. Confidentiality & Non-Disclosure', { x: 45, y: 580, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p1.drawText(
    'Both parties agree that all proprietary algorithms, architecture specifications, cryptographic keys,\n' +
    'and customer records shared during this engagement shall remain strictly confidential.\n' +
    'No information shall be disclosed to any third party without prior written authorization.',
    { x: 45, y: 550, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  p1.drawRectangle({ x: 45, y: 380, width: 505, height: 100, color: rgb(0.96, 0.97, 0.99) });
  p1.drawRectangle({ x: 45, y: 450, width: 505, height: 30, color: rgb(0.15, 0.23, 0.38) });
  p1.drawText('Key Deliverables', { x: 55, y: 462, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Target Timeline', { x: 280, y: 462, size: 10, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Sign-off Required', { x: 430, y: 462, size: 10, font: bold, color: rgb(1, 1, 1) });

  p1.drawText('Full Vector Signature Stamping Engine', { x: 55, y: 425, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('Month 1', { x: 280, y: 425, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('YES', { x: 430, y: 425, size: 9.5, font: bold, color: rgb(0.08, 0.55, 0.25) });

  p1.drawText('100% Client-Side Privacy Compliance', { x: 55, y: 395, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('Continuous', { x: 280, y: 395, size: 9.5, font, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('YES', { x: 430, y: 395, size: 9.5, font: bold, color: rgb(0.08, 0.55, 0.25) });

  p1.drawText('Page 1 of 3 — Master Services Agreement', { x: 45, y: 40, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  // --- Page 2: Terms of Service & SLA ---
  const p2 = pdfDoc.addPage([595, 842]);
  p2.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText('TERMS OF SERVICE & SERVICE LEVEL COMMITMENT', { x: 45, y: 800, size: 16, font: bold, color: rgb(1, 1, 1) });

  p2.drawText('3. Service Level Agreement (SLA)', { x: 45, y: 720, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText(
    'Provider warrants 99.9% uptime for client document runtime services. Any identified defects\n' +
    'shall be addressed within four (4) business hours of notification under Priority 1 SLA protocols.',
    { x: 45, y: 690, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  p2.drawText('4. Intellectual Property & Ownership', { x: 45, y: 620, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p2.drawText(
    'All works created, including code, documentation, and user interfaces, shall belong solely\n' +
    'to the Client upon receipt of final payment. Provider retains no proprietary claims.',
    { x: 45, y: 590, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  p2.drawText('Page 2 of 3 — Master Services Agreement', { x: 45, y: 40, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  // --- Page 3: Execution & Acceptance (Signature Page!) ---
  const p3 = pdfDoc.addPage([595, 842]);
  p3.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.15, 0.23, 0.38) });
  p3.drawText('EXECUTION & BINDING SIGNATURES', { x: 45, y: 800, size: 18, font: bold, color: rgb(1, 1, 1) });

  p3.drawText('5. Formal Agreement & Execution', { x: 45, y: 720, size: 14, font: bold, color: rgb(0.12, 0.16, 0.28) });
  p3.drawText(
    'IN WITNESS WHEREOF, the parties hereto have caused this Agreement to be executed by their\n' +
    'duly authorized representatives. By affixing digital signatures below, each party confirms full consent.',
    { x: 45, y: 690, size: 10, font, lineHeight: 16, color: rgb(0.25, 0.28, 0.35) }
  );

  // Left Signature Block (Party A: Provider)
  p3.drawRectangle({ x: 45, y: 420, width: 235, height: 210, color: rgb(0.97, 0.98, 1) });
  p3.drawText('PROVIDER ACCEPTANCE', { x: 60, y: 605, size: 11, font: bold, color: rgb(0.15, 0.23, 0.38) });
  p3.drawText('DreamKit Technologies Inc.', { x: 60, y: 585, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });

  p3.drawLine({ start: { x: 60, y: 495 }, end: { x: 260, y: 495 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  p3.drawText('Signature: __________________________', { x: 60, y: 480, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  p3.drawText('Name: Alex Morgan', { x: 60, y: 458, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  p3.drawText('Title: Managing Director & VP', { x: 60, y: 440, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

  // Right Signature Block (Party B: Client / User)
  p3.drawRectangle({ x: 315, y: 420, width: 235, height: 210, color: rgb(0.97, 0.98, 1) });
  p3.drawText('CLIENT ACCEPTANCE', { x: 330, y: 605, size: 11, font: bold, color: rgb(0.15, 0.23, 0.38) });
  p3.drawText('Authorized Client Organization', { x: 330, y: 585, size: 9.5, font, color: rgb(0.3, 0.3, 0.3) });

  p3.drawLine({ start: { x: 330, y: 495 }, end: { x: 530, y: 495 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  p3.drawText('Signature: [ Place Your Signature Here ]', { x: 330, y: 480, size: 9, font: bold, color: rgb(0.2, 0.35, 0.7) });
  p3.drawText('Name: _______________________________', { x: 330, y: 458, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  p3.drawText('Date: _______________________________', { x: 330, y: 440, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

  p3.drawText('Page 3 of 3 — Master Services Agreement (Signature Page)', { x: 45, y: 40, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  return {
    name: 'Sample_Master_Services_Agreement.pdf',
    size: pdfBytes.byteLength,
    formattedSize: formatBytes(pdfBytes.byteLength),
    pageCount: 3,
    buffer: pdfBytes.buffer
  };
}

/**
 * Signature History Storage Handlers
 */
export function getSignatureHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SIGNATURE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSignatureHistory(item) {
  if (typeof localStorage === 'undefined' || !item) return;
  try {
    const history = getSignatureHistory();
    const updated = [
      {
        id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...item
      },
      ...history
    ].slice(0, 15);
    localStorage.setItem(STORAGE_SIGNATURE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }
}

export function clearSignatureHistory() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_SIGNATURE_HISTORY_KEY);
  } catch {
    // Ignore
  }
}
