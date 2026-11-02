/**
 * RFC 9309 Compliant Robots.txt & Sitemaps.org XML Utilities
 * Implements parsing, URL testing, generation, and XML validation.
 */

export const POPULAR_CRAWLERS = [
  { id: '*', name: 'All Robots (*)', category: 'General' },
  { id: 'Googlebot', name: 'Googlebot (Google Search)', category: 'Search Engines' },
  { id: 'Googlebot-Image', name: 'Googlebot-Image', category: 'Search Engines' },
  { id: 'Googlebot-News', name: 'Googlebot-News', category: 'Search Engines' },
  { id: 'Bingbot', name: 'Bingbot (Microsoft Bing)', category: 'Search Engines' },
  { id: 'Applebot', name: 'Applebot (Apple Siri & Spotlight)', category: 'Search Engines' },
  { id: 'DuckDuckBot', name: 'DuckDuckBot (DuckDuckGo)', category: 'Search Engines' },
  { id: 'Baiduspider', name: 'Baiduspider (Baidu)', category: 'Search Engines' },
  { id: 'YandexBot', name: 'YandexBot (Yandex)', category: 'Search Engines' },
  { id: 'facebookexternalhit', name: 'Facebook External Hit', category: 'Social Media' },
  { id: 'Twitterbot', name: 'Twitterbot / X', category: 'Social Media' },
  { id: 'LinkedInBot', name: 'LinkedInBot', category: 'Social Media' },
  { id: 'GPTBot', name: 'GPTBot (OpenAI Web Crawler)', category: 'AI & Scrapers' },
  { id: 'ChatGPT-User', name: 'ChatGPT-User (OpenAI Browsing)', category: 'AI & Scrapers' },
  { id: 'CCBot', name: 'CCBot (Common Crawl)', category: 'AI & Scrapers' },
  { id: 'Claude-Web', name: 'Claude-Web / Anthropic AI', category: 'AI & Scrapers' },
  { id: 'Google-Extended', name: 'Google-Extended (Bard / Gemini Training)', category: 'AI & Scrapers' },
  { id: 'Bytespider', name: 'Bytespider (ByteDance / TikTok)', category: 'AI & Scrapers' }
];

export const ROBOTS_PRESETS = [
  {
    id: 'allow_all',
    name: 'Allow All (Public Site)',
    description: 'Permit all crawlers to access the entire site.',
    content: `# Allow all web crawlers
User-agent: *
Disallow:

Sitemap: https://example.com/sitemap.xml`
  },
  {
    id: 'block_all',
    name: 'Block All (Staging / Private)',
    description: 'Disallow all robots from indexing any part of the site.',
    content: `# Disallow all web crawlers (Staging/Dev environment)
User-agent: *
Disallow: /`
  },
  {
    id: 'standard_app',
    name: 'Standard Web Application',
    description: 'Block admin, internal APIs, and auth routes while allowing public pages.',
    content: `# Standard Web App robots.txt
User-agent: *
Disallow: /admin/
Disallow: /api/private/
Disallow: /dashboard/
Disallow: /login
Disallow: /checkout/
Allow: /api/public/

Sitemap: https://example.com/sitemap.xml`
  },
  {
    id: 'block_ai_bots',
    name: 'Block AI Scrapers',
    description: 'Allow standard search engines while blocking AI training crawlers.',
    content: `# Allow search engines
User-agent: *
Disallow: /admin/

# Block AI and LLM training scrapers
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

Sitemap: https://example.com/sitemap.xml`
  }
];

export const SAMPLE_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-10-30</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/products</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/blog/seo-guide</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://example.com/contact</loc>
    <lastmod>2026-10-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

// ==========================================
// 1. ROBOTS.TXT PARSER & RFC 9309 TESTER
// ==========================================

/**
 * Parses raw robots.txt into structured groups and global directives.
 */
