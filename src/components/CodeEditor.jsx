import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

export default function CodeEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  theme = 'light',
  minHeight = '360px',
  maxHeight = '520px',
  onExecuteShortcut,
}) {
  const isDark = theme === 'dark';

  // Custom light theme tuned to match application colors
  const lightThemeCustom = useMemo(() => {
    return EditorView.theme({
      '&': {
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
      },
      '.cm-content': {
        caretColor: '#4F46E5',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: '#4F46E5',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: '#E0E7FF',
      },
      '.cm-gutters': {
        backgroundColor: '#F8FAFC',
        color: '#94A3B8',
        borderRight: '1px solid #E2E8F0',
      },
      '.cm-activeLine': {
        backgroundColor: '#F1F5F9',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#E2E8F0',
        color: '#4F46E5',
        fontWeight: '600',
      },
    });
  }, []);

  const extensions = useMemo(() => {
    const exts = [
      json(),
      EditorView.lineWrapping,
    ];

    if (!isDark) {
      exts.push(lightThemeCustom);
    }

    return exts;
  }, [isDark, lightThemeCustom]);

  const handleKeyDown = (e) => {
    // Ctrl + Enter or Cmd + Enter shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (onExecuteShortcut) {
        e.preventDefault();
        onExecuteShortcut();
      }
    }
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden text-sm font-mono focus-within:ring-1 focus-within:ring-indigo-500/50 rounded-b-xl"
      onKeyDown={handleKeyDown}
    >
      <CodeMirror
        value={value}
        height="100%"
        minHeight={minHeight}
        maxHeight={maxHeight}
        theme={isDark ? oneDark : 'light'}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        editable={!readOnly}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: !readOnly,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
}
