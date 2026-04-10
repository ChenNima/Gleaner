import { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../stores/theme';
import { markdownThemes } from '../lib/markdown-themes';

export function DocumentThemePicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const markdownTheme = useThemeStore((s) => s.markdownTheme);
  const setMarkdownTheme = useThemeStore((s) => s.setMarkdownTheme);

  const current = markdownThemes.find((t) => t.id === markdownTheme) ?? markdownThemes[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border hover:bg-accent text-foreground text-xs"
        title="Document theme"
      >
        <Palette className="h-3.5 w-3.5 text-primary" />
        <span>{current.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md py-1 min-w-[180px]">
          {markdownThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setMarkdownTheme(t.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${
                t.id === current.id ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              <div>{t.label}</div>
              <div className="text-[10px] text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
