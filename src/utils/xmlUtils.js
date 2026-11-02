/**
 * Utilities for XML Formatting, Validation, and bidirectional JSON <-> XML conversion.
 */

export function escapeXml(str) {
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function sanitizeTagName(name, fallback = 'item') {
  if (!name || typeof name !== 'string') return fallback;
  // XML tag name must start with a letter or underscore, and can contain letters, digits, hyphens, underscores, dots
  let sanitized = name.trim().replace(/[^a-zA-Z0-9_\-.]/g, '_');
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = `tag_${sanitized}`;
  }
  return sanitized || fallback;
}

/**
 * Validates XML string and returns { isValid, error, stats }.
 */
export function validateXmlSyntax(xmlString) {
  if (!xmlString || !xmlString.trim()) {
    return {
      isValid: false,
      error: {
        title: 'Empty Input',
        message: 'No XML content provided to validate.',
        line: 1,
        column: 1,
        snippet: ''
      },
      stats: null
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const parserError = doc.querySelector('parsererror');

    if (parserError) {
      const rawMsg = parserError.textContent.trim();
      let line = 1;
      let column = 1;

      // Extract line and column from error text
      const lineMatch = rawMsg.match(/line\s+(\d+)/i) || rawMsg.match(/line:?\s*(\d+)/i);
      const colMatch = rawMsg.match(/column\s+(\d+)/i) || rawMsg.match(/col:?\s*(\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1], 10);
      if (colMatch) column = parseInt(colMatch[1], 10);

      const lines = xmlString.split('\n');
      const targetLineIdx = Math.max(0, Math.min(line - 1, lines.length - 1));
      const snippetLine = lines[targetLineIdx] || '';
      const caret = ' '.repeat(Math.max(0, column - 1)) + '^';

      const cleanMsg = rawMsg
        .split('\n')[0]
        .replace(/Below is a rendering.*$/i, '')
        .trim();

      return {
        isValid: false,
        error: {
          title: 'XML Syntax Error',
          message: cleanMsg || 'Invalid XML document structure.',
          line,
          column,
          snippet: `${snippetLine}\n${caret}`
        },
        stats: null
      };
    }

    // Compute XML stats: element count, attribute count, max depth
    let elementsCount = 0;
    let attributesCount = 0;
    let maxDepth = 0;

    function walk(node, depth) {
      if (depth > maxDepth) maxDepth = depth;
      if (node.nodeType === Node.ELEMENT_NODE) {
        elementsCount++;
        if (node.hasAttributes()) {
          attributesCount += node.attributes.length;
        }
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child, depth + 1);
        }
      }
    }

    if (doc.documentElement) {
      walk(doc.documentElement, 1);
    }

    return {
      isValid: true,
      error: null,
      stats: {
        elementsCount,
        attributesCount,
        maxDepth,
        rootElement: doc.documentElement ? doc.documentElement.tagName : 'none'
      }
    };
  } catch (err) {
    return {
      isValid: false,
      error: {
        title: 'XML Parse Failure',
        message: err.message || 'Failed to parse XML string.',
        line: 1,
        column: 1,
        snippet: ''
      },
      stats: null
    };
  }
}

/**
 * Formats XML string with custom indentation and handles CDATA & comments.
 */
export function formatXml(xmlString, options = {}) {
  const { indent = '2' } = options;
  const validation = validateXmlSyntax(xmlString);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }

  const space = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent, 10) || 2);

  function serializeNode(node, depth) {
    const currentIndent = space.repeat(depth);

    if (node.nodeType === Node.COMMENT_NODE) {
      return `${currentIndent}<!--${node.nodeValue}-->`;
    }

    if (node.nodeType === Node.CDATA_SECTION_NODE) {
      return `${currentIndent}<![CDATA[${node.nodeValue}]]>`;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue.trim();
      return text ? escapeXml(text) : '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName;
      let attrs = '';
      if (node.hasAttributes()) {
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          attrs += ` ${attr.name}="${escapeXml(attr.value)}"`;
        }
      }

      // Check child nodes (excluding whitespace text nodes)
      const meaningfulChildren = Array.from(node.childNodes).filter(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          return child.nodeValue.trim().length > 0;
        }
        return true;
      });

      if (meaningfulChildren.length === 0) {
        return `${currentIndent}<${tagName}${attrs}/>`;
      }

      // If only 1 text child, render inline: <tag attr="val">text</tag>
      if (meaningfulChildren.length === 1 && meaningfulChildren[0].nodeType === Node.TEXT_NODE) {
        const textContent = escapeXml(meaningfulChildren[0].nodeValue.trim());
        return `${currentIndent}<${tagName}${attrs}>${textContent}</${tagName}>`;
      }

      // Multiple or element children
      const childrenLines = meaningfulChildren
        .map(child => serializeNode(child, depth + 1))
        .filter(Boolean)
        .join('\n');

      return `${currentIndent}<${tagName}${attrs}>\n${childrenLines}\n${currentIndent}</${tagName}>`;
    }

    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for processing instruction <?xml ...?> in original string
  const hasXmlDecl = /^\s*<\?xml[^?]+\?>/i.test(xmlString);
  const declMatch = xmlString.match(/^\s*(<\?xml[^?]+\?>)/i);
  const declaration = hasXmlDecl && declMatch ? `${declMatch[1]}\n` : '<?xml version="1.0" encoding="UTF-8"?>\n';

  const body = doc.documentElement ? serializeNode(doc.documentElement, 0) : '';
  const result = `${declaration}${body}`;

  return {
    success: true,
    result,
    stats: {
      lines: result.split('\n').length,
      chars: result.length,
      bytes: new Blob([result]).size,
      ...validation.stats
    }
  };
}

