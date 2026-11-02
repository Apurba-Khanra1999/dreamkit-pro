import React, { useState, useMemo, useCallback } from 'react';
import { 
  Copy, 
  Check, 
  RotateCw, 
  Trash2, 
  Sparkles, 
  Code2, 
  Eye, 
  Clock, 
  SlidersHorizontal,
  Pilcrow
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';
import { 
  generateLoremIpsum, 
  calculateTextMetrics, 
  LOREM_FLAVORS, 
  LOREM_PRESETS 
} from '../utils/loremIpsumUtils';

export default function LoremIpsumGenerator({ theme, onNotify }) {
  // Generator Parameters
  const [flavor, setFlavor] = useState('classic'); // 'classic' | 'tech' | 'hipster' | 'pirate' | 'corporate'
  const [unit, setUnit] = useState('paragraphs'); // 'paragraphs' | 'sentences' | 'words' | 'characters' | 'lists' | 'headings'
  const [count, setCount] = useState(3);
  const [format, setFormat] = useState('plain'); // 'plain' | 'html' | 'markdown' | 'json'
  const [htmlTag, setHtmlTag] = useState('p'); // 'p' | 'div' | 'blockquote'
  const [startWithLorem, setStartWithLorem] = useState(true);

  // View state: 'code' | 'preview'
  const [viewMode, setViewMode] = useState('code');
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState(0); // Used to trigger re-generation

  // Dynamic limits depending on unit
  const unitLimits = useMemo(() => {
    switch (unit) {
      case 'paragraphs':
        return { min: 1, max: 30, step: 1, default: 3 };
      case 'sentences':
        return { min: 1, max: 100, step: 1, default: 5 };
      case 'words':
        return { min: 5, max: 1000, step: 5, default: 50 };
      case 'characters':
        return { min: 20, max: 5000, step: 10, default: 280 };
      case 'lists':
        return { min: 1, max: 25, step: 1, default: 5 };
      case 'headings':
        return { min: 1, max: 15, step: 1, default: 3 };
      default:
        return { min: 1, max: 50, step: 1, default: 3 };
    }
  }, [unit]);

  // Generate output text based on parameters + seed
  const generatedText = useMemo(() => {
    // seed ensures re-generation when clicked even if options are unchanged
    if (seed < 0) return '';
    return generateLoremIpsum({
      unit,
      count,
      flavor,
      startWithLorem,
      format,
      htmlTag
    });
  }, [unit, count, flavor, startWithLorem, format, htmlTag, seed]);

  // Real-time Text Metrics
  const metrics = useMemo(() => {
    return calculateTextMetrics(generatedText);
  }, [generatedText]);

  // Re-generate trigger
  const handleRegenerate = useCallback(() => {
    setSeed(prev => prev + 1);
    onNotify?.({
      type: 'info',
      title: 'Regenerated',
      message: `Generated fresh ${count} ${unit} using ${flavor} vocabulary.`
    });
  }, [count, unit, flavor, onNotify]);

  // Apply Preset
  const handleApplyPreset = (preset) => {
    setUnit(preset.unit);
    setCount(preset.count);
    setFormat(preset.format);
    setSeed(prev => prev + 1);
    onNotify?.({
      type: 'success',
      title: `Preset Applied: ${preset.label}`,
      message: `${preset.description}.`
    });
  };

  // Copy helper
  const handleCopy = async () => {
    if (!generatedText) return;
    const ok = await copyToClipboard(generatedText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onNotify?.({
        type: 'success',
        title: 'Copied to Clipboard',
        message: `${metrics.wordCount} words copied.`
      });
    } else {
      onNotify?.({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not copy generated text.'
      });
    }
  };

  // Download handler
  const handleDownload = (ext = 'txt') => {
    if (!generatedText) return;
    let filename = `lorem-ipsum-${flavor}-${unit}.${ext}`;
    let mime = 'text/plain';

    if (ext === 'html') {
      mime = 'text/html';
    } else if (ext === 'json') {
      mime = 'application/json';
    } else if (ext === 'md') {
      mime = 'text/markdown';
    }

    downloadJsonFile(generatedText, filename, mime);
    onNotify?.({
      type: 'success',
      title: 'File Downloaded',
      message: `Saved as ${filename}.`
    });
  };

  // Clear output
  const handleClear = () => {
    setSeed(-1);
    onNotify?.({ type: 'info', title: 'Cleared', message: 'Workspace cleared.' });
  };

  // Editor language according to format
  const editorLanguage = useMemo(() => {
    switch (format) {
      case 'html': return 'html';
      case 'json': return 'json';
      case 'markdown': return 'markdown';
      case 'plain':
      default: return 'text';
    }
  }, [format]);

  return (
    <div className="w-full space-y-6">
      {/* Preset Pills Header */}
      <div className="bg-white dark:bg-[#0c111a] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Generation Presets:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {LOREM_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all shrink-0 whitespace-nowrap shadow-2xs"
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Vocabulary Flavor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Pilcrow className="w-3.5 h-3.5 text-indigo-500" />
              <span>Vocabulary & Flavor</span>
            </label>
            <select
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {LOREM_FLAVORS.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {LOREM_FLAVORS.find(f => f.id === flavor)?.description}
            </p>
          </div>

          {/* 2. Unit Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Unit of Measure</span>
            </label>
            <select
              value={unit}
              onChange={(e) => {
                const newUnit = e.target.value;
                setUnit(newUnit);
                // Clamp count to new unit defaults
                if (newUnit === 'words') setCount(50);
                else if (newUnit === 'characters') setCount(280);
                else if (newUnit === 'sentences') setCount(5);
                else if (newUnit === 'lists') setCount(5);
                else if (newUnit === 'headings') setCount(3);
                else setCount(3);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium capitalize"
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
              <option value="characters">Characters / Bytes</option>
              <option value="lists">Bullet Lists (&lt;ul&gt;)</option>
              <option value="headings">Headings (Title Case)</option>
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Generating in {unit}
            </p>
          </div>

          {/* 3. Output Format Syntax */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Output Format</span>
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="plain">Plain Text</option>
              <option value="html">HTML Elements</option>
              <option value="markdown">Markdown</option>
              <option value="json">JSON String Array</option>
            </select>

            {format === 'html' && unit === 'paragraphs' ? (
              <div className="flex items-center gap-1 pt-0.5">
                <span className="text-[10px] text-slate-400">Tag:</span>
                {['p', 'div', 'blockquote'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHtmlTag(t)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      htmlTag === t
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    &lt;{t}&gt;
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                Format: {format}
              </p>
            )}
          </div>

          {/* 4. Options & Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white">
              Options
            </label>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Start with standard opener</span>
              </label>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                {flavor === 'classic'
                  ? 'Starts with "Lorem ipsum dolor sit amet..."'
                  : 'Starts with theme hallmark sentence'}
              </div>
            </div>
          </div>

        </div>

        {/* Quantity Slider Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Quantity ({unit})
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={unitLimits.min}
                max={unitLimits.max}
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setCount(Math.max(unitLimits.min, Math.min(val, unitLimits.max)));
                  }
                }}
                className="w-20 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400">{unit}</span>
            </div>
          </div>

          <input
            type="range"
            min={unitLimits.min}
            max={unitLimits.max}
            step={unitLimits.step}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Real-time Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Words</span>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {metrics.wordCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Characters</span>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {metrics.charCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chars (No Space)</span>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {metrics.charNoSpaces.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sentences</span>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
            {metrics.sentenceCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Reading Time</span>
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {metrics.readingTime}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Speaking Time</span>
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {metrics.speakingTime}
          </div>
        </div>
      </div>

      {/* Output Panel with Dual View (Editor & Live Preview) */}
      <div className="bg-white dark:bg-[#0c111a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        
        {/* Panel Header & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'code'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Source / Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Rendered Preview</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Regenerate */}
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Regenerate</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            {/* Download Dropdown */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => handleDownload('txt')}
                className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Download as .txt"
              >
                .txt
              </button>
              <button
                type="button"
                onClick={() => handleDownload('html')}
                className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Download as .html"
              >
                .html
              </button>
              <button
                type="button"
                onClick={() => handleDownload('md')}
                className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Download as .md"
              >
                .md
              </button>
              <button
                type="button"
                onClick={() => handleDownload('json')}
                className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Download as .json"
              >
                .json
              </button>
            </div>

            {/* Clear */}
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Clear text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === 'code' ? (
          <div className="h-[360px] w-full">
            <CodeEditor
              value={generatedText}
              readOnly={false}
              onChange={() => {}}
              height="360px"
              language={editorLanguage}
              theme={theme}
            />
          </div>
        ) : (
          <div className="min-h-[360px] max-h-[500px] overflow-y-auto p-6 bg-white dark:bg-[#0c111a] text-slate-900 dark:text-slate-100 leading-relaxed space-y-4 no-scrollbar">
            {format === 'html' ? (
              <div 
                className="prose dark:prose-invert max-w-none text-sm space-y-3"
                dangerouslySetInnerHTML={{ __html: generatedText }}
              />
            ) : unit === 'headings' ? (
              <div className="space-y-4">
                {generatedText.split('\n\n').map((h, i) => (
                  <h2 key={i} className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    {h}
                  </h2>
                ))}
              </div>
            ) : unit === 'lists' ? (
              <ul className="list-disc pl-5 space-y-1.5 text-sm marker:text-indigo-500">
                {generatedText.split('\n').map((item, i) => (
                  <li key={i} className="leading-snug">{item.replace(/^[•\s*-]+/, '')}</li>
                ))}
              </ul>
            ) : (
              <div className="space-y-4 text-sm leading-relaxed">
                {generatedText.split('\n\n').map((para, i) => (
                  <p key={i} className="text-slate-700 dark:text-slate-300">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
