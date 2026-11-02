/**
 * Utilities for CSS formatting, minification, and statistics.
 */

/**
 * Formats and beautifies CSS code with configurable indentation.
 * Handles nested blocks like @media, @supports, and @keyframes.
 */
export function formatCss(cssString, options = {}) {
  const {
    indent = '2', // '2', '4', or 'tab'
    removeComments = false,
    sortProperties = false
  } = options;

  if (!cssString || !cssString.trim()) {
    return {
      success: false,
      error: 'Empty CSS content provided.'
    };
  }

  const space = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent, 10) || 2);
  let cleaned = cssString.trim();

  // Strip comments if requested
  if (removeComments) {
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  // Tokenize CSS into comments, at-rules, selectors, declarations, braces
  // We'll parse block by block
  let depth = 0;
  const lines = [];
  let buffer = '';
  let inComment = false;
  let inString = false;
  let stringChar = '';

  const chars = cleaned.split('');
  let i = 0;
  let ruleCount = 0;

  // Helper to process declarations block (e.g. inside a rule { ... })
  const formatDeclarations = (declStr, currentDepth) => {
    const declIndent = space.repeat(currentDepth);
    const decls = [];
    let currentDecl = '';
    let inParen = 0;

    for (let c = 0; c < declStr.length; c++) {
      const char = declStr[c];
      if (char === '(') inParen++;
      else if (char === ')') inParen = Math.max(0, inParen - 1);

      if (char === ';' && inParen === 0) {
        if (currentDecl.trim()) {
          decls.push(currentDecl.trim());
        }
        currentDecl = '';
      } else {
        currentDecl += char;
      }
    }
    if (currentDecl.trim()) {
      decls.push(currentDecl.trim());
    }

    if (sortProperties) {
      decls.sort((a, b) => {
        // Keep CSS variables at top or sort standard
        const propA = a.split(':')[0]?.trim().toLowerCase() || '';
        const propB = b.split(':')[0]?.trim().toLowerCase() || '';
        return propA.localeCompare(propB);
      });
    }

    const formattedDecls = decls.map((d) => {
      // Split property and value by first colon
      const colonIndex = d.indexOf(':');
      if (colonIndex > 0) {
        const prop = d.slice(0, colonIndex).trim();
        const val = d.slice(colonIndex + 1).trim();
        return `${declIndent}${prop}: ${val};`;
      }
      return `${declIndent}${d};`;
    });

    return formattedDecls;
  };

  while (i < chars.length) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    // String tracking
    if (!inComment && (char === '"' || char === "'")) {
      if (inString && char === stringChar && chars[i - 1] !== '\\') {
        inString = false;
      } else if (!inString) {
        inString = true;
        stringChar = char;
      }
      buffer += char;
      i++;
      continue;
    }

    if (inString) {
      buffer += char;
      i++;
      continue;
    }

    // Comment tracking
    if (!inComment && char === '/' && nextChar === '*') {
      inComment = true;
      buffer += '/*';
      i += 2;
      continue;
    }

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        buffer += '*/';
        i += 2;
        const commentLines = buffer.trim().split('\n').map(l => `${space.repeat(depth)}${l.trim()}`);
        lines.push(...commentLines);
        buffer = '';
        continue;
      }
      buffer += char;
      i++;
      continue;
    }

    // Opening block '{'
    if (char === '{') {
      const selector = buffer.trim();
      buffer = '';
      if (selector) {
        // Clean multi-selectors: a, b, c -> separate or clean space
        const cleanedSelector = selector
          .replace(/\s+/g, ' ')
          .replace(/\s*,\s*/g, ',\n' + space.repeat(depth));

        lines.push(`${space.repeat(depth)}${cleanedSelector} {`);
      } else {
        lines.push(`${space.repeat(depth)}{`);
      }
      depth++;
      ruleCount++;
      i++;
      continue;
    }

    // Closing block '}'
    if (char === '}') {
      const innerDecl = buffer.trim();
      buffer = '';
      if (innerDecl) {
        const formattedDecls = formatDeclarations(innerDecl, depth);
        lines.push(...formattedDecls);
      }
      depth = Math.max(0, depth - 1);
      lines.push(`${space.repeat(depth)}}`);
      i++;
      continue;
    }

    buffer += char;
    i++;
  }

  // Any remaining buffer
  if (buffer.trim()) {
    lines.push(buffer.trim());
  }

  const result = lines.join('\n');

  return {
    success: true,
    result,
    stats: {
      lines: result.split('\n').length,
      chars: result.length,
      bytes: new Blob([result]).size,
      ruleCount
    }
  };
}

/**
 * Minifies CSS code into single line, stripping all comments and unnecessary whitespace.
 */
export function minifyCss(cssString, options = {}) {
  const {
    preserveBanners = false
  } = options;

  if (!cssString || !cssString.trim()) {
    return {
      success: false,
      error: 'Empty CSS content provided to minify.'
    };
  }

  const originalSize = cssString.length;
  const originalBytes = new Blob([cssString]).size;

  let minified = cssString;

  // 1. Comments removal (preserve /*! ... */ if requested)
  if (preserveBanners) {
    minified = minified.replace(/\/\*(?!![\s\S]*?\*\/)[\s\S]*?\*\//g, '');
  } else {
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  // 2. Whitespace compression
  minified = minified
    .replace(/\s+/g, ' ')                 // Multiple spaces to single space
    .replace(/\s*{\s*/g, '{')             // Whitespace around {
    .replace(/\s*}\s*/g, '}')             // Whitespace around }
    .replace(/\s*:\s*/g, ':')             // Whitespace around :
    .replace(/\s*;\s*/g, ';')             // Whitespace around ;
    .replace(/\s*,\s*/g, ',')             // Whitespace around ,
    .replace(/\s*>\s*/g, '>')             // Whitespace around child combinator >
    .replace(/\s*\+\s*/g, '+')            // Whitespace around adjacent sibling combinator +
    .replace(/\s*~\s*/g, '~')             // Whitespace around general sibling combinator ~
    .replace(/;}/g, '}')                  // Trailing semicolon before closing brace
    .replace(/(^|[^0-9])0(px|em|rem|%|in|cm|mm|pc|pt)/gi, '$10') // 0px -> 0
    .trim();

  const minifiedSize = minified.length;
  const minifiedBytes = new Blob([minified]).size;
  const reduction = originalSize > 0 
    ? ((originalSize - minifiedSize) / originalSize) * 100 
    : 0;

  return {
    success: true,
    result: minified,
    stats: {
      originalChars: originalSize,
      minifiedChars: minifiedSize,
      savedChars: Math.max(0, originalSize - minifiedSize),
      reductionPercentage: parseFloat(reduction.toFixed(2)),
      originalBytes,
      minifiedBytes,
      savedBytes: Math.max(0, originalBytes - minifiedBytes)
    }
  };
}

export const SAMPLE_CSS = `:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  --surface-color: rgba(30, 41, 59, 0.7);
  --border-radius: 16px;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Modern Card Layout */
.card-container, .panel-wrapper {
  background: var(--surface-color);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  padding: 24px;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.card-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.3);
}

/* Primary Action Button */
.btn-primary {
  align-items: center;
  background-color: var(--primary-color);
  border-radius: 12px;
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
  outline: none;
  padding: 10px 20px;
  transition: background-color var(--transition-fast);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

/* Pulsing Keyframe Animation */
@keyframes pulseGlow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.05);
  }
}

/* Responsive Media Queries */
@media (max-width: 768px) {
  .card-container {
    padding: 16px;
    border-radius: 12px;
  }
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}`;
