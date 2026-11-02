import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileSignature,
  PenTool,
  Type,
  Upload,
  Stamp,
  Check,
  Download,
  AlertCircle,
  FileText,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Move
} from 'lucide-react';
import {
  getPdfInfoForSigning,
  renderPdfPageToCanvas,
  applySignaturesToPdf,
  generateSampleContractPdf,
  generateTypedSignatureDataUrl,
  removeImageBackground,
  generateDigitalStampDataUrl,
  trimCanvasBoundingBox,
  SIGNATURE_STYLES,
  INK_COLORS,
  getSignatureHistory,
  saveSignatureHistory,
  clearSignatureHistory
} from '../utils/pdfSignatureUtils';

export default function PdfSignatureSuite({ _theme = 'dark', onNotify }) {
  // Input PDF State
  const [loadedDoc, setLoadedDoc] = useState(null); // { name, size, formattedSize, pageCount, pages, buffer }
  const [currentPage, setCurrentPage] = useState(1);
  const [pagePreviewUrl, setPagePreviewUrl] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 595, height: 842 });
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Active Signature Creator Mode: 'draw' | 'type' | 'upload' | 'stamp'
  const [creatorMode, setCreatorMode] = useState('draw');

  // Draw Mode State
  const drawCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawInkColor, setDrawInkColor] = useState('#1d4ed8');
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(3);
  const [hasDrawnStrokes, setHasDrawnStrokes] = useState(false);
  const [drawHistory, setDrawHistory] = useState([]); // for undo

  // Type Mode State
  const [typedName, setTypedName] = useState('Alex Morgan');
  const [selectedStyleId, setSelectedStyleId] = useState(SIGNATURE_STYLES[0].id);
  const [typeInkColor, setTypeInkColor] = useState('#1d4ed8');

  // Upload Mode State
  const [uploadedSigUrl, setUploadedSigUrl] = useState(null);
  const [cleanBackground, setCleanBackground] = useState(true);
  const uploadInputRef = useRef(null);

  // Digital Stamp Mode State
  const [stampSignerName, setStampSignerName] = useState('Alex Morgan');
  const [stampRole, setStampRole] = useState('Managing Director');
  const [stampReason, setStampReason] = useState('Approval & Sign-off');
  const [stampColor, setStampColor] = useState('#1d4ed8');

  // Active Staged Signature
  const [activeSignatureUrl, setActiveSignatureUrl] = useState(() => {
    return generateTypedSignatureDataUrl('Alex Morgan', SIGNATURE_STYLES[0].font, '#1d4ed8');
  });
  const [includeDateStamp, setIncludeDateStamp] = useState(true);
  const [sigScaleWidthPct, setSigScaleWidthPct] = useState(28); // % of page width

  // Placed Signatures Array on Document
  // [{ id, pageNumber, imageSource, xPct, yPct, widthPct, heightPct, includeDate, dateText }]
  const [placedSignatures, setPlacedSignatures] = useState([]);
  const [selectedSigId, setSelectedSigId] = useState(null);

  // Dragging placement on Page Viewer
  const viewerContainerRef = useRef(null);
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Processing & Result State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 0, percent: 0, stage: '' });
  const [signingResult, setSigningResult] = useState(null);
  const [historyList, setHistoryList] = useState(() => getSignatureHistory());
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // File Dropzone & input
  const fileInputRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Load PDF Buffer
  const handleLoadPdfBuffer = useCallback(async (buffer, filename = 'document.pdf') => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    setSigningResult(null);
    setPlacedSignatures([]);
    setSelectedSigId(null);

    try {
      const info = await getPdfInfoForSigning(buffer, filename);
      setLoadedDoc(info);
      // If document has multiple pages, default to last page (customary signature page)
      setCurrentPage(info.pageCount > 1 ? info.pageCount : 1);

      if (onNotify) {
        onNotify(`Loaded "${filename}" (${info.pageCount} ${info.pageCount === 1 ? 'page' : 'pages'})`, 'success');
      }
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setErrorMessage(err.message || 'Failed to parse PDF document.');
      if (onNotify) onNotify('Failed to parse PDF.', 'error');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [onNotify]);

  // Load Sample Contract
  const handleLoadSampleContract = useCallback(async () => {
    setIsLoadingDoc(true);
    setErrorMessage(null);
    try {
      const sample = await generateSampleContractPdf();
      await handleLoadPdfBuffer(sample.buffer, sample.name);
    } catch (err) {
      console.error('Failed to load sample contract:', err);
      setErrorMessage('Failed to generate sample document.');
    } finally {
      setIsLoadingDoc(false);
    }
  }, [handleLoadPdfBuffer]);

  // Render Current Page to Viewport
  useEffect(() => {
    if (!loadedDoc?.buffer) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      setIsRenderingPage(true);
      renderPdfPageToCanvas(loadedDoc.buffer, currentPage, 1.25)
        .then((res) => {
          if (isMounted && res) {
            setPagePreviewUrl(res.dataUrl);
            setPageDimensions({ width: res.width, height: res.height });
          }
        })
        .catch((err) => console.error('Page render error:', err))
        .finally(() => {
          if (isMounted) setIsRenderingPage(false);
        });
    }, 10);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadedDoc, currentPage]);

  // --- DRAWING CANVAS SETUP ---
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = drawInkColor;
    ctx.lineWidth = drawStrokeWidth;
  }, [drawInkColor, drawStrokeWidth]);

  const saveCanvasState = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setDrawHistory((prev) => [...prev.slice(-10), canvas.toDataURL()]);
  };

  const handlePointerDown = (e) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCanvasState();
    setIsDrawing(true);
    setHasDrawnStrokes(true);

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnStrokes(false);
    setDrawHistory([]);
  };

  const handleUndoDraw = () => {
    if (drawHistory.length === 0) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastState = drawHistory[drawHistory.length - 1];
    setDrawHistory((prev) => prev.slice(0, -1));

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = lastState;
  };

  const handleCommitDrawnSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !hasDrawnStrokes) {
      if (onNotify) onNotify('Please draw your signature first.', 'warning');
      return;
    }
    const trimmed = trimCanvasBoundingBox(canvas, 12);
    const dataUrl = trimmed.toDataURL('image/png');
    setActiveSignatureUrl(dataUrl);
    if (onNotify) onNotify('Signature ready! Click "Place Signature" to position on page.', 'success');
  };

  // --- TYPE MODE COMMIT ---
  const handleCommitTypedSignature = () => {
    const styleObj = SIGNATURE_STYLES.find((s) => s.id === selectedStyleId) || SIGNATURE_STYLES[0];
    const dataUrl = generateTypedSignatureDataUrl(typedName, styleObj.font, typeInkColor);
    setActiveSignatureUrl(dataUrl);
    if (onNotify) onNotify('Typed signature updated!', 'success');
  };

  // --- UPLOAD MODE COMMIT ---
  const handleSignatureFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let finalUrl = reader.result;
        if (cleanBackground) {
          finalUrl = removeImageBackground(img, 220);
        }
        setUploadedSigUrl(finalUrl);
        setActiveSignatureUrl(finalUrl);
        if (onNotify) onNotify('Signature uploaded and transparentized!', 'success');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- DIGITAL STAMP COMMIT ---
  const handleCommitDigitalStamp = () => {
    const dataUrl = generateDigitalStampDataUrl({
      name: stampSignerName,
      role: stampRole,
      reason: stampReason,
      color: stampColor
    });
    setActiveSignatureUrl(dataUrl);
    if (onNotify) onNotify('Digital Stamp certificate created!', 'success');
  };

  // --- PLACE SIGNATURE ON CURRENT PAGE ---
  const handlePlaceSignatureOnPage = (customXPct = null, customYPct = null) => {
    if (!activeSignatureUrl) {
      setErrorMessage('Please create or select a signature first.');
      return;
    }

    const now = new Date();
    const dateFormatted = `Signed: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Default placement on Page 3 or current page
    // Position near bottom right or custom spot
    const newSigItem = {
      id: `placed_sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageNumber: currentPage,
      imageSource: activeSignatureUrl,
      xPct: customXPct !== null ? customXPct : 0.55,
      yPct: customYPct !== null ? customYPct : 0.62,
      widthPct: sigScaleWidthPct / 100,
      heightPct: (sigScaleWidthPct / 100) * 0.38,
      includeDate: includeDateStamp,
      dateText: dateFormatted
    };

    setPlacedSignatures((prev) => [...prev, newSigItem]);
    setSelectedSigId(newSigItem.id);

    if (onNotify) {
      onNotify(`Placed signature on Page ${currentPage}! Drag to reposition.`, 'success');
    }
  };

  // Quick Preset Placement
  const handleQuickPlace = (preset) => {
    let x = 0.55;
    let y = 0.65;
    if (preset === 'bottom-right') {
      x = 0.58;
      y = 0.70;
    } else if (preset === 'bottom-left') {
      x = 0.10;
      y = 0.70;
    } else if (preset === 'center') {
      x = 0.35;
      y = 0.45;
    }
    handlePlaceSignatureOnPage(x, y);
  };

  // Dragging signature on viewer
  const handleSigMouseDown = (e, sigId) => {
    e.stopPropagation();
    setSelectedSigId(sigId);
    setIsDraggingSig(true);

    const viewer = viewerContainerRef.current;
    if (!viewer) return;
    const rect = viewer.getBoundingClientRect();
    const currentSig = placedSignatures.find((s) => s.id === sigId);
    if (!currentSig) return;

    const mouseXPct = (e.clientX - rect.left) / rect.width;
    const mouseYPct = (e.clientY - rect.top) / rect.height;

    setDragOffset({
      x: mouseXPct - currentSig.xPct,
      y: mouseYPct - currentSig.yPct
    });
  };

  const handleViewerMouseMove = (e) => {
    if (!isDraggingSig || !selectedSigId) return;
    const viewer = viewerContainerRef.current;
    if (!viewer) return;

    const rect = viewer.getBoundingClientRect();
    const mouseXPct = (e.clientX - rect.left) / rect.width;
    const mouseYPct = (e.clientY - rect.top) / rect.height;

    const newX = Math.max(0.01, Math.min(0.85, mouseXPct - dragOffset.x));
    const newY = Math.max(0.01, Math.min(0.88, mouseYPct - dragOffset.y));

    setPlacedSignatures((prev) =>
      prev.map((sig) => (sig.id === selectedSigId ? { ...sig, xPct: newX, yPct: newY } : sig))
    );
  };

  const handleViewerMouseUp = () => {
    setIsDraggingSig(false);
  };

  // Click on Viewer to Move or Place Signature
  const handleViewerClick = (e) => {
    if (!viewerContainerRef.current) return;
    const rect = viewerContainerRef.current.getBoundingClientRect();
    const clickXPct = (e.clientX - rect.left) / rect.width;
    const clickYPct = (e.clientY - rect.top) / rect.height;

    if (selectedSigId) {
      // Move selected signature to click position
      setPlacedSignatures((prev) =>
        prev.map((sig) =>
          sig.id === selectedSigId
            ? { ...sig, xPct: Math.max(0.02, clickXPct - sig.widthPct / 2), yPct: Math.max(0.02, clickYPct - sig.heightPct / 2) }
            : sig
        )
      );
    }
  };

  const handleDeletePlacedSig = (sigId) => {
    setPlacedSignatures((prev) => prev.filter((s) => s.id !== sigId));
    if (selectedSigId === sigId) setSelectedSigId(null);
  };

  // --- SAVE & EMBED SIGNATURES ON PDF ---
  const handleApplySignatures = async () => {
    if (!loadedDoc?.buffer) {
      setErrorMessage('Please load a PDF document first.');
      return;
    }

    if (placedSignatures.length === 0) {
      setErrorMessage('Please place at least one signature on the document before saving.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressInfo({ current: 0, total: placedSignatures.length, percent: 0, stage: 'Preparing document...' });

    try {
      const result = await applySignaturesToPdf(loadedDoc.buffer, placedSignatures, (p) => setProgressInfo(p));
      const downloadName = loadedDoc.name.replace(/\.[^/.]+$/, '') + '_signed.pdf';
      const outputResult = {
        ...result,
        filename: downloadName,
        blob: new Blob([result.pdfBytes], { type: 'application/pdf' })
      };

      setSigningResult(outputResult);

      saveSignatureHistory({
        filename: downloadName,
        size: result.size,
        formattedSize: result.formattedSize,
        pageCount: result.pageCount,
        signaturesAppliedCount: result.signaturesAppliedCount
      });
      setHistoryList(getSignatureHistory());

      if (onNotify) {
        onNotify(`Successfully embedded ${result.signaturesAppliedCount} signatures!`, 'success');
      }
    } catch (err) {
      console.error('Signing failed:', err);
      setErrorMessage(err.message || 'Failed to embed signatures into PDF document.');
      if (onNotify) onNotify('Signing failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSignedPdf = () => {
    if (!signingResult?.blob) return;
    const url = URL.createObjectURL(signingResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = signingResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Signatures on Current Page
  const currentPageSignatures = placedSignatures.filter((s) => s.pageNumber === currentPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-indigo-800/40">
              <FileSignature className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  PDF Signature Studio
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Client-Side
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Electronically sign PDF documents with smooth freehand drawing, elegant cursive typography, image signature uploads, or official cryptographic seals. 100% private in-browser vector execution.
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLoadSampleContract}
              disabled={isLoadingDoc || isProcessing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Contract</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({historyList.length})</span>
            </button>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Server Transmission: Signatures and documents remain 100% private on your device.</span>
          </div>
          {loadedDoc && (
            <div className="hidden sm:flex items-center gap-3">
              <span>Pages: <strong className="text-slate-900 dark:text-white">{loadedDoc.pageCount}</strong></span>
              <span>•</span>
              <span>Placed Signatures: <strong className="text-indigo-600 dark:text-indigo-400">{placedSignatures.length}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm font-medium">
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Workspace */}
      {!loadedDoc ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => handleLoadPdfBuffer(reader.result, file.name);
              reader.readAsArrayBuffer(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-12 text-center flex flex-col items-center justify-center ${
            isDraggingFile
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-[#111622]/50 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => handleLoadPdfBuffer(reader.result, file.name);
                reader.readAsArrayBuffer(file);
              }
              e.target.value = '';
            }}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
            <Upload className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Drop your PDF document to sign
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Drag & drop contracts, agreements, or forms. Add signatures, initials, and date stamps with zero uploads.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Browse PDF
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSampleContract();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Load Sample Contract (NDA)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Header Toolbar */}
          <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {loadedDoc.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {loadedDoc.pageCount} {loadedDoc.pageCount === 1 ? 'page' : 'pages'} • {loadedDoc.formattedSize}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => handleLoadPdfBuffer(reader.result, file.name);
                    reader.readAsArrayBuffer(file);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Change Document
              </button>
              <button
                type="button"
                onClick={() => setLoadedDoc(null)}
                className="p-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DUAL PANE WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: SIGNATURE CREATOR & STAGING */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Creator Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCreatorMode('draw')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    creatorMode === 'draw'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatorMode('type')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    creatorMode === 'type'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Type</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatorMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    creatorMode === 'upload'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatorMode('stamp')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    creatorMode === 'stamp'
                      ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>Seal</span>
                </button>
              </div>

              {/* TAB 1: DRAW SIGNATURE CANVAS */}
              {creatorMode === 'draw' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Sign on the pad below with mouse or touch:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUndoDraw}
                        disabled={drawHistory.length === 0}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30"
                        title="Undo stroke"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDrawCanvas}
                        className="text-slate-500 hover:text-red-500 text-xs font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Freehand Canvas Pad */}
                  <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 overflow-hidden shadow-inner">
                    <canvas
                      ref={drawCanvasRef}
                      width={600}
                      height={200}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className="w-full h-[150px] touch-none cursor-crosshair block"
                    />
                    {!hasDrawnStrokes && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                        ✍️ Draw your signature here...
                      </div>
                    )}
                  </div>

                  {/* Ink Controls */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Ink:</span>
                      {INK_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setDrawInkColor(c.hex)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            drawInkColor === c.hex
                              ? 'scale-125 border-slate-900 dark:border-white ring-2 ring-indigo-500/50'
                              : 'border-black/10 hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Thickness:</span>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={drawStrokeWidth}
                        onChange={(e) => setDrawStrokeWidth(parseInt(e.target.value, 10))}
                        className="w-20 accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitDrawnSignature}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    Adopt Drawn Signature
                  </button>
                </div>
              )}

              {/* TAB 2: TYPE SIGNATURE */}
              {creatorMode === 'type' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Full Name or Initials
                    </label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Signature Styles Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Handwriting Style:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SIGNATURE_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyleId(style.id)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            selectedStyleId === style.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="text-lg block truncate"
                            style={{ font: style.font, color: typeInkColor }}
                          >
                            {typedName.trim() || 'Signature'}
                          </span>
                          <span className="text-2xs text-slate-400 mt-1 block">
                            {style.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ink Color */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Ink Color:</span>
                    <div className="flex items-center gap-1.5">
                      {INK_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setTypeInkColor(c.hex)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            typeInkColor === c.hex
                              ? 'scale-125 border-slate-900 dark:border-white ring-2 ring-indigo-500/50'
                              : 'border-black/10 hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitTypedSignature}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    Adopt Typed Signature
                  </button>
                </div>
              )}

              {/* TAB 3: UPLOAD SIGNATURE */}
              {creatorMode === 'upload' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleSignatureFileUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => uploadInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-900/40 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Click to upload signature photo
                    </span>
                    <span className="text-2xs text-slate-400 mt-0.5 block">
                      PNG, JPG, SVG, WebP with auto-transparency
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Remove White Paper Background:
                    </span>
                    <input
                      type="checkbox"
                      checked={cleanBackground}
                      onChange={(e) => setCleanBackground(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>

                  {uploadedSigUrl && (
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img
                        src={uploadedSigUrl}
                        alt="Uploaded Signature"
                        className="max-h-16 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DIGITAL STAMP / CERTIFICATE */}
              {creatorMode === 'stamp' && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Signer Name
                    </label>
                    <input
                      type="text"
                      value={stampSignerName}
                      onChange={(e) => setStampSignerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Title / Role
                      </label>
                      <input
                        type="text"
                        value={stampRole}
                        onChange={(e) => setStampRole(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Stamp Color
                      </label>
                      <select
                        value={stampColor}
                        onChange={(e) => setStampColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="#1d4ed8">Corporate Blue</option>
                        <option value="#16a34a">Approved Green</option>
                        <option value="#0f172a">Dark Slate</option>
                        <option value="#dc2626">Crimson Red</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Signing Reason
                    </label>
                    <input
                      type="text"
                      value={stampReason}
                      onChange={(e) => setStampReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitDigitalStamp}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    Adopt Digital Certificate Seal
                  </button>
                </div>
              )}

              {/* ACTIVE STAGED SIGNATURE PREVIEW & PLACEMENT BAR */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#0c111a] border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Active Signature Stamp</span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-2xs text-slate-500 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDateStamp}
                        onChange={(e) => setIncludeDateStamp(e.target.checked)}
                        className="accent-indigo-600 w-3.5 h-3.5 rounded"
                      />
                      <span>Include Date</span>
                    </label>
                  </div>
                </div>

                {/* Staged Signature Image Box */}
                <div className="h-16 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center p-2">
                  {activeSignatureUrl ? (
                    <img
                      src={activeSignatureUrl}
                      alt="Active signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No signature created yet</span>
                  )}
                </div>

                {/* Scale Slider */}
                <div>
                  <div className="flex justify-between text-2xs text-slate-500 mb-1">
                    <span>Signature Scale:</span>
                    <span>{sigScaleWidthPct}% width</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    value={sigScaleWidthPct}
                    onChange={(e) => setSigScaleWidthPct(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Placement Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePlaceSignatureOnPage()}
                    className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>Place on Page {currentPage}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickPlace('bottom-right')}
                      className="px-2 py-1.5 text-2xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                      title="Bottom-Right"
                    >
                      ↘ BR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPlace('bottom-left')}
                      className="px-2 py-1.5 text-2xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                      title="Bottom-Left"
                    >
                      ↙ BL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPlace('center')}
                      className="px-2 py-1.5 text-2xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                      title="Center"
                    >
                      • Center
                    </button>
                  </div>
                </div>
              </div>

              {/* PLACED SIGNATURES LIST */}
              {placedSignatures.length > 0 && (
                <div className="rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Placed Signatures ({placedSignatures.length})</span>
                    <button
                      type="button"
                      onClick={() => setPlacedSignatures([])}
                      className="text-2xs text-red-500 hover:underline font-normal"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {placedSignatures.map((sig, idx) => (
                      <div
                        key={sig.id}
                        onClick={() => {
                          setSelectedSigId(sig.id);
                          setCurrentPage(sig.pageNumber);
                        }}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          selectedSigId === sig.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 font-semibold text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="truncate">Page {sig.pageNumber} Signature</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlacedSig(sig.id);
                          }}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRIMARY ACTION BUTTON */}
              <button
                type="button"
                onClick={handleApplySignatures}
                disabled={isProcessing || placedSignatures.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing Document ({progressInfo.percent}%)...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Sign & Save PDF Document</span>
                  </>
                )}
              </button>

              {/* Progress bar */}
              {isProcessing && (
                <div className="space-y-1 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex justify-between text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    <span>{progressInfo.stage || 'Embedding signatures...'}</span>
                    <span>{progressInfo.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-200/50 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                      style={{ width: `${progressInfo.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: VISUAL DOCUMENT PAGE VIEWER & SIGNATURE PLACEMENT */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                
                {/* Viewer Navigation Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Document Placement Viewer
                    </h3>
                    <span className="px-2 py-0.5 text-2xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {currentPageSignatures.length} on Page {currentPage}
                    </span>
                  </div>

                  {/* Page Stepper & Jump to Last Page */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || isRenderingPage}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-[70px] text-center">
                      {currentPage} / {loadedDoc.pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= loadedDoc.pageCount || isRenderingPage}
                      onClick={() => setCurrentPage((p) => Math.min(loadedDoc.pageCount, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {loadedDoc.pageCount > 1 && currentPage !== loadedDoc.pageCount && (
                      <button
                        type="button"
                        onClick={() => setCurrentPage(loadedDoc.pageCount)}
                        className="px-2.5 py-1 text-2xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                      >
                        Go to Signing Page ✍️
                      </button>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE PAGE CANVAS & DRAGGABLE SIGNATURE OVERLAY */}
                <div
                  ref={viewerContainerRef}
                  onClick={handleViewerClick}
                  onMouseMove={handleViewerMouseMove}
                  onMouseUp={handleViewerMouseUp}
                  className="relative min-h-[480px] max-h-[640px] rounded-xl bg-slate-100 dark:bg-[#0c111a] border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center p-3 overflow-auto select-none"
                >
                  {isRenderingPage && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center z-20">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>Rendering page {currentPage}...</span>
                      </div>
                    </div>
                  )}

                  {pagePreviewUrl && (
                    <div className="relative shadow-xl rounded-sm overflow-hidden bg-white max-w-full">
                      <img
                        src={pagePreviewUrl}
                        alt={`Page ${currentPage}`}
                        className="max-h-[590px] w-auto object-contain block pointer-events-none select-none"
                      />

                      {/* RENDER PLACED SIGNATURES ON THIS PAGE */}
                      {currentPageSignatures.map((sig) => {
                        const isSelected = selectedSigId === sig.id;
                        return (
                          <div
                            key={sig.id}
                            onMouseDown={(e) => handleSigMouseDown(e, sig.id)}
                            style={{
                              left: `${sig.xPct * 100}%`,
                              top: `${sig.yPct * 100}%`,
                              width: `${sig.widthPct * 100}%`
                            }}
                            className={`absolute z-10 cursor-move transition-shadow rounded-sm p-1 ${
                              isSelected
                                ? 'ring-2 ring-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20 shadow-md'
                                : 'border border-dashed border-indigo-400/80 hover:ring-1 hover:ring-indigo-400'
                            }`}
                          >
                            <img
                              src={sig.imageSource}
                              alt="Signature Stamp"
                              className="w-full h-auto object-contain block pointer-events-none"
                            />
                            {sig.includeDate && sig.dateText && (
                              <div className="text-[9px] font-mono font-semibold text-slate-700 bg-white/80 px-1 rounded-2xs mt-0.5 leading-tight truncate">
                                {sig.dateText}
                              </div>
                            )}

                            {/* Delete handle */}
                            {isSelected && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlacedSig(sig.id);
                                }}
                                className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 text-xs font-bold"
                                title="Remove signature"
                              >
                                ×
                              </button>
                            )}

                            {/* Move badge icon */}
                            {isSelected && (
                              <div className="absolute -top-3 -left-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md pointer-events-none">
                                <Move className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-2xs text-slate-400 dark:text-slate-500">
                  <span>💡 Drag the signature box to place it over any signature line. Click anywhere to jump.</span>
                  <span>{pageDimensions.width} × {pageDimensions.height} px</span>
                </div>
              </div>
            </div>

          </div>

          {/* SUCCESS DASHBOARD */}
          {signingResult && (
            <div className="rounded-2xl bg-white dark:bg-[#111622] border border-emerald-200 dark:border-emerald-800/80 shadow-md p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Signed PDF Document Ready!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Successfully embedded {signingResult.signaturesAppliedCount} electronic signature stamps with byte-level compaction.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSignedPdf}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Original Size</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {signingResult.formattedOriginalSize}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Signed Size</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {signingResult.formattedSize}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Total Pages</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {signingResult.pageCount}
                  </strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500 block mb-0.5">Signatures Embedded</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 text-sm">
                    {signingResult.signaturesAppliedCount}
                  </strong>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RECENT SIGNATURE HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <History className="w-4 h-4 text-indigo-500" />
                <span>Recent Signed Documents</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent signed documents found.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.filename}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {item.signaturesAppliedCount} signatures • {item.formattedSize}
                      </div>
                    </div>
                    <span className="text-2xs text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {historyList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearSignatureHistory();
                    setHistoryList([]);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear History
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="ml-auto px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
