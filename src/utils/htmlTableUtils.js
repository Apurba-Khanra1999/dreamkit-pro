/**
 * Utilities and Code Generators for the HTML Table Generator Suite
 */

export const TABLE_THEMES = [
  {
    id: 'modern_clean',
    name: 'Modern Clean',
    desc: 'Subtle borders, clean dividers, soft header tint.',
    headerBg: '#f8fafc',
    headerText: '#1e293b',
    borderColor: '#e2e8f0',
    zebraBg: '#f8fafc',
    hoverBg: '#f1f5f9',
    textColor: '#334155'
  },
  {
    id: 'striped_zebra',
    name: 'Striped Zebra',
    desc: 'Alternating shaded rows for dense data scanning.',
    headerBg: '#0f172a',
    headerText: '#ffffff',
    borderColor: '#cbd5e1',
    zebraBg: '#f1f5f9',
    hoverBg: '#e2e8f0',
    textColor: '#1e293b'
  },
  {
    id: 'bordered_grid',
    name: 'Bordered Grid',
    desc: 'Crisp borders around every cell like a classic spreadsheet.',
    headerBg: '#f1f5f9',
    headerText: '#0f172a',
    borderColor: '#94a3b8',
    zebraBg: '#f8fafc',
    hoverBg: '#f1f5f9',
    textColor: '#0f172a'
  },
  {
    id: 'vibrant_indigo',
    name: 'Vibrant Indigo',
    desc: 'Premium deep indigo header with clean white and slate accents.',
    headerBg: '#4f46e5',
    headerText: '#ffffff',
    borderColor: '#e0e7ff',
    zebraBg: '#f5f7ff',
    hoverBg: '#eef2ff',
    textColor: '#1e1b4b'
  },
  {
    id: 'emerald_accent',
    name: 'Emerald Corporate',
    desc: 'Rich emerald green header for accounting, finance & KPI reports.',
    headerBg: '#059669',
    headerText: '#ffffff',
    borderColor: '#d1fae5',
    zebraBg: '#f0fdf4',
    hoverBg: '#ecfdf5',
    textColor: '#064e3b'
  },
  {
    id: 'dark_glass',
    name: 'Dark Mode Glass',
    desc: 'Deep slate background with neon violet accents and luminous text.',
    headerBg: '#1e293b',
    headerText: '#f8fafc',
    borderColor: '#334155',
    zebraBg: '#0f172a',
    hoverBg: '#334155',
    textColor: '#f1f5f9',
    isDark: true
  },
  {
    id: 'minimal_rules',
    name: 'Minimalist Editorial',
    desc: 'Refined publication style with top, header, and bottom rules only.',
    headerBg: 'transparent',
    headerText: '#0f172a',
    borderColor: '#0f172a',
    zebraBg: 'transparent',
    hoverBg: '#f8fafc',
    textColor: '#334155',
    borderStyle: 'horizontal_only'
  }
];

