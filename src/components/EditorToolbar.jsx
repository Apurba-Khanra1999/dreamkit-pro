import React, { useRef } from 'react';
import { 
  FileText, 
  Trash2, 
  Upload, 
  ClipboardPaste, 
  Sparkles,
  AlignLeft
} from 'lucide-react';
import { formatBytes } from '../utils/jsonUtils';
import { readUploadedJsonFile } from '../utils/fileUtils';

export default function EditorToolbar({
  title = "Input JSON",
  value = "",
  onClear,
  onLoadSample,
  onUploadContent,
  onPaste,
  indent,
  onChangeIndent,
  showIndentSelector = false,
  onNotify,
}) {
  const fileInputRef = useRef(null);

  const charCount = value.length;
  const lineCount = value ? value.split('\n').length : 0;
  const byteSize = new Blob([value]).size;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { content, warning, fileName } = await readUploadedJsonFile(file);
      onUploadContent(content);
      if (warning) {
        onNotify?.({ type: 'warning', title: 'Large File Warning', message: warning });
      } else {
        onNotify?.({ type: 'success', title: 'File Loaded', message: `Successfully loaded ${fileName}` });
      }
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      // Reset input so same file can be reloaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasteClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onPaste?.(text);
          onNotify?.({ type: 'info', title: 'Pasted', message: 'Pasted content from clipboard' });
          return;
        }
      }
      onNotify?.({ type: 'info', title: 'Paste Hint', message: 'Use Ctrl+V or Cmd+V to paste directly into the editor.' });
    } catch {
      onNotify?.({ type: 'info', title: 'Paste Hint', message: 'Use Ctrl+V or Cmd+V to paste into the editor.' });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-xl text-xs font-medium">
      {/* Title & Metadata */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-sm">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>{title}</span>
        </div>

        {charCount > 0 && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <span className="hidden sm:inline">•</span>
            <span>{charCount.toLocaleString()} chars</span>
            <span>•</span>
            <span>{lineCount.toLocaleString()} {lineCount === 1 ? 'line' : 'lines'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{formatBytes(byteSize)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Indentation Selector (Formatter Only) */}
        {showIndentSelector && (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 mr-1 shadow-sm">
            <span className="px-1.5 text-slate-400 dark:text-slate-500 flex items-center" title="Indentation">
              <AlignLeft className="w-3.5 h-3.5" />
            </span>
            <button
              type="button"
              onClick={() => onChangeIndent('2')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                indent === '2'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="2 spaces indentation"
            >
              2 Sp
            </button>
            <button
              type="button"
              onClick={() => onChangeIndent('4')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                indent === '4'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="4 spaces indentation"
            >
              4 Sp
            </button>
            <button
              type="button"
              onClick={() => onChangeIndent('tab')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                indent === 'tab' || indent === '\t'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tab indentation"
            >
              Tab
            </button>
          </div>
        )}

        {/* Sample Button */}
        {onLoadSample && (
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-600 transition-colors shadow-sm"
            title="Load realistic sample JSON"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample</span>
          </button>
        )}

        {/* Upload Button */}
        {onUploadContent && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.txt,application/json,text/plain"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-600 transition-colors shadow-sm"
              title="Upload .json file from computer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Upload</span>
            </button>
          </>
        )}

        {/* Paste Button */}
        {onPaste && (
          <button
            type="button"
            onClick={handlePasteClick}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-slate-600 transition-colors shadow-sm"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Paste</span>
          </button>
        )}

        {/* Clear Button */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={!value}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear editor input"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}
