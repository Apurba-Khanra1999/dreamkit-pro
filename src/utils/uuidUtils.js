/**
 * Utilities for RFC 4122 and RFC 9562 UUID/GUID generation, formatting, and validation.
 */

export const UUID_NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

/**
 * Converts a 16-byte Uint8Array into a formatted UUID string.
 */
function bytesToUuidString(bytes, options = {}) {
  const {
    uppercase = false,
    hyphens = true,
    braces = false,
    urn = false
  } = options;

  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
    if (hyphens && (i === 3 || i === 5 || i === 7 || i === 9)) {
      hex += '-';
    }
  }

  if (uppercase) {
    hex = hex.toUpperCase();
  } else {
    hex = hex.toLowerCase();
  }

  if (urn) {
    return `urn:uuid:${hex}`;
  }
  if (braces) {
    return `{${hex}}`;
  }
  return hex;
}

/**
 * Parses a standard or compact UUID string into 16 bytes.
 */
function uuidToBytes(uuidStr) {
  const clean = uuidStr.replace(/[{}]|urn:uuid:|-/gi, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Generates a single UUID v4 (Cryptographically Secure Random).
 */
export function generateV4(options = {}) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version 4 (0100)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant RFC 4122 (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuidString(bytes, options);
}

/**
 * Generates a single UUID v7 (RFC 9562 Unix Epoch Timestamp + Random).
 * Monotonically sortable by creation time with millisecond resolution.
 */
export function generateV7(options = {}) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const now = Date.now();
  // 48-bit timestamp in milliseconds
  bytes[0] = (now / 0x10000000000) & 0xff;
  bytes[1] = (now / 0x100000000) & 0xff;
  bytes[2] = (now / 0x1000000) & 0xff;
  bytes[3] = (now / 0x10000) & 0xff;
  bytes[4] = (now / 0x100) & 0xff;
  bytes[5] = now & 0xff;

  // Set version 7 (0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Set variant RFC 4122 (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuidString(bytes, options);
}

/**
 * Generates a single UUID v1 (Gregorian timestamp & node based).
 */
export function generateV1(options = {}) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // 100-ns intervals since Gregorian calendar epoch (1582-10-15)
  const gregorianOffset = 0x01b21dd213814000n;
  const nowNs = BigInt(Date.now()) * 10000n + gregorianOffset;

  const timeLow = Number(nowNs & 0xffffffffn);
  bytes[0] = (timeLow >>> 24) & 0xff;
  bytes[1] = (timeLow >>> 16) & 0xff;
  bytes[2] = (timeLow >>> 8) & 0xff;
  bytes[3] = timeLow & 0xff;

  const timeMid = Number((nowNs >> 32n) & 0xffffn);
  bytes[4] = (timeMid >>> 8) & 0xff;
  bytes[5] = timeMid & 0xff;

  const timeHi = Number((nowNs >> 48n) & 0x0fffn);
  bytes[6] = ((timeHi >>> 8) & 0x0f) | 0x10; // version 1
  bytes[7] = timeHi & 0xff;

  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  return bytesToUuidString(bytes, options);
}

/**
 * Generates a UUID v5 (SHA-1 name-based hash).
 */
