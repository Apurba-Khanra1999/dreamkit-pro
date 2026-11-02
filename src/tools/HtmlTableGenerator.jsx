import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Plus,
  Minus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Check,
  Download,
  Upload,
  Sparkles,
  FileCode,
  Eye,
  Sliders,
  Palette,
  Layers,
  FileSpreadsheet,
  FileJson,
  FileText,
  Laptop,
  Tablet,
  Smartphone,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import {
  TABLE_THEMES,
  PRESET_TEMPLATES,
  DEFAULT_TABLE,
  generateHtmlTable,
  generateTailwindTable,
  generateMarkdownTable,
  generateCsvTable,
  generateJsonTable,
  parseCsvToTable,
  parseJsonToTable,
  parseMarkdownToTable
} from '../utils/htmlTableUtils';

export default function HtmlTableGenerator({ _theme = 'dark', onNotify }) {
  // Table Model State
  const [tableData, setTableData] = useState(() => ({ ...DEFAULT_TABLE }));
  const [activeOutputTab, setActiveOutputTab] = useState('preview'); // 'preview' | 'html' | 'tailwind' | 'markdown' | 'csv' | 'json'

  // Styling Configuration
  const [selectedThemeId, setSelectedThemeId] = useState('modern_clean');
  const [styleMode, setStyleMode] = useState('inline'); // 'inline' | 'embedded_css' | 'clean'
  const [cellPadding, setCellPadding] = useState('standard'); // 'compact' | 'standard' | 'relaxed'
  const [borderStyle, setBorderStyle] = useState('thin'); // 'none' | 'thin' | 'solid'
  const [borderRadius, setBorderRadius] = useState(8); // px
  const [hasStripedRows, setHasStripedRows] = useState(true);
  const [hasHoverHighlight, setHasHoverHighlight] = useState(true);
  const [isResponsive, setIsResponsive] = useState(true);
  const [fullWidth, setFullWidth] = useState(true);

  // Preview Settings
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewDarkBg, setPreviewDarkBg] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFormat, setImportFormat] = useState('csv'); // 'csv' | 'json' | 'markdown'
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState(null);

  // Copy Feedback
  const [copied, setCopied] = useState(false);

  // Active theme details
  const activeTheme = useMemo(() => {
    return TABLE_THEMES.find((t) => t.id === selectedThemeId) || TABLE_THEMES[0];
  }, [selectedThemeId]);

  // Dimensions
  const rowCount = tableData.rows.length;
  const colCount = tableData.headers.length;

  // Notification helper
  const notify = useCallback((msg, type = 'success') => {
    if (onNotify) {
      if (typeof onNotify === 'function') {
        onNotify(msg, type);
      }
    }
  }, [onNotify]);

  // Load Preset
  const handleLoadPreset = (presetId) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;
    setTableData({
      caption: preset.caption,
      hasHeader: preset.hasHeader,
      hasFooter: preset.hasFooter,
      headers: [...preset.headers],
      alignments: [...preset.alignments],
      rows: preset.rows.map((r) => [...r]),
      footers: preset.footers ? [...preset.footers] : []
    });
    notify(`Loaded preset "${preset.name}"`, 'success');
  };

  // --- Grid Modification Handlers ---

  // Update a single Header cell
  const handleUpdateHeader = (colIdx, val) => {
    setTableData((prev) => {
      const headers = [...prev.headers];
      headers[colIdx] = val;
      return { ...prev, headers };
    });
  };

  // Update a single Body cell
  const handleUpdateCell = (rowIdx, colIdx, val) => {
    setTableData((prev) => {
      const rows = prev.rows.map((r, rIdx) => {
        if (rIdx !== rowIdx) return r;
        const newRow = [...r];
        newRow[colIdx] = val;
        return newRow;
      });
      return { ...prev, rows };
    });
  };

  // Update a single Footer cell
  const handleUpdateFooter = (colIdx, val) => {
    setTableData((prev) => {
      const footers = [...prev.footers];
      footers[colIdx] = val;
      return { ...prev, footers };
    });
  };

  // Change Column Alignment
  const handleChangeAlignment = (colIdx, align) => {
    setTableData((prev) => {
      const alignments = [...prev.alignments];
      alignments[colIdx] = align;
      return { ...prev, alignments };
    });
  };

  // Add Column (at end or index)
  const handleAddColumn = (afterIdx = null) => {
    setTableData((prev) => {
      const insertIdx = afterIdx !== null ? afterIdx + 1 : prev.headers.length;
      const headers = [...prev.headers];
      headers.splice(insertIdx, 0, `Column ${headers.length + 1}`);

      const alignments = [...prev.alignments];
      alignments.splice(insertIdx, 0, 'left');

      const rows = prev.rows.map((row) => {
        const newRow = [...row];
        newRow.splice(insertIdx, 0, '');
        return newRow;
      });

      const footers = [...prev.footers];
      if (prev.hasFooter) {
        footers.splice(insertIdx, 0, '');
      }

      return { ...prev, headers, alignments, rows, footers };
    });
  };

  // Delete Column
  const handleDeleteColumn = (colIdx) => {
    if (tableData.headers.length <= 1) {
      notify('Table must contain at least 1 column.', 'error');
      return;
    }
    setTableData((prev) => {
      const headers = prev.headers.filter((_, i) => i !== colIdx);
      const alignments = prev.alignments.filter((_, i) => i !== colIdx);
      const rows = prev.rows.map((row) => row.filter((_, i) => i !== colIdx));
      const footers = prev.footers.filter((_, i) => i !== colIdx);
      return { ...prev, headers, alignments, rows, footers };
    });
  };

  // Move Column Left / Right
  const handleMoveColumn = (colIdx, direction) => {
    const targetIdx = direction === 'left' ? colIdx - 1 : colIdx + 1;
    if (targetIdx < 0 || targetIdx >= tableData.headers.length) return;

    setTableData((prev) => {
      const swap = (arr) => {
        const copy = [...arr];
        const temp = copy[colIdx];
        copy[colIdx] = copy[targetIdx];
        copy[targetIdx] = temp;
        return copy;
      };

      return {
        ...prev,
        headers: swap(prev.headers),
        alignments: swap(prev.alignments),
        rows: prev.rows.map((r) => swap(r)),
        footers: prev.hasFooter ? swap(prev.footers) : prev.footers
      };
    });
  };

  // Add Row (at end or index)
  const handleAddRow = (afterIdx = null) => {
    setTableData((prev) => {
      const insertIdx = afterIdx !== null ? afterIdx + 1 : prev.rows.length;
      const newRow = Array(prev.headers.length).fill('');
      const rows = [...prev.rows];
      rows.splice(insertIdx, 0, newRow);
      return { ...prev, rows };
    });
  };

  // Duplicate Row
  const handleDuplicateRow = (rowIdx) => {
    setTableData((prev) => {
      const rows = [...prev.rows];
      rows.splice(rowIdx + 1, 0, [...rows[rowIdx]]);
      return { ...prev, rows };
    });
    notify(`Row ${rowIdx + 1} duplicated`, 'success');
  };

  // Delete Row
  const handleDeleteRow = (rowIdx) => {
    if (tableData.rows.length <= 1) {
      notify('Table must have at least 1 row.', 'error');
      return;
    }
    setTableData((prev) => {
      const rows = prev.rows.filter((_, i) => i !== rowIdx);
      return { ...prev, rows };
    });
  };

  // Move Row Up / Down
  const handleMoveRow = (rowIdx, direction) => {
    const targetIdx = direction === 'up' ? rowIdx - 1 : rowIdx + 1;
    if (targetIdx < 0 || targetIdx >= tableData.rows.length) return;

    setTableData((prev) => {
      const rows = [...prev.rows];
      const temp = rows[rowIdx];
      rows[rowIdx] = rows[targetIdx];
      rows[targetIdx] = temp;
      return { ...prev, rows };
    });
  };

  // Adjust Grid Dimension Directly (e.g. set to N rows or M cols)
  const handleSetDimensions = (newRows, newCols) => {
    const targetRows = Math.max(1, Math.min(50, newRows));
    const targetCols = Math.max(1, Math.min(20, newCols));

    setTableData((prev) => {
      // Adjust Cols
      let headers = [...prev.headers];
      let alignments = [...prev.alignments];
      while (headers.length < targetCols) {
        headers.push(`Column ${headers.length + 1}`);
        alignments.push('left');
      }
      headers = headers.slice(0, targetCols);
      alignments = alignments.slice(0, targetCols);

      // Adjust Rows
      let rows = prev.rows.map((r) => {
        const copy = [...r];
        while (copy.length < targetCols) copy.push('');
        return copy.slice(0, targetCols);
      });

      while (rows.length < targetRows) {
        rows.push(Array(targetCols).fill(''));
      }
      rows = rows.slice(0, targetRows);

      // Adjust Footers
      let footers = [...prev.footers];
      while (footers.length < targetCols) footers.push('');
      footers = footers.slice(0, targetCols);

      return { ...prev, headers, alignments, rows, footers };
    });
  };

  // Reset Table to Blank
  const handleResetBlank = () => {
    setTableData({
      caption: '',
      hasHeader: true,
      hasFooter: false,
      headers: ['Column 1', 'Column 2', 'Column 3'],
      alignments: ['left', 'left', 'left'],
      rows: [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ],
      footers: ['', '', '']
    });
    notify('Table reset to blank 3×3 grid.', 'info');
  };

  // --- Import Data Handler ---
  const handleExecuteImport = () => {
    setImportError(null);
    try {
      let imported;
      if (importFormat === 'csv') {
        imported = parseCsvToTable(importText);
      } else if (importFormat === 'json') {
        imported = parseJsonToTable(importText);
      } else if (importFormat === 'markdown') {
        imported = parseMarkdownToTable(importText);
      }
      if (imported) {
        setTableData(imported);
        setShowImportModal(false);
        setImportText('');
        notify(`Imported ${imported.rows.length} rows × ${imported.headers.length} columns!`, 'success');
      }
    } catch (err) {
      setImportError(err.message || 'Failed to parse import data.');
    }
  };

  // Sample data for Import Modal
  const handleLoadImportSample = () => {
    if (importFormat === 'csv') {
      setImportText('Product,Category,Price,Stock\nMacBook Pro 16",Computers,$2499,14\nSony WH-1000XM5,Audio,$399,48\nDell UltraSharp 32",Monitors,$849,22');
    } else if (importFormat === 'json') {
      setImportText('[\n  {"City": "Tokyo", "Country": "Japan", "Population": "37.4M"},\n  {"City": "Delhi", "Country": "India", "Population": "32.9M"},\n  {"City": "Shanghai", "Country": "China", "Population": "28.5M"}\n]');
    } else if (importFormat === 'markdown') {
      setImportText('| Framework | Language | Stars | Performance |\n| :--- | :--- | ---: | :---: |\n| React | TypeScript | 224k | Excellent |\n| Vue | TypeScript | 207k | Fast |\n| Svelte | TypeScript | 78k | Ultra Fast |');
    }
  };

  // --- Generated Output Computations ---
  const generatedCode = useMemo(() => {
    const opts = {
      themeId: selectedThemeId,
      styleMode,
      cellPadding,
      borderStyle,
      borderRadius,
      hasStripedRows,
      hasHoverHighlight,
      isResponsive,
      fullWidth
    };

    switch (activeOutputTab) {
      case 'preview':
      case 'html':
        return generateHtmlTable(tableData, opts);
      case 'tailwind':
        return generateTailwindTable(tableData, opts);
      case 'markdown':
        return generateMarkdownTable(tableData);
      case 'csv':
        return generateCsvTable(tableData);
      case 'json':
        return generateJsonTable(tableData);
      default:
        return '';
    }
  }, [
    tableData,
    activeOutputTab,
    selectedThemeId,
    styleMode,
    cellPadding,
    borderStyle,
    borderRadius,
    hasStripedRows,
    hasHoverHighlight,
    isResponsive,
    fullWidth
  ]);

  // Copy Code to Clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      notify(`Copied ${activeOutputTab.toUpperCase()} to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('Failed to copy to clipboard.', 'error');
    }
  };

  // Download Code
  const handleDownloadCode = () => {
    const extMap = {
      preview: 'html',
      html: 'html',
      tailwind: 'html',
      markdown: 'md',
      csv: 'csv',
      json: 'json'
    };
    const ext = extMap[activeOutputTab] || 'html';
    const mimeMap = {
      html: 'text/html',
      md: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json'
    };

    const blob = new Blob([generatedCode], { type: mimeMap[ext] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_export_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Downloaded table as .${ext}`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  HTML Table Generator
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  CSS & Tailwind Ready
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Visual spreadsheet designer, CSS styling studio, and multi-format code generator for HTML, Tailwind, Markdown, CSV, and JSON.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Selector Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Presets</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-56 p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-40">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{preset.name}</span>
                  <span className="text-[10px] text-slate-400">{preset.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span>Import CSV / JSON</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetBlank}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-rose-500 dark:text-rose-400 transition-colors shadow-sm flex items-center gap-1.5"
            title="Reset to blank 3x3 table"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Grid Dimension Bar & Quick Presets */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Steppers for Rows & Cols */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Rows Stepper */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rows:
            </span>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                disabled={rowCount <= 1}
                onClick={() => handleDeleteRow(rowCount - 1)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-600 dark:text-slate-400"
                title="Remove last row"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white">
                {rowCount}
              </span>
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Add new row"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cols Stepper */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cols:
            </span>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                disabled={colCount <= 1}
                onClick={() => handleDeleteColumn(colCount - 1)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-600 dark:text-slate-400"
                title="Remove last column"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white">
                {colCount}
              </span>
              <button
                type="button"
                onClick={() => handleAddColumn()}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Add new column"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Matrix Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1">Quick:</span>
            {[
              [3, 3],
              [4, 4],
              [5, 5],
              [6, 6]
            ].map(([r, c]) => (
              <button
                key={`${r}x${c}`}
                type="button"
                onClick={() => handleSetDimensions(r, c)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded-md border transition-all ${
                  rowCount === r && colCount === c
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {r}×{c}
              </button>
            ))}
          </div>
        </div>

        {/* Structural Toggles: Header, Footer, Caption */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={tableData.hasHeader}
              onChange={(e) => setTableData((prev) => ({ ...prev, hasHeader: e.target.checked }))}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Header Row</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={tableData.hasFooter}
              onChange={(e) => setTableData((prev) => ({ ...prev, hasFooter: e.target.checked }))}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Footer Row</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={Boolean(tableData.caption)}
              onChange={(e) =>
                setTableData((prev) => ({
                  ...prev,
                  caption: e.target.checked ? (prev.caption || 'Table Title / Caption') : ''
                }))
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Caption</span>
          </label>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="space-y-6">
        {/* Caption Input if Enabled */}
        {tableData.caption !== '' && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Table Caption:
            </span>
            <input
              type="text"
              value={tableData.caption}
              onChange={(e) => setTableData((prev) => ({ ...prev, caption: e.target.value }))}
              placeholder="Enter descriptive table caption..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Visual Spreadsheet Editor Container */}
        <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Interactive Visual Spreadsheet Editor
              </h2>
              <span className="text-xs text-slate-400">
                ({rowCount} rows × {colCount} columns)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddColumn()}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Column</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Table Grid */}
          <div className="overflow-x-auto max-h-[520px] divide-y divide-slate-200 dark:divide-slate-800">
            <table className="w-full border-collapse text-xs">
              {/* Header Row */}
              {tableData.hasHeader && (
                <thead className="bg-slate-50 dark:bg-slate-900/90 sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th className="w-12 p-2 text-center text-[10px] font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      #
                    </th>
                    {tableData.headers.map((header, colIdx) => (
                      <th
                        key={colIdx}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 min-w-[170px]"
                      >
                        <div className="space-y-1.5">
                          {/* Header Text Input */}
                          <input
                            type="text"
                            value={header}
                            onChange={(e) => handleUpdateHeader(colIdx, e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder={`Column ${colIdx + 1}`}
                          />

                          {/* Column Toolbar (Alignments, Move, Delete) */}
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            {/* Alignment Group */}
                            <div className="flex items-center rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                              {[
                                { id: 'left', icon: AlignLeft },
                                { id: 'center', icon: AlignCenter },
                                { id: 'right', icon: AlignRight }
                              ].map(({ id, icon: Icon }) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => handleChangeAlignment(colIdx, id)}
                                  className={`p-1 transition-colors ${
                                    tableData.alignments[colIdx] === id
                                      ? 'bg-indigo-500 text-white'
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                                  title={`Align ${id}`}
                                >
                                  <Icon className="w-3 h-3" />
                                </button>
                              ))}
                            </div>

                            {/* Move and Delete */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={colIdx === 0}
                                onClick={() => handleMoveColumn(colIdx, 'left')}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                                title="Move column left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={colIdx === tableData.headers.length - 1}
                                onClick={() => handleMoveColumn(colIdx, 'right')}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                                title="Move column right"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteColumn(colIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                                title="Delete column"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="w-24 p-2 text-center text-[11px] font-semibold text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
              )}

              {/* Body Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111622]">
                {tableData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 group">
                    {/* Row Index */}
                    <td className="p-2 text-center text-[11px] font-mono font-medium text-slate-400 border-r border-slate-200 dark:border-slate-800 select-none">
                      {rowIdx + 1}
                    </td>

                    {/* Cell Editors */}
                    {row.map((cell, colIdx) => {
                      const align = tableData.alignments[colIdx] || 'left';
                      const textAlignClass =
                        align === 'center'
                          ? 'text-center'
                          : align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <td
                          key={colIdx}
                          className="p-1.5 border-r border-slate-200 dark:border-slate-800"
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                            className={`w-full px-2.5 py-1 text-xs rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none transition-all ${textAlignClass}`}
                            placeholder="Empty"
                          />
                        </td>
                      );
                    })}

                    {/* Row Actions Toolbar */}
                    <td className="p-1.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={rowIdx === 0}
                          onClick={() => handleMoveRow(rowIdx, 'up')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Move row up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={rowIdx === tableData.rows.length - 1}
                          onClick={() => handleMoveRow(rowIdx, 'down')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Move row down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(rowIdx)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-500"
                          title="Duplicate row"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rowIdx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500"
                          title="Delete row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Footer Row */}
              {tableData.hasFooter && (
                <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="p-2 text-center text-[10px] font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      Total
                    </td>
                    {tableData.footers.map((footerCell, colIdx) => {
                      const align = tableData.alignments[colIdx] || 'left';
                      const textAlignClass =
                        align === 'center'
                          ? 'text-center'
                          : align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <td
                          key={colIdx}
                          className="p-1.5 border-r border-slate-200 dark:border-slate-800"
                        >
                          <input
                            type="text"
                            value={footerCell}
                            onChange={(e) => handleUpdateFooter(colIdx, e.target.value)}
                            className={`w-full px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${textAlignClass}`}
                            placeholder="Footer summary..."
                          />
                        </td>
                      );
                    })}
                    <td className="p-2 text-center text-[10px] text-slate-400">
                      Footer
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Styling Studio Controls */}
        <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <span>Table Visual Themes & Styling Studio</span>
            </h2>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {activeTheme.name} Theme Active
            </span>
          </div>

          {/* Theme Palette Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {TABLE_THEMES.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {theme.name}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </div>

                  {/* Micro color preview bar */}
                  <div className="h-2 rounded-full overflow-hidden flex shadow-xs border border-slate-200/60 dark:border-slate-700">
                    <div className="w-1/2 h-full" style={{ backgroundColor: theme.headerBg }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: theme.hoverBg }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Tuning Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {/* Style Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                <span>HTML Code Output Mode</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'inline', label: 'Inline CSS (WordPress & Emails)' },
                  { id: 'embedded_css', label: 'Embedded <style> Classes' },
                  { id: 'clean', label: 'Clean Semantic HTML (No Styles)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyleMode(item.id)}
                    className={`px-3 py-2 text-xs rounded-lg border text-left font-medium transition-all ${
                      styleMode === item.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cell Padding Density */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cell Padding Density</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'compact', label: 'Compact' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'relaxed', label: 'Relaxed' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCellPadding(p.id)}
                    className={`py-2 text-xs rounded-lg border text-center font-medium transition-all ${
                      cellPadding === p.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Border Radius Slider */}
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Rounded Corners</span>
                  <span className="font-mono font-bold">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="2"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Border Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Grid Borders</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'thin', label: 'Thin (1px)' },
                  { id: 'solid', label: 'Solid (2px)' }
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBorderStyle(b.id)}
                    className={`py-2 text-xs rounded-lg border text-center font-medium transition-all ${
                      borderStyle === b.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Table Width Toggle */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Table Width:</span>
                <button
                  type="button"
                  onClick={() => setFullWidth((prev) => !prev)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    fullWidth
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {fullWidth ? '100% Full Width' : 'Auto Content'}
                </button>
              </div>
            </div>

            {/* Interactive Effects Toggles */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                Visual Enhancements
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasStripedRows}
                    onChange={(e) => setHasStripedRows(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Striped Zebra Rows</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasHoverHighlight}
                    onChange={(e) => setHasHoverHighlight(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Hover Row Highlight</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isResponsive}
                    onChange={(e) => setIsResponsive(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Responsive Container (`overflow-x: auto`)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview & Multi-Format Code Output Studio */}
        <div className="bg-white dark:bg-[#111622] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col space-y-0">
          {/* Format Tabs & Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
            {/* Format Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {[
                { id: 'preview', label: 'Live Preview', icon: Eye },
                { id: 'html', label: 'HTML / CSS', icon: FileCode },
                { id: 'tailwind', label: 'Tailwind CSS', icon: Sparkles },
                { id: 'markdown', label: 'Markdown', icon: FileText },
                { id: 'csv', label: 'CSV / TSV', icon: FileSpreadsheet },
                { id: 'json', label: 'JSON Dataset', icon: FileJson }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveOutputTab(id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    activeOutputTab === id
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons: Copy, Download, Viewport Switcher */}
            <div className="flex items-center gap-2">
              {activeOutputTab === 'preview' && (
                <>
                  {/* Viewport Width Switcher */}
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                    {[
                      { id: 'desktop', icon: Laptop, title: 'Desktop (100%)' },
                      { id: 'tablet', icon: Tablet, title: 'Tablet (768px)' },
                      { id: 'mobile', icon: Smartphone, title: 'Mobile (420px)' }
                    ].map(({ id, icon: Icon, title }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPreviewViewport(id)}
                        className={`p-1.5 rounded transition-colors ${
                          previewViewport === id
                            ? 'bg-indigo-500 text-white'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={title}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>

                  {/* Light / Dark Preview Background Switch */}
                  <button
                    type="button"
                    onClick={() => setPreviewDarkBg((prev) => !prev)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    {previewDarkBg ? '🌙 Dark Frame' : '☀️ Light Frame'}
                  </button>
                </>
              )}

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownloadCode}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Active Content Body */}
          <div className="p-6">
            {activeOutputTab === 'preview' ? (
              /* Live Rendered HTML Table Sandbox */
              <div
                className={`w-full p-8 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center overflow-x-auto ${
                  previewDarkBg ? 'bg-[#090d16]' : 'bg-slate-100/70'
                }`}
              >
                <div
                  className="transition-all duration-300 w-full"
                  style={{
                    maxWidth:
                      previewViewport === 'mobile'
                        ? '420px'
                        : previewViewport === 'tablet'
                        ? '768px'
                        : '100%'
                  }}
                  dangerouslySetInnerHTML={{ __html: generatedCode }}
                />
              </div>
            ) : (
              /* Syntax Formatted Code Viewer */
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <textarea
                    readOnly
                    value={generatedCode}
                    className="w-full h-80 p-4 font-mono text-xs bg-slate-900 text-emerald-400 dark:text-emerald-300 selection:bg-indigo-500/30 resize-none focus:outline-none"
                    spellCheck="false"
                  />
                  <div className="absolute right-3 top-3 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded backdrop-blur-xs">
                    {generatedCode.split('\n').length} lines • {generatedCode.length.toLocaleString()} characters
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Data Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Data into HTML Table
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Import Format Tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {[
                  { id: 'csv', label: 'CSV / TSV' },
                  { id: 'json', label: 'JSON Array' },
                  { id: 'markdown', label: 'Markdown Table' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setImportFormat(fmt.id);
                      setImportError(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      importFormat === fmt.id
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleLoadImportSample}
                className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Sample</span>
              </button>
            </div>

            {/* Paste Textarea */}
            <div className="space-y-2 flex-1 flex flex-col">
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                placeholder={
                  importFormat === 'csv'
                    ? 'Paste comma-separated or tab-separated spreadsheet data here...'
                    : importFormat === 'json'
                    ? 'Paste JSON array of objects (e.g. [{"id": 1, "name": "Item"}]) here...'
                    : 'Paste Markdown table (e.g. | Header 1 | Header 2 |) here...'
                }
                className="w-full flex-1 min-h-[220px] p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              {importError && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                  {importError}
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importText.trim()}
                onClick={handleExecuteImport}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-500/20"
              >
                Parse & Populate Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
