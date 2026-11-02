/**
 * Downloads a string content as a local file
 * @param {string} content 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function downloadJsonFile(content, filename = 'formatted.json', mimeType = 'application/json') {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('File download failed:', err);
    return false;
  }
}

/**
 * Reads an uploaded file as text with safety checks
 * @param {File} file 
 * @param {number} maxWarningSizeBytes 
 * @returns {Promise<{ content: string, warning: string|null, size: number }>}
 */
export function readUploadedJsonFile(file, maxWarningSizeBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const isJsonOrText = 
      file.name.endsWith('.json') || 
      file.name.endsWith('.txt') || 
      file.type === 'application/json' || 
      file.type === 'text/plain' ||
      file.type === '';

    if (!isJsonOrText) {
      reject(new Error('Please upload a valid .json or .txt file'));
      return;
    }

    let warning = null;
    if (file.size > maxWarningSizeBytes) {
      warning = `Large file (${(file.size / (1024 * 1024)).toFixed(1)} MB). Processing might take a few moments.`;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      resolve({
        content: event.target.result,
        warning,
        size: file.size,
        fileName: file.name
      });
    };
    reader.onerror = () => {
      reject(new Error('Failed to read the selected file'));
    };
    reader.readAsText(file);
  });
}

/**
 * Copies text to clipboard with modern API and fallback
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    document.body.removeChild(textArea);
    return false;
  }
}