export const PRESET_TEMPLATES = [
  {
    id: 'company_metrics',
    name: 'Product & Metrics Report',
    category: 'Business',
    caption: 'Company Performance & Product Metrics 2026',
    hasHeader: true,
    hasFooter: true,
    headers: ['Product Line', 'Category', 'Active Users', 'Growth (YoY)', 'Quarterly Revenue', 'Status'],
    alignments: ['left', 'left', 'right', 'right', 'right', 'center'],
    rows: [
      ['DreamKit Pro', 'Developer Tools', '142,500', '+38.4%', '$285,000', 'Active'],
      ['CloudSync API', 'Infrastructure', '89,200', '+112.5%', '$198,400', 'Trending'],
      ['Studio UI Kit', 'Design Assets', '64,100', '+18.2%', '$84,500', 'Stable'],
      ['SecurID Auth', 'Cybersecurity', '52,800', '+64.7%', '$142,000', 'Active'],
      ['MetricsPulse', 'Analytics', '31,400', '-4.1%', '$46,200', 'Review']
    ],
    footers: ['Total (5 Products)', 'All Categories', '380,000 Users', '+45.9% Avg', '$756,100', '98.5% Uptime']
  },
  {
    id: 'saas_pricing',
    name: 'SaaS Pricing Comparison',
    category: 'Marketing',
    caption: 'Subscription Plans & Feature Comparison',
    hasHeader: true,
    hasFooter: false,
    headers: ['Feature', 'Free Starter', 'Pro Developer', 'Enterprise Scale'],
    alignments: ['left', 'center', 'center', 'center'],
    rows: [
      ['Monthly Price', '$0 / mo', '$29 / mo', '$199 / mo'],
      ['Workspace Seats', '1 User', '5 Users', 'Unlimited'],
      ['Cloud API Requests', '10,000 / mo', '1,000,000 / mo', 'Unlimited Dedicated'],
      ['Client-Side Encryption', 'Standard', 'Advanced (AES-256)', 'Custom HSM & KMS'],
      ['Support SLA', 'Community Discord', '24h Priority Email', '1h Dedicated Slack'],
      ['Custom Domain & Branding', 'No', 'Yes', 'Yes']
    ],
    footers: []
  },
  {
    id: 'employee_directory',
    name: 'Team / Employee Directory',
    category: 'HR & Ops',
    caption: 'Global Engineering & Product Team Directory',
    hasHeader: true,
    hasFooter: false,
    headers: ['Full Name', 'Department', 'Role / Title', 'Location', 'Email Contact', 'Status'],
    alignments: ['left', 'left', 'left', 'left', 'left', 'center'],
    rows: [
      ['Elena Rostova', 'Engineering', 'Principal Architect', 'Berlin, DE', 'elena@example.com', 'Active'],
      ['Marcus Vance', 'Product', 'Lead UX Designer', 'San Francisco, US', 'marcus@example.com', 'Active'],
      ['Aoi Takahashi', 'Engineering', 'Core Systems Lead', 'Tokyo, JP', 'aoi@example.com', 'On Leave'],
      ['Devon Sterling', 'DevOps', 'Cloud Infrastructure SRE', 'London, UK', 'devon@example.com', 'Active'],
      ['Camila Flores', 'Product Marketing', 'Growth Manager', 'Sao Paulo, BR', 'camila@example.com', 'Active']
    ],
    footers: []
  },
  {
    id: 'crypto_assets',
    name: 'Financial Market Watch',
    category: 'Finance',
    caption: 'Top Digital Assets & Market Capitalization',
    hasHeader: true,
    hasFooter: true,
    headers: ['Asset', 'Ticker', 'Spot Price', '24h Change', '24h Volume', 'Market Cap'],
    alignments: ['left', 'center', 'right', 'right', 'right', 'right'],
    rows: [
      ['Bitcoin', 'BTC', '$89,450.00', '+3.82%', '$42.8B', '$1.76T'],
      ['Ethereum', 'ETH', '$3,420.50', '+5.14%', '$24.1B', '$411.2B'],
      ['Solana', 'SOL', '$184.20', '-1.25%', '$7.6B', '$86.4B'],
      ['Cardano', 'ADA', '$0.78', '+8.40%', '$1.8B', '$27.9B'],
      ['Avalanche', 'AVAX', '$34.60', '+2.10%', '$980M', '$14.2B']
    ],
    footers: ['Portfolio Composite', '5 Assets', 'Avg +3.64%', 'Positive Bias', '$77.28B Total', '$2.30T Total']
  }
];

export const DEFAULT_TABLE = PRESET_TEMPLATES[0];

/**
 * Escapes special HTML characters to prevent XSS and preserve text integrity.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalizes table dimensions (rows, cols) ensuring uniform rectangular grid
 */
export function normalizeTable(table) {
  const headers = Array.isArray(table.headers) ? [...table.headers] : [];
  const colCount = Math.max(1, headers.length);

  while (headers.length < colCount) {
    headers.push(`Column ${headers.length + 1}`);
  }

  const alignments = headers.map((_, idx) => {
    return table.alignments?.[idx] || 'left';
  });

  const rows = (table.rows || []).map((row) => {
    const newRow = Array.isArray(row) ? [...row] : [];
    while (newRow.length < colCount) newRow.push('');
    return newRow.slice(0, colCount);
  });

  const footers = table.hasFooter && Array.isArray(table.footers)
    ? [...table.footers]
    : [];
  while (footers.length < colCount && table.hasFooter) {
    footers.push('');
  }

  return {
    caption: table.caption || '',
    hasHeader: table.hasHeader !== false,
    hasFooter: !!table.hasFooter,
    headers: headers.slice(0, colCount),
    alignments,
    rows,
    footers: footers.slice(0, colCount)
  };
}

/**
 * Generates styled HTML code
 */
