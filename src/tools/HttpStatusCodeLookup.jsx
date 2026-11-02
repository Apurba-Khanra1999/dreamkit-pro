import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Server, 
  Send, 
  RotateCcw, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Download, 
  ChevronRight, 
  Code2, 
  Clock, 
  LayoutGrid, 
  List,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile } from '../utils/fileUtils';
import { 
  HTTP_STATUS_CODES, 
  STATUS_CATEGORIES, 
  getStatusColor, 
  generateStatusCodeSnippet, 
  DECISION_TREE, 
  exportAsMarkdown, 
  exportAsCsv, 
  exportAsJson 
} from '../utils/httpStatusCodes';

// Preset test endpoints for Live Status Prober
const PROBER_PRESETS = [
  { label: '200 OK (httpbin)', url: 'https://httpbin.org/status/200', method: 'GET' },
  { label: '201 Created (httpbin)', url: 'https://httpbin.org/status/201', method: 'POST' },
  { label: '204 No Content (httpbin)', url: 'https://httpbin.org/status/204', method: 'DELETE' },
  { label: '302 Found (httpbin)', url: 'https://httpbin.org/status/302', method: 'GET' },
  { label: '400 Bad Request (httpbin)', url: 'https://httpbin.org/status/400', method: 'GET' },
  { label: '401 Unauthorized (httpbin)', url: 'https://httpbin.org/status/401', method: 'GET' },
  { label: '403 Forbidden (httpbin)', url: 'https://httpbin.org/status/403', method: 'GET' },
  { label: '404 Not Found (httpbin)', url: 'https://httpbin.org/status/404', method: 'GET' },
  { label: '429 Rate Limit (httpbin)', url: 'https://httpbin.org/status/429', method: 'GET' },
  { label: '500 Server Error (httpbin)', url: 'https://httpbin.org/status/500', method: 'GET' },
  { label: 'GitHub Zen API', url: 'https://api.github.com/zen', method: 'GET' }
];

