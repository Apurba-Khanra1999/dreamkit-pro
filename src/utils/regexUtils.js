/**
 * Utilities for Regular Expression testing, matching, replacement, and diagnostics.
 */

export const REGEX_FLAGS = [
  { flag: 'g', name: 'Global', description: 'Match all occurrences rather than stopping after first match' },
  { flag: 'i', name: 'Case Insensitive', description: 'Match uppercase and lowercase characters interchangeably' },
  { flag: 'm', name: 'Multiline', description: '^ and $ match start and end of each line' },
  { flag: 's', name: 'DotAll', description: '. matches any character including newline (\\n)' },
  { flag: 'u', name: 'Unicode', description: 'Enable full Unicode support and character class escapes' },
  { flag: 'y', name: 'Sticky', description: 'Matches only from the index indicated by lastIndex' },
];

export const COMMON_REGEX_PRESETS = [
  {
    id: 'email',
    title: 'Email Address',
    category: 'Validation',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'gi',
    testString: `Contact our enterprise support team at support@cloudscale.io or inquiries@devstudio.com.
Personal email: alex.miller99@gmail.com
Invalid emails to ignore: user@.com, test@domain, @missing.org`,
    description: 'Matches standard RFC-compliant email addresses'
  },
  {
    id: 'url',
    title: 'URL & Web Links',
    category: 'Web',
    pattern: 'https?:\\/\\/(?:www\\.)?([a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)+)(:[0-9]+)?(\\/[^\\s?]*)?(\\?[^\\s#]*)?(#[^\\s]*)?',
    flags: 'g',
    testString: `Here are our service endpoints:
https://api.github.com/v1/repos/octocat/hello-world?sort=stars#section-2
http://localhost:8080/dashboard/analytics?view=realtime
https://docs.docker.com/engine/reference/run/
ftp://ftp.example.com (will not match)`,
    description: 'Parses URLs with protocol, domain, port, path, query parameters, and fragments'
  },
  {
    id: 'ipv4',
    title: 'IPv4 Address',
    category: 'Network',
    pattern: '\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    testString: `Gateway router IP: 192.168.1.1
Local host: 127.0.0.1
Public DNS server: 8.8.8.8 and Cloudflare: 1.1.1.1
Invalid octet: 256.100.0.1 or 192.168.1.999`,
    description: 'Matches valid IPv4 addresses from 0.0.0.0 to 255.255.255.255'
  },
  {
    id: 'iso_date',
    title: 'ISO 8601 Date (YYYY-MM-DD)',
    category: 'Dates',
    pattern: '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])(?:T(?<time>\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?)(?<tz>Z|[+-]\\d{2}:\\d{2})?)?',
    flags: 'g',
    testString: `Project milestone logs:
- Created: 2026-03-15T08:30:00Z
- Updated: 2026-10-30T11:25:40+05:30
- Target Launch: 2026-12-31
- Invalid date: 2026-02-31, 2026-13-01`,
    description: 'Matches ISO dates with optional time and timezone using named capture groups'
  },
  {
    id: 'hex_color',
    title: 'Hex Color Codes',
    category: 'Web',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'gi',
    testString: `Theme color palette:
Primary: #6366f1;
Background: #0f172a;
Accent: #38bdf8;
Shorthand: #fff and #123;
Invalid: #12345 or #gggggg`,
    description: 'Matches 3-digit and 6-digit hexadecimal color values'
  },
  {
    id: 'uuid',
    title: 'UUID v4 Identifier',
    category: 'Identifiers',
    pattern: '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b',
    flags: 'gi',
    testString: `Generated session tokens:
Session 1: c3d4e5f6-7a8b-4c9d-8e1f-2a3b4c5d6e7f
Session 2: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Invalid UUID: 12345678-1234-1234-1234-123456789012`,
    description: 'Matches standard Version 4 UUID format'
  },
  {
    id: 'phone_us',
    title: 'Phone Number (US/International)',
    category: 'Validation',
    pattern: '(?:\\+?1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})',
    flags: 'g',
    testString: `Customer contacts:
Call our direct office: (555) 123-4567
Mobile hotline: +1-800-555-0199
Alternative formatting: 555.234.5678 or 555-876-5432
Invalid: 12345 or 555-12-34`,
    description: 'Matches US and international formatted 10-digit phone numbers'
  },
  {
    id: 'jwt',
    title: 'JWT (JSON Web Token)',
    category: 'Security',
    pattern: '^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$',
    flags: 'm',
    testString: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`,
    description: 'Matches 3-part base64url encoded JSON Web Tokens'
  }
];

export const REGEX_CHEAT_SHEET = [
  {
    category: 'Character Classes',
    items: [
      { token: '.', desc: 'Any character except newline' },
      { token: '\\d', desc: 'Any digit [0-9]' },
      { token: '\\D', desc: 'Any non-digit [^0-9]' },
      { token: '\\w', desc: 'Any word character [a-zA-Z0-9_]' },
      { token: '\\W', desc: 'Any non-word character' },
      { token: '\\s', desc: 'Any whitespace (space, tab, newline)' },
      { token: '\\S', desc: 'Any non-whitespace character' },
      { token: '[abc]', desc: 'Any of character a, b, or c' },
      { token: '[^abc]', desc: 'Any character EXCEPT a, b, or c' },
      { token: '[a-z]', desc: 'Character range from a to z' },
    ]
  },
  {
    category: 'Anchors & Boundaries',
    items: [
      { token: '^', desc: 'Start of string or line' },
      { token: '$', desc: 'End of string or line' },
      { token: '\\b', desc: 'Word boundary' },
      { token: '\\B', desc: 'Non-word boundary' },
    ]
  },
  {
    category: 'Quantifiers',
    items: [
      { token: '*', desc: '0 or more occurrences (greedy)' },
      { token: '+', desc: '1 or more occurrences (greedy)' },
      { token: '?', desc: '0 or 1 occurrence (optional)' },
      { token: '{3}', desc: 'Exactly 3 occurrences' },
      { token: '{2,5}', desc: 'Between 2 and 5 occurrences' },
      { token: '{3,}', desc: '3 or more occurrences' },
      { token: '*? / +?', desc: 'Lazy / non-greedy quantifiers' },
    ]
  },
  {
    category: 'Groups & Lookaround',
    items: [
      { token: '(abc)', desc: 'Capturing group' },
      { token: '(?:abc)', desc: 'Non-capturing group' },
      { token: '(?<name>abc)', desc: 'Named capturing group' },
      { token: 'a|b', desc: 'Alternation (a OR b)' },
      { token: '(?=abc)', desc: 'Positive lookahead' },
      { token: '(?!abc)', desc: 'Negative lookahead' },
      { token: '(?<=abc)', desc: 'Positive lookbehind' },
      { token: '(?<!abc)', desc: 'Negative lookbehind' },
    ]
  }
];

/**
 * Validates and executes a regex test against test text.
 * Returns match entries, group breakdowns, and performance metrics.
 */
export function testRegex(pattern, flags, testString) {
  if (!pattern) {
    return {
      isValid: true,
      error: null,
      matches: [],
      matchCount: 0,
      groupCount: 0,
      executionTimeMs: 0
    };
  }

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err) {
    return {
      isValid: false,
      error: err.message,
      matches: [],
      matchCount: 0,
      groupCount: 0,
      executionTimeMs: 0
    };
  }

  if (!testString) {
    return {
      isValid: true,
      error: null,
      matches: [],
      matchCount: 0,
      groupCount: 0,
      executionTimeMs: 0
    };
  }

  const startTime = performance.now();
  const matches = [];
  let maxLoop = 5000; // Safeguard against infinite loops with zero-length matches

  try {
    if (flags.includes('g')) {
      let match;
      let lastIndex = -1;

      while ((match = regex.exec(testString)) !== null && maxLoop-- > 0) {
        // Prevent infinite loop on zero-width match
        if (regex.lastIndex === lastIndex) {
          regex.lastIndex++;
        }
        lastIndex = regex.lastIndex;

        const groups = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            groups.push({
              index: i,
              value: match[i] ?? '',
              name: null
            });
          }
        }

        const namedGroups = match.groups || {};
        // Map named groups to their corresponding items
        Object.entries(namedGroups).forEach(([name, val]) => {
          const grp = groups.find(g => g.value === val);
          if (grp) grp.name = name;
        });

        matches.push({
          matchNumber: matches.length + 1,
          fullMatch: match[0],
          index: match.index,
          endIndex: match.index + match[0].length,
          groups,
          namedGroups
        });

        if (match[0].length === 0 && regex.lastIndex >= testString.length) {
          break;
        }
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        const groups = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            groups.push({
              index: i,
              value: match[i] ?? '',
              name: null
            });
          }
        }

        const namedGroups = match.groups || {};
        Object.entries(namedGroups).forEach(([name, val]) => {
          const grp = groups.find(g => g.value === val);
          if (grp) grp.name = name;
        });

        matches.push({
          matchNumber: 1,
          fullMatch: match[0],
          index: match.index,
          endIndex: match.index + match[0].length,
          groups,
          namedGroups
        });
      }
    }

    const duration = performance.now() - startTime;

    return {
      isValid: true,
      error: null,
      matches,
      matchCount: matches.length,
      executionTimeMs: parseFloat(duration.toFixed(2))
    };
  } catch (err) {
    return {
      isValid: false,
      error: err.message || 'Execution error during regular expression evaluation.',
      matches: [],
      matchCount: 0,
      executionTimeMs: 0
    };
  }
}

/**
 * Performs string replacement using regex pattern and replacement text.
 */
export function replaceRegex(pattern, flags, testString, replacement) {
  if (!pattern) {
    return {
      success: true,
      result: testString,
      replacedCount: 0,
      error: null
    };
  }

  try {
    const regex = new RegExp(pattern, flags);
    let count = 0;

    // Estimate replacement count
    const matches = testString.match(regex);
    if (matches) {
      count = flags.includes('g') ? matches.length : 1;
    }

    const replaced = testString.replace(regex, replacement);

    return {
      success: true,
      result: replaced,
      replacedCount: count,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      result: testString,
      replacedCount: 0,
      error: err.message
    };
  }
}

/**
 * Generates copy-paste code snippets for popular languages.
 */
export function generateCodeSnippet(pattern, flags, language, replacement = '') {
  const safePattern = pattern.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  switch (language) {
    case 'javascript':
      return `// JavaScript ES6+
const regex = /${pattern}/${flags};
const text = "Your text string here";

// 1. Check if matches exist
const isMatch = regex.test(text);
console.log("Matches:", isMatch);

// 2. Extract all match occurrences
for (const match of text.matchAll(regex)) {
  console.log("Found:", match[0], "at index", match.index);
}

${replacement ? `// 3. String replacement\nconst result = text.replace(regex, "${replacement}");` : ''}`;

    case 'python': {
      const pyFlags = [];
      if (flags.includes('i')) pyFlags.push('re.IGNORECASE');
      if (flags.includes('m')) pyFlags.push('re.MULTILINE');
      if (flags.includes('s')) pyFlags.push('re.DOTALL');
      const flagStr = pyFlags.length ? `, flags=${pyFlags.join(' | ')}` : '';

      return `# Python 3
import re

pattern = r'${pattern}'
text = "Your text string here"

# 1. Find all matches
matches = re.finditer(pattern, text${flagStr})
for match in matches:
    print(f"Match: {match.group(0)} at ({match.start()}, {match.end()})")

${replacement ? `# 2. Substitution\nreplaced = re.sub(pattern, r'${replacement}', text${flagStr})` : ''}`;
    }

    case 'php':
      return `<?php
// PHP
$pattern = '/${safePattern}/${flags}';
$text = "Your text string here";

// 1. Match all occurrences
if (preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
    print_r($matches[0]);
}

${replacement ? `// 2. Replacement\n$result = preg_replace($pattern, '${replacement}', $text);` : ''}`;

    case 'go':
      return `package main

import (
\t"fmt"
\t"regexp"
)

func main() {
\tpattern := \`${pattern}\`
\tre := regexp.MustCompile(pattern)
\ttext := "Your text string here"

\tmatches := re.FindAllString(text, -1)
\tfmt.Println("Matches found:", matches)
}`;

    default:
      return '';
  }
}
