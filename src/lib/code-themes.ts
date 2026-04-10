const STYLE_ELEMENT_ID = 'hljs-theme';

const themeLoaders: Record<string, () => Promise<{ default: string }>> = {
  // Light
  'github': () => import('highlight.js/styles/github.min.css?raw'),
  'atom-one-light': () => import('highlight.js/styles/atom-one-light.min.css?raw'),
  'vs': () => import('highlight.js/styles/vs.min.css?raw'),
  'stackoverflow-light': () => import('highlight.js/styles/stackoverflow-light.min.css?raw'),
  'googlecode': () => import('highlight.js/styles/googlecode.min.css?raw'),
  // Dark
  'github-dark': () => import('highlight.js/styles/github-dark.min.css?raw'),
  'atom-one-dark': () => import('highlight.js/styles/atom-one-dark.min.css?raw'),
  'vs2015': () => import('highlight.js/styles/vs2015.min.css?raw'),
  'nord': () => import('highlight.js/styles/nord.min.css?raw'),
  'obsidian': () => import('highlight.js/styles/obsidian.min.css?raw'),
  'stackoverflow-dark': () => import('highlight.js/styles/stackoverflow-dark.min.css?raw'),
};

export async function applyCodeTheme(themeId: string): Promise<void> {
  const loader = themeLoaders[themeId];
  if (!loader) return;

  const mod = await loader();

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = mod.default;
}
