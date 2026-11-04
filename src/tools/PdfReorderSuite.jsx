import React, { useState, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Plus,
  Trash2,
  Undo2,
  Download,
  ExternalLink,
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  FileCheck,
  Sliders,
  Hash
} from 'lucide-react';
import {
  cloneBuffer,
  generateUniqueId,
  loadPdfForReorder,
  parseCustomSequence,
  reorderPdf,
  generateSampleReorderPdf,
  downloadPdfBlob,
  openPdfInNewTab,
  getReorderHistory,
  saveReorderHistory,
  clearReorderHistory
} from '../utils/pdfReorderUtils';

export default function PdfReorderSuite({ _theme = 'dark', onNotify }) {
  // --- DOCUMENT & PAGES STATE ---
  const [currentDoc, setCurrentDoc] = useState(null); // { id, name, baseName, size, formattedSize, pageCount, pages: [...], buffer }
  const [pageList, setPageList] = useState([]); // array of page items currently in reorder queue
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    current: 0,
    total: 0,
    stage: '',
    percent: 0
  });
  const [errorMessage, setErrorMessage] = useState(null);

  // --- REORDER CONFIG & CONTROLS ---
  const [outputTitle, setOutputTitle] = useState('Reordered_Document');
  const [customSequenceStr, setCustomSequenceStr] = useState('');
  const [showSequenceInput, setShowSequenceInput] = useState(false);
  const [gridSize, setGridSize] = useState('medium'); // 'small' | 'medium' | 'large'

  // --- PAGE NUMBERING STAMP ---
  const [addPageNumbers, setAddPageNumbers] = useState(false);
  const [pageNumberPos, setPageNumberPos] = useState('bottom_center'); // 'bottom_center' | 'bottom_right' | 'top_right'
  const [pageNumberFormat, setPageNumberFormat] = useState('x_of_y'); // 'x_of_y' | 'x'
  const [showStampOptions, setShowStampOptions] = useState(false);

  // --- RESULTS STATE ---
  const [reorderResult, setReorderResult] = useState(null);

  // --- HISTORY STATE ---
  const [historyList, setHistoryList] = useState(() => getReorderHistory());
  const [showHistory, setShowHistory] = useState(false);

  // --- DRAG & DROP STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Load PDF file
  const handleLoadDocument = async (fileObj, filename = 'document.pdf') => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setReorderResult(null);

      let buffer;
      if (fileObj instanceof ArrayBuffer) {
        buffer = fileObj;
      } else if (fileObj instanceof Blob || fileObj instanceof File) {
        buffer = await fileObj.arrayBuffer();
      } else {
        throw new Error('Unsupported file source.');
      }

      const docInfo = await loadPdfForReorder(
        cloneBuffer(buffer),
        filename,
        (p) => setProgressInfo(p)
      );

      setCurrentDoc(docInfo);
      setPageList(docInfo.pages);
      setOutputTitle(`${docInfo.baseName}_reordered`);
      setCustomSequenceStr(docInfo.pages.map((_, i) => i + 1).join(', '));

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'PDF Loaded',
          message: `Loaded "${filename}" (${docInfo.pageCount} pages, ${docInfo.formattedSize})`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to read PDF document.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Load Failed',
          message: err.message || 'Failed to load PDF document'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Drag & drop file handlers
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await handleLoadDocument(file, file.name);
      } else if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Invalid File',
          message: 'Please drop a valid .pdf file.'
        });
      }
    }
  };

  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await handleLoadDocument(file, file.name);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1-Click Out-of-Order Sample Generator
  const handleLoadSample = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressInfo({ current: 1, total: 1, stage: 'Generating shuffled 5-page presentation deck...', percent: 50 });

      const sample = await generateSampleReorderPdf();
      await handleLoadDocument(sample.buffer, sample.name);

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Sample PDF Loaded',
          message: 'Loaded 5-page shuffled presentation deck. Notice slides are out of order!'
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate sample PDF');
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Reordering Page Items
  const handleMovePage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= pageList.length || fromIndex === toIndex) return;
    setPageList((prev) => {
      const copy = [...prev];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleMoveToStart = (index) => {
    handleMovePage(index, 0);
  };

  const handleMoveToEnd = (index) => {
    handleMovePage(index, pageList.length - 1);
  };

  // Rotate a single page 90 degrees CW
  const handleRotatePage = (index, delta = 90) => {
    setPageList((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, rotation: ((item.rotation || 0) + delta + 360) % 360 }
          : item
      )
    );
  };

  // Duplicate a page
  const handleDuplicatePage = (index) => {
    const original = pageList[index];
    const clone = {
      ...original,
      id: `${original.id}_copy_${generateUniqueId()}`
    };
    setPageList((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, clone);
      return copy;
    });

    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'Page Duplicated',
        message: `Duplicated page ${index + 1}.`
      });
    }
  };

  // Delete a page
  const handleDeletePage = (index) => {
    if (pageList.length <= 1) {
      if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Cannot Delete',
          message: 'Document must contain at least 1 page.'
        });
      }
      return;
    }
    setPageList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Insert a blank page
  const handleInsertBlankPage = (afterIndex = null) => {
    const blankItem = {
      id: `blank_${generateUniqueId()}`,
      originalIndex: -1,
      originalPageNumber: null,
      width: 595,
      height: 842,
      orientation: 'Portrait',
      rotation: 0,
      isBlank: true,
      thumbnail: null
    };

    setPageList((prev) => {
      const copy = [...prev];
      const target = afterIndex === null ? copy.length : afterIndex + 1;
      copy.splice(target, 0, blankItem);
      return copy;
    });

    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'Blank Page Added',
        message: 'Inserted an empty page into document.'
      });
    }
  };

  // Bulk: Reverse all pages
  const handleReverseAll = () => {
    setPageList((prev) => [...prev].reverse());
    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'Order Reversed',
        message: 'Reversed all document pages (Page N to Page 1).'
      });
    }
  };

  // Bulk: Rotate all pages
  const handleRotateAll = (delta = 90) => {
    setPageList((prev) =>
      prev.map((item) => ({
        ...item,
        rotation: ((item.rotation || 0) + delta + 360) % 360
      }))
    );
  };

  // Bulk: Reset order to original
  const handleResetToOriginal = () => {
    if (!currentDoc) return;
    setPageList(currentDoc.pages.map((p) => ({ ...p, rotation: 0 })));
    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'Reset Completed',
        message: 'Reset sequence to original 1..N order.'
      });
    }
  };

  // Apply manual text sequence (e.g. "2, 4, 1, 3, 5")
  const handleApplySequence = () => {
    if (!currentDoc) return;
    const indices = parseCustomSequence(customSequenceStr, currentDoc.pageCount);
    if (indices.length === 0) {
      setErrorMessage('Please enter a valid page sequence like "2, 4, 1, 3, 5".');
      return;
    }

    const newPages = indices.map((idx) => {
      const original = currentDoc.pages[idx];
      return {
        ...original,
        id: `${original.id}_seq_${generateUniqueId()}`,
        rotation: 0
      };
    });

    setPageList(newPages);
    setShowSequenceInput(false);
    setErrorMessage(null);

    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'Sequence Applied',
        message: `Applied sequence of ${newPages.length} pages.`
      });
    }
  };

  // In-grid HTML5 drag and drop between cards
  const handleCardDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCardDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    handleMovePage(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  // Execute Reordering and generate new PDF
  const handleExecuteReorder = async () => {
    if (!currentDoc || pageList.length === 0) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setReorderResult(null);

      const result = await reorderPdf({
        buffer: currentDoc.buffer,
        pageList,
        options: {
          addPageNumbers,
          pageNumberPos,
          pageNumberFormat,
          title: outputTitle.trim() || 'Reordered_Document'
        },
        onProgress: (p) => setProgressInfo(p)
      });

      setReorderResult(result);

      // Save to local history
      saveReorderHistory({
        title: `${outputTitle.trim() || 'Reordered_Document'}.pdf`,
        originalPages: currentDoc.pageCount,
        reorderedPages: result.totalPages,
        totalSize: result.totalSize
      });
      setHistoryList(getReorderHistory());

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Document Reordered',
          message: `Created PDF with ${result.totalPages} pages (${result.formattedSize}) successfully!`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reorder PDF.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Reorder Error',
          message: err.message || 'PDF reordering failed.'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Download PDF
  const handleDownload = () => {
    if (!reorderResult) return;
    const filename = `${outputTitle.trim() || 'reordered_document'}.pdf`;
    downloadPdfBlob(reorderResult.reorderedBytes, filename);
    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'Download Started',
        message: `Downloaded ${filename}`
      });
    }
  };

  // Preview in New Tab
  const handlePreview = () => {
    if (!reorderResult) return;
    openPdfInNewTab(reorderResult.reorderedBytes);
  };

  // Reset file
  const handleResetFile = () => {
    setCurrentDoc(null);
    setPageList([]);
    setReorderResult(null);
    setErrorMessage(null);
  };

  // History Clear
  const handleClearHistory = () => {
    clearReorderHistory();
    setHistoryList([]);
    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'History Cleared',
        message: 'PDF reorder history cleared.'
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Status & Privacy Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            Lossless Engine
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local Browser Processing • 100% In-Browser</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>History ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          HISTORY DRAWER / PANEL
         ========================================================================= */}
      {showHistory && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Page Reorder Tasks
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
              No reorder history recorded yet. Completed document reorders will be logged here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-1.5 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={item.title}>
                    {item.title}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{item.originalPages} pgs → <strong className="text-slate-700 dark:text-slate-300">{item.reorderedPages} pgs</strong></span>
                    <span>{item.formattedSize}</span>
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
          FILE UPLOAD & DROP ZONE (OR COMPACT LOADED FILE BAR)
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!currentDoc ? (
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
              Click to select or drag & drop a PDF document to reorder
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rearrange page sequences, flip upside down pages, remove unwanted pages, or insert blanks.
            </p>

            {/* Quick Sample Trigger */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick test:</span>
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isProcessing}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer transition-colors disabled:opacity-50"
              >
                📄 Load 5-Page Out-of-Order Presentation Deck
              </button>
            </div>
          </div>
        ) : (
          /* Active Document Bar */
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {currentDoc.pages[0]?.thumbnail ? (
                <img
                  src={currentDoc.pages[0].thumbnail}
                  alt="Cover preview"
                  className="w-11 h-15 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-11 h-15 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white block truncate" title={currentDoc.name}>
                  {currentDoc.name}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 flex-wrap">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{currentDoc.formattedSize}</span>
                  <span>•</span>
                  <span>Original: {currentDoc.pageCount} pgs</span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">New: {pageList.length} pgs</span>
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
                onClick={handleResetFile}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                <span>Remove</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteReorder}
                disabled={isProcessing || pageList.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Reordering PDF...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Save Reordered PDF ({pageList.length} Pages)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{progressInfo.stage || 'Reordering pages...'}</span>
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
          REORDER CONTROLS & BULK TOOLBAR
         ========================================================================= */}
      {currentDoc && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleReverseAll}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Reverse entire document"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Reverse All</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotateAll(90)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Rotate all pages 90 degrees clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Rotate All 90°</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertBlankPage(null)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>Insert Blank Page</span>
            </button>

            <button
              type="button"
              onClick={handleResetToOriginal}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Reset order to original"
            >
              <Undo2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Order</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSequenceInput(!showSequenceInput)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Type Sequence</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Size:</span>
            <button
              type="button"
              onClick={() => setGridSize('small')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                gridSize === 'small' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              S
            </button>
            <button
              type="button"
              onClick={() => setGridSize('medium')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                gridSize === 'medium' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              M
            </button>
            <button
              type="button"
              onClick={() => setGridSize('large')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                gridSize === 'large' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              L
            </button>
          </div>
        </div>
      )}

      {/* Manual Sequence Input Bar */}
      {showSequenceInput && currentDoc && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Type custom page order (e.g. "2, 4, 1, 3, 5" or "5-1"):
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Original pages: 1 to {currentDoc.pageCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customSequenceStr}
              onChange={(e) => setCustomSequenceStr(e.target.value)}
              placeholder="e.g. 3, 1, 2, 4, 5"
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleApplySequence}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Apply Order
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          REORDERABLE PAGE GRID
         ========================================================================= */}
      {currentDoc && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Interactive Page Order Sequence ({pageList.length} Pages)</span>
            </h2>
            <span className="text-xs text-slate-400">
              Drag cards or use arrow buttons to move
            </span>
          </div>

          <div
            className={`grid gap-3.5 ${
              gridSize === 'small'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                : gridSize === 'large'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {pageList.map((item, index) => {
              const rotation = item.rotation || 0;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, index)}
                  onDragOver={handleCardDragOver}
                  onDrop={(e) => handleCardDrop(e, index)}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 flex flex-col justify-between space-y-2.5 transition-all hover:border-indigo-400 dark:hover:border-indigo-700 shadow-xs cursor-grab active:cursor-grabbing"
                >
                  {/* Card Header: Position Index + Origin Tag */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold font-mono text-[11px] flex items-center justify-center shadow-xs">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {item.isBlank ? 'Blank Page' : `From Page ${item.originalPageNumber}`}
                      </span>
                    </div>

                    {rotation !== 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                        {rotation}° CW
                      </span>
                    )}
                  </div>

                  {/* Thumbnail viewport */}
                  <div className="relative aspect-[1/1.3] w-full rounded-lg bg-white overflow-hidden shadow-inner flex items-center justify-center border border-slate-200/60">
                    {item.isBlank ? (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <FileText className="w-8 h-8 opacity-25" />
                        <span className="text-[11px] mt-1 font-semibold text-slate-400">Blank Page</span>
                        <span className="text-[9px] text-slate-300">595 × 842 pt</span>
                      </div>
                    ) : item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={`Page ${item.originalPageNumber}`}
                        style={{ transform: `rotate(${rotation}deg)` }}
                        className="w-full h-full object-contain transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6 opacity-40" />
                        <span className="text-[10px] mt-1">Page {item.originalPageNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Move, Rotate, Duplicate, Remove */}
                  <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-1 text-slate-600 dark:text-slate-400">
                    {/* Navigation buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveToStart(index)}
                        disabled={index === 0}
                        title="Move to first position"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMovePage(index, index - 1)}
                        disabled={index === 0}
                        title="Move left"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMovePage(index, index + 1)}
                        disabled={index === pageList.length - 1}
                        title="Move right"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveToEnd(index)}
                        disabled={index === pageList.length - 1}
                        title="Move to last position"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Transform buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRotatePage(index, -90)}
                        title="Rotate CCW 90°"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRotatePage(index, 90)}
                        title="Rotate CW 90°"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicatePage(index)}
                        title="Duplicate this page"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePage(index)}
                        title="Remove page"
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          OUTPUT SETTINGS & STAMPING OPTIONS
         ========================================================================= */}
      {currentDoc && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Export Settings & Output Configuration</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Filename input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Output File Name
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={outputTitle}
                  onChange={(e) => setOutputTitle(e.target.value)}
                  placeholder="Reordered_Document"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-400 font-mono">.pdf</span>
              </div>
            </div>

            {/* Page Numbering Stamp Toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sequential Page Numbers</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowStampOptions(!showStampOptions)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer"
                >
                  {showStampOptions ? 'Hide Options' : 'Customize Position'}
                </button>
              </div>

              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addPageNumbers}
                  onChange={(e) => setAddPageNumbers(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Stamp new sequential numbers on all pages
                </span>
              </label>
            </div>
          </div>

          {/* Stamp Options Panel */}
          {addPageNumbers && showStampOptions && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Position</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'bottom_center', label: 'Bottom Center' },
                    { id: 'bottom_right', label: 'Bottom Right' },
                    { id: 'top_right', label: 'Top Right' }
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPageNumberPos(pos.id)}
                      className={`flex-1 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                        pageNumberPos === pos.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Format</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'x_of_y', label: 'Page 1 of 5' },
                    { id: 'x', label: 'Simple (1, 2, 3)' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setPageNumberFormat(fmt.id)}
                      className={`flex-1 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                        pageNumberFormat === fmt.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          RESULTS DASHBOARD (AFTER SUCCESSFUL REORDER)
         ========================================================================= */}
      {reorderResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Pages
              </span>
              <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {reorderResult.totalPages}
              </p>
              <span className="text-[10px] text-slate-400">From {currentDoc?.pageCount} source pages</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Source Size
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {currentDoc?.formattedSize}
              </p>
              <span className="text-[10px] text-slate-400">Original input file</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Reordered File Size
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {reorderResult.formattedSize}
              </p>
              <span className="text-[10px] text-slate-400">Lossless object streams</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 space-y-1">
              <span className="text-[11px] font-semibold text-indigo-100 uppercase tracking-wider block">
                Document Status
              </span>
              <p className="text-2xl font-black font-mono">
                Ready!
              </p>
              <span className="text-[10px] text-indigo-100 font-medium">100% Client-Side Pure</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Document pages reorganized successfully! Preview the result or save to your device.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePreview}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Reordered PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
