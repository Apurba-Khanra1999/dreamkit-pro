import React, { useState, useRef } from 'react';
import {
  ArrowLeftRight,
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
  Upload,
  Download,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  FileCheck,
  Sliders,
  Copy,
  ExternalLink,
  Trash2,
  Archive,
  Eye,
  Code,
  ArrowUp,
  ArrowDown,
  Plus
} from 'lucide-react';
import {
  cloneBuffer,
  formatBytes,
  convertPdfToJpg,
  convertPdfToPng,
  convertImagesToPdf,
  convertWordToPdf,
  convertPdfToWord,
  convertExcelToPdf,
  convertPdfToText,
  convertPdfToHtml,
  generateSamplePdfForConversion,
  generateSampleCsv,
  generateSampleWordText,
  downloadBlob,
  downloadPdfBlob,
  openBlobInNewTab,
  getConverterHistory,
  saveConverterHistory,
  clearConverterHistory
} from '../utils/pdfConverterUtils';
import { createZipArchive } from '../utils/imageCompressorUtils';

export default function PdfConverterSuite({ _theme = 'dark', initialMode = 'pdf_to_jpg', onNotify }) {
  // Modes:
  // 'pdf_to_jpg' | 'pdf_to_png' | 'jpg_to_pdf' | 'png_to_pdf' | 'word_to_pdf' |
  // 'pdf_to_word' | 'excel_to_pdf' | 'pdf_to_text' | 'pdf_to_html'
  const [activeMode, setActiveMode] = useState(
    initialMode && initialMode !== 'pdf_converter' ? initialMode : 'pdf_to_jpg'
  );

  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    if (initialMode && initialMode !== 'pdf_converter') {
      setActiveMode(initialMode);
    }
  }

  // Input states
  const [loadedFile, setLoadedFile] = useState(null); // { name, size, formattedSize, buffer, rawFile }
  const [imageQueue, setImageQueue] = useState([]); // for image to pdf: [{ id, name, size, buffer, previewUrl }]
  const [textInput, setTextInput] = useState(''); // for text/csv fallback
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 0, stage: '', percent: 0 });
  const [errorMessage, setErrorMessage] = useState(null);

  // Mode Options
  const [dpi, setDpi] = useState(150); // 72, 150, 300
  const [jpegQuality, setJpegQuality] = useState(90); // 50 - 100
  const [transparentPng, setTransparentPng] = useState(false);
  const [pageSize, setPageSize] = useState('A4'); // 'A4', 'Letter', 'fit'
  const [orientation, setOrientation] = useState('auto'); // 'auto', 'portrait', 'landscape'
  const [margin, setMargin] = useState(18); // 0, 18, 36
  const [documentTitle, setDocumentTitle] = useState('Converted_Document');
  const [showGridlines, setShowGridlines] = useState(true);

  // Results State
  const [conversionResult, setConversionResult] = useState(null);
  const [previewTab, setPreviewTab] = useState('render'); // 'render' | 'code' for HTML/text
  const [copied, setCopied] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState(() => getConverterHistory());
  const [showHistory, setShowHistory] = useState(false);

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const CONVERTER_MODES = [
    { id: 'pdf_to_jpg', label: 'PDF to JPG', category: 'PDF to Image', icon: Image, badge: 'Popular' },
    { id: 'pdf_to_png', label: 'PDF to PNG', category: 'PDF to Image', icon: Image, badge: 'Lossless' },
    { id: 'jpg_to_pdf', label: 'JPG to PDF', category: 'Image to PDF', icon: FileText, badge: 'Multi-file' },
    { id: 'png_to_pdf', label: 'PNG to PDF', category: 'Image to PDF', icon: FileText, badge: 'Multi-file' },
    { id: 'word_to_pdf', label: 'Word to PDF', category: 'Office to PDF', icon: FileText, badge: '.docx' },
    { id: 'pdf_to_word', label: 'PDF to Word', category: 'PDF to Office', icon: FileText, badge: '.docx' },
    { id: 'excel_to_pdf', label: 'Excel to PDF', category: 'Office to PDF', icon: FileSpreadsheet, badge: '.xlsx' },
    { id: 'pdf_to_text', label: 'PDF to Text', category: 'PDF to Text', icon: FileText, badge: '.txt' },
    { id: 'pdf_to_html', label: 'PDF to HTML', category: 'PDF to Code', icon: FileCode, badge: '.html' }
  ];

  // Reset inputs when switching mode
  const handleSwitchMode = (modeId) => {
    setActiveMode(modeId);
    setLoadedFile(null);
    setImageQueue([]);
    setTextInput('');
    setConversionResult(null);
    setErrorMessage(null);
    setCopied(false);
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (activeMode === 'jpg_to_pdf' || activeMode === 'png_to_pdf') {
      // Append to image queue
      const newItems = [];
      for (const f of files) {
        const buf = await f.arrayBuffer();
        newItems.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          size: f.size,
          formattedSize: formatBytes(f.size),
          buffer: cloneBuffer(buf),
          previewUrl: URL.createObjectURL(f)
        });
      }
      setImageQueue((prev) => [...prev, ...newItems]);
      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Images Added',
          message: `Added ${newItems.length} images to queue.`
        });
      }
    } else {
      const f = files[0];
      const buf = await f.arrayBuffer();
      setLoadedFile({
        name: f.name,
        size: f.size,
        formattedSize: formatBytes(f.size),
        buffer: cloneBuffer(buf),
        rawFile: f
      });
      setDocumentTitle(f.name.replace(/\.[^/.]+$/, ''));
      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'File Loaded',
          message: `Loaded "${f.name}" (${formatBytes(f.size)})`
        });
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    if (activeMode === 'jpg_to_pdf' || activeMode === 'png_to_pdf') {
      const newItems = [];
      for (const f of files) {
        const buf = await f.arrayBuffer();
        newItems.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          size: f.size,
          formattedSize: formatBytes(f.size),
          buffer: cloneBuffer(buf),
          previewUrl: URL.createObjectURL(f)
        });
      }
      setImageQueue((prev) => [...prev, ...newItems]);
    } else {
      const f = files[0];
      const buf = await f.arrayBuffer();
      setLoadedFile({
        name: f.name,
        size: f.size,
        formattedSize: formatBytes(f.size),
        buffer: cloneBuffer(buf),
        rawFile: f
      });
      setDocumentTitle(f.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // Load sample data based on active mode
  const handleLoadSample = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setConversionResult(null);

      if (['pdf_to_jpg', 'pdf_to_png', 'pdf_to_word', 'pdf_to_text', 'pdf_to_html'].includes(activeMode)) {
        const sample = await generateSamplePdfForConversion();
        setLoadedFile({
          name: sample.name,
          size: sample.buffer.byteLength,
          formattedSize: formatBytes(sample.buffer.byteLength),
          buffer: sample.buffer
        });
        setDocumentTitle(sample.name.replace(/\.[^/.]+$/, ''));
      } else if (activeMode === 'jpg_to_pdf' || activeMode === 'png_to_pdf') {
        // Create 2 test canvases as sample images
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('Sample Presentation Slide 1', 60, 100);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.fillText('Generated test image for Image to PDF conversion', 60, 160);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const buf = await blob.arrayBuffer();

        setImageQueue([
          {
            id: 'sample_img_1',
            name: 'sample_slide_1.jpg',
            size: blob.size,
            formattedSize: formatBytes(blob.size),
            buffer: cloneBuffer(buf),
            previewUrl: dataUrl
          }
        ]);
      } else if (activeMode === 'word_to_pdf') {
        const text = generateSampleWordText();
        setTextInput(text);
        setDocumentTitle('Executive_Project_Charter');
      } else if (activeMode === 'excel_to_pdf') {
        const csv = generateSampleCsv();
        setTextInput(csv);
        setDocumentTitle('Quarterly_Financial_Report');
      }

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Sample Data Loaded',
          message: 'Loaded sample document for testing.'
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load sample');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run the Conversion!
  const handleExecuteConvert = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setConversionResult(null);

      const modeObj = CONVERTER_MODES.find((m) => m.id === activeMode);

      switch (activeMode) {
        case 'pdf_to_jpg': {
          if (!loadedFile) throw new Error('Please select a PDF file first.');
          const res = await convertPdfToJpg({
            buffer: loadedFile.buffer,
            dpi,
            quality: jpegQuality / 100,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({ type: 'images', format: 'jpg', pages: res.pages, totalPages: res.totalPages });
          break;
        }

        case 'pdf_to_png': {
          if (!loadedFile) throw new Error('Please select a PDF file first.');
          const res = await convertPdfToPng({
            buffer: loadedFile.buffer,
            dpi,
            transparentBg: transparentPng,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({ type: 'images', format: 'png', pages: res.pages, totalPages: res.totalPages });
          break;
        }

        case 'jpg_to_pdf':
        case 'png_to_pdf': {
          if (imageQueue.length === 0) throw new Error('Please add at least one image to queue.');
          const res = await convertImagesToPdf({
            imageFiles: imageQueue,
            pageSize,
            orientation,
            margin,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({ type: 'pdf', bytes: res.pdfBytes, totalPages: res.totalPages, formattedSize: res.formattedSize });
          break;
        }

        case 'word_to_pdf': {
          const res = await convertWordToPdf({
            docxBuffer: loadedFile ? loadedFile.buffer : null,
            textContent: textInput,
            documentTitle: documentTitle || 'Converted Document',
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({ type: 'pdf', bytes: res.pdfBytes, totalPages: res.totalPages, formattedSize: res.formattedSize });
          break;
        }

        case 'pdf_to_word': {
          if (!loadedFile) throw new Error('Please select a PDF file first.');
          const res = await convertPdfToWord({
            buffer: loadedFile.buffer,
            filename: loadedFile.name,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({
            type: 'word',
            docxBlob: res.docxBlob,
            docBlob: res.docBlob,
            docxFilename: res.docxFilename,
            docFilename: res.docFilename,
            paragraphs: res.extractedParagraphs,
            wordCount: res.wordCount,
            totalPages: res.totalPages
          });
          break;
        }

        case 'excel_to_pdf': {
          const res = await convertExcelToPdf({
            xlsxBuffer: loadedFile ? loadedFile.buffer : null,
            csvText: textInput,
            documentTitle: documentTitle || 'Spreadsheet Report',
            orientation,
            showGridlines,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({
            type: 'excel_pdf',
            bytes: res.pdfBytes,
            totalPages: res.totalPages,
            totalRows: res.totalRows,
            totalCols: res.totalCols,
            formattedSize: res.formattedSize,
            headers: res.headers,
            rows: res.rows
          });
          break;
        }

        case 'pdf_to_text': {
          if (!loadedFile) throw new Error('Please select a PDF file first.');
          const res = await convertPdfToText({
            buffer: loadedFile.buffer,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({
            type: 'text',
            text: res.text,
            wordCount: res.wordCount,
            charCount: res.charCount,
            lineCount: res.lineCount,
            readingTimeMin: res.readingTimeMin,
            totalPages: res.totalPages
          });
          break;
        }

        case 'pdf_to_html': {
          if (!loadedFile) throw new Error('Please select a PDF file first.');
          const res = await convertPdfToHtml({
            buffer: loadedFile.buffer,
            filename: loadedFile.name,
            onProgress: (p) => setProgressInfo(p)
          });
          setConversionResult({
            type: 'html',
            html: res.html,
            totalPages: res.totalPages,
            wordCount: res.wordCount
          });
          break;
        }

        default:
          break;
      }

      // Save to local history
      saveConverterHistory({
        mode: activeMode,
        modeLabel: modeObj?.label || activeMode,
        inputName: loadedFile ? loadedFile.name : (imageQueue.length > 0 ? `${imageQueue.length} Images` : 'Custom Text'),
        outputName: `${documentTitle || 'converted_document'}`,
        details: 'Conversion completed successfully'
      });
      setHistoryList(getConverterHistory());

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Conversion Complete',
          message: `Successfully executed ${modeObj?.label || 'conversion'}.`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Conversion failed.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Conversion Error',
          message: err.message || 'Operation failed'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Download all pages as ZIP (for PDF to Image)
  const handleDownloadAllZip = async () => {
    if (!conversionResult || !conversionResult.pages) return;
    try {
      const zipItems = conversionResult.pages.map((p) => ({
        name: p.filename,
        blob: p.blob
      }));
      const zipBlob = await createZipArchive(zipItems);
      const zipName = `${documentTitle || 'document'}_${conversionResult.format}_pages.zip`;
      downloadBlob(zipBlob, zipName);
      if (onNotify) {
        onNotify({ type: 'success', title: 'ZIP Downloaded', message: `Downloaded ${zipItems.length} pages in ZIP.` });
      }
    } catch (err) {
      if (onNotify) {
        onNotify({ type: 'error', title: 'ZIP Error', message: err.message });
      }
    }
  };

  // Copy text/HTML to clipboard
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onNotify) {
      onNotify({ type: 'success', title: 'Copied', message: 'Copied to clipboard.' });
    }
  };

  // Clear History
  const handleClearHistory = () => {
    clearConverterHistory();
    setHistoryList([]);
    if (onNotify) {
      onNotify({ type: 'info', title: 'History Cleared', message: 'Converter history cleared.' });
    }
  };

  const currentModeObj = CONVERTER_MODES.find((m) => m.id === activeMode);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          MODULE HEADER
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Universal PDF Converter Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                9 Engines Built-In
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bidirectional conversion between PDF, JPG, PNG, Word (.docx), Excel (.xlsx), Plain Text, and HTML with zero server uploads.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History ({historyList.length})</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-Side Pure</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HISTORY DRAWER
         ========================================================================= */}
      {showHistory && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Document Conversions
              </h3>
            </div>
            {historyList.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No conversion history recorded yet. Executed document conversions will appear here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={item.inputName}>
                      {item.inputName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium shrink-0">
                      {item.modeLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CONVERSION MODE PICKER TABS (9 BIDIRECTIONAL ENGINES)
         ========================================================================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Select Conversion Engine ({CONVERTER_MODES.length} Available)</span>
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            Active: {currentModeObj?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {CONVERTER_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSwitchMode(mode.id)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                  isActive
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold block leading-tight">
                  {mode.label}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono">
                  {mode.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          FILE UPLOAD / INPUT PANEL
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={
            activeMode === 'jpg_to_pdf'
              ? '.jpg,.jpeg,image/jpeg'
              : activeMode === 'png_to_pdf'
              ? '.png,image/png'
              : activeMode === 'word_to_pdf'
              ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : activeMode === 'excel_to_pdf'
              ? '.xlsx,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : '.pdf,application/pdf'
          }
          multiple={activeMode === 'jpg_to_pdf' || activeMode === 'png_to_pdf'}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Empty Dropzone */}
        {(!loadedFile && imageQueue.length === 0 && !textInput) ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs border border-indigo-200 dark:border-indigo-900/60">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeMode === 'jpg_to_pdf'
                ? 'Drop JPG Images or click to select'
                : activeMode === 'png_to_pdf'
                ? 'Drop PNG Images or click to select'
                : activeMode === 'word_to_pdf'
                ? 'Drop Word (.docx) Document or click to browse'
                : activeMode === 'excel_to_pdf'
                ? 'Drop Excel (.xlsx / .csv) Spreadsheet or click to browse'
                : 'Drop your PDF file here or click to browse'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentModeObj?.label} • 100% private in-browser client execution.
            </p>

            {/* Quick Sample Chip */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant test:</span>
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isProcessing}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer transition-colors disabled:opacity-50"
              >
                📄 Load 1-Click Sample File for {currentModeObj?.label}
              </button>
            </div>
          </div>
        ) : (
          /* Active Document / Input Header Bar */
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-14 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>

              <div className="space-y-1 min-w-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                  {loadedFile ? loadedFile.name : (imageQueue.length > 0 ? `${imageQueue.length} Images in Queue` : 'Text / Tabular Data Input')}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 flex-wrap">
                  {loadedFile && <span>Size: {loadedFile.formattedSize}</span>}
                  {imageQueue.length > 0 && <span>{imageQueue.length} image files ready</span>}
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{currentModeObj?.label}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoadedFile(null);
                  setImageQueue([]);
                  setTextInput('');
                  setConversionResult(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                <span>Remove</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteConvert}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Convert Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Multi-Image Queue Controls (For JPG/PNG to PDF) */}
        {(activeMode === 'jpg_to_pdf' || activeMode === 'png_to_pdf') && imageQueue.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Image Compilation Queue ({imageQueue.length})
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Images</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {imageQueue.map((item, idx) => (
                <div key={item.id} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1 relative group">
                  <div className="aspect-[4/3] rounded-lg bg-white overflow-hidden flex items-center justify-center border border-slate-200/60">
                    <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {idx + 1}. {item.name}
                  </span>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{item.formattedSize}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx <= 0) return;
                          setImageQueue((prev) => {
                            const c = [...prev];
                            const t = c[idx - 1];
                            c[idx - 1] = c[idx];
                            c[idx] = t;
                            return c;
                          });
                        }}
                        disabled={idx === 0}
                        className="hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx >= imageQueue.length - 1) return;
                          setImageQueue((prev) => {
                            const c = [...prev];
                            const t = c[idx + 1];
                            c[idx + 1] = c[idx];
                            c[idx] = t;
                            return c;
                          });
                        }}
                        disabled={idx === imageQueue.length - 1}
                        className="hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageQueue((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text/CSV Input Area (For Word to PDF / Excel to PDF fallback) */}
        {(activeMode === 'word_to_pdf' || activeMode === 'excel_to_pdf') && !loadedFile && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Or paste / edit {activeMode === 'word_to_pdf' ? 'document text' : 'CSV tabular data'} directly:
            </label>
            <textarea
              rows={5}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={activeMode === 'word_to_pdf' ? 'Paste headings and paragraphs here...' : 'Region,Quarter,Revenue,Profit\nNorth,Q1,$100k,$40k\nSouth,Q1,$90k,$35k'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Live Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{progressInfo.stage || 'Executing conversion...'}</span>
              </span>
              <span className="font-mono">{progressInfo.percent}%</span>
            </div>
            <div className="w-full h-2 bg-indigo-200 dark:bg-indigo-900/60 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressInfo.percent}%` }}
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODE-SPECIFIC TUNING OPTIONS CARD
         ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>Conversion Parameters & Quality Tuning</span>
        </h2>

        {/* PDF to JPG / PNG Options */}
        {(activeMode === 'pdf_to_jpg' || activeMode === 'pdf_to_png') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Render Resolution (DPI)</span>
              <div className="flex items-center gap-1.5">
                {[
                  { d: 72, label: '72 DPI (Screen)' },
                  { d: 150, label: '150 DPI (Balanced)' },
                  { d: 300, label: '300 DPI (Print HD)' }
                ].map((item) => (
                  <button
                    key={item.d}
                    type="button"
                    onClick={() => setDpi(item.d)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      dpi === item.d
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {activeMode === 'pdf_to_jpg' && (
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>JPEG Quality</span>
                  <span className="font-mono text-indigo-600">{jpegQuality}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            )}

            {activeMode === 'pdf_to_png' && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Background Transparency</span>
                <label className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparentPng}
                    onChange={(e) => setTransparentPng(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Preserve Transparent Canvas</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* JPG / PNG to PDF Options */}
        {(activeMode === 'jpg_to_pdf' || activeMode === 'png_to_pdf') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Target Page Size</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'A4', label: 'A4 Standard' },
                  { id: 'Letter', label: 'US Letter' },
                  { id: 'fit', label: 'Fit Image Size' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPageSize(s.id)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      pageSize === s.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Orientation</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'auto', label: 'Auto Detect' },
                  { id: 'portrait', label: 'Portrait' },
                  { id: 'landscape', label: 'Landscape' }
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOrientation(o.id)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      orientation === o.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Margins</span>
              <div className="flex items-center gap-1.5">
                {[
                  { m: 0, label: 'None (0pt)' },
                  { m: 18, label: 'Small (18pt)' },
                  { m: 36, label: 'Normal (36pt)' }
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => setMargin(item.m)}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      margin === item.m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Word / Excel Output Title & Orientation Options */}
        {(activeMode === 'word_to_pdf' || activeMode === 'excel_to_pdf' || activeMode === 'pdf_to_word') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Document Title
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Document Title"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {activeMode === 'excel_to_pdf' && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Table Orientation & Grid</span>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="excel_orient"
                      checked={orientation === 'landscape'}
                      onChange={() => setOrientation('landscape')}
                      className="text-indigo-600"
                    />
                    <span>Landscape (Recommended for wide tables)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGridlines}
                      onChange={(e) => setShowGridlines(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Cell Gridlines</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleExecuteConvert}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Execute {currentModeObj?.label}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          CONVERSION RESULTS DASHBOARD
         ========================================================================= */}
      {conversionResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* 1. PDF to Images (JPG or PNG) Results */}
          {conversionResult.type === 'images' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Rendered {conversionResult.pages.length} {conversionResult.format.toUpperCase()} Image Pages</span>
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    Resolution: {dpi} DPI • Format: {conversionResult.format.toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Download All as ZIP</span>
                </button>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {conversionResult.pages.map((p) => (
                  <div key={p.pageNumber} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                    <div className="aspect-[1/1.3] rounded-lg bg-white overflow-hidden flex items-center justify-center border border-slate-200/60 shadow-xs">
                      <img src={p.dataUrl} alt={`Page ${p.pageNumber}`} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between text-xs px-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Page {p.pageNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.formattedSize}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadBlob(p.blob, p.filename)}
                      className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PDF Output Results (From JPG/PNG/Word/Excel to PDF) */}
          {(conversionResult.type === 'pdf' || conversionResult.type === 'excel_pdf') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Pages</span>
                  <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{conversionResult.totalPages}</p>
                  <span className="text-[10px] text-slate-400">PDF document pages</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Generated Size</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{conversionResult.formattedSize}</p>
                  <span className="text-[10px] text-slate-400">Lossless object stream</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Standard</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">PDF 1.7</p>
                  <span className="text-[10px] text-slate-400">Vector & text fidelity</span>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-100 uppercase tracking-wider block">Status</span>
                  <p className="text-2xl font-black font-mono">Ready!</p>
                  <span className="text-[10px] text-indigo-100 font-medium">100% Client-Side Pure</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>PDF generation complete! Preview in new tab or download directly.</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([conversionResult.bytes], { type: 'application/pdf' });
                      openBlobInNewTab(blob);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPdfBlob(conversionResult.bytes, `${documentTitle || 'converted_document'}.pdf`)}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. PDF to Word (.docx & .doc) Results */}
          {conversionResult.type === 'word' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>PDF Converted to Microsoft Word Document</span>
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    {conversionResult.totalPages} Pages • {conversionResult.wordCount} Words • Standard OpenXML
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadBlob(conversionResult.docBlob, conversionResult.docFilename)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .doc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBlob(conversionResult.docxBlob, conversionResult.docxFilename)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .docx</span>
                  </button>
                </div>
              </div>

              {/* Formatted Text Preview */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 max-h-72 overflow-y-auto space-y-2 text-xs">
                {conversionResult.paragraphs.map((p, idx) => (
                  <p key={idx} className={p.isHeading ? 'font-bold text-slate-900 dark:text-white pt-2 text-sm' : 'text-slate-700 dark:text-slate-300 leading-relaxed'}>
                    {p.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 4. PDF to Text (.txt) Results */}
          {conversionResult.type === 'text' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                  <span><strong>{conversionResult.wordCount}</strong> words</span>
                  <span>•</span>
                  <span><strong>{conversionResult.charCount}</strong> characters</span>
                  <span>•</span>
                  <span><strong>{conversionResult.lineCount}</strong> lines</span>
                  <span>•</span>
                  <span>~{conversionResult.readingTimeMin} min read</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(conversionResult.text)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([conversionResult.text], { type: 'text/plain;charset=utf-8' });
                      downloadBlob(blob, `${documentTitle || 'document'}.txt`);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                rows={12}
                value={conversionResult.text}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none"
              />
            </div>
          )}

          {/* 5. PDF to HTML (.html) Results */}
          {conversionResult.type === 'html' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('render')}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      previewTab === 'render' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Rendered View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('code')}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      previewTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>HTML Source</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(conversionResult.html)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([conversionResult.html], { type: 'text/html;charset=utf-8' });
                      downloadBlob(blob, `${documentTitle || 'document'}.html`);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .html</span>
                  </button>
                </div>
              </div>

              {previewTab === 'render' ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-96 bg-white">
                  <iframe
                    title="Rendered HTML"
                    srcDoc={conversionResult.html}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <textarea
                  readOnly
                  rows={14}
                  value={conversionResult.html}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