export function generateHtmlTable(tableData, options = {}) {
  const norm = normalizeTable(tableData);
  const {
    styleMode = 'inline', // 'inline' | 'embedded_css' | 'clean'
    themeId = 'modern_clean',
    isResponsive = true,
    hasStripedRows = true,
    hasHoverHighlight = true,
    cellPadding = 'standard', // 'compact' | 'standard' | 'relaxed'
    borderStyle = 'thin', // 'none' | 'thin' | 'solid'
    borderRadius = 8, // px
    fullWidth = true,
    customClass = 'custom-table',
    customId = 'data-table'
  } = options;

  const theme = TABLE_THEMES.find((t) => t.id === themeId) || TABLE_THEMES[0];

  // Padding definitions
  const paddingMap = {
    compact: '6px 10px',
    standard: '12px 16px',
    relaxed: '16px 22px'
  };
  const padVal = paddingMap[cellPadding] || paddingMap.standard;

  // Border definitions
  let borderCss = `1px solid ${theme.borderColor}`;
  if (borderStyle === 'none') borderCss = 'none';
  if (borderStyle === 'solid') borderCss = `2px solid ${theme.borderColor}`;

  const isMinimal = theme.borderStyle === 'horizontal_only';

  if (styleMode === 'clean') {
    // Plain semantic HTML5 without inline styles or style blocks
    let html = '';
    if (isResponsive) html += '<div class="table-responsive">\n';
    html += `  <table id="${customId}" class="${customClass}">\n`;

    if (norm.caption) {
      html += `    <caption>${escapeHtml(norm.caption)}</caption>\n`;
    }

    if (norm.hasHeader && norm.headers.length > 0) {
      html += '    <thead>\n      <tr>\n';
      norm.headers.forEach((h, i) => {
        const align = norm.alignments[i] || 'left';
        const alignAttr = align !== 'left' ? ` style="text-align: ${align};"` : '';
        html += `        <th${alignAttr}>${escapeHtml(h)}</th>\n`;
      });
      html += '      </tr>\n    </thead>\n';
    }

    html += '    <tbody>\n';
    norm.rows.forEach((row) => {
      html += '      <tr>\n';
      row.forEach((cell, i) => {
        const align = norm.alignments[i] || 'left';
        const alignAttr = align !== 'left' ? ` style="text-align: ${align};"` : '';
        html += `        <td${alignAttr}>${escapeHtml(cell)}</td>\n`;
      });
      html += '      </tr>\n';
    });
    html += '    </tbody>\n';

    if (norm.hasFooter && norm.footers.length > 0) {
      html += '    <tfoot>\n      <tr>\n';
      norm.footers.forEach((f, i) => {
        const align = norm.alignments[i] || 'left';
        const alignAttr = align !== 'left' ? ` style="text-align: ${align};"` : '';
        html += `        <td${alignAttr}>${escapeHtml(f)}</td>\n`;
      });
      html += '      </tr>\n    </tfoot>\n';
    }

    html += '  </table>\n';
    if (isResponsive) html += '</div>';
    return html;
  }

  if (styleMode === 'embedded_css') {
    // Generate clean CSS class stylesheet + semantic HTML
    const css = `/* HTML Table Stylesheet - Generated with DreamKit */
.${customClass}-container {
  width: 100%;
  ${isResponsive ? 'overflow-x: auto;' : ''}
  margin: 1rem 0;
  ${borderRadius > 0 ? `border-radius: ${borderRadius}px;` : ''}
  ${borderRadius > 0 ? 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);' : ''}
}

table.${customClass} {
  width: ${fullWidth ? '100%' : 'auto'};
  border-collapse: collapse;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  text-align: left;
  color: ${theme.textColor};
  background-color: ${theme.isDark ? '#0f172a' : '#ffffff'};
  ${isMinimal ? `border-top: 2px solid ${theme.borderColor}; border-bottom: 2px solid ${theme.borderColor};` : (borderStyle !== 'none' ? `border: ${borderCss};` : '')}
  ${borderRadius > 0 ? 'overflow: hidden;' : ''}
}

table.${customClass} caption {
  font-size: 15px;
  font-weight: 600;
  padding: 10px 4px;
  text-align: left;
  color: ${theme.textColor};
  caption-side: top;
}

table.${customClass} th {
  background-color: ${theme.headerBg};
  color: ${theme.headerText};
  font-weight: 600;
  padding: ${padVal};
  ${isMinimal ? `border-bottom: 2px solid ${theme.borderColor};` : (borderStyle !== 'none' ? `border: ${borderCss};` : `border-bottom: 2px solid ${theme.borderColor};`)}
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.05em;
}

table.${customClass} td {
  padding: ${padVal};
  ${isMinimal ? `border-bottom: 1px solid ${theme.borderColor};` : (borderStyle !== 'none' ? `border: ${borderCss};` : `border-bottom: 1px solid ${theme.borderColor};`)}
}

${hasStripedRows ? `table.${customClass} tbody tr:nth-child(even) {
  background-color: ${theme.zebraBg};
}` : ''}

${hasHoverHighlight ? `table.${customClass} tbody tr:hover {
  background-color: ${theme.hoverBg};
}` : ''}

table.${customClass} tfoot td {
  background-color: ${theme.headerBg};
  color: ${theme.headerText};
  font-weight: 600;
  padding: ${padVal};
  ${isMinimal ? `border-top: 2px solid ${theme.borderColor};` : (borderStyle !== 'none' ? `border: ${borderCss};` : `border-top: 2px solid ${theme.borderColor};`)}
}`;

    let html = `<style>\n${css}\n</style>\n\n`;
    html += `<div class="${customClass}-container">\n`;
    html += `  <table id="${customId}" class="${customClass}">\n`;

    if (norm.caption) {
      html += `    <caption>${escapeHtml(norm.caption)}</caption>\n`;
    }

    if (norm.hasHeader && norm.headers.length > 0) {
      html += '    <thead>\n      <tr>\n';
      norm.headers.forEach((h, i) => {
        const align = norm.alignments[i] || 'left';
        const alignAttr = align !== 'left' ? ` style="text-align: ${align};"` : '';
        html += `        <th${alignAttr}>${escapeHtml(h)}</th>\n`;
      });
      html += '      </tr>\n    </thead>\n';
    }

    html += '    <tbody>\n';
    norm.rows.forEach((row) => {
      html += '      <tr>\n';
      row.forEach((cell, i) => {
        const align = norm.alignments[i] || 'left';
        const alignAttr = align !== 'left' ? ` style="text-align: ${align};"` : '';
        html += `        <td${alignAttr}>${escapeHtml(cell)}</td>\n`;
      });
      html += '      </tr>\n';
    });
    html += '    </tbody>\n';

    if (norm.hasFooter && norm.footers.length > 0) {
      html += '    <tfoot>\n      <tr>\n';
      norm.footers.forEach((f, i) => {
        const align = norm.alignments[i] || 'left';
        const alignAttr = align !== 'left' ? ` style="text-align: ${align};"` : '';
        html += `        <td${alignAttr}>${escapeHtml(f)}</td>\n`;
      });
      html += '      </tr>\n    </tfoot>\n';
    }

    html += '  </table>\n</div>';
    return html;
  }

  // Default: Pure Inline CSS Mode (100% portable for emails, Notion, WordPress, CMS)
  const containerStyle = isResponsive
    ? 'overflow-x: auto; width: 100%; margin: 16px 0;'
    : 'width: 100%; margin: 16px 0;';

  const tableBaseStyle = [
    `width: ${fullWidth ? '100%' : 'auto'}`,
    'border-collapse: collapse',
    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'font-size: 14px',
    `color: ${theme.textColor}`,
    `background-color: ${theme.isDark ? '#0f172a' : '#ffffff'}`,
    borderRadius > 0 ? `border-radius: ${borderRadius}px; overflow: hidden;` : '',
    borderRadius > 0 ? 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : '',
    isMinimal
      ? `border-top: 2px solid ${theme.borderColor}; border-bottom: 2px solid ${theme.borderColor};`
      : (borderStyle !== 'none' ? `border: ${borderCss};` : '')
  ].filter(Boolean).join('; ');

  let html = isResponsive ? `<div style="${containerStyle}">\n` : '';
  html += `  <table id="${customId}" style="${tableBaseStyle}">\n`;

  if (norm.caption) {
    html += `    <caption style="caption-side: top; text-align: left; font-weight: 600; font-size: 15px; padding: 8px 4px; color: ${theme.textColor};">${escapeHtml(norm.caption)}</caption>\n`;
  }

  // Headers
  if (norm.hasHeader && norm.headers.length > 0) {
    html += '    <thead>\n      <tr>\n';
    norm.headers.forEach((h, i) => {
      const align = norm.alignments[i] || 'left';
      const thStyle = [
        `background-color: ${theme.headerBg}`,
        `color: ${theme.headerText}`,
        `padding: ${padVal}`,
        `text-align: ${align}`,
        'font-weight: 600',
        'font-size: 12px',
        'text-transform: uppercase',
        'letter-spacing: 0.05em',
        isMinimal
          ? `border-bottom: 2px solid ${theme.borderColor}`
          : (borderStyle !== 'none' ? `border: ${borderCss}` : `border-bottom: 2px solid ${theme.borderColor}`)
      ].join('; ');
      html += `        <th style="${thStyle}">${escapeHtml(h)}</th>\n`;
    });
    html += '      </tr>\n    </thead>\n';
  }

  // Rows
  html += '    <tbody>\n';
  norm.rows.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 1;
    const rowBg = hasStripedRows && isEven ? theme.zebraBg : 'transparent';
    const trStyle = rowBg !== 'transparent' ? ` style="background-color: ${rowBg};"` : '';

    html += `      <tr${trStyle}>\n`;
    row.forEach((cell, i) => {
      const align = norm.alignments[i] || 'left';
      const tdStyle = [
        `padding: ${padVal}`,
        `text-align: ${align}`,
        isMinimal
          ? `border-bottom: 1px solid ${theme.borderColor}`
          : (borderStyle !== 'none' ? `border: ${borderCss}` : `border-bottom: 1px solid ${theme.borderColor}`)
      ].join('; ');
      html += `        <td style="${tdStyle}">${escapeHtml(cell)}</td>\n`;
    });
    html += '      </tr>\n';
  });
  html += '    </tbody>\n';

  // Footer
  if (norm.hasFooter && norm.footers.length > 0) {
    html += '    <tfoot>\n      <tr>\n';
    norm.footers.forEach((f, i) => {
      const align = norm.alignments[i] || 'left';
      const tfStyle = [
        `background-color: ${theme.headerBg}`,
        `color: ${theme.headerText}`,
        `padding: ${padVal}`,
        `text-align: ${align}`,
        'font-weight: 600',
        isMinimal
          ? `border-top: 2px solid ${theme.borderColor}`
          : (borderStyle !== 'none' ? `border: ${borderCss}` : `border-top: 2px solid ${theme.borderColor}`)
      ].join('; ');
      html += `        <td style="${tfStyle}">${escapeHtml(f)}</td>\n`;
    });
    html += '      </tr>\n    </tfoot>\n';
  }

  html += '  </table>\n';
  if (isResponsive) html += '</div>';

  return html;
}

