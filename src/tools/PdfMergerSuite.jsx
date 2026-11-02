import React, { useState, useRef, useMemo } from 'react';
import {
  Files,
  FileText,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Download,
  ExternalLink,
  RefreshCw,
  FileCheck,
  Sliders,
  History,
  Hash,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  formatBytes,
  cloneBuffer,
  loadPdfFileInfo,
  getSelectedPageCount,
  mergePdfs,
  generateSamplePdfs,
  downloadPdfBlob,
  openPdfInNewTab,
  getMergeHistory,
  saveMergeHistory,
  clearMergeHistory
} from '../utils/pdfMergerUtils';

export default function PdfMergerSuite({ _theme = 'dark', onNotify }) {
  // --- QUEUE & DOCUMENT STATE ---
  const [fileList, setFileList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    current: 0,
    total: 0,
    stage: '',
    percent: 0
  });
  const [errorMessage, setErrorMessage] = useState(null);

  // --- MERGE OPTIONS STATE ---
  const [outputTitle, setOutputTitle] = useState('Merged_Document');
  const [addPageNumbers, setAddPageNumbers] = useState(false);
  const [pageNumberPos, setPageNumberPos] = useState('bottom_center'); // 'bottom_center' | 'bottom_right' | 'top_right'
  const [pageNumberFormat, setPageNumberFormat] = useState('x_of_y'); // 'x_of_y' | 'x'
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // --- RESULT STATE ---
  const [mergeResult, setMergeResult] = useState(null);

  // --- HISTORY & DRAWER STATE ---
  const [historyList, setHistoryList] = useState(() => getMergeHistory());
  const [showHistory, setShowHistory] = useState(false);

  // --- DRAG & DROP STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Add multiple files to queue
  const handleAddFiles = async (filesToAdd) => {
    if (!filesToAdd || filesToAdd.length === 0) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const newItems = [];

      for (let i = 0; i < filesToAdd.length; i++) {
        const file = filesToAdd[i];
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          continue;
        }
        setProgressInfo({
          current: i + 1,
          total: filesToAdd.length,
          stage: `Reading "${file.name}"...`,
          percent: Math.round(((i + 1) / filesToAdd.length) * 100)
        });

        const buffer = await file.arrayBuffer();
        const info = await loadPdfFileInfo(cloneBuffer(buffer), file.name);
        newItems.push(info);
      }

      if (newItems.length > 0) {
        setFileList((prev) => [...prev, ...newItems]);
        if (onNotify) {
          onNotify({
            type: 'success',
            title: 'Files Added',
            message: `Added ${newItems.length} PDF ${newItems.length === 1 ? 'file' : 'files'} to merge queue.`
          });
        }
      } else {
        if (onNotify) {
          onNotify({
            type: 'warning',
            title: 'No Valid PDFs',
            message: 'Please select valid .pdf files.'
          });
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to read one or more PDF documents.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Import Failed',
          message: err.message || 'Failed to load PDF documents'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // File Input Change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    handleAddFiles(files);
    e.target.value = '';
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    handleAddFiles(files);
  };

  // Load 3 Sample Documents
  const handleLoadSamples = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressInfo({ current: 1, total: 3, stage: 'Generating 3 sample documents...', percent: 50 });

      const sampleDocs = await generateSamplePdfs();
      const loadedItems = [];

      for (let i = 0; i < sampleDocs.length; i++) {
        const item = await loadPdfFileInfo(cloneBuffer(sampleDocs[i].buffer), sampleDocs[i].name);
        loadedItems.push(item);
      }

      setFileList((prev) => [...prev, ...loadedItems]);
      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Samples Loaded',
          message: 'Loaded 3 sample PDFs (Proposal, Budget & Appendix) into the queue.'
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate sample PDFs');
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Reorder queue: Move item up
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setFileList((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Reorder queue: Move item down
  const handleMoveDown = (index) => {
    if (index >= fileList.length - 1) return;
    setFileList((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Rotate item 90 degrees clockwise
  const handleRotate = (id) => {
    setFileList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  // Update custom page range for a file
  const handlePageRangeChange = (id, newRange) => {
    setFileList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pageRange: newRange } : item))
    );
  };

  // Remove file from queue
  const handleRemoveFile = (id) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear entire queue
  const handleClearAll = () => {
    setFileList([]);
    setMergeResult(null);
    setErrorMessage(null);
    if (onNotify) {
      onNotify({
        type: 'info',
        title: 'Queue Cleared',
        message: 'All files removed from queue.'
      });
    }
  };

  // Sort queue by name or size
  const handleSort = (type) => {
    setFileList((prev) => {
      const copy = [...prev];
      if (type === 'name') {
        copy.sort((a, b) => a.name.localeCompare(b.name));
      } else if (type === 'size') {
        copy.sort((a, b) => b.size - a.size);
      } else if (type === 'reverse') {
        copy.reverse();
      }
      return copy;
    });
  };

  // Queue Totals Calculation
  const queueSummary = useMemo(() => {
    let totalOutputPages = 0;
    let totalInputBytes = 0;

    for (const f of fileList) {
      totalOutputPages += getSelectedPageCount(f);
      totalInputBytes += f.size;
    }

    return {
      fileCount: fileList.length,
      totalOutputPages,
      totalInputBytes,
      formattedInputSize: formatBytes(totalInputBytes)
    };
  }, [fileList]);

  // Run Merge Operation
  const handleExecuteMerge = async () => {
    if (fileList.length === 0) {
      if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'Empty Queue',
          message: 'Please add at least one PDF file to merge.'
        });
      }
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const result = await mergePdfs({
        files: fileList,
        options: {
          title: outputTitle.trim() || 'Merged Document',
          addPageNumbers,
          pageNumberPos,
          pageNumberFormat
        },
        onProgress: (prog) => {
          setProgressInfo(prog);
        }
      });

      setMergeResult(result);

      // Save to local merge history
      saveMergeHistory({
        title: `${outputTitle.trim() || 'Merged_Document'}.pdf`,
        fileCount: fileList.length,
        totalPages: result.totalPages,
        totalSize: result.totalSize
      });
      setHistoryList(getMergeHistory());

      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'Merge Complete',
          message: `Successfully consolidated ${fileList.length} documents into ${result.totalPages} pages (${result.formattedSize})!`
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to merge documents.');
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Merge Failed',
          message: err.message || 'Document merge failed'
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo({ current: 0, total: 0, stage: '', percent: 0 });
    }
  };

  // Download Output PDF
  const handleDownload = () => {
    if (!mergeResult) return;
    const filename = `${outputTitle.trim() || 'Merged_Document'}.pdf`;
    downloadPdfBlob(mergeResult.mergedBytes, filename);
    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'Download Started',
        message: `Downloaded ${filename}`
      });
    }
  };

  // Preview Merged PDF in New Tab
  const handlePreview = () => {
    if (!mergeResult) return;
    openPdfInNewTab(mergeResult.mergedBytes);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          MODULE HEADER
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                PDF Merger Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Lossless Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Combine, organize, and stamp multiple PDF documents into a single consolidated file with custom page ranges and rotation.
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
            <span>Local Browser Processing</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILE UPLOAD & DROP ZONE
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
        >
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs border border-indigo-200 dark:border-indigo-900/60">
            <Upload className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {fileList.length > 0 ? 'Click or drop more PDFs to add to queue' : 'Click to select or drag & drop PDF files to merge'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select multiple files at once. You can easily re-order, rotate, and select specific page ranges below.
          </p>

          {/* Quick Sample Trigger */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick test:</span>
            </span>
            <button
              type="button"
              onClick={handleLoadSamples}
              disabled={isProcessing}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer transition-colors disabled:opacity-50"
            >
              📄 Load 3 Sample PDFs (Proposal, Budget & Appendix)
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{progressInfo.stage || 'Processing PDFs...'}</span>
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
          DOCUMENT QUEUE & REORDERING
         ========================================================================= */}
      {fileList.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          {/* Queue Header & Sort Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Files className="w-4 h-4 text-indigo-500" />
                <span>Document Merge Queue ({fileList.length})</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total Output: <strong>{queueSummary.totalOutputPages} pages</strong> • Combined Source: <strong>{queueSummary.formattedInputSize}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => handleSort('name')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Sort A-Z"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>Name</span>
              </button>

              <button
                type="button"
                onClick={() => handleSort('size')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Sort by file size"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>Size</span>
              </button>

              <button
                type="button"
                onClick={() => handleSort('reverse')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Reverse queue order"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reverse</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Queue Item List */}
          <div className="space-y-2.5">
            {fileList.map((file, idx) => {
              const selectedPages = getSelectedPageCount(file);
              return (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  {/* Left: Index badge + Thumbnail + File Meta */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {file.thumbnail ? (
                      <img
                        src={file.thumbnail}
                        alt="Page preview"
                        style={{ transform: `rotate(${file.rotation}deg)` }}
                        className="w-10 h-14 rounded border border-slate-200 dark:border-slate-700 object-cover shrink-0 shadow-xs transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-xs" title={file.name}>
                        {file.name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono flex-wrap">
                        <span>{file.formattedSize}</span>
                        <span>•</span>
                        <span>{file.pageCount} total pages</span>
                        {file.rotation !== 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{file.rotation}° Rotated</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Page Range Picker + Rotation + Reorder Controls + Delete */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                    {/* Page Range Input */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 font-medium">Pages:</span>
                      <input
                        type="text"
                        value={file.pageRange}
                        onChange={(e) => handlePageRangeChange(file.id, e.target.value)}
                        placeholder={`All (${file.pageCount})`}
                        className="w-20 bg-transparent text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                        title="Enter page range (e.g. 1-3, 5) or leave blank for all"
                      />
                      <span className="text-[10px] font-mono px-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                        {selectedPages}p
                      </span>
                    </div>

                    {/* Rotate 90 CW Button */}
                    <button
                      type="button"
                      onClick={() => handleRotate(file.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Reorder Buttons */}
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === fileList.length - 1}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer border-l border-slate-200 dark:border-slate-700"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete File */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =====================================================================
              MERGE CONFIGURATION & ACTION BAR
             ===================================================================== */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Merged Filename Input */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Merged PDF Filename
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5">
                  <input
                    type="text"
                    value={outputTitle}
                    onChange={(e) => setOutputTitle(e.target.value)}
                    placeholder="Merged_Document"
                    className="w-full bg-transparent font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono text-xs">.pdf</span>
                </div>
              </div>

              {/* Page Numbering Options Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Page Numbers Stamp</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>{showAdvancedOptions ? 'Hide Options' : 'Customize'}</span>
                  </button>
                </div>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addPageNumbers}
                    onChange={(e) => setAddPageNumbers(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Stamp sequential page numbers on all merged pages
                  </span>
                </label>
              </div>
            </div>

            {/* Advanced Page Numbering Customizer */}
            {addPageNumbers && showAdvancedOptions && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Number Position</span>
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
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Number Format</span>
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

            {/* Merge Action Execution Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500 font-mono">
                Consolidating <strong>{fileList.length} files</strong> into <strong>{queueSummary.totalOutputPages} pages</strong>
              </span>

              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={isProcessing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Merging Documents...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Merge {fileList.length} Documents ({queueSummary.totalOutputPages} Pages)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESULTS DASHBOARD (AFTER SUCCESSFUL MERGE)
         ========================================================================= */}
      {mergeResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Files Merged
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {fileList.length}
              </p>
              <span className="text-[10px] text-slate-400">Source documents</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Pages
              </span>
              <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {mergeResult.totalPages}
              </p>
              <span className="text-[10px] text-indigo-500 font-medium">Consolidated pages</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Merged File Size
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {mergeResult.formattedSize}
              </p>
              <span className="text-[10px] text-slate-400">Optimized stream size</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 space-y-1">
              <span className="text-[11px] font-semibold text-indigo-100 uppercase tracking-wider block">
                Document Status
              </span>
              <p className="text-2xl font-black font-mono">
                Ready!
              </p>
              <span className="text-[10px] text-indigo-100 font-medium">100% Lossless Vectors</span>
            </div>
          </div>

          {/* Source Breakdown Table */}
          {mergeResult.filePageMap && mergeResult.filePageMap.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Merged Document Page Allocation</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {mergeResult.filePageMap.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>{item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        Pages {item.startPage} – {item.endPage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download & Preview Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Document successfully generated! Click download to save or preview in a new browser tab.
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
                <span>Download Merged PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          HISTORY DRAWER
         ========================================================================= */}
      {showHistory && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Recent PDF Merges ({historyList.length})</span>
            </span>

            {historyList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearMergeHistory();
                  setHistoryList([]);
                  if (onNotify) {
                    onNotify({
                      type: 'info',
                      title: 'History Cleared',
                      message: 'Cleared PDF merge history'
                    });
                  }
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {historyList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No past merges recorded yet.
              </div>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="truncate space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleString()} • {item.fileCount} source files • {item.totalPages} pages
                    </span>
                  </div>

                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {item.formattedSize}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
