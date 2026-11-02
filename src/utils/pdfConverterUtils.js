import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { createZipArchive } from './imageCompressorUtils';

// Configure pdfjs worker for Vite browser bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const STORAGE_CONVERTER_HISTORY_KEY = 'dreamkit_pdf_converter_history';

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
 * Format bytes to human readable format
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generate a unique ID
 */
export function generateUniqueId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Strip extension from filename
 */
export function getBaseFileName(filename = 'document.pdf') {
  return filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Escape XML/HTML special characters
 */
export function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* =========================================================================
   PURE CLIENT-SIDE ZIP DECOMPRESSOR (FOR DOCX & XLSX)
   ========================================================================= */

/**
 * Decompress a deflate-raw compressed buffer using native DecompressionStream
 */
async function decompressDeflateRaw(compressedData) {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressedData);
  writer.close();

  const chunks = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

/**
 * Unzip a standard PKZip archive (like DOCX, XLSX, or ZIP files)
 * Returns object mapping filename -> Uint8Array
 */
export async function unzipArchive(arrayBuffer) {
  const buf = cloneBuffer(arrayBuffer);
  const u8 = new Uint8Array(buf);
  const view = new DataView(buf);
  const files = {};

  // Find End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) {
      eocdOffset = i;
      break;
    }
  }

  const textDecoder = new TextDecoder();

  if (eocdOffset !== -1) {
    // Read from Central Directory
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const cdOffset = view.getUint32(eocdOffset + 16, true);
    let curr = cdOffset;

    for (let e = 0; e < totalEntries && curr < eocdOffset; e++) {
      const sig = view.getUint32(curr, true);
      if (sig !== 0x02014b50) break;

      const method = view.getUint16(curr + 10, true);
      const compSize = view.getUint32(curr + 20, true);
      const nameLen = view.getUint16(curr + 28, true);
      const extraLen = view.getUint16(curr + 30, true);
      const commentLen = view.getUint16(curr + 32, true);
      const localHeaderOffset = view.getUint32(curr + 42, true);

      const nameBytes = u8.subarray(curr + 46, curr + 46 + nameLen);
      const filename = textDecoder.decode(nameBytes);

      // Locate data in local header
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const fileData = u8.subarray(dataOffset, dataOffset + compSize);

      if (method === 0) {
        files[filename] = fileData;
      } else if (method === 8) {
        try {
          files[filename] = await decompressDeflateRaw(fileData);
        } catch {
          // ignore corrupted sub-entry
        }
      }

      curr += 46 + nameLen + extraLen + commentLen;
    }
  } else {
    // Fallback: scan local file headers directly
    let offset = 0;
    while (offset < buf.byteLength - 30) {
      const sig = view.getUint32(offset, true);
      if (sig !== 0x04034b50) break;

      const method = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);

      const nameBytes = u8.subarray(offset + 30, offset + 30 + nameLen);
      const filename = textDecoder.decode(nameBytes);

      const dataOffset = offset + 30 + nameLen + extraLen;
      const fileData = u8.subarray(dataOffset, dataOffset + compSize);

      if (method === 0) {
        files[filename] = fileData;
      } else if (method === 8 && compSize > 0) {
        try {
          files[filename] = await decompressDeflateRaw(fileData);
        } catch {
          // ignore
        }
      }

      offset = dataOffset + compSize;
    }
  }

  return files;
}

/* =========================================================================
   DOCX & XLSX TEXT / TABLE EXTRACTORS
   ========================================================================= */

/**
 * Extract structured text, paragraphs, and headings from a DOCX buffer
 */