/**
 * Generates modern Tailwind CSS Table Markup
 */
export function generateTailwindTable(tableData, options = {}) {
  const norm = normalizeTable(tableData);
  const {
    isResponsive = true,
    hasStripedRows = true,
    hasHoverHighlight = true,
    cellPadding = 'standard',
    borderRadius = 8
  } = options;

  const padClassMap = {
    compact: 'px-3 py-2 text-xs',
    standard: 'px-4 py-3 text-sm',
    relaxed: 'px-6 py-4 text-base'
  };
  const padClass = padClassMap[cellPadding] || padClassMap.standard;

  let out = '';
  if (isResponsive) {
    out += '<div class="relative overflow-x-auto shadow-md ' + (borderRadius > 0 ? 'sm:rounded-lg' : '') + '">\n';
  }

  out += '  <table class="w-full text-left rtl:text-right text-slate-600 dark:text-slate-300">\n';

  if (norm.caption) {
    out += `    <caption class="p-4 text-base font-semibold text-left rtl:text-right text-slate-900 bg-white dark:text-white dark:bg-slate-900">\n      ${escapeHtml(norm.caption)}\n    </caption>\n`;
  }

  if (norm.hasHeader && norm.headers.length > 0) {
    out += '    <thead class="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">\n      <tr>\n';
    norm.headers.forEach((h, i) => {
      const align = norm.alignments[i] || 'left';
      const alignClass = align === 'center' ? ' text-center' : align === 'right' ? ' text-right' : ' text-left';
      out += `        <th scope="col" class="${padClass}${alignClass}">${escapeHtml(h)}</th>\n`;
    });
    out += '      </tr>\n    </thead>\n';
  }

  out += '    <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">\n';
  norm.rows.forEach((row, idx) => {
    const isEven = idx % 2 === 1;
    const stripeClass = hasStripedRows && isEven ? ' bg-slate-50 dark:bg-slate-850' : '';
    const hoverClass = hasHoverHighlight ? ' hover:bg-slate-100/75 dark:hover:bg-slate-800/60 transition-colors' : '';

    out += `      <tr class="${stripeClass}${hoverClass}">\n`;
    row.forEach((cell, i) => {
      const align = norm.alignments[i] || 'left';
      const alignClass = align === 'center' ? ' text-center' : align === 'right' ? ' text-right' : ' text-left';
      out += `        <td class="${padClass}${alignClass}">${escapeHtml(cell)}</td>\n`;
    });
    out += '      </tr>\n';
  });
  out += '    </tbody>\n';

  if (norm.hasFooter && norm.footers.length > 0) {
    out += '    <tfoot class="text-xs font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">\n      <tr>\n';
    norm.footers.forEach((f, i) => {
      const align = norm.alignments[i] || 'left';
      const alignClass = align === 'center' ? ' text-center' : align === 'right' ? ' text-right' : ' text-left';
      out += `        <td class="${padClass}${alignClass}">${escapeHtml(f)}</td>\n`;
    });
    out += '      </tr>\n    </tfoot>\n';
  }

  out += '  </table>\n';
  if (isResponsive) out += '</div>';

  return out;
}

