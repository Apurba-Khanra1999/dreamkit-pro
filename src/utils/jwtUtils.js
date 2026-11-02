/**
 * Utilities for JWT (JSON Web Token) decoding, inspection, verification, and creation.
 */

/**
 * Base64URL decode helper with UTF-8 support.
 */
export function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Base64URL encode helper for UTF-8 string or ArrayBuffer.
 */
export function base64UrlEncode(data) {
  let binary = '';
  if (typeof data === 'string') {
    const bytes = new TextEncoder().encode(data);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
  } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Formats a Unix epoch timestamp (seconds) into human-readable local and UTC strings.
 */
export function formatUnixTimestamp(timestampSec) {
  if (typeof timestampSec !== 'number' || isNaN(timestampSec)) return null;

  const date = new Date(timestampSec * 1000);
  if (isNaN(date.getTime())) return null;

  return {
    raw: timestampSec,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relativeTime: getRelativeTime(timestampSec)
  };
}

/**
 * Returns human-readable relative time (e.g. "in 2 hours", "3 days ago").
 */
export function getRelativeTime(timestampSec) {
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = timestampSec - nowSec;
  const isFuture = diffSec > 0;
  const absSec = Math.abs(diffSec);

  const minutes = Math.floor(absSec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let formatted = '';
  if (days > 0) {
    formatted = `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    formatted = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    formatted = `${minutes} min${minutes > 1 ? 's' : ''}`;
  } else {
    formatted = `${absSec} sec${absSec > 1 ? 's' : ''}`;
  }

  return isFuture ? `in ${formatted}` : `${formatted} ago`;
}

/**
 * Decodes and parses a JWT string.
 */
export function decodeJwt(jwtString) {
  if (!jwtString || !jwtString.trim()) {
    return {
      success: false,
      error: 'Empty JWT token string provided.'
    };
  }

  const clean = jwtString.trim().replace(/^Bearer\s+/i, '');
  const parts = clean.split('.');

  if (parts.length < 2 || parts.length > 3) {
    return {
      success: false,
      error: `Invalid JWT structure: Expected 3 parts separated by dots (header.payload.signature), but found ${parts.length} part${parts.length === 1 ? '' : 's'}.`
    };
  }

  try {
    // 1. Decode Header
    const headerJson = base64UrlDecode(parts[0]);
    const header = JSON.parse(headerJson);

    // 2. Decode Payload
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);

    // 3. Signature
    const signature = parts[2] || '';

    // 4. Claims Analysis
    const nowSec = Math.floor(Date.now() / 1000);
    const expInfo = payload.exp ? formatUnixTimestamp(payload.exp) : null;
    const iatInfo = payload.iat ? formatUnixTimestamp(payload.iat) : null;
    const nbfInfo = payload.nbf ? formatUnixTimestamp(payload.nbf) : null;

    let isExpired = false;
    let isNotYetValid = false;
    let statusText = 'No expiration claim (exp)';
    let statusType = 'no_exp'; // 'active' | 'expired' | 'future' | 'no_exp'

    if (payload.exp) {
      if (nowSec >= payload.exp) {
        isExpired = true;
        statusText = `Expired ${expInfo.relativeTime}`;
        statusType = 'expired';
      } else {
        isExpired = false;
        statusText = `Valid • Expires ${expInfo.relativeTime}`;
        statusType = 'active';
      }
    }

    if (payload.nbf && nowSec < payload.nbf) {
      isNotYetValid = true;
      statusText = `Not valid before ${nbfInfo.relativeTime}`;
      statusType = 'future';
    }

    return {
      success: true,
      rawParts: {
        header: parts[0],
        payload: parts[1],
        signature: parts[2] || ''
      },
      header,
      payload,
      signature,
      expiryInfo: {
        isExpired,
        isNotYetValid,
        statusText,
        statusType,
        exp: expInfo,
        iat: iatInfo,
        nbf: nbfInfo
      }
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to decode JWT: ${err.message}`
    };
  }
}

/**
 * Client-side HMAC signature verification using Web Cryptography API.
 */
export async function verifyHmacSignature(tokenString, secret, isSecretBase64 = false) {
  if (!tokenString || !secret) {
    return { verified: false, message: 'Please provide both token and secret.' };
  }

  const clean = tokenString.trim().replace(/^Bearer\s+/i, '');
  const parts = clean.split('.');
  if (parts.length !== 3) {
    return { verified: false, message: 'Token must have a signature part to verify.' };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const alg = header.alg;

    let hashName = '';
    if (alg === 'HS256') hashName = 'SHA-256';
    else if (alg === 'HS384') hashName = 'SHA-384';
    else if (alg === 'HS512') hashName = 'SHA-512';
    else {
      return {
        verified: false,
        message: `Algorithm ${alg || 'none'} is not an HMAC algorithm (HS256/HS384/HS512). Asymmetric keys (RS256/ES256) require public certs.`
      };
    }

    let secretKeyBytes;
    if (isSecretBase64) {
      secretKeyBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
    } else {
      secretKeyBytes = new TextEncoder().encode(secret);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      secretKeyBytes,
      { name: 'HMAC', hash: hashName },
      false,
      ['sign']
    );

    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const computedSignature = base64UrlEncode(signatureBuffer);

    if (computedSignature === parts[2]) {
      return {
        verified: true,
        message: `Signature verified successfully (${alg}).`
      };
    } else {
      return {
        verified: false,
        message: 'Invalid signature: secret does not match token signature.'
      };
    }
  } catch (err) {
    return {
      verified: false,
      message: `Verification failed: ${err.message}`
    };
  }
}

/**
 * Creates a signed JWT using Web Cryptography API for HMAC algorithms.
 */
export async function createSignedJwt(headerObj, payloadObj, secret = 'secret-key', isSecretBase64 = false) {
  try {
    const alg = headerObj.alg || 'HS256';
    let hashName = 'SHA-256';
    if (alg === 'HS384') hashName = 'SHA-384';
    if (alg === 'HS512') hashName = 'SHA-512';

    const headerB64 = base64UrlEncode(JSON.stringify(headerObj));
    const payloadB64 = base64UrlEncode(JSON.stringify(payloadObj));
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    let secretKeyBytes;
    if (isSecretBase64) {
      secretKeyBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
    } else {
      secretKeyBytes = new TextEncoder().encode(secret);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      secretKeyBytes,
      { name: 'HMAC', hash: hashName },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const signatureB64 = base64UrlEncode(signatureBuffer);

    return `${headerB64}.${payloadB64}.${signatureB64}`;
  } catch (err) {
    throw new Error(`Failed to sign JWT: ${err.message}`);
  }
}

// Generate realistic preset timestamps based on current time
const nowSec = Math.floor(Date.now() / 1000);

export const JWT_PRESETS = [
  {
    id: 'active_session',
    title: 'Active User Session Token (HS256)',
    description: 'Valid access token with future expiration and user profile claims',
    secret: 'antigravity-dev-secret-key-2026',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    },
    payload: {
      sub: 'usr_88941258',
      name: 'Sarah Connor',
      email: 'sarah.connor@cyberdyne.dev',
      role: 'Staff Engineer',
      tier: 'Enterprise',
      iat: nowSec - 3600, // 1 hour ago
      exp: nowSec + 86400 * 7, // 7 days in future
      iss: 'https://auth.cloudscale.io/v2'
    }
  },
  {
    id: 'rbac_admin',
    title: 'RBAC Admin Claims with Scopes',
    description: 'Administrator token with granular permissions and multi-tenant claims',
    secret: 'jwt-super-secret-salt-32-chars-long',
    header: {
      alg: 'HS256',
      typ: 'JWT',
      kid: 'key-ed256-primary'
    },
    payload: {
      sub: 'admin_00192',
      tenant_id: 'org_acme_corp',
      email: 'admin@acmecorp.com',
      roles: ['admin', 'billing_manager', 'security_officer'],
      permissions: [
        'users:read',
        'users:write',
        'billing:manage',
        'audit:export'
      ],
      iat: nowSec - 7200,
      exp: nowSec + 3600 * 12, // 12 hours from now
      nbf: nowSec - 7200,
      iss: 'https://identity.acmecorp.com'
    }
  },
  {
    id: 'expired_token',
    title: 'Expired Access Token',
    description: 'Demonstrates expired token alert and expiration time calculations',
    secret: 'legacy-app-secret-12345',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    },
    payload: {
      sub: 'usr_legacy_expired',
      name: 'Johnathan Doe',
      iat: nowSec - 86400 * 30, // 30 days ago
      exp: nowSec - 86400 * 2, // Expired 2 days ago
      iss: 'https://oauth.legacy.net'
    }
  }
];