export async function generateV5(name, namespace = UUID_NAMESPACES.DNS, options = {}) {
  const nsBytes = uuidToBytes(namespace || UUID_NAMESPACES.DNS);
  const nameBytes = new TextEncoder().encode(name || '');
  const data = new Uint8Array(nsBytes.length + nameBytes.length);
  data.set(nsBytes, 0);
  data.set(nameBytes, nsBytes.length);

  const hash = await crypto.subtle.digest('SHA-1', data);
  const bytes = new Uint8Array(hash).slice(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50; // Version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx

  return bytesToUuidString(bytes, options);
}

/**
 * Generates a NIL UUID (all 0s).
 */
export function generateNil(options = {}) {
  const bytes = new Uint8Array(16);
  return bytesToUuidString(bytes, options);
}

/**
 * Generates a MAX UUID (all 1s / Fs).
 */
export function generateMax(options = {}) {
  const bytes = new Uint8Array(16).fill(0xff);
  return bytesToUuidString(bytes, options);
}

/**
 * Batch generates UUIDs based on count and selected version.
 */
export async function generateBatchUuids(count = 1, version = 'v4', options = {}) {
  const safeCount = Math.max(1, Math.min(Number(count) || 1, 1000));
  const results = [];

  for (let i = 0; i < safeCount; i++) {
    switch (version) {
      case 'v7':
        results.push(generateV7(options));
        break;
      case 'v1':
        results.push(generateV1(options));
        break;
      case 'v5': {
        const itemV5Name = safeCount > 1 && options.v5Name
          ? `${options.v5Name}-${i + 1}`
          : (options.v5Name || `entry_${i + 1}`);
        results.push(await generateV5(itemV5Name, options.v5Namespace, options));
        break;
      }
      case 'nil':
        results.push(generateNil(options));
        break;
      case 'max':
        results.push(generateMax(options));
        break;
      case 'v4':
      default:
        results.push(generateV4(options));
        break;
    }
  }

  return results;
}

/**
 * Formats a list of UUIDs into various output syntax formats.
 */
export function formatUuidOutput(uuidList, format = 'lines') {
  if (!uuidList || !uuidList.length) return '';

  switch (format) {
    case 'json':
      return JSON.stringify(uuidList, null, 2);

    case 'csv':
      return uuidList.join(',\n');

    case 'sql':
      return `INSERT INTO records (id) VALUES\n` + uuidList.map(id => `  ('${id}')`).join(',\n') + ';';

    case 'array_js':
      return `const uuids = [\n` + uuidList.map(id => `  "${id}"`).join(',\n') + `\n];`;

    case 'lines':
    default:
      return uuidList.join('\n');
  }
}

/**
 * Validates and inspects an existing UUID string, identifying its version, variant, and creation timestamp.
 */
export function inspectUuid(uuidStr) {
  if (!uuidStr || !uuidStr.trim()) {
    return { isValid: false, error: 'Empty UUID provided.' };
  }

  const clean = uuidStr.trim().replace(/[{}]|urn:uuid:/gi, '');
  const standardRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f]{4})-([0-9a-f]{4})-[0-9a-f]{12}$/i;
  const compactRegex = /^[0-9a-f]{32}$/i;

  let formatted = clean;
  if (compactRegex.test(clean)) {
    // Reinsert hyphens
    formatted = `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
  }

  if (!standardRegex.test(formatted)) {
    return {
      isValid: false,
      error: 'Invalid format: String does not match 128-bit UUID hexadecimal pattern.'
    };
  }

  try {
    const bytes = uuidToBytes(formatted);

    // Check for NIL / MAX
    const isAllZeros = bytes.every(b => b === 0);
    const isAllOnes = bytes.every(b => b === 0xff);

    if (isAllZeros) {
      return {
        isValid: true,
        version: 'Nil UUID',
        versionNum: 0,
        variant: 'N/A (All zeros)',
        description: 'Special empty identifier: 00000000-0000-0000-0000-000000000000',
        timestamp: null,
        formatted
      };
    }

    if (isAllOnes) {
      return {
        isValid: true,
        version: 'Max UUID',
        versionNum: 15,
        variant: 'N/A (All ones)',
        description: 'Special maximum identifier: ffffffff-ffff-ffff-ffff-ffffffffffff',
        timestamp: null,
        formatted
      };
    }

    // Version is high nibble of byte 6
    const versionNum = (bytes[6] >>> 4) & 0x0f;
    let versionDesc = `Version ${versionNum}`;
    let timestamp = null;

    switch (versionNum) {
      case 1:
        versionDesc = 'Version 1 (Gregorian timestamp & node ID)';
        // Extract 60-bit timestamp
        try {
          const timeLow = (BigInt(bytes[0]) << 24n) | (BigInt(bytes[1]) << 16n) | (BigInt(bytes[2]) << 8n) | BigInt(bytes[3]);
          const timeMid = (BigInt(bytes[4]) << 8n) | BigInt(bytes[5]);
          const timeHi = BigInt(bytes[6] & 0x0f) << 8n | BigInt(bytes[7]);
          const totalNs = (timeHi << 48n) | (timeMid << 32n) | timeLow;
          const gregorianOffset = 0x01b21dd213814000n;
          const unixMs = Number((totalNs - gregorianOffset) / 10000n);
          const date = new Date(unixMs);
          if (!isNaN(date.getTime())) {
            timestamp = {
              iso: date.toISOString(),
              local: date.toLocaleString(),
              utc: date.toUTCString()
            };
          }
        } catch {
          // ignore
        }
        break;

      case 2:
        versionDesc = 'Version 2 (DCE Security)';
        break;

      case 3:
        versionDesc = 'Version 3 (MD5 hash namespace)';
        break;

      case 4:
        versionDesc = 'Version 4 (Cryptographically random)';
        break;

      case 5:
        versionDesc = 'Version 5 (SHA-1 hash namespace)';
        break;

      case 6:
        versionDesc = 'Version 6 (Reordered field date-time)';
        break;

      case 7: {
        versionDesc = 'Version 7 (Unix epoch timestamp + random)';
        // Extract 48-bit timestamp from bytes 0..5
        const ms = (bytes[0] * 0x10000000000) +
                   (bytes[1] * 0x100000000) +
                   (bytes[2] * 0x1000000) +
                   (bytes[3] * 0x10000) +
                   (bytes[4] * 0x100) +
                   bytes[5];
        const date = new Date(ms);
        if (!isNaN(date.getTime())) {
          timestamp = {
            iso: date.toISOString(),
            local: date.toLocaleString(),
            utc: date.toUTCString()
          };
        }
        break;
      }

      default:
        versionDesc = `Version ${versionNum} (Unknown / Custom)`;
        break;
    }

    // Variant is determined by high 3 bits of byte 8
    let variantDesc = 'RFC 4122 / Leach-Salz';
    if ((bytes[8] & 0x80) === 0) {
      variantDesc = 'NCS backward compatibility';
    } else if ((bytes[8] & 0xc0) === 0x80) {
      variantDesc = 'RFC 4122 / Leach-Salz (Standard)';
    } else if ((bytes[8] & 0xe0) === 0xc0) {
      variantDesc = 'Microsoft Corporation GUID';
    } else {
      variantDesc = 'Reserved for future definition';
    }

    return {
      isValid: true,
      formatted,
      version: versionDesc,
      versionNum,
      variant: variantDesc,
      timestamp,
      error: null
    };
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to inspect UUID: ${err.message}`
    };
  }
}

