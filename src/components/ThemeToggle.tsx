import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/theme';
import { cn } from '../lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center w-14 h-7 rounded-full p-0.5 transition-colors duration-300',
        isDark
          ? 'bg-zinc-600'
          : 'bg-zinc-200'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon (left side) */}
      <Sun className={cn(
        'absolute left-1.5 h-3.5 w-3.5 transition-colors duration-300',
        isDark ? 'text-zinc-400' : 'text-amber-500'
      )} />
      {/* Moon icon (right side) */}
      <Moon className={cn(
        'absolute right-1.5 h-3.5 w-3.5 transition-colors duration-300',
        isDark ? 'text-blue-300' : 'text-zinc-400'
      )} />
      {/* Sliding knob */}
      <div className={cn(
        'h-6 w-6 rounded-full shadow-sm transition-transform duration-300',
        isDark
          ? 'translate-x-7 bg-zinc-900'
          : 'translate-x-0 bg-white'
      )} />
    </button>
  );
}