export function parseRobotsTxt(content = '') {
  const lines = content.split('\n');
  const groups = [];
  const sitemaps = [];
  const errors = [];

  let currentGroup = null;

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    // Strip comments
    const line = rawLine.split('#')[0].trim();
    if (!line) return;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      errors.push({ line: lineNum, message: `Syntax error: missing colon delimiter in "${rawLine.trim()}"` });
      return;
    }

    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (field === 'sitemap') {
      if (value) sitemaps.push(value);
      return;
    }

    if (field === 'user-agent') {
      // If previous group had rules, start a new group
      if (currentGroup && currentGroup.rules.length > 0) {
        groups.push(currentGroup);
        currentGroup = { userAgents: [], rules: [], crawlDelay: null, line: lineNum };
      }

      if (!currentGroup) {
        currentGroup = { userAgents: [], rules: [], crawlDelay: null, line: lineNum };
      }

      currentGroup.userAgents.push(value.toLowerCase());
      return;
    }

    if (field === 'allow' || field === 'disallow') {
      if (!currentGroup) {
        // Directives before any User-agent are syntax violations in RFC 9309
        errors.push({ line: lineNum, message: `Orphan directive "${field}": Must follow a "User-agent" declaration.` });
        return;
      }

      currentGroup.rules.push({
        type: field,
        path: value,
        line: lineNum,
        raw: rawLine.trim()
      });
      return;
    }

    if (field === 'crawl-delay') {
      if (currentGroup) {
        const delay = parseFloat(value);
        if (!isNaN(delay)) currentGroup.crawlDelay = delay;
      }
      return;
    }

    // Other directives (e.g. host, clean-param)
    if (field === 'host' || field === 'clean-param') {
      return;
    }

    errors.push({ line: lineNum, message: `Unrecognized directive "${field}"` });
  });

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return { groups, sitemaps, errors };
}

/**
 * Converts a robots.txt path pattern into a JavaScript RegExp according to RFC 9309 §2.2.2.
 * Supports '*' (wildcard) and '$' (end-of-path anchor).
 */
function patternToRegExp(pattern) {
  if (!pattern) return null;

  let regexStr = '^';
  let hasEndAnchor = false;

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];

    if (ch === '*') {
      regexStr += '.*';
    } else if (ch === '$' && i === pattern.length - 1) {
      hasEndAnchor = true;
    } else if (['.', '+', '?', '^', '{', '}', '(', ')', '[', ']', '|', '\\'].includes(ch)) {
      regexStr += '\\' + ch;
    } else {
      regexStr += ch;
    }
  }

  if (hasEndAnchor) {
    regexStr += '$';
  }

  try {
    return new RegExp(regexStr);
  } catch {
    return null;
  }
}

/**
 * Tests whether a URL path is allowed for a given User-agent in accordance with RFC 9309.
 */
export function testRobotsUrl(robotsContent, targetUrl, userAgent = '*') {
  if (!targetUrl || !targetUrl.trim()) {
    return {
      allowed: true,
      reason: 'No test URL provided.',
      matchedRule: null,
      userAgentUsed: userAgent
    };
  }

  // Extract path and query from targetUrl
  let urlPath = targetUrl.trim();
  try {
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      const u = new URL(urlPath);
      urlPath = u.pathname + u.search;
    } else {
      if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
    }
  } catch {
    if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
  }

  const { groups } = parseRobotsTxt(robotsContent);
  const targetAgent = userAgent.trim().toLowerCase();

  // Find most specific group matching userAgent
  let matchedGroup = groups.find(g => g.userAgents.includes(targetAgent));
  let userAgentUsed = targetAgent;

  // Fallback to wildcard '*'
  if (!matchedGroup && targetAgent !== '*') {
    matchedGroup = groups.find(g => g.userAgents.includes('*'));
    userAgentUsed = '*';
  }

  // If no matching group exists, everything is allowed by default
  if (!matchedGroup || !matchedGroup.rules.length) {
    return {
      allowed: true,
      reason: `No applicable rules found for User-agent "${userAgent}". URL is allowed by default.`,
      matchedRule: null,
      userAgentUsed,
      testedPath: urlPath
    };
  }

  // RFC 9309 Section 2.2.2 Rule Precedence:
  // Find all matching rules. Longest pattern length wins.
  // In case of a tie between Allow and Disallow with identical pattern lengths, Allow wins.
  const matchingRules = [];

  for (const rule of matchedGroup.rules) {
    // Empty disallow means "allow everything"
    if (rule.type === 'disallow' && (!rule.path || rule.path.trim() === '')) {
      continue;
    }

    const regex = patternToRegExp(rule.path);
    if (regex && regex.test(urlPath)) {
      matchingRules.push({
        ...rule,
        length: rule.path.length
      });
    }
  }

  if (matchingRules.length === 0) {
    return {
      allowed: true,
      reason: `No rules matched path "${urlPath}". Allowed by default.`,
      matchedRule: null,
      userAgentUsed,
      testedPath: urlPath
    };
  }

  // Sort by length descending, and if lengths equal, allow comes first
  matchingRules.sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length;
    }
    if (a.type === 'allow' && b.type === 'disallow') return -1;
    if (b.type === 'allow' && a.type === 'disallow') return 1;
    return a.line - b.line;
  });

  const winner = matchingRules[0];
  const isAllowed = winner.type === 'allow';

  return {
    allowed: isAllowed,
    reason: isAllowed
      ? `Allowed by rule "${winner.raw}" on line ${winner.line} (longest matching pattern of ${winner.length} chars).`
      : `Blocked by rule "${winner.raw}" on line ${winner.line} (longest matching pattern of ${winner.length} chars).`,
    matchedRule: winner,
    userAgentUsed,
    testedPath: urlPath
  };
}

