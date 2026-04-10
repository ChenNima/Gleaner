export interface CodeTheme {
  id: string;
  label: string;
}

export const lightThemes: CodeTheme[] = [
  { id: 'github', label: 'GitHub' },
  { id: 'atom-one-light', label: 'Atom One Light' },
  { id: 'vs', label: 'Visual Studio' },
  { id: 'intellij-light', label: 'IntelliJ' },
  { id: 'stackoverflow-light', label: 'Stack Overflow' },
  { id: 'xcode', label: 'Xcode' },
  { id: 'googlecode', label: 'Google Code' },
  { id: 'arduino-light', label: 'Arduino' },
  { id: 'tokyo-night-light', label: 'Tokyo Night' },
  { id: 'rose-pine-dawn', label: 'Rose Pine Dawn' },
];

export const darkThemes: CodeTheme[] = [
  { id: 'github-dark', label: 'GitHub Dark' },
  { id: 'atom-one-dark', label: 'Atom One Dark' },
  { id: 'vs2015', label: 'VS 2015' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'nord', label: 'Nord' },
  { id: 'tokyo-night-dark', label: 'Tokyo Night' },
  { id: 'night-owl', label: 'Night Owl' },
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'stackoverflow-dark', label: 'Stack Overflow' },
  { id: 'rose-pine', label: 'Rose Pine' },
  { id: 'an-old-hope', label: 'An Old Hope' },
  { id: 'monokai-sublime', label: 'Monokai Sublime' },
];

const STYLE_ELEMENT_ID = 'hljs-theme';

const themeLoaders: Record<string, () => Promise<{ default: string }>> = {
  // Light
  'github': () => import('highlight.js/styles/github.min.css?raw'),
  'atom-one-light': () => import('highlight.js/styles/atom-one-light.min.css?raw'),
  'vs': () => import('highlight.js/styles/vs.min.css?raw'),
  'intellij-light': () => import('highlight.js/styles/intellij-light.min.css?raw'),
  'stackoverflow-light': () => import('highlight.js/styles/stackoverflow-light.min.css?raw'),
  'xcode': () => import('highlight.js/styles/xcode.min.css?raw'),
  'googlecode': () => import('highlight.js/styles/googlecode.min.css?raw'),
  'arduino-light': () => import('highlight.js/styles/arduino-light.min.css?raw'),
  'tokyo-night-light': () => import('highlight.js/styles/tokyo-night-light.min.css?raw'),
  'rose-pine-dawn': () => import('highlight.js/styles/rose-pine-dawn.min.css?raw'),
  // Dark
  'github-dark': () => import('highlight.js/styles/github-dark.min.css?raw'),
  'atom-one-dark': () => import('highlight.js/styles/atom-one-dark.min.css?raw'),
  'vs2015': () => import('highlight.js/styles/vs2015.min.css?raw'),
  'monokai': () => import('highlight.js/styles/monokai.min.css?raw'),
  'nord': () => import('highlight.js/styles/nord.min.css?raw'),
  'tokyo-night-dark': () => import('highlight.js/styles/tokyo-night-dark.min.css?raw'),
  'night-owl': () => import('highlight.js/styles/night-owl.min.css?raw'),
  'obsidian': () => import('highlight.js/styles/obsidian.min.css?raw'),
  'stackoverflow-dark': () => import('highlight.js/styles/stackoverflow-dark.min.css?raw'),
  'rose-pine': () => import('highlight.js/styles/rose-pine.min.css?raw'),
  'an-old-hope': () => import('highlight.js/styles/an-old-hope.min.css?raw'),
  'monokai-sublime': () => import('highlight.js/styles/monokai-sublime.min.css?raw'),
};

/** Scope all hljs theme selectors under `.prose pre` so they don't leak */
function scopeCSS(css: string): string {
  return css.replace(
    /\.hljs\b/g,
    '.prose pre .hljs'
  );
}

export async function applyCodeTheme(themeId: string): Promise<void> {
  const loader = themeLoaders[themeId];
  if (!loader) return;

  const mod = await loader();
  const css = scopeCSS(mod.default);

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

export const DEFAULT_LIGHT_THEME = 'github';
export const DEFAULT_DARK_THEME = 'github-dark';
