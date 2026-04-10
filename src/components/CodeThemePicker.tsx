import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore } from '../stores/theme';
import { lightThemes, darkThemes } from '../lib/code-themes';

export function CodeThemePicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const codeThemeLight = useThemeStore((s) => s.codeThemeLight);
  const codeThemeDark = useThemeStore((s) => s.codeThemeDark);
  const setCodeThemeLight = useThemeStore((s) => s.setCodeThemeLight);
  const setCodeThemeDark = useThemeStore((s) => s.setCodeThemeDark);

  const isDark = theme === 'dark';
  const themes = isDark ? darkThemes : lightThemes;
  const current = isDark ? codeThemeDark : codeThemeLight;
  const setCurrent = isDark ? setCodeThemeDark : setCodeThemeLight;
  const currentLabel = themes.find((t) => t.id === current)?.label ?? current;

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
        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground text-xs"
        title="Code theme"
      >
        <Palette className="h-3 w-3" />
        <span className="hidden sm:inline">{currentLabel}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md py-1 min-w-[160px] max-h-64 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isDark ? 'Dark themes' : 'Light themes'}
          </div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setCurrent(t.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1 text-xs hover:bg-accent ${
                t.id === current ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
