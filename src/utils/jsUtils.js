import jsBeautify from 'js-beautify';
import * as Terser from 'terser';

/**
 * Utilities for JavaScript formatting, beautification, minification, and statistics.
 */

/**
 * Formats / Beautifies JavaScript code using js-beautify.
 * Preserves structure, formatting options, comments, and spacing.
 */
export function formatJavascript(jsString, options = {}) {
  const {
    indent = '2', // '2', '4', or 'tab'
    removeComments = false,
    preserveNewlines = true,
    spaceBeforeConditional = true,
    semi = true
  } = options;

  if (!jsString || !jsString.trim()) {
    return {
      success: false,
      error: 'Empty JavaScript code provided.'
    };
  }

  try {
    let source = jsString;
    if (removeComments) {
      // Clean single-line and multi-line comments
      source = source.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    }

    const indent_size = indent === 'tab' ? 1 : parseInt(indent, 10) || 2;
    const indent_char = indent === 'tab' ? '\t' : ' ';

    const formatted = jsBeautify.js(source, {
      indent_size,
      indent_char,
      preserve_newlines: preserveNewlines,
      max_preserve_newlines: 2,
      space_before_conditional: spaceBeforeConditional,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: false,
      wrap_line_length: 0,
      comma_first: false,
      e4x: true,
      indent_empty_lines: false
    });

    const lines = formatted.split('\n');

    return {
      success: true,
      result: semi ? formatted : formatted.replace(/;(?=\s*$|\s*\n)/g, ''),
      stats: {
        lines: lines.length,
        chars: formatted.length,
        bytes: new Blob([formatted]).size
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to format JavaScript'
    };
  }
}

/**
 * Minifies JavaScript code using Terser.
 * Offers compression options: mangle variable names, drop console.log, drop debugger, etc.
 */
export async function minifyJavascript(jsString, options = {}) {
  const {
    mangle = true,
    dropConsole = false,
    dropDebugger = true,
    keepFunctionNames = false,
    removeComments = true
  } = options;

  if (!jsString || !jsString.trim()) {
    return {
      success: false,
      error: 'Empty JavaScript code provided to minify.'
    };
  }

  const originalSize = jsString.length;
  const originalBytes = new Blob([jsString]).size;

  try {
    const terserOptions = {
      compress: {
        drop_console: dropConsole,
        drop_debugger: dropDebugger,
        passes: 2
      },
      mangle: mangle
        ? {
            keep_fnames: keepFunctionNames
          }
        : false,
      format: {
        comments: removeComments ? false : 'all'
      }
    };

    const res = await Terser.minify(jsString, terserOptions);

    if (res.error) {
      return {
        success: false,
        error: res.error.message || 'Syntax error during minification',
        line: res.error.line,
        col: res.error.col
      };
    }

    const minified = res.code || '';
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
      error: err.message || 'Minification error occurred.',
      line: err.line,
      col: err.col
    };
  }
}

export const SAMPLE_JS = `/**
 * Calculate order summary with tiered discounts and tax rates.
 * @param {Array<Object>} cart - Shopping cart item entries
 * @param {Object} customer - Customer metadata and loyalty tier
 * @returns {Object} Final payment summary
 */
async function processOrderCheckout(cart, customer = {}) {
  const TAX_RATE = 0.0825; // 8.25% municipal tax
  console.log("Processing order for customer:", customer.id);

  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart must contain at least one item.");
  }

  // Calculate gross subtotal
  const subtotal = cart.reduce((accumulator, currentItem) => {
    const itemTotal = Number(currentItem.price || 0) * Number(currentItem.quantity || 1);
    return accumulator + itemTotal;
  }, 0);

  // Determine loyalty discount tier
  let discountRatio = 0;
  if (customer.tier === "platinum") {
    discountRatio = 0.20; // 20% off
  } else if (customer.tier === "gold") {
    discountRatio = 0.15; // 15% off
  } else if (customer.tier === "silver") {
    discountRatio = 0.05; // 5% off
  }

  const discountAmount = Math.round(subtotal * discountRatio * 100) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const calculatedTax = Math.round(taxableBase * TAX_RATE * 100) / 100;
  const grandTotal = Math.round((taxableBase + calculatedTax) * 100) / 100;

  return {
    orderId: "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    itemsCount: cart.length,
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    tax: calculatedTax.toFixed(2),
    total: grandTotal.toFixed(2),
    processedAt: new Date().toISOString()
  };
}

// Example invocation
const mockCart = [
  { id: "SKU-100", name: "Wireless Mechanical Keyboard", price: 89.99, quantity: 1 },
  { id: "SKU-204", name: "Ergonomic Desk Mat", price: 24.50, quantity: 2 }
];

processOrderCheckout(mockCart, { id: "USR-9921", tier: "platinum" })
  .then(summary => console.log("Checkout complete:", summary))
  .catch(err => console.error("Checkout failed:", err));
`;
