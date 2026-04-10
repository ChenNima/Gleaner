import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { useThemeStore } from '../stores/theme';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function YamlEditor({ value, onChange, error }: YamlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isDark = useThemeStore((s) => s.theme) === 'dark';

  // Create editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      basicSetup,
      yaml(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { fontSize: '13px', maxHeight: '400px' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { fontFamily: 'ui-monospace, monospace' },
      }),
    ];

    if (isDark) extensions.push(oneDark);

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [isDark]); // Recreate on theme change

  // Sync external value changes into editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        className="border rounded-md overflow-hidden"
      />
      {error && (
        <p className="text-xs text-destructive px-1">{error}</p>
      )}
    </div>
  );
}
