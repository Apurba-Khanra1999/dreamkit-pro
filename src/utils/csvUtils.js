/**
 * Utilities for bidirectional JSON <-> CSV conversion adhering to RFC 4180.
 */

/**
 * Recursively flattens nested object into dot-notated keys (e.g. { user: { name: 'Alex' } } -> { 'user.name': 'Alex' })
 */
export function flattenObject(obj, prefix = '', res = {}) {
  if (obj === null || obj === undefined) return res;

  for (const key of Object.keys(obj)) {
    const propName = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];

    if (val !== null && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0) {
      flattenObject(val, propName, res);
    } else if (Array.isArray(val)) {
      if (val.every(item => typeof item !== 'object')) {
        res[propName] = val.join('; ');
      } else {
        res[propName] = JSON.stringify(val);
      }
    } else {
      res[propName] = val;
    }
  }

  return res;
}

/**
 * Escapes a single cell value for CSV output.
 */
export function escapeCsvCell(val, delimiter = ',') {
  if (val === null || val === undefined) return '';

  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // If cell contains delimiter, double quote, or newlines, wrap in quotes and escape internal quotes
  const needsQuotes = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r');
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts JSON data (array of objects or single object) into CSV string.
 */
export function jsonToCsv(data, options = {}) {
  const {
    delimiter = ',',
    flatten = true,
    includeHeader = true,
  } = options;

  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === 'object' && data !== null) {
    // If it has a single top-level array (e.g. { "users": [...] }), extract that array
    const keys = Object.keys(data);
    const firstArrayKey = keys.find(k => Array.isArray(data[k]));
    if (firstArrayKey) {
      items = data[firstArrayKey];
    } else {
      items = [data];
    }
  } else {
    throw new Error('Input must be a JSON array of objects or a JSON object.');
  }

  if (items.length === 0) {
    return { csv: '', rowCount: 0, colCount: 0, headers: [] };
  }

  // Flatten items if required
  const processedItems = items.map(item => {
    if (typeof item !== 'object' || item === null) {
      return { value: item };
    }
    return flatten ? flattenObject(item) : item;
  });

  // Collect all unique headers across all rows
  const headersMap = new Map();
  processedItems.forEach(item => {
    Object.keys(item).forEach(key => headersMap.set(key, true));
  });
  const headers = Array.from(headersMap.keys());

  if (headers.length === 0) {
    return { csv: '', rowCount: 0, colCount: 0, headers: [] };
  }

  const lines = [];

  // Add header line
  if (includeHeader) {
    lines.push(headers.map(h => escapeCsvCell(h, delimiter)).join(delimiter));
  }

  // Add data rows
  processedItems.forEach(item => {
    const row = headers.map(h => escapeCsvCell(item[h], delimiter));
    lines.push(row.join(delimiter));
  });

  return {
    csv: lines.join('\n'),
    rowCount: processedItems.length,
    colCount: headers.length,
    headers,
    rows: processedItems
  };
}

/**
 * Parses CSV text into tokens supporting RFC 4180 quotes and escaped quotes.
 */
export function parseCsvRows(csvString, delimiter = ',') {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuote = false;

  const len = csvString.length;
  let i = 0;

  while (i < len) {
    const char = csvString[i];
    const nextChar = i + 1 < len ? csvString[i + 1] : '';

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: ""
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuote = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
        i++;
        continue;
      }

      if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      }

      if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }

      if (char === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }

      currentCell += char;
      i++;
    }
  }

  // Push final cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter(r => r.some(cell => cell.length > 0));
}

/**
 * Converts CSV string into formatted JSON string.
 */
export function csvToJson(csvString, options = {}) {
  const { delimiter = ',' } = options;

  if (!csvString || !csvString.trim()) {
    return { success: false, error: 'Empty CSV input provided.' };
  }

  try {
    const rows = parseCsvRows(csvString, delimiter);
    if (rows.length === 0) {
      return { success: false, error: 'No CSV rows found.' };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const jsonList = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, idx) => {
        const val = row[idx] !== undefined ? row[idx] : '';
        // Try parsing numbers and booleans
        if (val === 'true') obj[header] = true;
        else if (val === 'false') obj[header] = false;
        else if (val !== '' && !isNaN(Number(val)) && !val.startsWith('0x') && !val.startsWith('00')) {
          obj[header] = Number(val);
        } else {
          obj[header] = val;
        }
      });
      return obj;
    });

    return {
      success: true,
      result: JSON.stringify(jsonList, null, 2),
      rowCount: jsonList.length,
      colCount: headers.length,
      headers
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to parse CSV string.'
    };
  }
}

export const SAMPLE_JSON_FOR_CSV = `[
  {
    "id": 1001,
    "name": "Sarah Connor",
    "role": "Lead Architect",
    "department": "Engineering",
    "contact": {
      "email": "sarah@example.dev",
      "city": "San Francisco"
    },
    "salary": 145000,
    "active": true
  },
  {
    "id": 1002,
    "name": "David Miller",
    "role": "Frontend Developer",
    "department": "Product",
    "contact": {
      "email": "david@example.dev",
      "city": "Austin"
    },
    "salary": 118000,
    "active": true
  },
  {
    "id": 1003,
    "name": "Elena Rostova",
    "role": "DevOps Engineer",
    "department": "Infrastructure",
    "contact": {
      "email": "elena@example.dev",
      "city": "Seattle"
    },
    "salary": 132000,
    "active": false
  }
]`;

export const SAMPLE_CSV_FOR_JSON = `id,name,role,department,email,city,active
1001,Sarah Connor,Lead Architect,Engineering,sarah@example.dev,San Francisco,true
1002,David Miller,Frontend Developer,Product,david@example.dev,Austin,true
1003,Elena Rostova,DevOps Engineer,Infrastructure,elena@example.dev,Seattle,false`;