/**
 * Minifies XML by stripping whitespace between tags and removing comments.
 */
export function minifyXml(xmlString) {
  const validation = validateXmlSyntax(xmlString);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }

  const minified = xmlString
    .replace(/>\s+</g, '><')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  return {
    success: true,
    result: minified,
    stats: {
      lines: 1,
      chars: minified.length,
      bytes: new Blob([minified]).size,
      ...validation.stats
    }
  };
}

/**
 * Converts a JS object/array/primitive to formatted XML string.
 */
export function jsonToXml(data, options = {}) {
  const {
    rootTag = 'root',
    indent = '2',
    includeDeclaration = true,
    arrayItemTag = 'item'
  } = options;

  const space = indent === 'none' ? '' : ' '.repeat(parseInt(indent, 10) || 2);
  const newline = indent === 'none' ? '' : '\n';

  function buildXml(val, tagName, depth) {
    const currentIndent = indent === 'none' ? '' : space.repeat(depth);
    const innerIndent = indent === 'none' ? '' : space.repeat(depth + 1);

    if (val === null || val === undefined) {
      return `${currentIndent}<${tagName}/>`;
    }

    if (typeof val === 'boolean' || typeof val === 'number') {
      return `${currentIndent}<${tagName}>${val}</${tagName}>`;
    }

    if (typeof val === 'string') {
      return `${currentIndent}<${tagName}>${escapeXml(val)}</${tagName}>`;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return `${currentIndent}<${tagName}/>`;
      }
      return val
        .map((item) => buildXml(item, arrayItemTag, depth))
        .join(newline);
    }

    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) {
        return `${currentIndent}<${tagName}/>`;
      }

      const attrKeys = keys.filter(k => k.startsWith('@'));
      const childKeys = keys.filter(k => !k.startsWith('@'));

      const attrsString = attrKeys
        .map(k => ` ${escapeXml(k.slice(1))}="${escapeXml(String(val[k]))}"`)
        .join('');

      if (childKeys.length === 0) {
        return `${currentIndent}<${tagName}${attrsString}/>`;
      }

      const childrenXml = childKeys
        .map((key) => {
          const childVal = val[key];
          const tag = sanitizeTagName(key);

          if (Array.isArray(childVal)) {
            if (childVal.length === 0) {
              return `${innerIndent}<${tag}/>`;
            }
            return childVal
              .map(item => buildXml(item, tag, depth + 1))
              .join(newline);
          }

          return buildXml(childVal, tag, depth + 1);
        })
        .join(newline);

      return `${currentIndent}<${tagName}${attrsString}>${newline}${childrenXml}${newline}${currentIndent}</${tagName}>`;
    }

    return `${currentIndent}<${tagName}>${escapeXml(String(val))}</${tagName}>`;
  }

  const cleanRootTag = sanitizeTagName(rootTag, 'root');
  let body = '';

  if (Array.isArray(data)) {
    const items = data.map(item => buildXml(item, arrayItemTag, 1)).join(newline);
    body = `<${cleanRootTag}>${newline}${items}${newline}</${cleanRootTag}>`;
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 1 && !keys[0].startsWith('@') && typeof data[keys[0]] === 'object') {
      body = buildXml(data[keys[0]], sanitizeTagName(keys[0]), 0);
    } else {
      body = buildXml(data, cleanRootTag, 0);
    }
  } else {
    body = buildXml(data, cleanRootTag, 0);
  }

  const declaration = includeDeclaration ? `<?xml version="1.0" encoding="UTF-8"?>${newline}` : '';
  return `${declaration}${body}`;
}

/**
 * Converts XML DOM Element into JSON-serializable JavaScript object.
 */