// ==========================================
// 2. ROBOTS.TXT GENERATOR
// ==========================================

export function generateRobotsTxt({
  userAgents = ['*'],
  allows = [],
  disallows = ['/admin/', '/api/private/'],
  crawlDelay = null,
  sitemaps = ['https://example.com/sitemap.xml'],
  customRules = []
}) {
  let out = '# Generated by DreamKit Robots.txt Builder\n';
  out += `# Date: ${new Date().toISOString().split('T')[0]}\n\n`;

  // Default block
  userAgents.forEach(agent => {
    out += `User-agent: ${agent}\n`;
  });

  if (crawlDelay) {
    out += `Crawl-delay: ${crawlDelay}\n`;
  }

  allows.filter(Boolean).forEach(a => {
    out += `Allow: ${a}\n`;
  });

  if (disallows.length === 0) {
    out += `Disallow:\n`;
  } else {
    disallows.filter(Boolean).forEach(d => {
      out += `Disallow: ${d}\n`;
    });
  }

  // Extra custom blocks (e.g. AI bots)
  if (customRules && customRules.length > 0) {
    customRules.forEach(cr => {
      out += `\n# ${cr.label || 'Bot Rule'}\n`;
      out += `User-agent: ${cr.agent}\n`;
      if (cr.disallowAll) {
        out += `Disallow: /\n`;
      } else if (cr.disallow) {
        cr.disallow.forEach(d => { out += `Disallow: ${d}\n`; });
      }
    });
  }

  // Sitemaps section
  if (sitemaps && sitemaps.length > 0) {
    out += '\n# XML Sitemaps\n';
    sitemaps.filter(Boolean).forEach(s => {
      out += `Sitemap: ${s}\n`;
    });
  }

  return out.trim();
}

// ==========================================
// 3. XML SITEMAP GENERATOR
// ==========================================