/**
 * Generates GitHub-Flavored Markdown Table
 */
export function generateMarkdownTable(tableData) {
  const norm = normalizeTable(tableData);
  if (!norm.headers.length) return '';

  const colWidths = norm.headers.map((h, i) => {
    let max = String(h || '').length;
    norm.rows.forEach((r) => {
      const len = String(r[i] || '').length;
      if (len > max) max = len;
    });
    if (norm.hasFooter && norm.footers[i]) {
      const len = String(norm.footers[i]).length;
      if (len > max) max = len;
    }
    return Math.max(3, max);
  });

  let md = '';
  if (norm.caption) {
    md += `### ${norm.caption}\n\n`;
  }

  // Header row
  md += '| ' + norm.headers.map((h, i) => (h || '').padEnd(colWidths[i])).join(' | ') + ' |\n';

  // Divider row with alignment colons
  md += '| ' + norm.alignments.map((a, i) => {
    const w = colWidths[i];
    if (a === 'center') {
      return ':' + '-'.repeat(Math.max(1, w - 2)) + ':';
    }
    if (a === 'right') {
      return '-'.repeat(Math.max(2, w - 1)) + ':';
    }
    return ':' + '-'.repeat(Math.max(2, w - 1));
  }).join(' | ') + ' |\n';

  // Body rows
  norm.rows.forEach((row) => {
    md += '| ' + row.map((cell, i) => {
      const a = norm.alignments[i];
      const s = String(cell || '');
      const w = colWidths[i];
      if (a === 'right') return s.padStart(w);
      if (a === 'center') {
        const totalPad = Math.max(0, w - s.length);
        const left = Math.floor(totalPad / 2);
        const right = totalPad - left;
        return ' '.repeat(left) + s + ' '.repeat(right);
      }
      return s.padEnd(w);
    }).join(' | ') + ' |\n';
  });

  // Footer row (if present)
  if (norm.hasFooter && norm.footers.length > 0) {
    md += '| ' + norm.footers.map((f, i) => String(f || '').padEnd(colWidths[i])).join(' | ') + ' |\n';
  }

  return md;
}