export default function HttpStatusCodeLookup({ theme, onNotify }) {
  // Navigation tabs: 'directory' | 'decision' | 'prober'
  const [activeTab, setActiveTab] = useState('directory');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cacheableOnly, setCacheableOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Inspector State: default to 200 OK
  const [selectedCode, setSelectedCode] = useState(200);
  const [selectedCodeLang, setSelectedCodeLang] = useState('javascript');
  const [copiedKey, setCopiedKey] = useState(null);

  // Decision Tree Wizard State
  const [decisionHistory, setDecisionHistory] = useState(['root']);
  const [finalRecommendation, setFinalRecommendation] = useState(null);

  // Live Prober State
  const [probeUrl, setProbeUrl] = useState('https://httpbin.org/status/200');
  const [probeMethod, setProbeMethod] = useState('GET');
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);
  const [probeError, setProbeError] = useState(null);

  // Active status metadata
  const currentStatus = useMemo(() => {
    return HTTP_STATUS_CODES.find(s => s.code === selectedCode) || HTTP_STATUS_CODES[4]; // 200 OK default
  }, [selectedCode]);

  // Filtered status codes list
  const filteredCodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HTTP_STATUS_CODES.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Cacheable filter
      if (cacheableOnly && !item.cacheable) {
        return false;
      }
      // Search query filter (matches code number, reason phrase, summary, or description)
      if (q) {
        const matchesCode = String(item.code).includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesRfc = item.rfc.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesSummary && !matchesDesc && !matchesRfc) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedCategory, cacheableOnly]);

  // Copy helper with feedback
  const handleCopy = useCallback(async (text, key = 'generic', label = 'Copied') => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      onNotify?.({ type: 'success', title: 'Copied to Clipboard', message: `${label} copied.` });
    } else {
      onNotify?.({ type: 'error', title: 'Copy Failed', message: 'Unable to copy to clipboard.' });
    }
  }, [onNotify]);

  // Export handlers
  const handleExport = (format) => {
    if (format === 'markdown') {
      const content = exportAsMarkdown(filteredCodes);
      downloadJsonFile(content, 'http-status-codes.md', 'text/markdown');
      onNotify?.({ type: 'success', title: 'Exported Markdown', message: `Downloaded ${filteredCodes.length} codes as Markdown table.` });
    } else if (format === 'csv') {
      const content = exportAsCsv(filteredCodes);
      downloadJsonFile(content, 'http-status-codes.csv', 'text/csv');
      onNotify?.({ type: 'success', title: 'Exported CSV', message: `Downloaded ${filteredCodes.length} codes as CSV.` });
    } else if (format === 'json') {
      const content = exportAsJson(filteredCodes);
      downloadJsonFile(content, 'http-status-codes.json', 'application/json');
      onNotify?.({ type: 'success', title: 'Exported JSON', message: `Downloaded ${filteredCodes.length} codes as JSON.` });
    }
  };

  // Decision Tree navigation
  const currentNodeId = decisionHistory[decisionHistory.length - 1];
  const currentNode = currentNodeId === 'root' ? DECISION_TREE : DECISION_TREE.nodes[currentNodeId];

  const handleDecisionSelect = (option) => {
    if (option.recommendation) {
      setFinalRecommendation({
        code: option.recommendation,
        hint: option.hint,
        reason: option.label
      });
    } else if (option.next) {
      setDecisionHistory(prev => [...prev, option.next]);
    }
  };

  const handleDecisionReset = () => {
    setDecisionHistory(['root']);
    setFinalRecommendation(null);
  };

  const handleDecisionBack = () => {
    if (finalRecommendation) {
      setFinalRecommendation(null);
    } else if (decisionHistory.length > 1) {
      setDecisionHistory(prev => prev.slice(0, prev.length - 1));
    }
  };

  // Jump to code from recommendation or prober
  const handleJumpToCode = (code) => {
    setSelectedCode(code);
    setActiveTab('directory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNotify?.({ type: 'info', title: `Loaded HTTP ${code}`, message: `Viewing full specifications for HTTP ${code}.` });
  };

  // Execute Live HTTP Probe
  const handleProbeEndpoint = async () => {
    if (!probeUrl.trim()) return;
    setIsProbing(true);
    setProbeResult(null);
    setProbeError(null);

    const startTime = performance.now();
    try {
      const options = {
        method: probeMethod,
        headers: {
          'Accept': '*/*'
        }
      };

      const response = await fetch(probeUrl.trim(), options);
      const latencyMs = Math.round(performance.now() - startTime);

      // Collect response headers
      const headersObj = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });

      // Try reading body preview
      let bodyText = '';
      try {
        const text = await response.text();
        // Try pretty formatting if JSON
        try {
          const parsed = JSON.parse(text);
          bodyText = JSON.stringify(parsed, null, 2);
        } catch {
          bodyText = text.slice(0, 3000); // Limit length
        }
      } catch {
        bodyText = '[Unable to read body stream]';
      }

      setProbeResult({
        status: response.status,
        statusText: response.statusText || 'Response Received',
        latencyMs,
        headers: headersObj,
        body: bodyText,
        ok: response.ok
      });

      onNotify?.({
        type: response.ok ? 'success' : 'info',
        title: `HTTP ${response.status} ${response.statusText}`,
        message: `Probe finished in ${latencyMs}ms.`
      });
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      setProbeError({
        message: err.message || 'Network request failed (possibly blocked by CORS or network timeout).',
        latencyMs
      });
      onNotify?.({
        type: 'error',
        title: 'Probe Failed',
        message: 'Request could not reach the target URL. Check CORS or URL validity.'
      });
    } finally {
      setIsProbing(false);
    }
  };

  // Server code snippet
  const serverCodeSnippet = useMemo(() => {
    return generateStatusCodeSnippet(currentStatus.code, selectedCodeLang);
  }, [currentStatus.code, selectedCodeLang]);

  // Color tokens for currently inspected status
  const currentColors = useMemo(() => {
    return getStatusColor(currentStatus.code);
  }, [currentStatus.code]);

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Status Code Registry ({HTTP_STATUS_CODES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'decision'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-500" />
            <span>Which Code to Return? (Decision Tree)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prober')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'prober'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live Endpoint Prober</span>
          </button>
        </div>

        {/* Export Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleExport('markdown')}
              title="Export as Markdown Table"
              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              title="Export as JSON"
              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              title="Export as CSV"
              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: STATUS CODE DIRECTORY ================= */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search, Categories, and View Controls */}
          <div className="space-y-3 bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Top row: search + view switch */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code (e.g. 404, 201), phrase (e.g. Not Found), or keywords (timeout, auth, rate limit)..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Cacheable filter checkbox */}
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={cacheableOnly}
                    onChange={(e) => setCacheableOnly(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Cacheable Only</span>
                </label>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {STATUS_CATEGORIES.map((cat) => {
                const count = cat.id === 'all' 
                  ? HTTP_STATUS_CODES.length 
                  : HTTP_STATUS_CODES.filter(s => s.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected 
                        ? 'bg-white/20 dark:bg-slate-900/20 text-current font-bold' 
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Layout: Left Status List / Grid + Right Deep Dive Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Codes Catalog (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Showing <strong>{filteredCodes.length}</strong> status code{filteredCodes.length === 1 ? '' : 's'}</span>
                {filteredCodes.length === 0 && (
                  <span className="text-rose-500">No matching status codes found</span>
                )}
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[720px] overflow-y-auto pr-1 no-scrollbar">
                  {filteredCodes.map((item) => {
                    const colors = getStatusColor(item.code);
                    const isSelected = item.code === selectedCode;

                    return (
                      <div
                        key={item.code}
                        onClick={() => setSelectedCode(item.code)}
                        className={`group cursor-pointer p-3.5 rounded-2xl border transition-all text-left relative ${
                          isSelected
                            ? `bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/20`
                            : 'bg-white dark:bg-[#0c111a] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-sm ${colors.badge}`}>
                              {item.code}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[140px]">
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.cacheable && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20" title="Cacheable by default">
                                Cacheable
                              </span>
                            )}
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'}`} />
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="font-mono">{item.rfc.split(',')[0]}</span>
                          <span className="capitalize">{item.categoryName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="bg-white dark:bg-[#0c111a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[720px] overflow-y-auto no-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider z-10">
                        <tr>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Phrase</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Specification</th>
                          <th className="py-2.5 px-3">Cache</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {filteredCodes.map((item) => {
                          const colors = getStatusColor(item.code);
                          const isSelected = item.code === selectedCode;

                          return (
                            <tr
                              key={item.code}
                              onClick={() => setSelectedCode(item.code)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold">
                                <span className={`px-2 py-0.5 rounded ${colors.badge}`}>
                                  {item.code}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-900 dark:text-white font-semibold">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                                {item.categoryName}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                                {item.rfc}
                              </td>
                              <td className="py-2.5 px-3">
                                {item.cacheable ? (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">No</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(String(item.code), `code_${item.code}`, `HTTP ${item.code}`);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                  title="Copy status code"
                                >
                                  {copiedKey === `code_${item.code}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Deep-Dive Status Inspector (5 cols on desktop, sticky) */}
            <div className="lg:col-span-5 sticky top-6 space-y-4">
              <div className="bg-white dark:bg-[#0c111a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
                {/* Header: Code number + name */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl font-mono font-black text-2xl tracking-tight ${currentColors.badge}`}>
                        {currentStatus.code}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {currentStatus.categoryName}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-1">
                      {currentStatus.name}
                    </h2>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(`${currentStatus.code} ${currentStatus.name}`, 'header', 'Status Line')}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Copy Status Line (e.g. 200 OK)"
                    >
                      {copiedKey === 'header' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {currentStatus.rfcUrl && (
                      <a
                        href={currentStatus.rfcUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Read official RFC specification"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Primary Meaning & RFC */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">RFC Standard:</span>
                    <a
                      href={currentStatus.rfcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-mono hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>{currentStatus.rfc}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    {currentStatus.description}
                  </p>
                </div>

                {/* Cacheability Directive */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${currentStatus.cacheable ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentStatus.cacheable ? 'Cacheable by Default: ' : 'Non-Cacheable: '}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {currentStatus.cacheableNote}
                    </span>
                  </div>
                </div>

                {/* Common Causes & When to Use */}
                {currentStatus.commonCauses && currentStatus.commonCauses.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      <span>When to Return / Common Scenarios</span>
                    </h3>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-4 list-disc marker:text-indigo-500">
                      {currentStatus.commonCauses.map((cause, idx) => (
                        <li key={idx} className="leading-snug">{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* How to Fix / Resolve */}
                {currentStatus.howToFix && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Troubleshooting & Resolution</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-900/40 p-2.5 rounded-xl">
                      {currentStatus.howToFix}
                    </p>
                  </div>
                )}

                {/* Standard Associated Headers */}
                {currentStatus.headers && currentStatus.headers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Associated HTTP Headers
                    </h3>
                    <div className="space-y-1.5">
                      {currentStatus.headers.map((h, i) => (
                        <div key={i} className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {h.header}
                            </span>
                            {h.example && (
                              <code className="text-[10px] text-slate-400 font-mono bg-slate-200/60 dark:bg-slate-800 px-1 rounded">
                                {h.example}
                              </code>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {h.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example Response Payload */}
                {currentStatus.exampleResponse && currentStatus.exampleResponse.body && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Example Response Body</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopy(
                          typeof currentStatus.exampleResponse.body === 'object' 
                            ? JSON.stringify(currentStatus.exampleResponse.body, null, 2) 
                            : String(currentStatus.exampleResponse.body),
                          'body',
                          'Example Body'
                        )}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'body' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Body</span>
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <CodeEditor
                        value={
                          typeof currentStatus.exampleResponse.body === 'object'
                            ? JSON.stringify(currentStatus.exampleResponse.body, null, 2)
                            : String(currentStatus.exampleResponse.body)
                        }
                        readOnly={true}
                        height="140px"
                        language="json"
                        theme={theme}
                      />
                    </div>
                  </div>
                )}

                {/* Server Implementation Snippets */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Server Implementation Snippet
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleCopy(serverCodeSnippet, 'snippet', `${selectedCodeLang.toUpperCase()} Snippet`)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Snippet</span>
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'javascript', label: 'Node (Express)' },
                      { id: 'python', label: 'FastAPI' },
                      { id: 'go', label: 'Go' },
                      { id: 'csharp', label: 'C# ASP.NET' },
                      { id: 'rust', label: 'Rust (Axum)' },
                      { id: 'php', label: 'PHP' }
                    ].map(lang => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedCodeLang(lang.id)}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          selectedCodeLang === lang.id
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <CodeEditor
                      value={serverCodeSnippet}
                      readOnly={true}
                      height="130px"
                      language={selectedCodeLang === 'javascript' ? 'javascript' : selectedCodeLang === 'python' ? 'python' : 'text'}
                      theme={theme}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DECISION TREE WIZARD ================= */}
      {activeTab === 'decision' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#0c111a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Which HTTP Status Code Should You Return?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      RFC-accurate interactive decision tree for REST APIs and backend developers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {decisionHistory.length > 1 && !finalRecommendation && (
                  <button
                    type="button"
                    onClick={handleDecisionBack}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDecisionReset}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Over</span>
                </button>
              </div>
            </div>

            {/* If Final Recommendation is reached */}
            {finalRecommendation ? (
              <div className="space-y-6 py-4 animate-in fade-in duration-200">
                <div className="text-center space-y-3">
                  <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      RFC Recommended Status Code
                    </span>
                    <h3 className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
                      HTTP {finalRecommendation.code}
                    </h3>
                  </div>
                </div>

                {/* Detailed Recommendation Card */}
                {(() => {
                  const recMeta = HTTP_STATUS_CODES.find(s => s.code === finalRecommendation.code);
                  const colors = getStatusColor(finalRecommendation.code);

                  return (
                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-sm ${colors.badge}`}>
                            {finalRecommendation.code}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {recMeta?.name || 'Recommended'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {recMeta?.rfc}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {finalRecommendation.hint}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {recMeta?.description}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleJumpToCode(finalRecommendation.code)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                        >
                          <span>View Full Code Specs & Snippets</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(finalRecommendation.code), 'rec_code', `HTTP ${finalRecommendation.code}`)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy HTTP {finalRecommendation.code}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Question Step */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Step {decisionHistory.length} of Decision Flow</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentNode.question}
                </h3>

                {/* Option cards */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {currentNode.options.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDecisionSelect(option)}
                      className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c111a] hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {option.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {option.description}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= TAB 3: LIVE ENDPOINT STATUS PROBER ================= */}
      {activeTab === 'prober' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#0c111a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Live HTTP Status Code Prober
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Test live URLs, inspect HTTP status codes, measure latency, and view response headers.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Quick Test Endpoints:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PROBER_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setProbeUrl(p.url);
                      setProbeMethod(p.method);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Probe URL & Method Input Bar */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <select
                value={probeMethod}
                onChange={(e) => setProbeMethod(e.target.value)}
                className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shrink-0"
              >
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>

              <input
                type="url"
                value={probeUrl}
                onChange={(e) => setProbeUrl(e.target.value)}
                placeholder="https://api.example.com/v1/health"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={handleProbeEndpoint}
                disabled={isProbing || !probeUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
              >
                {isProbing ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Probing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>

            {/* Probe Error Alert */}
            {probeError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Request Failed / CORS Blocked</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {probeError.message}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Note: In-browser HTTP requests require target servers to enable Cross-Origin Resource Sharing (CORS) with <code className="font-mono">Access-Control-Allow-Origin: *</code>. Try using the preset endpoints above which are CORS-enabled.
                </p>
              </div>
            )}

            {/* Probe Results */}
            {probeResult && (
              <div className="space-y-5 animate-in fade-in duration-200 border-t border-slate-100 dark:border-slate-800 pt-5">
                {/* Result Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl font-mono font-black text-lg ${getStatusColor(probeResult.status).badge}`}>
                      {probeResult.status}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {probeResult.statusText}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {probeResult.ok ? 'Successful HTTP Response' : 'Non-2xx Status Code'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{probeResult.latencyMs} ms</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJumpToCode(probeResult.status)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>Lookup Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Response Headers Table */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Response Headers ({Object.keys(probeResult.headers).length})
                  </span>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 font-mono text-xs no-scrollbar">
                    {Object.keys(probeResult.headers).length === 0 ? (
                      <span className="text-slate-400 text-xs p-2">No headers exposed by CORS policy.</span>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(probeResult.headers).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-2 py-0.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">{k}:</span>
                            <span className="text-slate-700 dark:text-slate-300 break-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Response Body Preview */}
                {probeResult.body && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Response Body
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(probeResult.body, 'probe_body', 'Response Body')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'probe_body' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Response</span>
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <CodeEditor
                        value={probeResult.body}
                        readOnly={true}
                        height="180px"
                        language="json"
                        theme={theme}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
