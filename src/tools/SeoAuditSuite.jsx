import React, { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Globe,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Download,
  Printer,
  Key,
  RefreshCw,
  ShieldCheck,
  Zap,
  BarChart3,
  HardDrive,
  Cpu,
  Layers,
  Lock,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Server
} from 'lucide-react';
import {
  DEFAULT_PAGESPEED_API_KEY,
  SAMPLE_AUDIT_URLS,
  normalizeAuditUrl,
  cleanApiKey,
  formatBytes,
  formatMs,
  getScoreTier,
  runPageSpeedAudit,
  runComparativeAudit,
  getAuditHistory,
  saveAuditToHistory,
  clearAuditHistory,
  exportAuditAsJson,
  generateMarkdownReport
} from '../utils/seoAuditUtils';

export default function SeoAuditSuite({ _theme = 'dark', onNotify }) {
  // --- AUDIT INPUT STATE ---
  const [urlInput, setUrlInput] = useState('https://pagespeed.web.dev');
  const [strategy, setStrategy] = useState('mobile'); // 'mobile' | 'desktop'
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('dreamkit_pagespeed_api_key') || DEFAULT_PAGESPEED_API_KEY;
  });

  // --- MULTI-STRATEGY CACHE ---
  // Store both mobile & desktop results for instant zero-lag switching
  const [resultsByStrategy, setResultsByStrategy] = useState({
    mobile: null,
    desktop: null
  });

  // --- API & LOADING STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [auditError, setAuditError] = useState(null);
  const [auditData, setAuditData] = useState(null);

  // --- ACTIVE INSPECTOR TAB ---
  // 'insights' | 'compare' | 'seo' | 'performance' | 'accessibility' | 'best-practices' | 'opportunities' | 'filmstrip' | 'history'
  const [activeTab, setActiveTab] = useState('insights');
  const [auditFilter, setAuditFilter] = useState('all'); // 'all' | 'failed' | 'passed'

  // --- API KEY MODAL STATE ---
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  // --- COPIED STATE ---
  const [copiedReport, setCopiedReport] = useState(false);

  // --- AUDIT HISTORY ---
  const [historyList, setHistoryList] = useState(() => getAuditHistory());

  // Save custom API key
  const handleSaveApiKey = () => {
    const cleaned = cleanApiKey(tempApiKey) || DEFAULT_PAGESPEED_API_KEY;
    setApiKey(cleaned);
    localStorage.setItem('dreamkit_pagespeed_api_key', cleaned);
    setShowApiKeyModal(false);
    if (onNotify) onNotify('PageSpeed Insights API key updated!', 'success');
  };

  // Run Audit Execution
  const executeAudit = useCallback(async (targetUrl = urlInput, targetStrategy = strategy) => {
    const normalized = normalizeAuditUrl(targetUrl);
    if (!normalized) {
      if (onNotify) onNotify('Please enter a valid website URL to test.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      setAuditError(null);
      setStrategy(targetStrategy);
      setLoadingStage(`Querying Google PageSpeed Insights (${targetStrategy.toUpperCase()})...`);

      const stageTimer1 = setTimeout(() => {
        setLoadingStage(`Analyzing ${targetStrategy.toUpperCase()} Core Web Vitals & LCP metrics...`);
      }, 3000);

      const stageTimer2 = setTimeout(() => {
        setLoadingStage(`Inspecting SEO, Architecture & Security for ${targetStrategy.toUpperCase()}...`);
      }, 6500);

      const stageTimer3 = setTimeout(() => {
        setLoadingStage(`Compiling Lighthouse v13 report & filmstrip (${targetStrategy.toUpperCase()})...`);
      }, 10500);

      const result = await runPageSpeedAudit({
        url: normalized,
        strategy: targetStrategy,
        apiKey
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      setAuditData(result);
      setResultsByStrategy(prev => ({
        ...prev,
        [targetStrategy]: result
      }));
      saveAuditToHistory(result);
      setHistoryList(getAuditHistory());

      if (onNotify) {
        onNotify(`Audit completed for ${normalized} (${targetStrategy.toUpperCase()})!`, 'success');
      }
    } catch (err) {
      setAuditError(err.message || 'Audit failed. Check URL accessibility or API key limits.');
      if (onNotify) onNotify(err.message || 'Audit execution failed', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [urlInput, strategy, apiKey, onNotify]);

  // Handle Strategy Toggle Switch (Mobile <-> Desktop)
  const handleStrategyChange = (newStrategy) => {
    if (newStrategy === strategy && auditData) return;
    setStrategy(newStrategy);

    const normalized = normalizeAuditUrl(urlInput);
    const cached = resultsByStrategy[newStrategy];

    // Check if the target strategy is already in cache for this URL
    if (cached && (cached.meta.requestedUrl === normalized || cached.meta.finalUrl === normalized)) {
      setAuditData(cached);
      if (onNotify) onNotify(`Switched to ${newStrategy.toUpperCase()} view!`, 'info');
      return;
    }

    // Otherwise, if an audit is already displayed, automatically run the new strategy!
    if (auditData || isLoading) {
      executeAudit(urlInput, newStrategy);
    }
  };

  // Run Dual Comparative Audit (Mobile + Desktop in Parallel)
  const handleRunComparativeAudit = async () => {
    const normalized = normalizeAuditUrl(urlInput);
    if (!normalized) {
      if (onNotify) onNotify('Please enter a valid website URL to test.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      setIsComparing(true);
      setAuditError(null);
      setLoadingStage('Running dual Mobile & Desktop PageSpeed audits in parallel...');

      const comparative = await runComparativeAudit({
        url: normalized,
        apiKey
      });

      setResultsByStrategy({
        mobile: comparative.mobile,
        desktop: comparative.desktop
      });
      setAuditData(strategy === 'desktop' ? comparative.desktop : comparative.mobile);
      saveAuditToHistory(comparative.mobile);
      saveAuditToHistory(comparative.desktop);
      setHistoryList(getAuditHistory());
      setActiveTab('compare');

      if (onNotify) {
        onNotify(`Comparative Mobile & Desktop audit complete for ${normalized}!`, 'success');
      }
    } catch (err) {
      setAuditError(err.message || 'Dual audit failed.');
      if (onNotify) onNotify(err.message || 'Comparative audit failed', 'error');
    } finally {
      setIsLoading(false);
      setIsComparing(false);
      setLoadingStage('');
    }
  };

  // Handle Quick Sample Click
  const handleLoadSample = (sample) => {
    setUrlInput(sample.url);
    // Clear cache if changing sample URL
    setResultsByStrategy({ mobile: null, desktop: null });
    executeAudit(sample.url, strategy);
  };

  // Copy Executive Report
  const handleCopyReport = async () => {
    if (!auditData) return;
    try {
      const md = generateMarkdownReport(auditData);
      await navigator.clipboard.writeText(md);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
      if (onNotify) onNotify('Audit report copied to clipboard!', 'success');
    } catch {
      if (onNotify) onNotify('Clipboard copy failed', 'warning');
    }
  };

  // Download JSON
  const handleDownloadJson = () => {
    if (!auditData) return;
    exportAuditAsJson(auditData, `seo_audit_${auditData.meta.strategy}`);
    if (onNotify) onNotify('Downloaded Lighthouse audit JSON data', 'success');
  };

  // Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Filtered Audits for active category
  const activeCategoryAudits = useMemo(() => {
    if (!auditData || !auditData.categorizedAudits) return [];
    let list = [];
    if (activeTab === 'seo') list = auditData.categorizedAudits.seo;
    else if (activeTab === 'performance') list = auditData.categorizedAudits.performance;
    else if (activeTab === 'accessibility') list = auditData.categorizedAudits.accessibility;
    else if (activeTab === 'best-practices') list = auditData.categorizedAudits.bestPractices;

    if (auditFilter === 'failed') return list.filter(a => !a.passed);
    if (auditFilter === 'passed') return list.filter(a => a.passed);
    return list;
  }, [auditData, activeTab, auditFilter]);

  // Comparative data between mobile & desktop if both exist
  const comparativeMetrics = useMemo(() => {
    const mob = resultsByStrategy.mobile;
    const dsk = resultsByStrategy.desktop;
    if (!mob || !dsk) return null;

    return {
      scores: [
        {
          id: 'performance',
          label: 'Performance',
          mobile: mob.scores.performance,
          desktop: dsk.scores.performance,
          delta: dsk.scores.performance - mob.scores.performance
        },
        {
          id: 'accessibility',
          label: 'Accessibility',
          mobile: mob.scores.accessibility,
          desktop: dsk.scores.accessibility,
          delta: dsk.scores.accessibility - mob.scores.accessibility
        },
        {
          id: 'bestPractices',
          label: 'Best Practices',
          mobile: mob.scores.bestPractices,
          desktop: dsk.scores.bestPractices,
          delta: dsk.scores.bestPractices - mob.scores.bestPractices
        },
        {
          id: 'seo',
          label: 'SEO Compliance',
          mobile: mob.scores.seo,
          desktop: dsk.scores.seo,
          delta: dsk.scores.seo - mob.scores.seo
        }
      ],
      cwv: [
        {
          label: 'Largest Contentful Paint (LCP)',
          mobile: mob.coreWebVitals.lcp.displayValue,
          desktop: dsk.coreWebVitals.lcp.displayValue,
          target: '≤ 2.5 s'
        },
        {
          label: 'Cumulative Layout Shift (CLS)',
          mobile: mob.coreWebVitals.cls.displayValue,
          desktop: dsk.coreWebVitals.cls.displayValue,
          target: '≤ 0.1'
        },
        {
          label: 'Total Blocking Time (TBT)',
          mobile: mob.coreWebVitals.tbt.displayValue,
          desktop: dsk.coreWebVitals.tbt.displayValue,
          target: '≤ 200 ms'
        },
        {
          label: 'First Contentful Paint (FCP)',
          mobile: mob.coreWebVitals.fcp.displayValue,
          desktop: dsk.coreWebVitals.fcp.displayValue,
          target: '≤ 1.8 s'
        },
        {
          label: 'Time to First Byte (TTFB)',
          mobile: mob.coreWebVitals.ttfb.displayValue,
          desktop: dsk.coreWebVitals.ttfb.displayValue,
          target: '≤ 0.8 s'
        }
      ],
      network: {
        mobileBytes: mob.networkSummary?.formattedTotalBytes,
        desktopBytes: dsk.networkSummary?.formattedTotalBytes,
        mobileRequests: mob.networkSummary?.totalRequests,
        desktopRequests: dsk.networkSummary?.totalRequests
      }
    };
  }, [resultsByStrategy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action & Status Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Status & Privacy Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Lighthouse v13
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official Google PageSpeed API • Core Web Vitals (LCP, CLS, INP)</span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTempApiKey(apiKey);
              setShowApiKeyModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Configure PageSpeed API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>API Key</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!auditData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Print report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={!auditData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Download full JSON audit report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            disabled={!auditData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            title="Copy Markdown Summary to clipboard"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          HERO URL INPUT BAR & STRATEGY CONTROLS
         ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeAudit();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          {/* Strategy Switcher: Mobile vs Desktop Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => handleStrategyChange('mobile')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                strategy === 'mobile'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mobile</span>
              {resultsByStrategy.mobile && (
                <span className="text-[10px] font-mono px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {resultsByStrategy.mobile.scores.performance}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleStrategyChange('desktop')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                strategy === 'desktop'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-blue-500" />
              <span>Desktop</span>
              {resultsByStrategy.desktop && (
                <span className="text-[10px] font-mono px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {resultsByStrategy.desktop.scores.performance}
                </span>
              )}
            </button>
          </div>

          {/* URL Input */}
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter website URL (e.g. https://yourdomain.com)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Run Single Audit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading && !isComparing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auditing {strategy.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Audit {strategy.toUpperCase()}</span>
              </>
            )}
          </button>

          {/* Run Dual Compare Button */}
          <button
            type="button"
            onClick={handleRunComparativeAudit}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Benchmark Mobile & Desktop simultaneously"
          >
            {isComparing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5" />
                <span>Compare Both</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Try sample:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {SAMPLE_AUDIT_URLS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-emerald-500 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-all cursor-pointer whitespace-nowrap"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>{loadingStage || 'Connecting to Google PageSpeed Insights...'}</span>
              </span>
              <span className="text-[11px] font-mono opacity-80">
                {isComparing ? 'MOBILE + DESKTOP DUAL AUDIT' : `TESTING ${strategy.toUpperCase()}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-900/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Audit Error Alert */}
        {auditError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Audit Execution Error</span>
              <span className="opacity-90">{auditError}</span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          AUDIT RESULTS DASHBOARD (WHEN AUDIT DATA IS AVAILABLE)
         ========================================================================= */}
      {auditData && (
        <div className="space-y-6 animate-in fade-in">

          {/* Strategy Switcher Bar in Results View */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleStrategyChange('mobile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    strategy === 'mobile'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile View</span>
                  {resultsByStrategy.mobile && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                      {resultsByStrategy.mobile.scores.performance}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleStrategyChange('desktop')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    strategy === 'desktop'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Desktop View</span>
                  {resultsByStrategy.desktop && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                      {resultsByStrategy.desktop.scores.performance}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
                Device Profile: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{auditData.environmentInfo?.deviceLabel}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!resultsByStrategy.mobile || !resultsByStrategy.desktop) {
                    handleRunComparativeAudit();
                  } else {
                    setActiveTab('compare');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {resultsByStrategy.mobile && resultsByStrategy.desktop
                    ? 'View Side-by-Side Comparison'
                    : 'Benchmark Desktop vs Mobile'}
                </span>
              </button>
            </div>
          </div>

          {/* =====================================================================
              1. HERO LIGHTHOUSE CATEGORY SCORE GAUGES (4 CARDS)
             ===================================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'performance', label: 'Performance', score: auditData.scores.performance, tab: 'performance' },
              { id: 'accessibility', label: 'Accessibility', score: auditData.scores.accessibility, tab: 'accessibility' },
              { id: 'bestPractices', label: 'Best Practices', score: auditData.scores.bestPractices, tab: 'best-practices' },
              { id: 'seo', label: 'SEO', score: auditData.scores.seo, tab: 'seo' }
            ].map((cat) => {
              const tier = getScoreTier(cat.score);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.tab)}
                  className={`p-4 rounded-2xl bg-white dark:bg-[#111622] border transition-all cursor-pointer text-center group hover:scale-[1.01] ${
                    activeTab === cat.tab
                      ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Circular Score Gauge */}
                  <div className="relative w-20 h-20 mx-auto my-1 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="transition-all duration-1000 ease-out"
                        strokeWidth="3.2"
                        strokeDasharray={`${cat.score}, 100`}
                        strokeLinecap="round"
                        stroke={tier.ringColor}
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-mono font-black text-2xl text-slate-900 dark:text-white">
                      {cat.score}
                    </span>
                  </div>

                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block mt-1 group-hover:text-emerald-600 transition-colors">
                    {cat.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${tier.bgColor} ${tier.textColor}`}>
                    {tier.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* =====================================================================
              2. CORE WEB VITALS CARD GRID (LCP, CLS, INP/TBT, FCP, SI, TTFB)
             ===================================================================== */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Core Web Vitals & Performance Diagnostics</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lab measurements under simulated {auditData.meta.strategy.toUpperCase()} network throttling ({auditData.environmentInfo?.networkThrottling || 'Broadband'}).
                </p>
              </div>

              {auditData.fieldData?.pageExperience && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto">
                  CrUX Field Data: {auditData.fieldData.pageExperience.overallCategory}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                auditData.coreWebVitals.lcp,
                auditData.coreWebVitals.cls,
                auditData.coreWebVitals.tbt,
                auditData.coreWebVitals.fcp,
                auditData.coreWebVitals.si,
                auditData.coreWebVitals.ttfb
              ].map((metric) => (
                <div
                  key={metric.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {metric.name} ({metric.abbr})
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        metric.rating === 'good'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : metric.rating === 'needs-improvement'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                      }`}
                    >
                      {metric.label}
                    </span>
                  </div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {metric.displayValue}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Target: {metric.target}</span>
                    <span className="truncate max-w-[140px] text-right">{metric.abbr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =====================================================================
              3. VISUAL FILMSTRIP & SCREENSHOT TIMELINE
             ===================================================================== */}
          {auditData.filmstrip && auditData.filmstrip.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Visual Loading Progression (Filmstrip Timeline — {auditData.meta.strategy.toUpperCase()})</span>
              </span>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {auditData.filmstrip.map((frame, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 text-center space-y-1"
                  >
                    <img
                      src={frame.data}
                      alt={`Loading at ${frame.timing}ms`}
                      className="w-20 h-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                    />
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {frame.timing} ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              4. TABBED IN-DEPTH AUDIT INSPECTOR & STATS
             ===================================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 gap-1 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'insights'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-purple-500" />
                <span>Insights & Architecture</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('compare')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'compare'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mobile vs Desktop Comparison</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'seo'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-blue-500" />
                <span>SEO Compliance ({auditData.scores.seo}/100)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'performance'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Performance Checks</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('accessibility')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'accessibility'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>Accessibility ({auditData.scores.accessibility}/100)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('best-practices')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'best-practices'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Best Practices ({auditData.scores.bestPractices}/100)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'opportunities'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                <span>Opportunities ({auditData.opportunities?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>History ({historyList.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. INSIGHTS & ARCHITECTURE */}
            {activeTab === 'insights' && (
              <div className="p-5 space-y-6">
                {/* Network & Payload Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <span>Network Payload & Resource Distribution</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-500">
                        Total Weight: <strong className="text-slate-900 dark:text-white font-bold">{auditData.networkSummary?.formattedTotalBytes || '0 KB'}</strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Requests: <strong className="text-slate-900 dark:text-white font-bold">{auditData.networkSummary?.totalRequests || 0}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Segmented Payload Bar */}
                  {auditData.networkSummary?.resources && auditData.networkSummary.resources.length > 0 && (
                    <div className="space-y-2">
                      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                        {auditData.networkSummary.resources.map((res, idx) => {
                          const colors = [
                            'bg-blue-500',
                            'bg-emerald-500',
                            'bg-amber-500',
                            'bg-purple-500',
                            'bg-rose-500',
                            'bg-teal-500',
                            'bg-indigo-500'
                          ];
                          return (
                            <div
                              key={idx}
                              style={{ width: `${Math.max(res.percent, 2)}%` }}
                              className={`${colors[idx % colors.length]} transition-all`}
                              title={`${res.label}: ${res.formattedSize} (${res.percent}%)`}
                            />
                          );
                        })}
                      </div>

                      {/* Resource Legend Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {auditData.networkSummary.resources.map((res, idx) => {
                          const dotColors = [
                            'bg-blue-500',
                            'bg-emerald-500',
                            'bg-amber-500',
                            'bg-purple-500',
                            'bg-rose-500',
                            'bg-teal-500',
                            'bg-indigo-500'
                          ];
                          return (
                            <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                                <span className="truncate">{res.label}</span>
                              </div>
                              <div className="mt-1 flex items-baseline justify-between text-[11px] font-mono text-slate-500">
                                <span>{res.formattedSize}</span>
                                <span>{res.requestCount} req</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* DOM Complexity & Architecture */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>DOM Tree Architecture & Complexity</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                      <span className="text-[11px] font-medium text-slate-500 block">Total DOM Elements</span>
                      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        {auditData.domStats?.totalElements != null ? auditData.domStats.totalElements.toLocaleString() : 'Optimized'}
                      </p>
                      <span className="text-[10px] text-slate-400">Target: ≤ 800 elements</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                      <span className="text-[11px] font-medium text-slate-500 block">Maximum DOM Depth</span>
                      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        {auditData.domStats?.maxDepth != null ? `${auditData.domStats.maxDepth} levels` : 'Optimal'}
                      </p>
                      <span className="text-[10px] text-slate-400">Target: ≤ 32 levels</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                      <span className="text-[11px] font-medium text-slate-500 block">Max Child Elements</span>
                      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        {auditData.domStats?.maxChildren != null ? `${auditData.domStats.maxChildren} nodes` : 'Optimal'}
                      </p>
                      <span className="text-[10px] text-slate-400">Target: ≤ 60 child nodes</span>
                    </div>
                  </div>
                </div>

                {/* Main-Thread CPU Execution Breakdown */}
                {auditData.mainThreadWork?.items && auditData.mainThreadWork.items.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-amber-500" />
                        <span>Main-Thread CPU Execution Breakdown</span>
                      </h3>
                      <span className="text-xs font-mono text-slate-500">
                        Total Execution: <strong className="text-slate-900 dark:text-white">{auditData.mainThreadWork.formattedDuration}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {auditData.mainThreadWork.items.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 space-y-1 text-xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                            <span className="font-mono text-slate-900 dark:text-white">{item.formattedDuration}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div style={{ width: `${item.percent}%` }} className="h-full bg-amber-500 rounded-full" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block text-right">{item.percent}% of main-thread</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security, Hosting & Infrastructure Signals */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>Security & Hosting Protocols</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                      {auditData.securityStats?.isHttps ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">HTTPS Enforced</span>
                        <span className="text-[10px] text-slate-400">{auditData.securityStats?.isHttps ? 'Encrypted' : 'Insecure'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                      {auditData.securityStats?.hasHsts ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">HSTS Header</span>
                        <span className="text-[10px] text-slate-400">{auditData.securityStats?.hasHsts ? 'Active' : 'Missing'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                      {auditData.securityStats?.isCrawlable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">Crawlable</span>
                        <span className="text-[10px] text-slate-400">{auditData.securityStats?.isCrawlable ? 'Indexable' : 'Blocked'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">Server Latency</span>
                        <span className="text-[10px] text-slate-400 font-mono">{auditData.coreWebVitals?.ttfb?.displayValue || 'Optimal'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Environment & Emulation Config */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Lighthouse Execution Environment</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-500 font-mono text-[11px]">
                    <div>Emulation: <span className="text-slate-900 dark:text-white font-semibold">{auditData.environmentInfo?.deviceLabel}</span></div>
                    <div>Throttling: <span className="text-slate-900 dark:text-white font-semibold">{auditData.environmentInfo?.networkThrottling}</span></div>
                    <div>CPU Factor: <span className="text-slate-900 dark:text-white font-semibold">{auditData.environmentInfo?.cpuSlowdown}</span></div>
                    <div>Benchmark Index: <span className="text-slate-900 dark:text-white font-semibold">{auditData.environmentInfo?.benchmarkIndex ?? 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. MOBILE VS DESKTOP COMPARISON */}
            {activeTab === 'compare' && (
              <div className="p-5 space-y-6">
                {!comparativeMetrics ? (
                  <div className="text-center py-10 space-y-3">
                    <Scale className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Side-by-Side Mobile vs Desktop Comparison
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Run both Mobile and Desktop audits to compare score differentials, layout stability, and response times across screen form factors.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunComparativeAudit}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                    >
                      <Scale className="w-4 h-4" />
                      <span>{isLoading ? 'Running Dual Benchmark...' : 'Run Comparative Benchmark Now'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Scale className="w-4 h-4 text-indigo-500" />
                          <span>Mobile vs Desktop Comparative Scoreboard</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Side-by-side performance differentials under mobile throttling vs high-speed desktop broadband.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunComparativeAudit}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh Both</span>
                      </button>
                    </div>

                    {/* Scores Comparison Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Lighthouse Category</th>
                            <th className="py-2.5 px-4">Mobile (Moto G Power)</th>
                            <th className="py-2.5 px-4">Desktop (1350×940)</th>
                            <th className="py-2.5 px-4">Differential (Δ)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                          {comparativeMetrics.scores.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200">{row.label}</td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{row.mobile}</span> / 100
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{row.desktop}</span> / 100
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    row.delta > 0
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                      : row.delta < 0
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  {row.delta > 0 ? (
                                    <>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                      <span>+{row.delta} Desktop Advantage</span>
                                    </>
                                  ) : row.delta < 0 ? (
                                    <>
                                      <ArrowDownRight className="w-3.5 h-3.5" />
                                      <span>{row.delta} Mobile Higher</span>
                                    </>
                                  ) : (
                                    <span>Parity (0)</span>
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Core Web Vitals Comparison */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Core Web Vitals Comparison
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {comparativeMetrics.cwv.map((m, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{m.label}</span>
                            <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-200/50 dark:border-slate-800">
                              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                                <span className="text-[10px] text-slate-400 block">Mobile</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{m.mobile}</span>
                              </div>
                              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800">
                                <span className="text-[10px] text-slate-400 block">Desktop</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{m.desktop}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 block text-right font-mono">Target: {m.target}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. SEO / PERFORMANCE / ACCESSIBILITY / BEST PRACTICES AUDIT LIST */}
            {['seo', 'performance', 'accessibility', 'best-practices'].includes(activeTab) && (
              <div className="p-5 space-y-4">
                {/* Audit Filter Pill Controls */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setAuditFilter('all')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        auditFilter === 'all'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      All Audits
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilter('failed')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        auditFilter === 'failed'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>Action Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilter('passed')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        auditFilter === 'passed'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      Passed Only
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    Showing {activeCategoryAudits.length} checks
                  </span>
                </div>

                {/* Checklist items */}
                <div className="space-y-2">
                  {activeCategoryAudits.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No audits match the selected filter.
                    </div>
                  ) : (
                    activeCategoryAudits.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-3 text-xs"
                      >
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : item.score === null ? (
                          <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            {item.displayValue && (
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                {item.displayValue}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                            {item.description}
                          </p>
                          {item.explanation && (
                            <p className="text-amber-600 dark:text-amber-400 text-[10px] font-mono">
                              {item.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. PERFORMANCE OPPORTUNITIES */}
            {activeTab === 'opportunities' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Estimated Time & Byte Savings Opportunities
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Optimization recommendations from Lighthouse that directly accelerate page load speeds.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {auditData.opportunities && auditData.opportunities.length > 0 ? (
                    auditData.opportunities.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {opp.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {opp.savingsMs > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                Save ~{formatMs(opp.savingsMs)}
                              </span>
                            )}
                            {opp.savingsBytes > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                Save ~{formatBytes(opp.savingsBytes)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {opp.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 space-y-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No critical opportunities detected!
                      </p>
                      <p>Your web assets, scripts, and images are properly compressed and optimized.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. AUDIT HISTORY */}
            {activeTab === 'history' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Recent Website Audits ({historyList.length})
                  </span>
                  {historyList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        clearAuditHistory();
                        setHistoryList([]);
                        if (onNotify) onNotify('Cleared audit history', 'info');
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {historyList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      No past audits recorded yet. Run an audit to populate history.
                    </div>
                  ) : (
                    historyList.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1 truncate">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {entry.url}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {entry.strategy}
                            </span>
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="Performance">
                              P: {entry.scores?.performance}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold" title="SEO">
                              SEO: {entry.scores?.seo}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setUrlInput(entry.url);
                              handleStrategyChange(entry.strategy);
                              executeAudit(entry.url, entry.strategy);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 cursor-pointer"
                          >
                            Re-Run
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          EMPTY STATE ONBOARDING (BEFORE AUDIT RUN)
         ========================================================================= */}
      {!auditData && !isLoading && (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
            <Search className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ready to Inspect Any Public Website
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter any URL above and toggle between <strong>Mobile</strong> or <strong>Desktop</strong> profiles, or click <strong>Compare Both</strong> for a complete cross-device benchmark.
            </p>
          </div>

          {/* Quick Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-3 text-left">
            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Core Web Vitals</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Lab and Chrome UX Report field metrics for LCP, CLS, INP, and TTFB.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mobile vs Desktop</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Side-by-side comparison under simulated 4G mobile and broadband desktop.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                <span>Network & DOM Stats</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Resource payload breakdown, DOM node depth, and CPU main-thread work.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Visual Filmstrip</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Visual timeline frames showing the exact step-by-step rendering progression.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          API KEY CONFIGURATION MODAL
         ========================================================================= */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>PageSpeed Insights API Key</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Google PageSpeed Insights v5 provides up to 25,000 queries per day with a valid Google Cloud API key. The key is securely stored in your local browser storage.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Google Cloud API Key
              </label>
              <input
                type="text"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setTempApiKey(DEFAULT_PAGESPEED_API_KEY)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset to Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