/**
 * Generates copy-paste code snippets for UUID generation in multiple languages.
 */
export function generateUuidCode(_version = 'v4') {
  return {
    javascript: `// JavaScript (Modern Browser & Node.js 16+)
// 1. Native V4
const uuidV4 = crypto.randomUUID();
console.log("UUID v4:", uuidV4);

// 2. Using 'uuid' package for all versions
// npm i uuid
import { v4 as uuidv4, v7 as uuidv7, v1 as uuidv1 } from 'uuid';
console.log("UUID v7:", uuidv7());`,

    python: `# Python 3
import uuid

# 1. Standard UUID v4 (random)
id_v4 = uuid.uuid4()
print("UUID v4:", str(id_v4))

# 2. Name-based UUID v5
id_v5 = uuid.uuid5(uuid.NAMESPACE_DNS, 'example.com')
print("UUID v5:", str(id_v5))`,

    sql: `-- SQL Dialects
-- PostgreSQL
SELECT gen_random_uuid();

-- MySQL (v8.0+)
SELECT UUID();

-- SQL Server (T-SQL)
SELECT NEWID();

-- SQLite
-- With extension or custom hex function`,

    go: `package main

import (
\t"fmt"
\t"github.com/google/uuid"
)

func main() {
\t// 1. UUID v4
\tidV4 := uuid.New()
\tfmt.Println("UUID v4:", idV4.String())

\t// 2. UUID v7 (Time-ordered)
\tidV7, _ := uuid.NewV7()
\tfmt.Println("UUID v7:", idV7.String())
}`,

    csharp: `// C# (.NET)
using System;

// 1. GUID / UUID v4
Guid newGuid = Guid.NewGuid();
Console.WriteLine(newGuid.ToString("D")); // Standard xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Console.WriteLine(newGuid.ToString("B")); // Registry format {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}`
  };
}
