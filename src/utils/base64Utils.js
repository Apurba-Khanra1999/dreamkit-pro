/**
 * Utilities for Base64 encoding, decoding, Base64URL conversion, Hex conversion, and file Data URI processing.
 */

/**
 * Encodes a UTF-8 string into standard or URL-safe Base64.
 */
export function encodeTextToBase64(text, options = {}) {
  const {
    urlSafe = false,
    stripPadding = false,
    lineWrap = 0 // 0, 64, or 76
  } = options;

  if (text === undefined || text === null) {
    return { success: false, error: 'Empty content provided.' };
  }

  try {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let b64 = btoa(binary);

    if (urlSafe) {
      b64 = b64.replace(/\+/g, '-').replace(/\//g, '_');
      if (stripPadding) {
        b64 = b64.replace(/=+$/, '');
      }
    } else if (stripPadding) {
      b64 = b64.replace(/=+$/, '');
    }

    if (lineWrap > 0) {
      b64 = wrapLines(b64, lineWrap);
    }

    const originalBytes = new Blob([text]).size;
    const encodedBytes = new Blob([b64]).size;
    const overhead = originalBytes > 0 
      ? (((encodedBytes - originalBytes) / originalBytes) * 100).toFixed(1)
      : '0.0';

    return {
      success: true,
      result: b64,
      stats: {
        originalChars: text.length,
        originalBytes,
        encodedChars: b64.length,
        encodedBytes,
        overheadPercentage: overhead
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to encode text to Base64.'
    };
  }
}

/**
 * Decodes a standard or URL-safe Base64 string into a UTF-8 string.
 */
export function decodeBase64ToText(b64String) {
  if (!b64String || !b64String.trim()) {
    return { success: false, error: 'Empty Base64 string provided.' };
  }

  try {
    // 1. Clean spaces, newlines, tabs
    let cleaned = b64String.replace(/\s+/g, '');

    // 2. Normalize Base64URL (- to +, _ to /)
    cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

    // 3. Re-pad missing '=' characters
    while (cleaned.length % 4 !== 0) {
      cleaned += '=';
    }

    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);

    // Check if decoded text is JSON
    let isJson = false;
    let formattedJson = null;
    try {
      const parsed = JSON.parse(decoded);
      if (typeof parsed === 'object' && parsed !== null) {
        isJson = true;
        formattedJson = JSON.stringify(parsed, null, 2);
      }
    } catch {
      // not JSON
    }

    return {
      success: true,
      result: decoded,
      isJson,
      formattedJson,
      stats: {
        encodedChars: b64String.length,
        encodedBytes: new Blob([b64String]).size,
        decodedChars: decoded.length,
        decodedBytes: new Blob([decoded]).size
      }
    };
  } catch {
    return {
      success: false,
      error: 'Invalid Base64 sequence: Unable to decode string. Verify characters are valid Base64.'
    };
  }
}

/**
 * Converts a Hex string to Base64.
 */
export function hexToBase64(hexString) {
  if (!hexString || !hexString.trim()) {
    return { success: false, error: 'Empty Hex string provided.' };
  }

  try {
    const cleanHex = hexString.replace(/\s+|0x/gi, '');
    if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
      return { success: false, error: 'Hex string contains invalid non-hexadecimal characters.' };
    }
    if (cleanHex.length % 2 !== 0) {
      return { success: false, error: 'Hex string must have an even number of characters.' };
    }

    let binary = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      binary += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
    }

    return {
      success: true,
      result: btoa(binary)
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to convert Hex to Base64.'
    };
  }
}

/**
 * Converts a Base64 string to Hex.
 */
export function base64ToHex(b64String) {
  if (!b64String || !b64String.trim()) {
    return { success: false, error: 'Empty Base64 string provided.' };
  }

  try {
    let cleaned = b64String.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (cleaned.length % 4 !== 0) cleaned += '=';

    const binary = atob(cleaned);
    let hex = '';
    for (let i = 0; i < binary.length; i++) {
      const h = binary.charCodeAt(i).toString(16).padStart(2, '0');
      hex += h;
    }

    return {
      success: true,
      result: hex.toUpperCase()
    };
  } catch {
    return {
      success: false,
      error: 'Invalid Base64 string provided for Hex conversion.'
    };
  }
}

/**
 * Parses a Data URI string: data:image/png;base64,iVBORw...
 */
