/**
 * Utilities for HTML formatting, minification, and statistics.
 */

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const RAW_ELEMENTS = new Set(['script', 'style', 'pre', 'textarea']);

/**
 * Formats / Beautifies an HTML string with configurable indentation.
 */
export function formatHtml(htmlString, options = {}) {
  const {
    indent = '2', // '2', '4', or 'tab'
    removeComments = false
  } = options;

  if (!htmlString || !htmlString.trim()) {
    return {
      success: false,
      error: 'Empty HTML content provided.'
    };
  }

  const space = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent, 10) || 2);
  let cleaned = htmlString.trim();

  if (removeComments) {
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Tokenize HTML using regex
  // 1: Doctype <!DOCTYPE ...>
  // 2: Comment <!-- ... -->
  // 3: Closing tag </tag>
  // 4: Opening or self-closing tag <tag ...>
  // 5: Text content
  const tokenRegex = /(<!DOCTYPE[^>]*>)|(<!--[\s\S]*?-->)|(<\/([a-zA-Z0-9_-]+)>)|(<([a-zA-Z0-9_-]+)([^>]*)>)|([^<]+)/gi;

  let depth = 0;
  const lines = [];
  let inRawElement = null; // 'script' | 'style' | 'pre' | 'textarea'
  let rawContent = '';

  let match;
  while ((match = tokenRegex.exec(cleaned)) !== null) {
    const [token, doctype, comment, closeTag, closeTagName, openTag, openTagName, openTagAttrs, text] = match;

    if (inRawElement) {
      if (closeTag && closeTagName.toLowerCase() === inRawElement) {
        // End raw element
        const trimmedRaw = rawContent.trim();
        if (trimmedRaw) {
          lines.push(`${space.repeat(depth)}${trimmedRaw}`);
        }
        depth = Math.max(0, depth - 1);
        lines.push(`${space.repeat(depth)}</${closeTagName.toLowerCase()}>`);
        inRawElement = null;
        rawContent = '';
      } else {
        rawContent += token;
      }
      continue;
    }

    if (doctype) {
      lines.push(doctype.trim());
    } else if (comment) {
      const trimmedComment = comment.trim();
      lines.push(`${space.repeat(depth)}${trimmedComment}`);
    } else if (closeTag) {
      const tag = closeTagName.toLowerCase();
      depth = Math.max(0, depth - 1);
      lines.push(`${space.repeat(depth)}</${tag}>`);
    } else if (openTag) {
      const tag = openTagName.toLowerCase();
      const isVoid = VOID_ELEMENTS.has(tag) || openTag.endsWith('/>');
      const currentIndent = space.repeat(depth);

      // Clean attributes: normalize spacing inside tag
      const cleanAttrs = openTagAttrs ? openTagAttrs.trim().replace(/\s+/g, ' ') : '';
      const renderedTag = cleanAttrs ? `<${tag} ${cleanAttrs}${openTag.endsWith('/>') ? ' /' : ''}>` : `<${tag}${openTag.endsWith('/>') ? ' /' : ''}>`;

      lines.push(`${currentIndent}${renderedTag}`);

      if (RAW_ELEMENTS.has(tag) && !isVoid) {
        inRawElement = tag;
        rawContent = '';
        depth++;
      } else if (!isVoid) {
        depth++;
      }
    } else if (text) {
      const trimmedText = text.trim().replace(/\s+/g, ' ');
      if (trimmedText) {
        lines.push(`${space.repeat(depth)}${trimmedText}`);
      }
    }
  }

  // Join lines and clean up inline combinations
  const formatted = lines.join('\n');

  return {
    success: true,
    result: formatted,
    stats: {
      lines: formatted.split('\n').length,
      chars: formatted.length,
      bytes: new Blob([formatted]).size
    }
  };
}

/**
 * Minifies HTML by removing whitespace, comments, and redundant spaces.
 */
export function minifyHtml(htmlString, options = {}) {
  const {
    removeComments = true,
    collapseWhitespace = true
  } = options;

  if (!htmlString || !htmlString.trim()) {
    return {
      success: false,
      error: 'Empty HTML content provided to minify.'
    };
  }

  const originalSize = htmlString.length;
  const originalBytes = new Blob([htmlString]).size;

  let minified = htmlString;

  // 1. Remove standard comments (keep conditional IE comments if any)
  if (removeComments) {
    minified = minified.replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, '');
  }

  // 2. Remove whitespace between tags: >   < -> ><
  if (collapseWhitespace) {
    minified = minified.replace(/>\s+</g, '><');
    // Collapse multiple internal whitespaces to a single space
    minified = minified.replace(/\s{2,}/g, ' ');
  }

  minified = minified.trim();

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

export const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Suite - Modern Web Toolkit</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; }
    .hero { max-width: 800px; margin: 40px auto; padding: 24px; text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(79, 70, 229, 0.2); color: #818cf8; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <!-- Main application container -->
  <main class="hero">
    <span class="badge">Client-Side Engine</span>
    <h1>Your HTML. Clean, Minified, Ready.</h1>
    <p>Format and compress HTML payloads instantly in your browser with zero server transmission.</p>
    <div class="actions">
      <a href="#tools" class="btn btn-primary">Explore Dev Tools</a>
      <button type="button" class="btn btn-secondary" onclick="alert('Running client sandbox')">Run Sandbox</button>
    </div>
  </main>
  <script>
    console.log('HTML Formatter initialized successfully.');
  </script>
</body>
</html>`;