export async function extractTextFromDocx(arrayBuffer) {
  const files = await unzipArchive(arrayBuffer);
  const docXmlData = files['word/document.xml'];

  if (!docXmlData) {
    throw new Error('Invalid DOCX document. "word/document.xml" was not found.');
  }

  const xmlText = new TextDecoder('utf-8').decode(docXmlData);

  // Extract paragraphs (<w:p>...</w:p>)
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  const paragraphs = [];
  let match;

  while ((match = pRegex.exec(xmlText)) !== null) {
    const pContent = match[1];

    // Check if paragraph is a heading or has bold
    const isHeading = /<w:pStyle\s+w:val="Heading(\d)"/i.test(pContent) || /<w:b(?:\s+[^>]*)?\/>/i.test(pContent);

    // Extract all text nodes (<w:t>...</w:t>)
    const tRegex = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g;
    const textPieces = [];
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      textPieces.push(tMatch[1]);
    }

    const fullPText = textPieces.join('').trim();
    if (fullPText) {
      paragraphs.push({
        text: fullPText,
        isHeading
      });
    }
  }

  const fullText = paragraphs.map((p) => p.text).join('\n\n');
  return {
    fullText,
    paragraphs
  };
}

/**
 * Extract spreadsheet table from an XLSX buffer
 */
export async function extractTableFromXlsx(arrayBuffer) {
  const files = await unzipArchive(arrayBuffer);
  const sheetData = files['xl/worksheets/sheet1.xml'];

  if (!sheetData) {
    throw new Error('Invalid XLSX file. "xl/worksheets/sheet1.xml" not found.');
  }

  // 1. Parse Shared Strings if available
  const sharedStrings = [];
  const sharedData = files['xl/sharedStrings.xml'];
  if (sharedData) {
    const sharedXml = new TextDecoder('utf-8').decode(sharedData);
    const siRegex = /<si>([\s\S]*?)<\/si>/g;
    let siMatch;
    while ((siMatch = siRegex.exec(sharedXml)) !== null) {
      const siContent = siMatch[1];
      const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
      const parts = [];
      let tMatch;
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        parts.push(tMatch[1]);
      }
      sharedStrings.push(parts.join(''));
    }
  }

  // 2. Parse Sheet Rows & Cells
  const sheetXml = new TextDecoder('utf-8').decode(sheetData);
  const rowRegex = /<row(?:\s+[^>]*)?>([\s\S]*?)<\/row>/g;
  const rows = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<c\s+r="([A-Z]+)(\d+)"(?:\s+t="([^"]+)")?[^>]*>(?:[\s\S]*?<v>([\s\S]*?)<\/v>)?[\s\S]*?<\/c>/g;
    const rowCells = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const colLetter = cellMatch[1];
      const cellType = cellMatch[3] || 'n';
      const cellValueRaw = cellMatch[4] || '';

      // Convert column letter to 0-based column index
      let colIdx = 0;
      for (let i = 0; i < colLetter.length; i++) {
        colIdx = colIdx * 26 + (colLetter.charCodeAt(i) - 64);
      }
      colIdx -= 1;

      let cellValue = cellValueRaw;
      if (cellType === 's') {
        const sIdx = parseInt(cellValueRaw, 10);
        cellValue = (!isNaN(sIdx) && sharedStrings[sIdx]) ? sharedStrings[sIdx] : cellValueRaw;
      }

      rowCells[colIdx] = cellValue;
    }

    // Fill sparse empty cells
    for (let i = 0; i < rowCells.length; i++) {
      if (rowCells[i] === undefined) rowCells[i] = '';
    }

    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  }

  const headers = rows.length > 0 ? rows[0] : [];
  const dataRows = rows.length > 1 ? rows.slice(1) : [];

  return {
    headers,
    rows: dataRows,
    totalRows: rows.length,
    totalCols: headers.length
  };
}

/**
 * Parse CSV or TSV string into headers and rows
 */
export function parseCsvTable(csvText = '') {
  if (!csvText || !csvText.trim()) return { headers: [], rows: [] };

  const lines = csvText.trim().split(/\r?\n/);
  const parsedRows = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // Delimiter detection: Tab or Comma
    const delimiter = line.includes('\t') ? '\t' : ',';
    const row = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    parsedRows.push(row);
  }

  const headers = parsedRows.length > 0 ? parsedRows[0] : [];
  const rows = parsedRows.length > 1 ? parsedRows.slice(1) : [];

  return { headers, rows };
}

/* =========================================================================
   1. PDF TO JPG CONVERTER
   ========================================================================= */