export function parseDataUri(dataUri) {
  if (!dataUri || !dataUri.startsWith('data:')) {
    return null;
  }

  const match = dataUri.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) return null;

  return {
    mimeType: match[1],
    base64Data: match[2].trim(),
    isImage: match[1].startsWith('image/')
  };
}

/**
 * Reads a File object and converts it to a Data URI.
 */
export function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file as Data URI'));
    reader.readAsDataURL(file);
  });
}

/**
 * Wraps long Base64 string at specified column boundary.
 */
export function wrapLines(str, lineLength = 64) {
  if (!lineLength || lineLength <= 0) return str;
  const regex = new RegExp(`.{1,${lineLength}}`, 'g');
  const chunks = str.match(regex);
  return chunks ? chunks.join('\n') : str;
}

export const BASE64_PRESETS = [
  {
    id: 'json_payload',
    title: 'JSON API Claims',
    type: 'text',
    content: JSON.stringify({
      sub: "usr_99841249",
      name: "Alex Vance",
      role: "lead_engineer",
      permissions: ["admin:write", "analytics:read"],
      issued_at: "2026-10-30T11:45:00Z"
    }, null, 2),
    description: 'Structured JSON payload commonly encoded in tokens'
  },
  {
    id: 'utf8_multilingual',
    title: 'Unicode & Emojis',
    type: 'text',
    content: `Antigravity Suite 🚀 — Zero latency, 100% private in-browser memory.
Languages: English • Español • Français • 日本語 (こんにちは) • 中文 (你好) • Deutsch`,
    description: 'Multilingual UTF-8 characters and emoji verification'
  },
  {
    id: 'svg_badge',
    title: 'SVG Image Vector',
    type: 'text',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="12" fill="#4f46e5"/>
  <text x="100" y="36" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">JSON Studio Pro</text>
</svg>`,
    description: 'SVG XML vector graphic ready for Data URI embedding'
  },
  {
    id: 'hex_bytes',
    title: 'Cryptographic Hash Hex',
    type: 'hex',
    content: '4A6F686E20446F652053656375726520546F6B656E2032303236',
    description: 'Hexadecimal raw byte sequence'
  }
];

/**
 * Generates copy-paste code snippets for Base64 in multiple languages.
 */
export function generateBase64Code(mode, text) {
  const safeText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

  if (mode === 'encode') {
    return {
      javascript: `// JavaScript (Browser & Node.js)
const plainText = "${safeText.slice(0, 80)}...";

// 1. Browser (UTF-8 safe)
const encoded = btoa(unescape(encodeURIComponent(plainText)));

// 2. Node.js Buffer
const nodeEncoded = Buffer.from(plainText, 'utf-8').toString('base64');
console.log(encoded);`,
      python: `# Python 3
import base64

text = "${safeText.slice(0, 80)}..."
encoded_bytes = base64.b64encode(text.encode('utf-8'))
encoded_str = encoded_bytes.decode('utf-8')
print(encoded_str)`,
      php: `<?php
// PHP
$text = "${safeText.slice(0, 80)}...";
$encoded = base64_encode($text);
echo $encoded;`,
      go: `package main

import (
\t"encoding/base64"
\t"fmt"
)

func main() {
\ttext := "${safeText.slice(0, 80)}..."
\tencoded := base64.StdEncoding.EncodeToString([]byte(text))
\tfmt.Println(encoded)
}`
    };
  } else {
    return {
      javascript: `// JavaScript (Browser & Node.js)
const base64Str = "${safeText.slice(0, 80)}...";

// 1. Browser (UTF-8 safe)
const decoded = decodeURIComponent(escape(atob(base64Str.replace(/\\s/g, ''))));

// 2. Node.js Buffer
const nodeDecoded = Buffer.from(base64Str, 'base64').toString('utf-8');
console.log(decoded);`,
      python: `# Python 3
import base64

b64_str = "${safeText.slice(0, 80)}..."
decoded_bytes = base64.b64decode(b64_str)
decoded_text = decoded_bytes.decode('utf-8')
print(decoded_text)`,
      php: `<?php
// PHP
$b64 = "${safeText.slice(0, 80)}...";
$decoded = base64_decode($b64);
echo $decoded;`,
      go: `package main

import (
\t"encoding/base64"
\t"fmt"
)

func main() {
\tb64 := "${safeText.slice(0, 80)}..."
\tdata, err := base64.StdEncoding.DecodeString(b64)
\tif err != nil {
\t\tpanic(err)
\t}
\tfmt.Println(string(data))
}`
    };
  }
}
