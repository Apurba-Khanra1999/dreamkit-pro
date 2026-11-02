/**
 * Utilities for URL encoding, decoding, parsing, and query parameter management.
 */

/**
 * Encodes a URL or component based on selected mode.
 */
export function encodeUrl(input, options = {}) {
  const {
    mode = 'component', // 'component' | 'full' | 'rfc3986' | 'form'
  } = options;

  if (input === undefined || input === null || input === '') {
    return { success: false, error: 'Empty input provided.' };
  }

  try {
    let result = '';

    switch (mode) {
      case 'full':
        // encodeURI preserves : / ? & = # etc.
        result = encodeURI(input);
        break;

      case 'rfc3986':
        // Strict RFC 3986 encoding (also encodes ! ' ( ) *)
        result = encodeURIComponent(input).replace(/[!'()*]/g, c => {
          return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
        break;

      case 'form':
        // x-www-form-urlencoded replaces spaces with +
        result = encodeURIComponent(input).replace(/%20/g, '+');
        break;

      case 'component':
      default:
        result = encodeURIComponent(input);
        break;
    }

    return {
      success: true,
      result,
      stats: {
        originalLength: input.length,
        encodedLength: result.length,
        diff: result.length - input.length
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to encode URL.'
    };
  }
}

/**
 * Decodes a URL or component with tolerant fallback.
 */
export function decodeUrl(input, options = {}) {
  const {
    plusAsSpace = true,
  } = options;

  if (input === undefined || input === null || input === '') {
    return { success: false, error: 'Empty input provided.' };
  }

  try {
    let toDecode = input;
    if (plusAsSpace) {
      toDecode = toDecode.replace(/\+/g, '%20');
    }

    let result;
    try {
      result = decodeURIComponent(toDecode);
    } catch {
      // Fallback: character-by-character tolerant decoding for partially encoded strings
      result = tolerantDecode(toDecode);
    }

    return {
      success: true,
      result,
      stats: {
        originalLength: input.length,
        decodedLength: result.length,
        diff: input.length - result.length
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to decode URL string.'
    };
  }
}

/**
 * Tolerant decoder that replaces malformed %XX sequences instead of throwing URIError.
 */
function tolerantDecode(str) {
  return str.replace(/%(?:[0-9a-fA-F]{2})|%/g, match => {
    if (match === '%' || match.length !== 3) return '%';
    try {
      return decodeURIComponent(match);
    } catch {
      return match;
    }
  });
}

/**
 * Parses full URL into its components and query parameters.
 */
export function parseUrlDetails(urlString) {
  if (!urlString || !urlString.trim()) return null;

  try {
    // If string does not have a protocol, prepend dummy for parsing if it looks like a domain or path
    let urlToParse = urlString.trim();
    let hasCustomProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(urlToParse);

    if (!hasCustomProtocol && (urlToParse.startsWith('/') || urlToParse.includes('?') || urlToParse.includes('.'))) {
      urlToParse = `https://${urlToParse.replace(/^\/+/, '')}`;
    }

    const parsed = new URL(urlToParse);
    const params = [];
    parsed.searchParams.forEach((val, key) => {
      params.push({ key, value: val, id: Math.random().toString(36).substring(2, 9) });
    });

    return {
      isValidUrl: true,
      protocol: parsed.protocol,
      origin: parsed.origin,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : parsed.protocol === 'http:' ? '80' : ''),
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      username: parsed.username,
      password: parsed.password,
      params,
      paramCount: params.length
    };
  } catch {
    // If not a full URL, test if it's a standalone query string (e.g. key1=val1&key2=val2)
    try {
      const searchStr = urlString.startsWith('?') ? urlString.slice(1) : urlString;
      if (searchStr.includes('=')) {
        const searchParams = new URLSearchParams(searchStr);
        const params = [];
        searchParams.forEach((val, key) => {
          params.push({ key, value: val, id: Math.random().toString(36).substring(2, 9) });
        });

        if (params.length > 0) {
          return {
            isValidUrl: false,
            isQueryOnly: true,
            pathname: '',
            search: `?${searchStr}`,
            hash: '',
            params,
            paramCount: params.length
          };
        }
      }
    } catch {
      // not a query string
    }

    return null;
  }
}

/**
 * Rebuilds a URL string from components and query parameters list.
 */
export function buildUrlString(baseDetails, paramsList = []) {
  if (!baseDetails) return '';

  try {
    if (baseDetails.isValidUrl) {
      const url = new URL(baseDetails.origin + baseDetails.pathname);
      url.search = '';
      paramsList.forEach(p => {
        if (p.key.trim()) {
          url.searchParams.append(p.key.trim(), p.value || '');
        }
      });
      if (baseDetails.hash) {
        url.hash = baseDetails.hash;
      }
      return url.toString();
    } else {
      const sp = new URLSearchParams();
      paramsList.forEach(p => {
        if (p.key.trim()) {
          sp.append(p.key.trim(), p.value || '');
        }
      });
      const qs = sp.toString();
      return qs ? `?${qs}` : '';
    }
  } catch {
    return '';
  }
}

export const URL_PRESETS = [
  {
    id: 'oauth_url',
    title: 'OAuth 2.0 Authorization Endpoint',
    description: 'OAuth2 login redirect with scopes, state, and redirect URI',
    url: 'https://auth.provider.com/oauth/v2/authorize?client_id=client_9872164&response_type=code&redirect_uri=https%3A%2F%2Fmyapp.dev%2Fcallback%3Fprovider%3Doauth&scope=openid%20profile%20email%20read%3Aorg&state=xyz987654321#login'
  },
  {
    id: 'utm_tracking',
    title: 'Campaign Analytics with UTMs',
    description: 'Marketing campaign URL with tracking parameters',
    url: 'https://cloudscale.io/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=black_friday_2026&utm_content=cta_banner&referral=team_cloud'
  },
  {
    id: 'search_filters',
    title: 'REST API Query with Arrays & Filters',
    description: 'Complex filtering with pagination, sorting, and search terms',
    url: 'https://api.ecommerce.dev/v2/products?query=wireless+earbuds&category=electronics&price_min=50&price_max=250&tags=bluetooth%2Cwaterproof&sort=rating_desc&page=1&limit=20'
  },
  {
    id: 'multilingual',
    title: 'Multilingual / Internationalized URL',
    description: 'Unicode query with Japanese and Spanish characters',
    url: 'https://travel.example.com/destinations/search?city=東京&country=日本&activities=グルメ&lang=es&currency=EUR'
  }
];

export const ENCODING_MODES = [
  { id: 'component', label: 'encodeURIComponent', desc: 'Standard query component: encodes all separators (&, =, ?, /)' },
  { id: 'full', label: 'encodeURI', desc: 'Full URL mode: preserves protocol, domain, and path separators' },
  { id: 'rfc3986', label: 'RFC 3986 Strict', desc: 'Encodes everything plus ! \' ( ) *' },
  { id: 'form', label: 'x-www-form-urlencoded', desc: 'Encodes spaces as + instead of %20' },
];

/**
 * Generates copy-paste code snippets for URL encoding in multiple languages.
 */
export function generateUrlCode(mode, urlString) {
  const safe = urlString.replace(/"/g, '\\"');

  return {
    javascript: `// JavaScript (Browser & Node.js)
const urlStr = "${safe}";

// 1. Encode entire URL or parameter
const encodedComponent = encodeURIComponent(urlStr);
const fullUrlEncoded = encodeURI(urlStr);

// 2. Decode URL
const decoded = decodeURIComponent(encodedComponent);

// 3. Work with URLSearchParams
const url = new URL(urlStr);
console.log("Host:", url.hostname);
console.log("Query param:", url.searchParams.get("query"));`,

    python: `# Python 3
from urllib.parse import quote, unquote, quote_plus, urlparse, parse_qs

url_str = "${safe}"

# 1. Encode
encoded = quote(url_str)
form_encoded = quote_plus(url_str)

# 2. Decode
decoded = unquote(encoded)

# 3. Parse components & query params
parsed = urlparse(url_str)
params = parse_qs(parsed.query)
print("Host:", parsed.netloc)
print("Query dict:", params)`,

    php: `<?php
// PHP
$urlStr = "${safe}";

// 1. Encode
$encoded = urlencode($urlStr);
$rawEncoded = rawurlencode($urlStr);

// 2. Decode
$decoded = urldecode($encoded);

// 3. Parse URL components
$parsed = parse_url($urlStr);
parse_str($parsed['query'] ?? '', $queryParams);
print_r($queryParams);`,

    go: `package main

import (
\t"fmt"
\t"net/url"
)

func main() {
\trawURL := "${safe}"

\t// 1. Encode component
\tencoded := url.QueryEscape(rawURL)

\t// 2. Decode component
\tdecoded, _ := url.QueryUnescape(encoded)

\t// 3. Parse full URL & query parameters
\tu, _ := url.Parse(rawURL)
\tqueryParams := u.Query()
\tfmt.Println("Host:", u.Host)
\tfmt.Println("Query param:", queryParams.Get("query"))
\tfmt.Println("Decoded:", decoded)
}`
  };
}
