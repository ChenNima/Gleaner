import { create } from 'zustand';
import { applyCodeTheme, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '../lib/code-themes';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  codeThemeLight: string;
  codeThemeDark: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setCodeThemeLight: (id: string) => void;
  setCodeThemeDark: (id: string) => void;
}

function activeCodeTheme(theme: Theme, light: string, dark: string): string {
  return theme === 'dark' ? dark : light;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const stored = localStorage.getItem('gleaner-theme') as Theme | null;
  const initial: Theme = stored ?? 'light';
  const initialCodeLight = localStorage.getItem('gleaner-code-theme-light') ?? DEFAULT_LIGHT_THEME;
  const initialCodeDark = localStorage.getItem('gleaner-code-theme-dark') ?? DEFAULT_DARK_THEME;

  if (initial === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // Apply initial code theme
  applyCodeTheme(activeCodeTheme(initial, initialCodeLight, initialCodeDark));

  return {
    theme: initial,
    codeThemeLight: initialCodeLight,
    codeThemeDark: initialCodeDark,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('gleaner-theme', next);
        applyCodeTheme(activeCodeTheme(next, state.codeThemeLight, state.codeThemeDark));
        return { theme: next };
      }),
    setTheme: (theme) =>
      set((state) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('gleaner-theme', theme);
        applyCodeTheme(activeCodeTheme(theme, state.codeThemeLight, state.codeThemeDark));
        return { theme };
      }),
    setCodeThemeLight: (id) => {
      localStorage.setItem('gleaner-code-theme-light', id);
      set({ codeThemeLight: id });
      const { theme, codeThemeDark } = get();
      applyCodeTheme(activeCodeTheme(theme, id, codeThemeDark));
    },
    setCodeThemeDark: (id) => {
      localStorage.setItem('gleaner-code-theme-dark', id);
      set({ codeThemeDark: id });
      const { theme, codeThemeLight } = get();
      applyCodeTheme(activeCodeTheme(theme, codeThemeLight, id));
    },
  };
});