function domElementToJson(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue.trim();
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const obj = {};

  if (node.hasAttributes && node.hasAttributes()) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj[`@${attr.name}`] = attr.value;
    }
  }

  const children = Array.from(node.childNodes).filter(child => {
    return child.nodeType === Node.ELEMENT_NODE || 
      (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim().length > 0);
  });

  if (children.length === 0) {
    return Object.keys(obj).length > 0 ? obj : null;
  }

  if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
    const textVal = children[0].nodeValue.trim();
    let parsedVal = textVal;
    if (textVal === 'true') parsedVal = true;
    else if (textVal === 'false') parsedVal = false;
    else if (!isNaN(Number(textVal)) && textVal.length > 0 && !textVal.startsWith('0x')) {
      parsedVal = Number(textVal);
    }

    if (Object.keys(obj).length === 0) {
      return parsedVal;
    }
    obj['#text'] = parsedVal;
    return obj;
  }

  const elementChildren = children.filter(c => c.nodeType === Node.ELEMENT_NODE);
  const tagCounts = {};
  elementChildren.forEach(child => {
    tagCounts[child.tagName] = (tagCounts[child.tagName] || 0) + 1;
  });

  elementChildren.forEach(child => {
    const childJson = domElementToJson(child);
    const tagName = child.tagName;

    if (tagCounts[tagName] > 1) {
      if (!Array.isArray(obj[tagName])) {
        obj[tagName] = [];
      }
      obj[tagName].push(childJson);
    } else {
      obj[tagName] = childJson;
    }
  });

  return obj;
}

/**
 * Converts XML string to formatted JSON string.
 */
export function xmlToJson(xmlString) {
  if (!xmlString || !xmlString.trim()) {
    return {
      success: false,
      error: 'Empty XML input provided.'
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        success: false,
        error: parserError.textContent.trim() || 'XML Parsing Error: invalid document structure.'
      };
    }

    const rootElement = doc.documentElement;
    if (!rootElement) {
      return {
        success: false,
        error: 'No root element found in XML.'
      };
    }

    const result = {
      [rootElement.tagName]: domElementToJson(rootElement)
    };

    const formatted = JSON.stringify(result, null, 2);
    return {
      success: true,
      result: formatted
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to parse XML string.'
    };
  }
}

export const SAMPLE_JSON_FOR_XML = `{
  "store": {
    "name": "DreamKit Digital Marketplace",
    "currency": "USD",
    "location": {
      "city": "San Francisco",
      "country": "USA"
    },
    "inventory": [
      {
        "id": "prod_101",
        "name": "Developer Pro Suite",
        "price": 49.99,
        "inStock": true,
        "tags": ["software", "productivity", "utilities"]
      },
      {
        "id": "prod_102",
        "name": "Code Optimizer Tool",
        "price": 29.5,
        "inStock": false,
        "tags": ["devtools", "formatter"]
      }
    ]
  }
}`;

export const SAMPLE_XML_FOR_JSON = `<?xml version="1.0" encoding="UTF-8"?>
<catalog department="Engineering">
  <company>JSON Studio Corp</company>
  <version>2.0</version>
  <tools>
    <tool active="true">
      <id>fmt_01</id>
      <name>JSON Formatter</name>
      <category>Formatting</category>
    </tool>
    <tool active="true">
      <id>xml_02</id>
      <name>XML Converter</name>
      <category>Transformation</category>
    </tool>
  </tools>
</catalog>`;

export const SAMPLE_XML_FOR_FORMATTING = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Production Cloud Infrastructure Manifest -->
<infrastructure environment="production" region="us-east-1">
<metadata><author>Infrastructure Team</author><version>3.2.0</version><lastUpdated>2026-10-30</lastUpdated></metadata>
<cluster name="k8s-prod-primary" provider="aws" tier="enterprise">
<nodes min="3" max="12" desired="5"><instanceType>m6i.2xlarge</instanceType><autoScaling enabled="true"/></nodes>
<networking vpcId="vpc-0a89bc213" cidrBlock="10.100.0.0/16"><subnets><subnet tier="public" zone="us-east-1a">10.100.1.0/24</subnet><subnet tier="private" zone="us-east-1b">10.100.2.0/24</subnet></subnets></networking>
<services>
<service id="svc-api" port="443" protocol="HTTPS"><domain>api.studio.dev</domain><healthCheck path="/healthz" intervalSec="15"/><description><![CDATA[Public REST API endpoint gateway with TLS termination.]]></description></service>
<service id="svc-worker" port="8080" protocol="HTTP"><domain>worker.internal</domain><replicas>4</replicas></service>
</services>
</cluster>
</infrastructure>`;