export async function convertPdfToJpg({
  buffer,
  dpi = 150,
  quality = 0.9,
  onProgress = null
}) {
  const safeBuffer = cloneBuffer(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages = [];

  const scale = dpi / 72;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({
        current: i,
        total: totalPages,
        stage: `Rendering JPG for Page ${i} of ${totalPages}...`,
        percent: Math.round((i / totalPages) * 100)
      });
    }

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    // Solid white background for JPG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    pages.push({
      pageNumber: i,
      dataUrl,
      blob,
      size: blob.size,
      formattedSize: formatBytes(blob.size),
      filename: `page_${i}.jpg`
    });

    canvas.width = 0;
    canvas.height = 0;
  }

  return {
    pages,
    totalPages
  };
}

/* =========================================================================
   2. PDF TO PNG CONVERTER
   ========================================================================= */

export async function convertPdfToPng({
  buffer,
  dpi = 150,
  transparentBg = false,
  onProgress = null
}) {
  const safeBuffer = cloneBuffer(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages = [];

  const scale = dpi / 72;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({
        current: i,
        total: totalPages,
        stage: `Rendering PNG for Page ${i} of ${totalPages}...`,
        percent: Math.round((i / totalPages) * 100)
      });
    }

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: transparentBg });

    if (!transparentBg) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    pages.push({
      pageNumber: i,
      dataUrl,
      blob,
      size: blob.size,
      formattedSize: formatBytes(blob.size),
      filename: `page_${i}.png`
    });

    canvas.width = 0;
    canvas.height = 0;
  }

  return {
    pages,
    totalPages
  };
}

/* =========================================================================
   3. JPG TO PDF & 4. PNG TO PDF CONVERTER
   ========================================================================= */

export async function convertImagesToPdf({
  imageFiles = [],
  pageSize = 'A4', // 'A4' | 'Letter' | 'fit'
  orientation = 'auto', // 'auto' | 'portrait' | 'landscape'
  margin = 18,
  onProgress = null
}) {
  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Please select at least one image to convert.');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Image Compilation');
  pdfDoc.setProducer('DreamKit Image to PDF Studio');
  pdfDoc.setCreator('DreamKit');

  const pageDimensions = {
    A4: [595.28, 841.89],
    Letter: [612, 792]
  };

  for (let i = 0; i < imageFiles.length; i++) {
    const item = imageFiles[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: imageFiles.length,
        stage: `Embedding image ${i + 1} of ${imageFiles.length}...`,
        percent: Math.round(((i + 1) / imageFiles.length) * 90)
      });
    }

    const rawBuffer = item.buffer || await item.file.arrayBuffer();
    const isPng = item.name?.toLowerCase().endsWith('.png') || item.type === 'image/png';

    const embeddedImage = isPng
      ? await pdfDoc.embedPng(cloneBuffer(rawBuffer))
      : await pdfDoc.embedJpg(cloneBuffer(rawBuffer));

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let targetPageWidth;
    let targetPageHeight;

    if (pageSize === 'fit') {
      targetPageWidth = imgWidth + margin * 2;
      targetPageHeight = imgHeight + margin * 2;
    } else {
      const baseDims = pageDimensions[pageSize] || pageDimensions.A4;
      const isImgLandscape = imgWidth > imgHeight;

      if (orientation === 'landscape' || (orientation === 'auto' && isImgLandscape)) {
        targetPageWidth = Math.max(baseDims[0], baseDims[1]);
        targetPageHeight = Math.min(baseDims[0], baseDims[1]);
      } else {
        targetPageWidth = Math.min(baseDims[0], baseDims[1]);
        targetPageHeight = Math.max(baseDims[0], baseDims[1]);
      }
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Available drawing box
    const availWidth = targetPageWidth - margin * 2;
    const availHeight = targetPageHeight - margin * 2;

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight, 1);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = margin + (availWidth - drawWidth) / 2;
    const y = margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });
  }

  const savedBytes = await pdfDoc.save({ useObjectStreams: true });
  const finalBytes = cloneBuffer(savedBytes);

  return {
    pdfBytes: finalBytes,
    totalPages: imageFiles.length,
    totalSize: finalBytes.byteLength,
    formattedSize: formatBytes(finalBytes.byteLength)
  };
}

