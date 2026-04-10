export interface MarkdownTheme {
  id: string;
  label: string;
  description: string;
  codeThemeLight: string;
  codeThemeDark: string;
}

export const markdownThemes: MarkdownTheme[] = [
  {
    id: 'github',
    label: 'GitHub',
    description: 'Clean and familiar',
    codeThemeLight: 'github',
    codeThemeDark: 'github-dark',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'Dense and wiki-like',
    codeThemeLight: 'atom-one-light',
    codeThemeDark: 'atom-one-dark',
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'Serif fonts, paper feel',
    codeThemeLight: 'vs',
    codeThemeDark: 'vs2015',
  },
  {
    id: 'notion',
    label: 'Notion',
    description: 'Spacious and modern',
    codeThemeLight: 'stackoverflow-light',
    codeThemeDark: 'stackoverflow-dark',
  },
  {
    id: 'newsprint',
    label: 'Newsprint',
    description: 'Classic reading experience',
    codeThemeLight: 'googlecode',
    codeThemeDark: 'nord',
  },
];

export const DEFAULT_MARKDOWN_THEME = 'github';

export function getMarkdownTheme(id: string): MarkdownTheme {
  return markdownThemes.find((t) => t.id === id) ?? markdownThemes[0];
}