/**
 * Generates standard RFC 4180 CSV
 */
export function generateCsvTable(tableData, delimiter = ',') {
  const norm = normalizeTable(tableData);

  const escapeCell = (cell) => {
    const str = String(cell ?? '');
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [];
  if (norm.hasHeader && norm.headers.length > 0) {
    lines.push(norm.headers.map(escapeCell).join(delimiter));
  }

  norm.rows.forEach((row) => {
    lines.push(row.map(escapeCell).join(delimiter));
  });

  if (norm.hasFooter && norm.footers.length > 0) {
    lines.push(norm.footers.map(escapeCell).join(delimiter));
  }

  return lines.join('\n');
}

/**
 * Generates JSON array of objects or structured array
 */
export function generateJsonTable(tableData) {
  const norm = normalizeTable(tableData);

  if (!norm.hasHeader || norm.headers.length === 0) {
    return JSON.stringify(norm.rows, null, 2);
  }

  const items = norm.rows.map((row) => {
    const obj = {};
    norm.headers.forEach((h, i) => {
      const key = h && h.trim() ? h.trim() : `col_${i + 1}`;
      obj[key] = row[i] ?? '';
    });
    return obj;
  });

  return JSON.stringify(items, null, 2);
}

/**
 * Parse CSV or TSV string into Table Data structure
 */
export function parseCsvToTable(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('CSV input is empty.');
  }

  const clean = rawText.trim();
  // Auto-detect delimiter: tab vs comma vs semicolon vs pipe
  const firstLine = clean.split(/\r?\n/)[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
  else if (firstLine.includes('|')) delimiter = '|';

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (ch === '"') {
      if (insideQuotes && next === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (ch === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((ch === '\n' || ch === '\r') && !insideQuotes) {
      if (ch === '\r' && next === '\n') i++; // CRLF
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    throw new Error('No valid rows found in CSV.');
  }

  // First row is headers
  const headers = rows[0];
  const bodyRows = rows.slice(1);

  // Determine alignments (numeric -> right, text -> left)
  const alignments = headers.map((_, colIdx) => {
    let numericCount = 0;
    bodyRows.forEach((r) => {
      const val = (r[colIdx] || '').trim().replace(/[$,%]/g, '');
      if (val && !isNaN(Number(val))) numericCount++;
    });
    return numericCount > bodyRows.length * 0.6 ? 'right' : 'left';
  });

  return {
    caption: 'Imported CSV Table',
    hasHeader: true,
    hasFooter: false,
    headers,
    alignments,
    rows: bodyRows.length > 0 ? bodyRows : [['']],
    footers: []
  };
}

/**
 * Parse JSON string into Table Data structure
 */
export function parseJsonToTable(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('JSON input is empty.');
  }

  const parsed = JSON.parse(rawText);

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error('JSON array is empty.');
    }

    // Case A: Array of objects
    if (typeof parsed[0] === 'object' && parsed[0] !== null && !Array.isArray(parsed[0])) {
      const keySet = new Set();
      parsed.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach((k) => keySet.add(k));
        }
      });
      const headers = Array.from(keySet);
      const rows = parsed.map((item) => {
        return headers.map((k) => {
          const val = item[k];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        });
      });

      const alignments = headers.map((_, colIdx) => {
        let numericCount = 0;
        rows.forEach((r) => {
          const val = (r[colIdx] || '').trim().replace(/[$,%]/g, '');
          if (val && !isNaN(Number(val))) numericCount++;
        });
        return numericCount > rows.length * 0.6 ? 'right' : 'left';
      });

      return {
        caption: 'Imported JSON Dataset',
        hasHeader: true,
        hasFooter: false,
        headers,
        alignments,
        rows,
        footers: []
      };
    }

    // Case B: Array of arrays
    if (Array.isArray(parsed[0])) {
      const headers = parsed[0].map((v, i) => String(v || `Column ${i + 1}`));
      const bodyRows = parsed.slice(1).map((r) => r.map((c) => String(c ?? '')));
      return {
        caption: 'Imported Matrix',
        hasHeader: true,
        hasFooter: false,
        headers,
        alignments: headers.map(() => 'left'),
        rows: bodyRows.length > 0 ? bodyRows : [['']],
        footers: []
      };
    }
  }

  throw new Error('Expected JSON array of objects (e.g. [{"name": "A"}]) or 2D array.');
}

/**
 * Parse Markdown Table into Table Data structure
 */
export function parseMarkdownToTable(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Markdown table input is empty.');
  }

  const lines = rawText.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tableLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (tableLines.length < 2) {
    throw new Error('Valid Markdown table requires at least a header row and a divider row (e.g. | Col1 | Col2 |).');
  }

  const parseRow = (line) => {
    return line
      .slice(1, -1) // remove leading and trailing pipe
      .split('|')
      .map((c) => c.trim());
  };

  const headers = parseRow(tableLines[0]);
  const divider = parseRow(tableLines[1]);

  const alignments = divider.map((d) => {
    const trimmed = d.trim();
    const starts = trimmed.startsWith(':');
    const ends = trimmed.endsWith(':');
    if (starts && ends) return 'center';
    if (ends) return 'right';
    return 'left';
  });

  const bodyRows = tableLines.slice(2).map(parseRow);

  return {
    caption: 'Imported Markdown Table',
    hasHeader: true,
    hasFooter: false,
    headers,
    alignments,
    rows: bodyRows.length > 0 ? bodyRows : [['']],
    footers: []
  };
}
