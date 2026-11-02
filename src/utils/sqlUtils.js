import { format } from 'sql-formatter';

/**
 * Supported SQL Dialects
 */
export const SQL_DIALECTS = [
  { id: 'sql', label: 'Standard SQL', placeholder: 'Standard ANSI SQL syntax' },
  { id: 'postgresql', label: 'PostgreSQL', placeholder: 'PostgreSQL dialects, JSON operators' },
  { id: 'mysql', label: 'MySQL', placeholder: 'MySQL 5.7 / 8.0+ dialect' },
  { id: 'mariadb', label: 'MariaDB', placeholder: 'MariaDB specific syntax' },
  { id: 'sqlite', label: 'SQLite', placeholder: 'SQLite embedded database' },
  { id: 'bigquery', label: 'Google BigQuery', placeholder: 'Google BigQuery standard dialect' },
  { id: 'snowflake', label: 'Snowflake', placeholder: 'Snowflake cloud warehouse SQL' },
  { id: 'tsql', label: 'T-SQL (SQL Server)', placeholder: 'Microsoft Transact-SQL' },
  { id: 'plsql', label: 'PL/SQL (Oracle)', placeholder: 'Oracle PL/SQL procedure & query' },
  { id: 'redshift', label: 'Amazon Redshift', placeholder: 'AWS Redshift cloud warehouse' },
  { id: 'trino', label: 'Trino / Presto', placeholder: 'Distributed SQL query engine' },
  { id: 'spark', label: 'Apache Spark SQL', placeholder: 'Apache Spark DataFrame queries' },
];

/**
 * Formats / Beautifies SQL with dialect, casing, and indentation options.
 */
export function formatSql(sqlString, options = {}) {
  const {
    language = 'sql',
    indent = '2', // '2', '4', or 'tab'
    keywordCase = 'upper', // 'upper' | 'lower' | 'preserve'
    functionCase = 'upper',
    dataTypeCase = 'upper',
    linesBetweenQueries = 2,
    removeComments = false,
  } = options;

  if (!sqlString || !sqlString.trim()) {
    return {
      success: false,
      error: 'Empty SQL query provided.'
    };
  }

  try {
    let source = sqlString;
    if (removeComments) {
      // Strip block comments /* ... */ and line comments -- ...
      source = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, '')
        .trim();
    }

    const useTabs = indent === 'tab';
    const tabWidth = useTabs ? 2 : parseInt(indent, 10) || 2;

    const formatted = format(source, {
      language: language || 'sql',
      tabWidth,
      useTabs,
      keywordCase: keywordCase || 'upper',
      dataTypeCase: dataTypeCase || 'upper',
      functionCase: functionCase || 'upper',
      linesBetweenQueries: Number(linesBetweenQueries) || 2,
    });

    const lines = formatted.split('\n');

    // Analyze queries / statement count
    const statements = formatted
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    return {
      success: true,
      result: formatted,
      stats: {
        lines: lines.length,
        chars: formatted.length,
        bytes: new Blob([formatted]).size,
        queryCount: Math.max(1, statements.length),
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to format SQL query.'
    };
  }
}

/**
 * Minifies SQL queries into a single compact line.
 * Removes all block comments, line comments, and redundant whitespaces.
 */
export function minifySql(sqlString) {
  if (!sqlString || !sqlString.trim()) {
    return {
      success: false,
      error: 'Empty SQL query provided to minify.'
    };
  }

  const originalSize = sqlString.length;
  const originalBytes = new Blob([sqlString]).size;

  try {
    let minified = sqlString;

    // 1. Remove block comments /* ... */
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Remove line comments -- ... (respecting newlines)
    minified = minified.replace(/--.*$/gm, '');

    // 3. Normalize newlines to spaces
    minified = minified.replace(/\r?\n/g, ' ');

    // 4. Collapse multiple whitespaces to single space
    minified = minified.replace(/\s+/g, ' ');

    // 5. Clean spaces around parenthesis, commas, and operators
    minified = minified
      .replace(/\s*([(),;])\s*/g, '$1 ')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      .replace(/\s*;\s*/g, '; ')
      .trim();

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
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to minify SQL query.'
    };
  }
}

export const SAMPLE_SQL = `-- Monthly high-value customer analytics query
WITH monthly_customer_orders AS (
  SELECT 
    o.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    c.country,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spend,
    AVG(o.total_amount) AS average_order_value,
    MAX(o.created_at) AS last_order_date
  FROM orders o
  INNER JOIN customers c ON o.customer_id = c.id
  WHERE o.status IN ('completed', 'shipped')
    AND o.created_at >= '2026-01-01'
  GROUP BY o.customer_id, c.first_name, c.last_name, c.email, c.country
  HAVING COUNT(DISTINCT o.order_id) >= 3 AND SUM(o.total_amount) > 1500.00
),
ranked_vip_customers AS (
  SELECT 
    mco.*,
    NTILE(4) OVER (ORDER BY mco.total_spend DESC) AS spend_quartile,
    RANK() OVER (PARTITION BY mco.country ORDER BY mco.total_spend DESC) AS country_rank
  FROM monthly_customer_orders mco
)
SELECT 
  rvc.customer_id,
  rvc.customer_name,
  rvc.email,
  rvc.country,
  rvc.total_orders,
  ROUND(rvc.total_spend, 2) AS lifetime_value,
  ROUND(rvc.average_order_value, 2) AS aov,
  CASE 
    WHEN rvc.spend_quartile = 1 THEN 'Tier 1 Diamond'
    WHEN rvc.spend_quartile = 2 THEN 'Tier 2 Platinum'
    WHEN rvc.spend_quartile = 3 THEN 'Tier 3 Gold'
    ELSE 'Standard'
  END AS loyalty_segment,
  rvc.country_rank
FROM ranked_vip_customers rvc
ORDER BY rvc.total_spend DESC, rvc.total_orders DESC
LIMIT 100;
`;