export function generateXmlSitemap(entries = [], { isIndex = false } = {}) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

  if (isIndex) {
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    entries.forEach(item => {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
      if (item.lastmod) {
        xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
      }
      xml += `  </sitemap>\n`;
    });
    xml += `</sitemapindex>`;
    return xml;
  }

  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  entries.forEach(item => {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    if (item.lastmod) {
      xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    }
    if (item.changefreq && item.changefreq !== 'none') {
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    }
    if (item.priority !== undefined && item.priority !== '' && item.priority !== null) {
      xml += `    <priority>${parseFloat(item.priority).toFixed(1)}</priority>\n`;
    }
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

function escapeXml(unsafe = '') {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// ==========================================
// 4. SITEMAP.XML VALIDATOR & INSPECTOR
// ==========================================

export const VALID_CHANGEFREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export function validateXmlSitemap(xmlString = '') {
  const result = {
    isValid: false,
    isIndex: false,
    urls: [],
    errors: [],
    warnings: [],
    stats: {
      totalUrls: 0,
      hasLastmod: 0,
      hasPriority: 0,
      hasChangefreq: 0,
      changefreqCounts: {},
      averagePriority: 0
    }
  };

  if (!xmlString || !xmlString.trim()) {
    result.errors.push({ line: 1, message: 'Sitemap XML is empty.' });
    return result;
  }

  // Parse XML using browser DOMParser or fallback regex
  let doc = null;
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      doc = parser.parseFromString(xmlString, 'application/xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        result.errors.push({
          line: 1,
          message: `XML Parsing Error: ${parserError.textContent.split('\n')[0].replace('This page contains the following errors:', '').trim()}`
        });
        return result;
      }
    } catch (err) {
      result.errors.push({ line: 1, message: `XML Parser exception: ${err.message}` });
      return result;
    }
  }

  if (!doc) {
    result.errors.push({ line: 1, message: 'DOMParser is unavailable in this runtime.' });
    return result;
  }

  const root = doc.documentElement;
  const rootTag = root.tagName.toLowerCase();

  if (rootTag === 'sitemapindex') {
    result.isIndex = true;
  } else if (rootTag === 'urlset') {
    result.isIndex = false;
  } else {
    result.errors.push({
      line: 1,
      message: `Invalid root tag <${root.tagName}>. Must be either <urlset> or <sitemapindex>.`
    });
    return result;
  }

  // Namespace check
  const xmlns = root.getAttribute('xmlns');
  if (xmlns !== 'http://www.sitemaps.org/schemas/sitemap/0.9') {
    result.warnings.push({
      line: 1,
      message: `Root xmlns is "${xmlns || 'missing'}". Recommended standard namespace is "http://www.sitemaps.org/schemas/sitemap/0.9".`
    });
  }

  // Process nodes
  const nodeName = result.isIndex ? 'sitemap' : 'url';
  const nodes = Array.from(root.getElementsByTagName(nodeName));

  if (nodes.length === 0) {
    result.warnings.push({
      line: 1,
      message: `Sitemap contains zero <${nodeName}> elements.`
    });
  }

  if (nodes.length > 50000) {
    result.errors.push({
      line: 1,
      message: `Sitemap exceeds 50,000 URLs limit (${nodes.length} found). Search engines will reject this file unless split with a <sitemapindex>.`
    });
  }

  let totalPriority = 0;
  let priorityCount = 0;

  nodes.forEach((node, idx) => {
    const locNode = node.querySelector('loc');
    const lastmodNode = node.querySelector('lastmod');
    const changefreqNode = node.querySelector('changefreq');
    const priorityNode = node.querySelector('priority');

    const item = {
      index: idx + 1,
      loc: locNode ? locNode.textContent.trim() : '',
      lastmod: lastmodNode ? lastmodNode.textContent.trim() : '',
      changefreq: changefreqNode ? changefreqNode.textContent.trim() : '',
      priority: priorityNode ? priorityNode.textContent.trim() : '',
      errors: []
    };

    // 1. Validate <loc>
    if (!item.loc) {
      item.errors.push('Missing mandatory <loc> URL tag.');
      result.errors.push({ line: idx + 1, message: `URL #${idx + 1}: Missing mandatory <loc> tag.` });
    } else {
      if (!/^https?:\/\//i.test(item.loc)) {
        item.errors.push('URL must begin with http:// or https://');
        result.errors.push({ line: idx + 1, message: `URL #${idx + 1}: Invalid protocol in "${item.loc}". Must start with http:// or https://` });
      }
    }

    // 2. Validate <lastmod>
    if (item.lastmod) {
      result.stats.hasLastmod++;
      // Check ISO 8601 / W3C Datetime (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
      const isDateValid = !isNaN(Date.parse(item.lastmod));
      if (!isDateValid || !/^\d{4}-\d{2}-\d{2}/.test(item.lastmod)) {
        item.errors.push(`Invalid date format in <lastmod>: "${item.lastmod}". Expected YYYY-MM-DD.`);
        result.warnings.push({ line: idx + 1, message: `URL #${idx + 1}: Invalid date format in <lastmod> "${item.lastmod}". Expected YYYY-MM-DD.` });
      }
    }

    // 3. Validate <changefreq>
    if (item.changefreq) {
      result.stats.hasChangefreq++;
      const freq = item.changefreq.toLowerCase();
      if (!VALID_CHANGEFREQS.includes(freq)) {
        item.errors.push(`Invalid changefreq "${item.changefreq}". Allowed: ${VALID_CHANGEFREQS.join(', ')}`);
        result.warnings.push({ line: idx + 1, message: `URL #${idx + 1}: Invalid changefreq "${item.changefreq}".` });
      } else {
        result.stats.changefreqCounts[freq] = (result.stats.changefreqCounts[freq] || 0) + 1;
      }
    }

    // 4. Validate <priority>
    if (item.priority !== '') {
      result.stats.hasPriority++;
      const p = parseFloat(item.priority);
      if (isNaN(p) || p < 0.0 || p > 1.0) {
        item.errors.push(`Invalid priority "${item.priority}". Must be a float between 0.0 and 1.0.`);
        result.warnings.push({ line: idx + 1, message: `URL #${idx + 1}: Priority must be between 0.0 and 1.0, got "${item.priority}".` });
      } else {
        totalPriority += p;
        priorityCount++;
      }
    }

    result.urls.push(item);
  });

  result.stats.totalUrls = nodes.length;
  result.stats.averagePriority = priorityCount > 0 ? (totalPriority / priorityCount).toFixed(2) : 0;
  result.isValid = result.errors.length === 0;

  return result;
}
