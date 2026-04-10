import { create } from 'zustand';
import { applyCodeTheme } from '../lib/code-themes';
import { getMarkdownTheme, DEFAULT_MARKDOWN_THEME } from '../lib/markdown-themes';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  markdownTheme: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setMarkdownTheme: (id: string) => void;
}

function applyCodeThemeForMarkdown(appTheme: Theme, markdownThemeId: string) {
  const mt = getMarkdownTheme(markdownThemeId);
  applyCodeTheme(appTheme === 'dark' ? mt.codeThemeDark : mt.codeThemeLight);
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const stored = localStorage.getItem('gleaner-theme') as Theme | null;
  const initial: Theme = stored ?? 'light';
  const initialMdTheme = localStorage.getItem('gleaner-markdown-theme') ?? DEFAULT_MARKDOWN_THEME;

  if (initial === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // Apply initial code theme
  applyCodeThemeForMarkdown(initial, initialMdTheme);

  return {
    theme: initial,
    markdownTheme: initialMdTheme,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('gleaner-theme', next);
        applyCodeThemeForMarkdown(next, state.markdownTheme);
        return { theme: next };
      }),
    setTheme: (theme) =>
      set((state) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('gleaner-theme', theme);
        applyCodeThemeForMarkdown(theme, state.markdownTheme);
        return { theme };
      }),
    setMarkdownTheme: (id) => {
      localStorage.setItem('gleaner-markdown-theme', id);
      set({ markdownTheme: id });
      const { theme } = get();
      applyCodeThemeForMarkdown(theme, id);
    },
  };
});
