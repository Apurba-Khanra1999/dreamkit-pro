/**
 * Parses and extracts line and column details from a JSON.parse SyntaxError.
 * @param {string} jsonString - The raw JSON string
 * @param {Error} error - The caught SyntaxError
 * @returns {object} { message, line, column, position, snippet }
 */
export function extractJsonErrorDetails(jsonString, error) {
  const message = error.message || 'Invalid JSON syntax';
  let position = null;
  let line = 1;
  let column = 1;

  // 1. Try regex extraction of line and column directly from modern V8 messages
  // Example: "Expected ':' after property name in JSON at position 18 (line 2 column 5)"
  const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  }

  // 2. Try regex extraction of position (e.g., "at position 42")
  const posMatch = message.match(/position\s+(\d+)/i);
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
    // If line and column were not found, calculate from position
    if (!lineColMatch && position >= 0 && position <= jsonString.length) {
      const upToError = jsonString.slice(0, position);
      const lines = upToError.split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
  }

  // 3. Fallback position approximation if still not found
  if (position === null) {
    const lines = jsonString.split('\n');
    let currentPos = 0;
    for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
      currentPos += lines[i].length + 1;
    }
    position = currentPos + Math.max(0, column - 1);
  }

  // 4. Generate snippet context
  const lines = jsonString.split('\n');
  const targetLineIdx = Math.max(0, Math.min(line - 1, lines.length - 1));
  const snippetLine = lines[targetLineIdx] || '';
  const caretIndicator = ' '.repeat(Math.max(0, column - 1)) + '^';

  return {
    message,
    line,
    column,
    position,
    snippet: `${snippetLine}\n${caretIndicator}`,
    cleanMessage: message.replace(/\s*\(line \d+ column \d+\)/i, '').replace(/in JSON at position \d+/i, '').trim(),
  };
}

/**
 * Validates a JSON string
 * @param {string} jsonString 
 * @returns {object} { isValid: boolean, error: object|null, parsed: any }
 */
export function validateJson(jsonString) {
  if (!jsonString || !jsonString.trim()) {
    return {
      isValid: false,
      error: {
        message: 'Input is empty. Please enter or paste JSON to validate.',
        cleanMessage: 'Input is empty',
        line: 1,
        column: 1,
        snippet: ''
      },
      parsed: null
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      isValid: true,
      error: null,
      parsed
    };
  } catch (err) {
    return {
      isValid: false,
      error: extractJsonErrorDetails(jsonString, err),
      parsed: null
    };
  }
}

/**
 * Formats JSON with specified indentation
 * @param {string} jsonString 
 * @param {string|number} indent - '2', '4', or '\t'
 * @returns {object}
 */
export function formatJson(jsonString, indent = '2') {
  if (!jsonString || !jsonString.trim()) {
    return {
      success: false,
      error: {
        message: 'No JSON input provided to format.',
        cleanMessage: 'Input is empty',
        line: 1,
        column: 1,
      }
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const spacing = indent === 'tab' || indent === '\t' ? '\t' : parseInt(indent, 10);
    const formatted = JSON.stringify(parsed, null, spacing);
    
    return {
      success: true,
      result: formatted,
      stats: {
        chars: formatted.length,
        lines: formatted.split('\n').length,
        bytes: new Blob([formatted]).size
      }
    };
  } catch (err) {
    return {
      success: false,
      error: extractJsonErrorDetails(jsonString, err)
    };
  }
}

/**
 * Minifies JSON to a single line without unnecessary whitespace
 * @param {string} jsonString 
 * @returns {object}
 */
export function minifyJson(jsonString) {
  if (!jsonString || !jsonString.trim()) {
    return {
      success: false,
      error: {
        message: 'No JSON input provided to minify.',
        cleanMessage: 'Input is empty',
        line: 1,
        column: 1,
      }
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const minified = JSON.stringify(parsed);

    const originalSize = jsonString.length;
    const minifiedSize = minified.length;
    
    // Formula: Reduction percentage = ((Original size - Minified size) / Original size) * 100
    const reduction = originalSize > 0 
      ? ((originalSize - minifiedSize) / originalSize) * 100 
      : 0;

    const originalBytes = new Blob([jsonString]).size;
    const minifiedBytes = new Blob([minified]).size;

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
  } catch (err) {
    return {
      success: false,
      error: extractJsonErrorDetails(jsonString, err)
    };
  }
}

/**
 * Format bytes to human readable format (KB, MB, etc.)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Realistic developer sample JSON
 */
export const SAMPLE_JSON = `{
  "application": "JSON Studio",
  "version": "1.0.0",
  "environment": "production",
  "settings": {
    "theme": "dark",
    "telemetry": false,
    "editor": {
      "tabSize": 2,
      "wordWrap": true,
      "formatOnPaste": true
    }
  },
  "user": {
    "id": "usr_99824",
    "username": "alex_developer",
    "email": "alex@example.dev",
    "verified": true,
    "roles": ["admin", "developer", "maintainer"],
    "profile": {
      "displayName": "Alex Rivers",
      "bio": "Building modern web developer tools & utilities",
      "timezone": "UTC"
    }
  },
  "metrics": {
    "requestsCount": 142080,
    "avgLatencyMs": 14.8,
    "uptimePercentage": 99.99
  },
  "features": [
    {
      "id": "fmt_01",
      "name": "Beautify & Format",
      "enabled": true,
      "options": ["2 spaces", "4 spaces", "tabs"]
    },
    {
      "id": "min_02",
      "name": "Minify & Compress",
      "enabled": true,
      "compressionRatio": 0.42
    }
  ],
  "metadata": null
}`;

/**
 * Messy / unformatted JSON sample
 */
export const MESSY_JSON = `{"application":"JSON Studio","version":"1.0.0","settings":{"theme":"dark","editor":{"tabSize":2,"wordWrap":true}},"user":{"id":"usr_99824","roles":["admin","developer"],"verified":true},"features":[{"id":"fmt_01","enabled":true},{"id":"min_02","enabled":true}],"status":"active"}`;
