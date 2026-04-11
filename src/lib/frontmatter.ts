import { load as yamlLoad } from 'js-yaml';

/** Extract YAML frontmatter and remaining body from markdown content */
export function extractFrontmatter(content: string): { meta: Record<string, unknown> | null; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: null, body: content };

  try {
    const parsed = yamlLoad(match[1]);
    if (typeof parsed !== 'object' || parsed === null) return { meta: null, body: content };
    const body = content.slice(match[0].length).replace(/^\r?\n/, '');
    return { meta: parsed as Record<string, unknown>, body };
  } catch {
    return { meta: null, body: content };
  }
}
