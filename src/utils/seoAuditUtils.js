/**
 * Website SEO & Lighthouse Audit Utilities
 * Integrates with Google PageSpeed Insights v5 API for real-time Core Web Vitals,
 * SEO, Performance, Accessibility, and Best Practices testing.
 */

export const DEFAULT_PAGESPEED_API_KEY = 'AIzaSyDayocXHaLWEmh6l5yUntrauTzlCzdy7C0';
export const AUDIT_HISTORY_STORAGE_KEY = 'dreamkit_seo_audit_history';

export const SAMPLE_AUDIT_URLS = [
  { id: 'pagespeed', label: 'PageSpeed Dev', url: 'https://pagespeed.web.dev' },
  { id: 'github', label: 'GitHub', url: 'https://github.com' },
  { id: 'stripe', label: 'Stripe', url: 'https://stripe.com' },
  { id: 'wikipedia', label: 'Wikipedia', url: 'https://wikipedia.org' },
  { id: 'vercel', label: 'Vercel', url: 'https://vercel.com' },
];

/**
 * Clean API Key by stripping any whitespace or "apikey-" prefix
 */
export function cleanApiKey(rawKey) {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^apikey-/, '');
}

/**
 * Ensure URL has valid http/https protocol
 */
export function normalizeAuditUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) return '';
  const trimmed = rawUrl.trim();
  if (/^[a-zA-Z]+:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format milliseconds into human-readable seconds or ms
 */
export function formatMs(ms) {
  if (ms === undefined || ms === null) return 'N/A';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Helper to determine qualitative metric rating
 */
export function getMetricRating(value, goodMax, needsWorkMax) {
  if (value === undefined || value === null) return { rating: 'unknown', label: 'Unknown', color: 'slate' };
  if (value <= goodMax) {
    return { rating: 'good', label: 'Good', color: 'emerald' };
  } else if (value <= needsWorkMax) {
    return { rating: 'needs-improvement', label: 'Needs Improvement', color: 'amber' };
  }
  return { rating: 'poor', label: 'Poor', color: 'rose' };
}

/**
 * Determine score tier & visual badge classes
 */
export function getScoreTier(score) {
  // score is 0 - 100
  if (score >= 90) {
    return {
      tier: 'good',
      label: 'Good',
      color: 'emerald',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderColor: 'border-emerald-300 dark:border-emerald-800',
      ringColor: '#10b981'
    };
  } else if (score >= 50) {
    return {
      tier: 'average',
      label: 'Needs Work',
      color: 'amber',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      borderColor: 'border-amber-300 dark:border-amber-800',
      ringColor: '#f59e0b'
    };
  }
  return {
    tier: 'poor',
    label: 'Poor',
    color: 'rose',
    textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    borderColor: 'border-rose-300 dark:border-rose-900/60',
    ringColor: '#ef4444'
  };
}

/**
 * Run Google PageSpeed Insights v5 API audit
 */
export async function runPageSpeedAudit({ url, strategy = 'mobile', apiKey = DEFAULT_PAGESPEED_API_KEY }) {
  const normalizedUrl = normalizeAuditUrl(url);
  if (!normalizedUrl) {
    throw new Error('Please enter a valid website URL to audit.');
  }

  const key = cleanApiKey(apiKey);
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  const categoryParams = categories.map(c => `category=${c}`).join('&');
  const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=${strategy}&${categoryParams}${keyParam}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    let errMessage = `PageSpeed API returned HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errMessage = errJson.error.message;
      }
    } catch {
      // fallback
    }

    if (response.status === 429) {
      errMessage = 'Google PageSpeed API rate limit reached. Please wait a minute or use a custom Google Cloud API key.';
    } else if (response.status === 400) {
      errMessage = `Could not test "${normalizedUrl}". Ensure the URL is publicly reachable over the internet and not behind a firewall or local network.`;
    }

    throw new Error(errMessage);
  }

  const data = await response.json();
  return parseLighthouseResponse(data, strategy);
}

/**
 * Parse raw Google PageSpeed API JSON response into structured audit model
 */
export function parseLighthouseResponse(data, strategy = 'mobile') {
  const lh = data.lighthouseResult || {};
  const audits = lh.audits || {};
  const categories = lh.categories || {};

  // 1. Category Scores (0 - 100)
  const scores = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
  };

  // 2. Core Web Vitals Lab Metrics
  const lcpAudit = audits['largest-contentful-paint'] || {};
  const clsAudit = audits['cumulative-layout-shift'] || {};
  const tbtAudit = audits['total-blocking-time'] || {};
  const fcpAudit = audits['first-contentful-paint'] || {};
  const siAudit = audits['speed-index'] || {};
  const ttfbAudit = audits['server-response-time'] || {};
  const inpAudit = audits['interaction-to-next-paint'] || {};

  const lcpVal = lcpAudit.numericValue || 0;
  const clsVal = clsAudit.numericValue || 0;
  const tbtVal = tbtAudit.numericValue || 0;
  const fcpVal = fcpAudit.numericValue || 0;
  const siVal = siAudit.numericValue || 0;
  const ttfbVal = ttfbAudit.numericValue || 0;

  const coreWebVitals = {
    lcp: {
      id: 'lcp',
      name: 'Largest Contentful Paint',
      abbr: 'LCP',
      value: lcpVal,
      displayValue: lcpAudit.displayValue || formatMs(lcpVal),
      score: lcpAudit.score,
      target: '≤ 2.5 s',
      ...getMetricRating(lcpVal, 2500, 4000),
      description: 'Measures loading performance. For a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.'
    },
    cls: {
      id: 'cls',
      name: 'Cumulative Layout Shift',
      abbr: 'CLS',
      value: clsVal,
      displayValue: clsAudit.displayValue || clsVal.toFixed(3),
      score: clsAudit.score,
      target: '≤ 0.1',
      ...getMetricRating(clsVal, 0.1, 0.25),
      description: 'Measures visual stability. For a good user experience, pages should maintain a CLS of 0.1 or less.'
    },
    tbt: {
      id: 'tbt',
      name: 'Total Blocking Time',
      abbr: 'TBT',
      value: tbtVal,
      displayValue: tbtAudit.displayValue || formatMs(tbtVal),
      score: tbtAudit.score,
      target: '≤ 200 ms',
      ...getMetricRating(tbtVal, 200, 600),
      description: 'Measures responsiveness and main-thread blockage before interactive usability. Correlates closely with INP.'
    },
    fcp: {
      id: 'fcp',
      name: 'First Contentful Paint',
      abbr: 'FCP',
      value: fcpVal,
      displayValue: fcpAudit.displayValue || formatMs(fcpVal),
      score: fcpAudit.score,
      target: '≤ 1.8 s',
      ...getMetricRating(fcpVal, 1800, 3000),
      description: 'Marks the time at which the first text or image is painted.'
    },
    si: {
      id: 'si',
      name: 'Speed Index',
      abbr: 'SI',
      value: siVal,
      displayValue: siAudit.displayValue || formatMs(siVal),
      score: siAudit.score,
      target: '≤ 3.4 s',
      ...getMetricRating(siVal, 3400, 5800),
      description: 'Shows how quickly the contents of a page are visibly populated.'
    },
    ttfb: {
      id: 'ttfb',
      name: 'Time to First Byte',
      abbr: 'TTFB',
      value: ttfbVal,
      displayValue: ttfbAudit.displayValue || formatMs(ttfbVal),
      score: ttfbAudit.score,
      target: '≤ 0.8 s',
      ...getMetricRating(ttfbVal, 800, 1800),
      description: 'Time taken for the web server to respond and return the initial HTML document byte.'
    },
    inp: {
      id: 'inp',
      name: 'Interaction to Next Paint',
      abbr: 'INP',
      value: inpAudit.numericValue || null,
      displayValue: inpAudit.displayValue || (data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT ? `${data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT.percentile} ms` : 'Assessed via TBT'),
      score: inpAudit.score || null,
      target: '≤ 200 ms',
      ...getMetricRating(inpAudit.numericValue || tbtVal, 200, 500),
      description: 'Assesses a page\'s overall responsiveness to user interactions like clicks, taps, and keyboard inputs.'
    }
  };

  // 3. CrUX Real-World Field Data (Chrome User Experience Report 28-day data)
  const loadingExp = data.loadingExperience || {};
  const originExp = data.originLoadingExperience || {};

  const fieldData = {
    pageExperience: (loadingExp.metrics && Object.keys(loadingExp.metrics).length > 0) ? {
      overallCategory: loadingExp.overall_category || 'AVERAGE',
      metrics: loadingExp.metrics
    } : null,
    originExperience: (originExp.metrics && Object.keys(originExp.metrics).length > 0) ? {
      overallCategory: originExp.overall_category || 'AVERAGE',
      metrics: originExp.metrics
    } : null,
    hasFieldData: Boolean(
      (loadingExp.metrics && Object.keys(loadingExp.metrics).length > 0) ||
      (originExp.metrics && Object.keys(originExp.metrics).length > 0)
    )
  };

  // 4. Performance Optimization Opportunities (Estimated Time & Byte Savings)
  const opportunities = [];
  for (const [id, audit] of Object.entries(audits)) {
    if (audit.details?.type === 'opportunity' && audit.score !== null && audit.score < 0.9) {
      opportunities.push({
        id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue || '',
        savingsMs: audit.numericValue || 0,
        savingsBytes: audit.details?.overallSavingsBytes || 0,
        score: audit.score
      });
    }
  }
  opportunities.sort((a, b) => b.savingsMs - a.savingsMs || b.savingsBytes - a.savingsBytes);

  // 5. Diagnostics Breakdown
  const diagnostics = [];
  const diagnosticIds = [
    'dom-size',
    'dom-size-insight',
    'bootup-time',
    'mainthread-work-breakdown',
    'network-requests',
    'total-byte-weight',
    'font-display',
    'critical-request-chains'
  ];
  for (const id of diagnosticIds) {
    if (audits[id]) {
      diagnostics.push({
        id,
        title: audits[id].title,
        description: audits[id].description,
        displayValue: audits[id].displayValue || '',
        score: audits[id].score
      });
    }
  }

  // 6. Deep Network & Payload Summary
  const resItems = audits['resource-summary']?.details?.items || [];
  const totalRes = resItems.find(i => i.resourceType === 'total') || {};
  const totalTransferBytes = totalRes.transferSize || audits['total-byte-weight']?.numericValue || 0;
  const totalRequests = totalRes.requestCount || audits['network-requests']?.details?.items?.length || 0;

  const resourceBreakdown = resItems
    .filter(i => i.resourceType !== 'total')
    .map(i => {
      const bytes = i.transferSize || 0;
      const pct = totalTransferBytes > 0 ? Math.round((bytes / totalTransferBytes) * 100) : 0;
      return {
        type: i.resourceType,
        label: i.label || i.resourceType,
        transferSize: bytes,
        formattedSize: formatBytes(bytes),
        requestCount: i.requestCount || 0,
        percent: pct
      };
    })
    .sort((a, b) => b.transferSize - a.transferSize);

  const networkSummary = {
    totalBytes: totalTransferBytes,
    formattedTotalBytes: formatBytes(totalTransferBytes),
    totalRequests,
    resources: resourceBreakdown
  };

  // 7. Main Thread Work Breakdown
  const mtItems = audits['mainthread-work-breakdown']?.details?.items || [];
  const totalMtDuration = mtItems.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const mainThreadWork = {
    totalDurationMs: Math.round(totalMtDuration),
    formattedDuration: formatMs(totalMtDuration),
    items: mtItems.map(item => ({
      group: item.group,
      label: item.groupLabel || item.group,
      durationMs: Math.round(item.duration || 0),
      formattedDuration: formatMs(item.duration || 0),
      percent: totalMtDuration > 0 ? Math.round(((item.duration || 0) / totalMtDuration) * 100) : 0
    }))
  };

  // 8. DOM Architecture & Complexity Stats
  const domAudit = audits['dom-size'] || audits['dom-size-insight'] || {};
  const domDebug = domAudit.details?.debugData || {};
  const domStats = {
    totalElements: domDebug.totalElements || (typeof domAudit.numericValue === 'number' ? domAudit.numericValue : null),
    maxDepth: domDebug.maxDepth || null,
    maxChildren: domDebug.maxChildren || null,
    score: domAudit.score !== undefined ? domAudit.score : null
  };

  // 9. Security & Infrastructure Signals
  const securityStats = {
    isHttps: audits['is-on-https']?.score === 1,
    hasHsts: audits['has-hsts']?.score === 1,
    hasCsp: audits['csp-xss']?.score === 1,
    isCrawlable: audits['is-crawlable']?.score === 1,
    consoleErrorsCount: audits['errors-in-console']?.details?.items?.length || 0,
    deprecationsCount: audits['deprecations']?.details?.items?.length || 0
  };

  // 10. Audit Execution Environment & Emulation Config
  const environmentInfo = {
    strategy,
    deviceLabel: strategy === 'desktop' ? 'Desktop Screen (1350 × 940)' : 'Mobile (Moto G Power, 412 × 823)',
    networkThrottling: strategy === 'desktop' ? 'Desktop Broadband (10 Mbps, 40ms RTT)' : 'Simulated Slow 4G (1.6 Mbps, 150ms RTT, 4x CPU slowdown)',
    cpuSlowdown: strategy === 'desktop' ? '1x (No CPU slowdown)' : '4x CPU slowdown (Emulated mobile CPU)',
    benchmarkIndex: lh.environment?.benchmarkIndex ? Math.round(lh.environment.benchmarkIndex) : null,
    lighthouseVersion: lh.lighthouseVersion || '13.x',
    totalDurationSeconds: lh.timing?.total ? (lh.timing.total / 1000).toFixed(1) : null
  };

  // 11. Categorized Audits (SEO, Accessibility, Best Practices, Performance)
  const categorizeAudits = (catId) => {
    const cat = categories[catId];
    if (!cat || !cat.auditRefs) return [];

    return cat.auditRefs
      .map(ref => {
        const audit = audits[ref.id];
        if (!audit) return null;
        return {
          id: ref.id,
          weight: ref.weight,
          group: ref.group,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          displayValue: audit.displayValue || '',
          explanation: audit.explanation || '',
          passed: audit.score === 1
        };
      })
      .filter(Boolean);
  };

  const categorizedAudits = {
    seo: categorizeAudits('seo'),
    accessibility: categorizeAudits('accessibility'),
    bestPractices: categorizeAudits('best-practices'),
    performance: categorizeAudits('performance')
  };

  // 12. Screenshots & Filmstrip
  const finalScreenshot = audits['final-screenshot']?.details?.data || null;
  const filmstrip = (audits['screenshot-thumbnails']?.details?.items || []).map(item => ({
    timing: item.timing,
    timestamp: item.timestamp,
    data: item.data
  }));

  return {
    meta: {
      requestedUrl: lh.requestedUrl || normalizedUrl,
      finalUrl: lh.finalUrl || normalizedUrl,
      fetchTime: lh.fetchTime || new Date().toISOString(),
      lighthouseVersion: lh.lighthouseVersion || '13.x',
      strategy,
      benchmarkIndex: lh.environment?.benchmarkIndex
    },
    scores,
    coreWebVitals,
    fieldData,
    networkSummary,
    mainThreadWork,
    domStats,
    securityStats,
    environmentInfo,
    opportunities,
    diagnostics,
    categorizedAudits,
    filmstrip,
    finalScreenshot
  };
}

/**
 * Concurrently audit both Mobile and Desktop for rich comparative benchmark
 */
export async function runComparativeAudit({ url, apiKey = DEFAULT_PAGESPEED_API_KEY }) {
  const [mobileResult, desktopResult] = await Promise.all([
    runPageSpeedAudit({ url, strategy: 'mobile', apiKey }),
    runPageSpeedAudit({ url, strategy: 'desktop', apiKey })
  ]);

  const comparison = {
    scores: {
      performance: {
        mobile: mobileResult.scores.performance,
        desktop: desktopResult.scores.performance,
        delta: desktopResult.scores.performance - mobileResult.scores.performance
      },
      accessibility: {
        mobile: mobileResult.scores.accessibility,
        desktop: desktopResult.scores.accessibility,
        delta: desktopResult.scores.accessibility - mobileResult.scores.accessibility
      },
      bestPractices: {
        mobile: mobileResult.scores.bestPractices,
        desktop: desktopResult.scores.bestPractices,
        delta: desktopResult.scores.bestPractices - mobileResult.scores.bestPractices
      },
      seo: {
        mobile: mobileResult.scores.seo,
        desktop: desktopResult.scores.seo,
        delta: desktopResult.scores.seo - mobileResult.scores.seo
      }
    },
    cwv: {
      lcp: {
        mobile: mobileResult.coreWebVitals.lcp.displayValue,
        desktop: desktopResult.coreWebVitals.lcp.displayValue
      },
      cls: {
        mobile: mobileResult.coreWebVitals.cls.displayValue,
        desktop: desktopResult.coreWebVitals.cls.displayValue
      },
      tbt: {
        mobile: mobileResult.coreWebVitals.tbt.displayValue,
        desktop: desktopResult.coreWebVitals.tbt.displayValue
      }
    }
  };

  return {
    mobile: mobileResult,
    desktop: desktopResult,
    comparison
  };
}

// =============================================================================
// AUDIT HISTORY & PERSISTENCE
// =============================================================================

export function getAuditHistory() {
  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAuditToHistory(auditResult) {
  if (!auditResult || !auditResult.meta) return;
  try {
    const history = getAuditHistory();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url: auditResult.meta.finalUrl || auditResult.meta.requestedUrl,
      strategy: auditResult.meta.strategy,
      timestamp: auditResult.meta.fetchTime,
      scores: auditResult.scores,
      lcp: auditResult.coreWebVitals?.lcp?.displayValue,
      cls: auditResult.coreWebVitals?.cls?.displayValue,
      tbt: auditResult.coreWebVitals?.tbt?.displayValue
    };
    // Keep last 10 entries
    const updated = [entry, ...history.filter(h => h.url !== entry.url || h.strategy !== entry.strategy)].slice(0, 10);
    localStorage.setItem(AUDIT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearAuditHistory() {
  try {
    localStorage.removeItem(AUDIT_HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// =============================================================================
// EXPORT & REPORTING
// =============================================================================

export function exportAuditAsJson(auditData, filename = 'seo_audit_report') {
  if (!auditData) return;
  const jsonStr = JSON.stringify(auditData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateMarkdownReport(auditData) {
  if (!auditData) return '';
  const m = auditData.meta;
  const s = auditData.scores;
  const cwv = auditData.coreWebVitals;
  const net = auditData.networkSummary || {};
  const dom = auditData.domStats || {};
  const sec = auditData.securityStats || {};
  const env = auditData.environmentInfo || {};

  return `# Website SEO & Lighthouse Audit Report
**Target URL**: ${m.finalUrl}  
**Audit Device Profile**: ${env.deviceLabel || m.strategy.toUpperCase()}  
**Network Simulation**: ${env.networkThrottling || m.strategy}  
**Audit Date**: ${new Date(m.fetchTime).toLocaleString()}  
**Lighthouse Version**: ${m.lighthouseVersion}

---

## 🏆 Lighthouse Category Scores
- **Performance**: ${s.performance} / 100
- **Accessibility**: ${s.accessibility} / 100
- **Best Practices**: ${s.bestPractices} / 100
- **SEO**: ${s.seo} / 100

---

## ⚡ Core Web Vitals (Lab Assessment)
- **Largest Contentful Paint (LCP)**: ${cwv.lcp.displayValue} (${cwv.lcp.label} — Target: ${cwv.lcp.target})
- **Cumulative Layout Shift (CLS)**: ${cwv.cls.displayValue} (${cwv.cls.label} — Target: ${cwv.cls.target})
- **Total Blocking Time (TBT)**: ${cwv.tbt.displayValue} (${cwv.tbt.label} — Target: ${cwv.tbt.target})
- **First Contentful Paint (FCP)**: ${cwv.fcp.displayValue} (${cwv.fcp.label} — Target: ${cwv.fcp.target})
- **Speed Index (SI)**: ${cwv.si.displayValue} (${cwv.si.label} — Target: ${cwv.si.target})
- **Time to First Byte (TTFB)**: ${cwv.ttfb.displayValue} (${cwv.ttfb.label} — Target: ${cwv.ttfb.target})

---

## 📊 Network, Payload & DOM Architecture
- **Total Transfer Size**: ${net.formattedTotalBytes || 'N/A'}
- **Total HTTP Requests**: ${net.totalRequests || 'N/A'}
- **Total DOM Elements**: ${dom.totalElements ?? 'N/A'}
- **Maximum DOM Tree Depth**: ${dom.maxDepth ?? 'N/A'}
- **HTTPS Enforced**: ${sec.isHttps ? 'Yes (Secure)' : 'No'}
- **HSTS Configured**: ${sec.hasHsts ? 'Yes' : 'No'}

---

## 💡 Top Performance Opportunities
${auditData.opportunities && auditData.opportunities.length > 0 ? auditData.opportunities.slice(0, 5).map(o => `- **${o.title}**: ${o.displayValue || (o.savingsMs ? `Save ~${formatMs(o.savingsMs)}` : '')}`).join('\n') : '- No critical performance opportunities detected! Excellent job.'}

---

## 🔍 SEO Audits Overview
- **Passed Checks**: ${auditData.categorizedAudits.seo.filter(a => a.passed).length}
- **Failed / Action Items**: ${auditData.categorizedAudits.seo.filter(a => !a.passed).length}

Generated by DreamKit Developer Studio.
`;
}