/* =========================================================================
   5. WORD TO PDF CONVERTER
   ========================================================================= */

export async function convertWordToPdf({
  docxBuffer = null,
  textContent = '',
  documentTitle = 'Converted Document',
  onProgress = null
}) {
  let paragraphs = [];

  if (docxBuffer && docxBuffer.byteLength > 0) {
    if (onProgress) {
      onProgress({ current: 1, total: 3, stage: 'Unzipping and parsing DOCX structure...', percent: 25 });
    }
    const extracted = await extractTextFromDocx(docxBuffer);
    paragraphs = extracted.paragraphs;
  } else if (textContent) {
    paragraphs = textContent.split(/\r?\n/).map((line) => ({
      text: line.trim(),
      isHeading: line.startsWith('#') || (line.length < 60 && line.endsWith(':'))
    })).filter((p) => p.text.length > 0);
  } else {
    throw new Error('Please provide a Word document or document text.');
  }

  if (onProgress) {
    onProgress({ current: 2, total: 3, stage: 'Generating formatted PDF pages...', percent: 60 });
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(documentTitle);
  pdfDoc.setProducer('DreamKit Word to PDF Studio');
  pdfDoc.setCreator('DreamKit');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Header Title
  currentPage.drawText(documentTitle.toUpperCase(), {
    x: margin,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4)
  });
  currentY -= 28;

  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9)
  });
  currentY -= 24;

  for (const item of paragraphs) {
    const isHeading = item.isHeading;
    const currentFont = isHeading ? boldFont : font;
    const fontSize = isHeading ? 12 : 9.5;
    const lineHeight = isHeading ? 18 : 14;
    const textColor = isHeading ? rgb(0.1, 0.15, 0.3) : rgb(0.2, 0.2, 0.2);

    // Text wrapping
    const words = item.text.replace(/^#+\s*/, '').split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = currentFont.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine) {
        if (currentY - lineHeight < margin + 20) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        currentPage.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: currentFont,
          color: textColor
        });

        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (currentY - lineHeight < margin + 20) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      currentPage.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font: currentFont,
        color: textColor
      });
      currentY -= (lineHeight + (isHeading ? 8 : 4));
    }
  }

  // Stamp page numbers
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: pageWidth / 2 - 25,
      y: 20,
      size: 8.5,
      font,
      color: rgb(0.45, 0.45, 0.45)
    });
  }

  const savedBytes = await pdfDoc.save({ useObjectStreams: true });
  const finalBytes = cloneBuffer(savedBytes);

  return {
    pdfBytes: finalBytes,
    totalPages: pages.length,
    totalSize: finalBytes.byteLength,
    formattedSize: formatBytes(finalBytes.byteLength)
  };
}

/* =========================================================================
   6. PDF TO WORD CONVERTER (.docx & .doc)
   ========================================================================= */

