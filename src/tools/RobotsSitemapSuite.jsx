import React, { useState, useMemo, useCallback } from 'react';
import { 
  Bot, 
  FileCode, 
  Compass, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowRight, 
  ShieldAlert, 
  Search,
  RotateCcw
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { 
  POPULAR_CRAWLERS, 
  ROBOTS_PRESETS, 
  SAMPLE_SITEMAP_XML, 
  testRobotsUrl, 
  generateRobotsTxt, 
  generateXmlSitemap, 
  validateXmlSitemap, 
  VALID_CHANGEFREQS 
} from '../utils/robotsSitemapUtils';

export default function RobotsSitemapSuite({ theme, onNotify }) {
  // Main Suite Navigation: 'tester' | 'robots_gen' | 'sitemap_gen' | 'validator'
  const [activeTab, setActiveTab] = useState('tester');
  const [copiedKey, setCopiedKey] = useState(null);

  // ==========================================
  // TAB 1: ROBOTS.TXT TESTER STATE
  // ==========================================
  const [testerRobotsContent, setTesterRobotsContent] = useState(ROBOTS_PRESETS[2].content);
  const [testerUserAgent, setTesterUserAgent] = useState('*');
  const [testerUrl, setTesterUrl] = useState('https://example.com/admin/login');

  const testResult = useMemo(() => {
    return testRobotsUrl(testerRobotsContent, testerUrl, testerUserAgent);
  }, [testerRobotsContent, testerUrl, testerUserAgent]);

  // ==========================================
  // TAB 2: ROBOTS.TXT GENERATOR STATE
  // ==========================================
  const [genUserAgent, setGenUserAgent] = useState('*');
  const [genAllows, setGenAllows] = useState(['/api/public/']);
  const [genDisallows, setGenDisallows] = useState(['/admin/', '/api/private/', '/dashboard/']);
  const [genCrawlDelay, setGenCrawlDelay] = useState('');
  const [genSitemaps, setGenSitemaps] = useState(['https://example.com/sitemap.xml']);
  const [blockAiBots, setBlockAiBots] = useState(false);

  const [newAllowInput, setNewAllowInput] = useState('');
  const [newDisallowInput, setNewDisallowInput] = useState('');
  const [newSitemapInput, setNewSitemapInput] = useState('');

  const generatedRobotsTxt = useMemo(() => {
    const customRules = blockAiBots ? [
      { agent: 'GPTBot', disallowAll: true, label: 'OpenAI GPTBot' },
      { agent: 'ChatGPT-User', disallowAll: true, label: 'ChatGPT Browsing' },
      { agent: 'CCBot', disallowAll: true, label: 'Common Crawl' },
      { agent: 'Claude-Web', disallowAll: true, label: 'Anthropic Claude' },
      { agent: 'Google-Extended', disallowAll: true, label: 'Google Gemini Training' },
      { agent: 'Bytespider', disallowAll: true, label: 'ByteDance AI' }
    ] : [];

    return generateRobotsTxt({
      userAgents: [genUserAgent],
      allows: genAllows,
      disallows: genDisallows,
      crawlDelay: genCrawlDelay ? parseFloat(genCrawlDelay) : null,
      sitemaps: genSitemaps,
      customRules
    });
  }, [genUserAgent, genAllows, genDisallows, genCrawlDelay, genSitemaps, blockAiBots]);

  // ==========================================
  // TAB 3: XML SITEMAP GENERATOR STATE
  // ==========================================
  const [sitemapBaseUrl, setSitemapBaseUrl] = useState('https://example.com');
  const [sitemapEntries, setSitemapEntries] = useState([
    { loc: 'https://example.com/', lastmod: '2026-10-30', changefreq: 'daily', priority: '1.0' },
    { loc: 'https://example.com/products', lastmod: '2026-10-28', changefreq: 'weekly', priority: '0.8' },
    { loc: 'https://example.com/blog/seo-guide', lastmod: '2026-10-25', changefreq: 'monthly', priority: '0.7' },
    { loc: 'https://example.com/contact', lastmod: '2026-10-01', changefreq: 'yearly', priority: '0.3' }
  ]);
  const [isSitemapIndex, setIsSitemapIndex] = useState(false);
  const [bulkUrlText, setBulkUrlText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Add single URL state
  const [newUrlLoc, setNewUrlLoc] = useState('');
  const [newUrlFreq, setNewUrlFreq] = useState('weekly');
  const [newUrlPriority, setNewUrlPriority] = useState('0.8');

  const generatedSitemapXml = useMemo(() => {
    return generateXmlSitemap(sitemapEntries, { isIndex: isSitemapIndex });
  }, [sitemapEntries, isSitemapIndex]);

  // ==========================================
  // TAB 4: SITEMAP.XML VALIDATOR STATE
  // ==========================================
  const [validatorXmlInput, setValidatorXmlInput] = useState(SAMPLE_SITEMAP_XML);
  const [validatorSearchFilter, setValidatorSearchFilter] = useState('');

  const validationResult = useMemo(() => {
    return validateXmlSitemap(validatorXmlInput);
  }, [validatorXmlInput]);

  const filteredValidatorUrls = useMemo(() => {
    if (!validatorSearchFilter.trim()) return validationResult.urls;
    const q = validatorSearchFilter.toLowerCase();
    return validationResult.urls.filter(u => u.loc.toLowerCase().includes(q));
  }, [validationResult.urls, validatorSearchFilter]);

  // ==========================================
  // SHARED HANDLERS
  // ==========================================
  const handleCopy = useCallback(async (text, key = 'generic', label = 'Content') => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      onNotify?.({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
    } else {
      onNotify?.({ type: 'error', title: 'Copy Failed', message: 'Unable to copy to clipboard.' });
    }
  }, [onNotify]);

  const handleDownload = (content, filename, mime = 'text/plain') => {
    if (!content) return;
    downloadJsonFile(content, filename, mime);
    onNotify?.({ type: 'success', title: 'File Downloaded', message: `Saved as ${filename}.` });
  };

  // Upload sitemap file for validation
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await readUploadedJsonFile(file);
      setValidatorXmlInput(res.content);
      onNotify?.({ type: 'success', title: 'File Uploaded', message: `Loaded ${file.name} for validation.` });
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Upload Failed', message: err.message });
    }
  };

  // Bulk add URLs to Sitemap Generator
  const handleProcessBulkUrls = () => {
    if (!bulkUrlText.trim()) return;
    const lines = bulkUrlText.split('\n').map(l => l.trim()).filter(Boolean);
    const today = new Date().toISOString().split('T')[0];

    const newEntries = lines.map(line => {
      let loc = line;
      if (!/^https?:\/\//i.test(loc)) {
        loc = sitemapBaseUrl.replace(/\/+$/, '') + '/' + loc.replace(/^\/+/, '');
      }
      return {
        loc,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8'
      };
    });

    setSitemapEntries(prev => [...prev, ...newEntries]);
    setBulkUrlText('');
    setShowBulkModal(false);
    onNotify?.({
      type: 'success',
      title: 'Bulk URLs Ingested',
      message: `Added ${newEntries.length} URL entries to your sitemap.`
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Suite Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('tester')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'tester'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Robots.txt Tester</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('robots_gen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'robots_gen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Robots.txt Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sitemap_gen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'sitemap_gen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-500" />
            <span>XML Sitemap Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'validator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Sitemap.xml Validator</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[11px] font-mono text-slate-400">RFC 9309 & Sitemaps 0.9</span>
        </div>
      </div>

      {/* ==========================================
          TAB 1: ROBOTS.TXT TESTER & DEBUGGER
      ========================================== */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Editor & Presets (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Robots.txt Source Code
                  </h2>
                </div>

                {/* Presets dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Load Preset:</span>
                  <select
                    onChange={(e) => {
                      const p = ROBOTS_PRESETS.find(x => x.id === e.target.value);
                      if (p) {
                        setTesterRobotsContent(p.content);
                        onNotify?.({ type: 'info', title: 'Preset Loaded', message: p.name });
                      }
                    }}
                    defaultValue="standard_app"
                    className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    {ROBOTS_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Code Editor */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <CodeEditor
                  value={testerRobotsContent}
                  onChange={setTesterRobotsContent}
                  height="380px"
                  language="text"
                  theme={theme}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  {testerRobotsContent.split('\n').length} lines
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(testerRobotsContent, 'tester_robots', 'Robots.txt')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === 'tester_robots' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(testerRobotsContent, 'robots.txt')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: URL Testing Controller & RFC 9309 Verdict (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Tester Box */}
            <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                <span>Simulate Crawler Access</span>
              </h2>

              {/* User-Agent Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Select User-Agent
                </label>
                <select
                  value={testerUserAgent}
                  onChange={(e) => setTesterUserAgent(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {POPULAR_CRAWLERS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Test URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Target URL / Path
                </label>
                <input
                  type="text"
                  value={testerUrl}
                  onChange={(e) => setTesterUrl(e.target.value)}
                  placeholder="https://example.com/admin/login or /private"
                  className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Test Verdict Banner */}
              <div className={`p-5 rounded-2xl border transition-all ${
                testResult.allowed
                  ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-500/10 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100'
              }`}>
                <div className="flex items-center gap-3">
                  {testResult.allowed ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-500 text-white shrink-0 shadow-xs">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      RFC 9309 Access Verdict
                    </span>
                    <h3 className="text-lg font-black tracking-tight">
                      {testResult.allowed ? 'ALLOWED' : 'BLOCKED / DISALLOWED'}
                    </h3>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-xs space-y-1.5">
                  <p className="leading-relaxed font-medium">
                    {testResult.reason}
                  </p>
                  <div className="flex items-center justify-between text-[11px] opacity-75 font-mono pt-1">
                    <span>Evaluated as: {testResult.userAgentUsed}</span>
                    <span>Path: {testResult.testedPath || testerUrl}</span>
                  </div>
                </div>
              </div>

              {/* Quick sample paths to test */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-500">Quick Test Paths:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['/admin/', '/admin/login', '/api/public/', '/api/private/', '/blog/post', '/docs/file.pdf'].map(path => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => setTesterUrl(`https://example.com${path}`)}
                      className="px-2 py-1 rounded-lg text-[11px] font-mono bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {path}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ROBOTS.TXT GENERATOR
      ========================================== */}
      {activeTab === 'robots_gen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Form Builder (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>Visual Robots.txt Builder</span>
              </h2>

              {/* Default User-Agent */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Target User-Agent
                </label>
                <select
                  value={genUserAgent}
                  onChange={(e) => setGenUserAgent(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {POPULAR_CRAWLERS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* AI Scrapers Protection Toggle */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-900 dark:text-white">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Block AI & LLM Web Scrapers</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={blockAiBots}
                    onChange={(e) => setBlockAiBots(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Automatically generates disallow rules for GPTBot, CCBot, Claude-Web, Google-Extended, and Bytespider to protect proprietary content from AI model training.
                </p>
              </div>

              {/* Disallowed Paths List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Disallowed Paths (Disallow:)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                  {genDisallows.map((path, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                      <span className="text-rose-600 dark:text-rose-400">Disallow: {path}</span>
                      <button
                        type="button"
                        onClick={() => setGenDisallows(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newDisallowInput}
                    onChange={(e) => setNewDisallowInput(e.target.value)}
                    placeholder="/admin/ or /private/"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDisallowInput.trim()) {
                        setGenDisallows(prev => [...prev, newDisallowInput.trim()]);
                        setNewDisallowInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Allowed Paths List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Allowed Paths (Allow:)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                  {genAllows.map((path, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400">Allow: {path}</span>
                      <button
                        type="button"
                        onClick={() => setGenAllows(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newAllowInput}
                    onChange={(e) => setNewAllowInput(e.target.value)}
                    placeholder="/api/public/ or /images/"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAllowInput.trim()) {
                        setGenAllows(prev => [...prev, newAllowInput.trim()]);
                        setNewAllowInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Crawl-delay & Sitemap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Crawl-Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={genCrawlDelay}
                    onChange={(e) => setGenCrawlDelay(e.target.value)}
                    placeholder="None (Default)"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Sitemap URL
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="url"
                      value={newSitemapInput}
                      onChange={(e) => setNewSitemapInput(e.target.value)}
                      placeholder="https://example.com/sitemap.xml"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSitemapInput.trim()) {
                          setGenSitemaps(prev => [...prev, newSitemapInput.trim()]);
                          setNewSitemapInput('');
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Generated Code Preview (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Generated robots.txt Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTesterRobotsContent(generatedRobotsTxt);
                      setActiveTab('tester');
                      onNotify?.({ type: 'success', title: 'Sent to Tester', message: 'Loaded into live testing simulator.' });
                    }}
                    className="px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Test This</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedRobotsTxt, 'gen_robots', 'Robots.txt')}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {copiedKey === 'gen_robots' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <CodeEditor
                  value={generatedRobotsTxt}
                  readOnly={true}
                  height="440px"
                  language="text"
                  theme={theme}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setGenAllows([]);
                    setGenDisallows([]);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Rules</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(generatedRobotsTxt, 'robots.txt')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download robots.txt</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 3: XML SITEMAP GENERATOR
      ========================================== */}
      {activeTab === 'sitemap_gen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: URL List & Builder (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sitemap URLs ({sitemapEntries.length})</span>
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(prev => !prev)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
                  >
                    Bulk Add URLs
                  </button>
                  <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSitemapIndex}
                      onChange={(e) => setIsSitemapIndex(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Index Mode</span>
                  </label>
                </div>
              </div>

              {/* Bulk paste drawer */}
              {showBulkModal && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Paste URL List (One per line):</span>
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">Base URL:</span>
                    <input
                      type="url"
                      value={sitemapBaseUrl}
                      onChange={(e) => setSitemapBaseUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={bulkUrlText}
                    onChange={(e) => setBulkUrlText(e.target.value)}
                    placeholder="https://example.com/about&#10;https://example.com/pricing&#10;/contact"
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleProcessBulkUrls}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                  >
                    Ingest Bulk URLs
                  </button>
                </div>
              )}

              {/* Add Single URL Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Add New URL Entry
                </span>

                <div className="space-y-2">
                  <input
                    type="url"
                    value={newUrlLoc}
                    onChange={(e) => setNewUrlLoc(e.target.value)}
                    placeholder="https://example.com/features"
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newUrlFreq}
                      onChange={(e) => setNewUrlFreq(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white capitalize"
                    >
                      {VALID_CHANGEFREQS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.1"
                      min="0.0"
                      max="1.0"
                      value={newUrlPriority}
                      onChange={(e) => setNewUrlPriority(e.target.value)}
                      placeholder="Priority (0.8)"
                      className="px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (newUrlLoc.trim()) {
                        setSitemapEntries(prev => [
                          ...prev,
                          {
                            loc: newUrlLoc.trim(),
                            lastmod: new Date().toISOString().split('T')[0],
                            changefreq: newUrlFreq,
                            priority: newUrlPriority
                          }
                        ]);
                        setNewUrlLoc('');
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>
              </div>

              {/* Table of Entries */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Location (&lt;loc&gt;)</th>
                      <th className="py-2 px-2">Freq</th>
                      <th className="py-2 px-2">Pri</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {sitemapEntries.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-2 px-3 truncate max-w-[200px]" title={it.loc}>
                          {it.loc}
                        </td>
                        <td className="py-2 px-2 capitalize text-[11px] text-slate-500">
                          {it.changefreq}
                        </td>
                        <td className="py-2 px-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {it.priority}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSitemapEntries(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Right Column: XML Code Output (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Generated XML Sitemap Output
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValidatorXmlInput(generatedSitemapXml);
                      setActiveTab('validator');
                      onNotify?.({ type: 'success', title: 'Sent to Validator', message: 'Loaded into XML validator tab.' });
                    }}
                    className="px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Validate This</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(generatedSitemapXml, 'gen_sitemap', 'Sitemap XML')}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {copiedKey === 'gen_sitemap' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <CodeEditor
                  value={generatedSitemapXml}
                  readOnly={true}
                  height="440px"
                  language="html"
                  theme={theme}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Standard Sitemaps.org 0.9 Protocol
                </span>

                <button
                  type="button"
                  onClick={() => handleDownload(generatedSitemapXml, 'sitemap.xml', 'application/xml')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download sitemap.xml</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 4: SITEMAP.XML VALIDATOR & INSPECTOR
      ========================================== */}
      {activeTab === 'validator' && (
        <div className="space-y-6">
          
          {/* Top Row: XML Input & Health Report */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Code Input (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sitemap XML Source</span>
                </h3>

                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload .xml</span>
                    <input
                      type="file"
                      accept=".xml,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setValidatorXmlInput(SAMPLE_SITEMAP_XML)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Sample XML
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <CodeEditor
                  value={validatorXmlInput}
                  onChange={setValidatorXmlInput}
                  height="260px"
                  language="html"
                  theme={theme}
                />
              </div>
            </div>

            {/* Right: Validation Health Card (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Validation Status
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  validationResult.isValid
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {validationResult.isValid ? 'Valid XML Sitemap' : 'Errors Detected'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total URLs</span>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {validationResult.stats.totalUrls}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Avg Priority</span>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {validationResult.stats.averagePriority}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">&lt;lastmod&gt; Coverage</span>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {validationResult.stats.totalUrls > 0 
                      ? `${Math.round((validationResult.stats.hasLastmod / validationResult.stats.totalUrls) * 100)}%`
                      : '0%'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">50,000 URL Limit</span>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    Within Limit
                  </div>
                </div>
              </div>

              {/* Errors / Warnings List */}
              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded-lg">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{err.message}</span>
                    </div>
                  ))}

                  {validationResult.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Bottom Table: Extracted URLs Inspection */}
          <div className="bg-white dark:bg-[#0c111a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Extracted URLs ({filteredValidatorUrls.length})
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={validatorSearchFilter}
                  onChange={(e) => setValidatorSearchFilter(e.target.value)}
                  placeholder="Filter by URL slug..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">URL (&lt;loc&gt;)</th>
                    <th className="py-2.5 px-3">Last Modified</th>
                    <th className="py-2.5 px-3">Changefreq</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filteredValidatorUrls.map((u) => (
                    <tr key={u.index} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {u.index}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 break-all">
                        {u.loc}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {u.lastmod || '—'}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-500 text-[11px]">
                        {u.changefreq || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                        {u.priority || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {u.errors.length === 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Valid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400" title={u.errors.join(', ')}>
                            Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
