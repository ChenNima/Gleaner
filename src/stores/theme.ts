import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const stored = localStorage.getItem('gleaner-theme') as Theme | null;
  const initial: Theme = stored ?? 'light';

  if (initial === 'dark') {
    document.documentElement.classList.add('dark');
  }

  return {
    theme: initial,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('gleaner-theme', next);
        return { theme: next };
      }),
    setTheme: (theme) =>
      set(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('gleaner-theme', theme);
        return { theme };
      }),
  };
});