export async function convertPdfToWord({
  buffer,
  filename = 'document.pdf',
  onProgress = null
}) {
  const safeBuffer = cloneBuffer(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const extractedParagraphs = [];
  let totalWordCount = 0;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({
        current: i,
        total: totalPages,
        stage: `Extracting text and structure from Page ${i} of ${totalPages}...`,
        percent: Math.round((i / totalPages) * 75)
      });
    }

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Group items into vertical lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push(item);
    }

    // Sort top-down
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedYs) {
      const items = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const lineText = items.map((it) => it.str).join(' ').trim();
      const avgFontSize = items.reduce((acc, it) => acc + (it.height || 10), 0) / items.length;

      if (lineText) {
        const isHeading = avgFontSize >= 14 || (avgFontSize >= 12 && lineText.length < 50);
        extractedParagraphs.push({
          text: lineText,
          isHeading,
          fontSize: avgFontSize
        });
        totalWordCount += lineText.split(/\s+/).length;
      }
    }
  }

  const baseName = getBaseFileName(filename);

  // 1. Build genuine .docx files
  const paragraphsDocxXml = extractedParagraphs.map((p) => {
    const escaped = escapeXml(p.text);
    return `<w:p><w:pPr>${p.isHeading ? '<w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="120"/>' : '<w:spacing w:after="140" w:line="260" w:lineRule="auto"/>'}</w:pPr><w:r><w:rPr>${p.isHeading ? '<w:b/><w:sz w:val="30"/><w:color w:val="1A365D"/>' : '<w:sz w:val="22"/><w:color w:val="2D3748"/>'}</w:rPr><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  }).join('');

  const contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>';

  const relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';

  const docRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';

  const stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="2D3748"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>';

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphsDocxXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;

  const docxFiles = [
    { name: '[Content_Types].xml', blob: new Blob([contentTypesXml], { type: 'application/xml' }) },
    { name: '_rels/.rels', blob: new Blob([relsXml], { type: 'application/xml' }) },
    { name: 'word/_rels/document.xml.rels', blob: new Blob([docRelsXml], { type: 'application/xml' }) },
    { name: 'word/document.xml', blob: new Blob([documentXml], { type: 'application/xml' }) },
    { name: 'word/styles.xml', blob: new Blob([stylesXml], { type: 'application/xml' }) }
  ];

  const docxBlob = await createZipArchive(docxFiles);

  // 2. Also build Word HTML (.doc)
  const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${baseName}</title>
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #2d3748; line-height: 1.6; margin: 40px; }
h1, h2, h3 { color: #1a365d; font-weight: bold; margin-top: 18px; margin-bottom: 8px; }
p { margin-bottom: 12px; }
</style>
</head>
<body>
${extractedParagraphs.map((p) => p.isHeading ? `<h2>${escapeXml(p.text)}</h2>` : `<p>${escapeXml(p.text)}</p>`).join('\n')}
</body></html>`;

  const docBlob = new Blob([docHtml], { type: 'application/msword' });

  return {
    docxBlob,
    docBlob,
    docxFilename: `${baseName}.docx`,
    docFilename: `${baseName}.doc`,
    extractedParagraphs,
    wordCount: totalWordCount,
    totalPages
  };
}

/* =========================================================================
   7. EXCEL TO PDF CONVERTER
   ========================================================================= */

export async function convertExcelToPdf({
  xlsxBuffer = null,
  csvText = '',
  documentTitle = 'Spreadsheet Export',
  orientation = 'landscape', // 'landscape' | 'portrait'
  showGridlines = true,
  onProgress = null
}) {
  let headers = [];
  let rows = [];

  if (xlsxBuffer && xlsxBuffer.byteLength > 0) {
    if (onProgress) {
      onProgress({ current: 1, total: 3, stage: 'Parsing XLSX worksheet and cells...', percent: 30 });
    }
    const extracted = await extractTableFromXlsx(xlsxBuffer);
    headers = extracted.headers;
    rows = extracted.rows;
  } else if (csvText) {
    const parsed = parseCsvTable(csvText);
    headers = parsed.headers;
    rows = parsed.rows;
  } else {
    throw new Error('Please upload an Excel (.xlsx) file or provide tabular CSV text.');
  }

  if (headers.length === 0 && rows.length === 0) {
    throw new Error('Spreadsheet contains no data rows.');
  }

  if (onProgress) {
    onProgress({ current: 2, total: 3, stage: 'Formatting and rendering grid PDF pages...', percent: 65 });
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(documentTitle);
  pdfDoc.setProducer('DreamKit Excel to PDF Studio');
  pdfDoc.setCreator('DreamKit');

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;
  const margin = 36;
  const tableWidth = pageWidth - margin * 2;

  const colCount = Math.max(headers.length, ...rows.map((r) => r.length));
  const colWidth = tableWidth / Math.max(1, colCount);
  const rowHeight = 22;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Title
  currentPage.drawText(documentTitle, {
    x: margin,
    y: currentY,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.35)
  });
  currentY -= 26;

  // Function to draw header row
  const drawHeaderRow = (page, y) => {
    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 4,
      width: tableWidth,
      height: rowHeight,
      color: rgb(0.1, 0.16, 0.28)
    });

    for (let c = 0; c < colCount; c++) {
      const text = headers[c] || `Col ${c + 1}`;
      const cellX = margin + c * colWidth + 6;
      page.drawText(String(text).substring(0, 24), {
        x: cellX,
        y: y - 10,
        size: 9,
        font: boldFont,
        color: rgb(1, 1, 1)
      });
    }
  };

  drawHeaderRow(currentPage, currentY);
  currentY -= rowHeight;

  // Draw Data Rows
  for (let r = 0; r < rows.length; r++) {
    if (currentY - rowHeight < margin + 25) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
      drawHeaderRow(currentPage, currentY);
      currentY -= rowHeight;
    }

    const row = rows[r];
    const isZebra = r % 2 === 1;

    // Row Background
    if (isZebra) {
      currentPage.drawRectangle({
        x: margin,
        y: currentY - rowHeight + 4,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.96, 0.98, 1.0)
      });
    }

    // Gridline
    if (showGridlines) {
      currentPage.drawLine({
        start: { x: margin, y: currentY - rowHeight + 4 },
        end: { x: margin + tableWidth, y: currentY - rowHeight + 4 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92)
      });
    }

    // Cell Texts
    for (let c = 0; c < colCount; c++) {
      const val = row[c] !== undefined ? String(row[c]) : '';
      const cellX = margin + c * colWidth + 6;
      currentPage.drawText(val.substring(0, 28), {
        x: cellX,
        y: currentY - 11,
        size: 8.5,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
    }

    currentY -= rowHeight;
  }

  // Stamp Page Numbers
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: pageWidth / 2 - 25,
      y: 16,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45)
    });
  }

  const savedBytes = await pdfDoc.save({ useObjectStreams: true });
  const finalBytes = cloneBuffer(savedBytes);

  return {
    pdfBytes: finalBytes,
    totalPages: pages.length,
    totalRows: rows.length,
    totalCols: colCount,
    totalSize: finalBytes.byteLength,
    formattedSize: formatBytes(finalBytes.byteLength),
    headers,
    rows
  };
}

