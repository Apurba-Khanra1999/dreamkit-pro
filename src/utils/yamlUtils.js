import YAML from 'yaml';

/**
 * Extracts line, column and snippet from YAML parse error.
 */
export function extractYamlErrorDetails(yamlString, err) {
  let line = 1;
  let column = 1;
  let message = err.message || 'YAML Syntax Error';

  if (err.linePos && err.linePos.length >= 1) {
    line = err.linePos[0].line;
    column = err.linePos[0].col;
  } else {
    // Try regex from error message (e.g. at line 4, column 3)
    const match = message.match(/at line (\d+), column (\d+)/i) || message.match(/line (\d+) column (\d+)/i);
    if (match) {
      line = parseInt(match[1], 10);
      column = parseInt(match[2], 10);
    }
  }

  const lines = yamlString.split('\n');
  const targetLineIdx = Math.max(0, Math.min(line - 1, lines.length - 1));
  const snippetLine = lines[targetLineIdx] || '';
  const caretIndicator = ' '.repeat(Math.max(0, column - 1)) + '^';

  // Clean message: remove long source pointers from default yaml error text
  const cleanMessage = message.split('\n')[0].replace(/:\s*at line \d+, column \d+.*$/, '').trim();

  return {
    title: 'YAML Syntax Error',
    message: cleanMessage || message,
    line,
    column,
    snippet: `${snippetLine}\n${caretIndicator}`
  };
}

/**
 * Validates a YAML string and returns error details if invalid.
 */
export function validateYaml(yamlString) {
  if (!yamlString || !yamlString.trim()) {
    return {
      isValid: false,
      error: {
        title: 'Empty Input',
        message: 'No YAML content provided to validate.',
        line: 1,
        column: 1,
        snippet: ''
      },
      parsed: null
    };
  }

  try {
    const doc = YAML.parseDocument(yamlString, { prettyErrors: false });
    if (doc.errors && doc.errors.length > 0) {
      const firstErr = doc.errors[0];
      return {
        isValid: false,
        error: extractYamlErrorDetails(yamlString, firstErr),
        parsed: null
      };
    }

    return {
      isValid: true,
      error: null,
      parsed: doc.toJSON()
    };
  } catch (err) {
    return {
      isValid: false,
      error: extractYamlErrorDetails(yamlString, err),
      parsed: null
    };
  }
}

/**
 * Formats / Beautifies YAML with configurable indentation.
 */
export function formatYaml(yamlString, options = {}) {
  const { indent = 2, sortMapEntries = false } = options;

  if (!yamlString || !yamlString.trim()) {
    return {
      success: false,
      error: {
        title: 'Empty Input',
        message: 'No YAML provided to format.',
        line: 1,
        column: 1,
        snippet: ''
      }
    };
  }

  try {
    const doc = YAML.parseDocument(yamlString);
    if (doc.errors && doc.errors.length > 0) {
      return {
        success: false,
        error: extractYamlErrorDetails(yamlString, doc.errors[0])
      };
    }

    const formatted = doc.toString({
      indent: parseInt(indent, 10) || 2,
      indentSeq: true,
      sortMapEntries: Boolean(sortMapEntries)
    });

    return {
      success: true,
      result: formatted,
      stats: {
        lines: formatted.split('\n').length,
        chars: formatted.length,
        bytes: new Blob([formatted]).size
      }
    };
  } catch (err) {
    return {
      success: false,
      error: extractYamlErrorDetails(yamlString, err)
    };
  }
}

/**
 * Converts YAML string to formatted JSON string.
 */
export function yamlToJson(yamlString) {
  if (!yamlString || !yamlString.trim()) {
    return { success: false, error: 'Empty YAML string provided.' };
  }

  try {
    const parsed = YAML.parse(yamlString);
    return {
      success: true,
      result: JSON.stringify(parsed, null, 2)
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to convert YAML to JSON.'
    };
  }
}

/**
 * Converts JSON string to clean YAML string.
 */
export function jsonToYaml(jsonString, options = {}) {
  const { indent = 2 } = options;
  if (!jsonString || !jsonString.trim()) {
    return { success: false, error: 'Empty JSON string provided.' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const yaml = YAML.stringify(parsed, {
      indent: parseInt(indent, 10) || 2,
      indentSeq: true
    });
    return {
      success: true,
      result: yaml
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Invalid JSON string provided.'
    };
  }
}

export const SAMPLE_YAML = `# Kubernetes Deployment & Service Manifest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: production
  labels:
    app.kubernetes.io/name: api-gateway
    app.kubernetes.io/instance: prod-v2
    app.kubernetes.io/version: "2.4.1"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: gateway-container
          image: ghcr.io/org/gateway:2.4.1
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
          resources:
            limits:
              cpu: 500m
              memory: 512Mi
            requests:
              cpu: 100m
              memory: 128Mi
          env:
            - name: ENVIRONMENT
              value: "production"
            - name: LOG_LEVEL
              value: "info"
            - name: CORS_ENABLED
              value: "true"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
`;