/* =========================================================================
   8. PDF TO TEXT CONVERTER (.txt)
   ========================================================================= */

export async function convertPdfToText({
  buffer,
  onProgress = null
}) {
  const safeBuffer = cloneBuffer(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const pageTexts = [];
  let totalWordCount = 0;
  let totalCharCount = 0;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({
        current: i,
        total: totalPages,
        stage: `Extracting text from Page ${i} of ${totalPages}...`,
        percent: Math.round((i / totalPages) * 100)
      });
    }

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Group items into vertical lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push(item);
    }

    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines = [];

    for (const y of sortedYs) {
      const items = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const lineStr = items.map((it) => it.str).join(' ').trim();
      if (lineStr) {
        pageLines.push(lineStr);
        totalWordCount += lineStr.split(/\s+/).length;
        totalCharCount += lineStr.length;
      }
    }

    const pageBlock = `=== Page ${i} of ${totalPages} ===\n\n${pageLines.join('\n')}\n`;
    pageTexts.push(pageBlock);
  }

  const fullText = pageTexts.join('\n');
  const lineCount = fullText.split('\n').length;
  const readingTimeMin = Math.max(1, Math.round(totalWordCount / 225));

  return {
    text: fullText,
    wordCount: totalWordCount,
    charCount: totalCharCount,
    lineCount,
    readingTimeMin,
    totalPages
  };
}

/* =========================================================================
   9. PDF TO HTML CONVERTER (.html)
   ========================================================================= */

export async function convertPdfToHtml({
  buffer,
  filename = 'document.pdf',
  onProgress = null
}) {
  const safeBuffer = cloneBuffer(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: toTransferableUint8Array(safeBuffer)
  });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const baseName = getBaseFileName(filename);
  const pageHtmlBlocks = [];
  let totalWordCount = 0;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({
        current: i,
        total: totalPages,
        stage: `Converting Page ${i} of ${totalPages} to HTML...`,
        percent: Math.round((i / totalPages) * 100)
      });
    }

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Group items into vertical lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push(item);
    }

    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const lineElements = [];

    for (const y of sortedYs) {
      const items = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const lineStr = items.map((it) => it.str).join(' ').trim();
      const avgFontSize = items.reduce((acc, it) => acc + (it.height || 10), 0) / items.length;

      if (lineStr) {
        totalWordCount += lineStr.split(/\s+/).length;
        if (avgFontSize >= 16) {
          lineElements.push(`  <h1 class="pdf-h1">${escapeXml(lineStr)}</h1>`);
        } else if (avgFontSize >= 13) {
          lineElements.push(`  <h2 class="pdf-h2">${escapeXml(lineStr)}</h2>`);
        } else {
          lineElements.push(`  <p class="pdf-p">${escapeXml(lineStr)}</p>`);
        }
      }
    }

    const pageHtml = `<!-- Page ${i} -->
<section class="pdf-page" id="page-${i}">
  <div class="pdf-page-header">
    <span class="pdf-page-num">Page ${i} of ${totalPages}</span>
    <span class="pdf-page-title">${escapeXml(baseName)}</span>
  </div>
  <div class="pdf-page-content">
${lineElements.join('\n')}
  </div>
</section>`;

    pageHtmlBlocks.push(pageHtml);
  }

  const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(baseName)} - HTML Export</title>
  <style>
    :root {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --accent: #4f46e5;
      --border: #e2e8f0;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0c1017;
        --card-bg: #111622;
        --text-main: #f1f5f9;
        --text-muted: #94a3b8;
        --accent: #6366f1;
        --border: #1e293b;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.65;
      padding: 40px 20px;
    }
    .pdf-container {
      max-width: 820px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .pdf-page {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .pdf-page-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 24px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .pdf-h1 {
      font-size: 22px;
      font-weight: 800;
      color: var(--accent);
      margin-top: 16px;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    .pdf-h2 {
      font-size: 16px;
      font-weight: 700;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    .pdf-p {
      font-size: 14px;
      margin-bottom: 12px;
      color: var(--text-main);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .pdf-page { border: none; box-shadow: none; page-break-after: always; padding: 20mm; }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
${pageHtmlBlocks.join('\n\n')}
  </div>
</body>
</html>`;

  return {
    html: completeHtml,
    totalPages,
    wordCount: totalWordCount
  };
}

/* =========================================================================
   SAMPLE GENERATORS FOR INSTANT 1-CLICK TESTING
   ========================================================================= */

/**
 * Generate a multi-page test PDF for conversion testing
 */
export async function generateSamplePdfForConversion() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const a4 = [595.28, 841.89];

  // Page 1: Executive Charter
  const p1 = doc.addPage(a4);
  p1.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.08, 0.16, 0.28) });
  p1.drawText('PROJECT APEX: ENTERPRISE CONVERSION ARCHITECTURE', { x: 45, y: 795, size: 15, font: bold, color: rgb(1, 1, 1) });
  p1.drawText('Client-Side Zero-Latency Document Processing Specification', { x: 45, y: 770, size: 10, font, color: rgb(0.8, 0.9, 0.98) });

  p1.drawText('1. Executive Vision & Problem Statement', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.1, 0.2, 0.35) });
  p1.drawText(`Enterprise workflows necessitate high-speed document transformations across image formats,
spreadsheets, and word processing structures. Traditional web solutions route documents to remote
servers, introducing latency and regulatory exposure. DreamKit executes every pipeline locally.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  p1.drawRectangle({ x: 45, y: 480, width: 505, height: 140, color: rgb(0.96, 0.98, 1.0), borderColor: rgb(0.85, 0.9, 0.98), borderWidth: 1 });
  p1.drawText('Transformation Benchmarks', { x: 60, y: 595, size: 11, font: bold, color: rgb(0.1, 0.2, 0.4) });
  p1.drawText('• PDF to High-Res JPG/PNG: Rendered at 150/300 DPI via hardware-accelerated Canvas', { x: 60, y: 565, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p1.drawText('• Image to PDF Compilation: Multi-file losslessly embedded into PDF 1.7 standard', { x: 60, y: 535, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });
  p1.drawText('• Bidirectional Office Pipelines: Full OpenXML .docx and spreadsheet rendering', { x: 60, y: 505, size: 9.5, font, color: rgb(0.35, 0.35, 0.35) });

  // Page 2: Financial Metrics Table
  const p2 = doc.addPage(a4);
  p2.drawRectangle({ x: 0, y: 740, width: 595.28, height: 101.89, color: rgb(0.06, 0.22, 0.15) });
  p2.drawText('SECTION 2: COMPUTATIONAL PERFORMANCE & COST SAVINGS', { x: 45, y: 795, size: 15, font: bold, color: rgb(1, 1, 1) });
  p2.drawText('Resource Utilization Metrics Across Transformation Workloads', { x: 45, y: 770, size: 10, font, color: rgb(0.8, 0.95, 0.85) });

  p2.drawText('Cost & Efficiency Comparison', { x: 45, y: 700, size: 13, font: bold, color: rgb(0.1, 0.2, 0.15) });
  p2.drawText(`Client execution prevents over $18,400 in server compute bills per million operations.
Document transformations occur in real time with immediate user gratification.`, {
    x: 45,
    y: 665,
    size: 10,
    font,
    lineHeight: 16,
    color: rgb(0.3, 0.3, 0.3)
  });

  const bytes = await doc.save({ useObjectStreams: false });
  return {
    name: 'DreamKit_Sample_Conversion_Document.pdf',
    buffer: cloneBuffer(bytes)
  };
}

/**
 * Generate sample CSV text for Excel to PDF testing
 */
export function generateSampleCsv() {
  return `Region,Quarter,Revenue,Expenses,Net Profit,Status
North America,Q1 2026,$4,850,000,$2,910,000,$1,940,000,Exceeded
North America,Q2 2026,$5,220,000,$3,100,000,$2,120,000,Exceeded
Europe & EMEA,Q1 2026,$3,410,000,$2,180,000,$1,230,000,On Target
Europe & EMEA,Q2 2026,$3,780,000,$2,350,000,$1,430,000,Exceeded
Asia Pacific,Q1 2026,$2,950,000,$1,890,000,$1,060,000,On Target
Asia Pacific,Q2 2026,$3,340,000,$2,020,000,$1,320,000,Exceeded
Latin America,Q1 2026,$1,120,000,$780,000,$340,000,Under Review
Latin America,Q2 2026,$1,350,000,$890,000,$460,000,On Target`;
}

/**
 * Generate sample Word text for Word to PDF testing
 */
export function generateSampleWordText() {
  return `DREAMKIT EXECUTIVE PROJECT CHARTER

1. Strategic Directive & Mission
The objective of this software system is to provide private, high-fidelity document conversions completely within modern client web browsers. All parsing and encoding operations run without server-side compute.

2. Architecture & Data Security
By isolating processing in local browser sandbox environments, sensitive organizational records remain strictly on the client workstation. This approach achieves complete GDPR Article 25 and HIPAA Safe Harbor compliance.

3. Performance Benchmarks
- PDF to JPG/PNG: Sub-100ms per page rendering via HTML5 Canvas
- Office & Word Processing: Instant OpenXML serialization
- Tabular Spreadsheets: Auto-aligned vector gridlines with multi-page pagination

4. Executive Approval
Lead Architect: Dr. Marcus Vance, Ph.D.
Status: Validated & Production Ready`;
}

/* =========================================================================
   DOWNLOAD & STORAGE HELPERS
   ========================================================================= */

/**
 * Download a Blob
 */
export function downloadBlob(blob, filename = 'download') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Download PDF bytes
 */
export function downloadPdfBlob(bytes, filename = 'document.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  downloadBlob(blob, filename);
}

/**
 * Open blob in new browser tab
 */
export function openBlobInNewTab(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/**
 * History Management
 */
export function getConverterHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_CONVERTER_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConverterHistory(entry) {
  try {
    const history = getConverterHistory();
    const item = {
      id: generateUniqueId(),
      mode: entry.mode,
      modeLabel: entry.modeLabel,
      inputName: entry.inputName,
      outputName: entry.outputName,
      details: entry.details,
      timestamp: new Date().toISOString()
    };
    const updated = [item, ...history].slice(0, 15);
    localStorage.setItem(STORAGE_CONVERTER_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearConverterHistory() {
  try {
    localStorage.removeItem(STORAGE_CONVERTER_HISTORY_KEY);
  } catch {
    // ignore
  }
}
