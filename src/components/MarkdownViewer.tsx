import { useMemo, useRef, useCallback, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import rehypeReact from 'rehype-react';
import type { MdFile } from '../db';
import { Loader2 } from 'lucide-react';
import { useThemeStore } from '../stores/theme';
import { cn } from '../lib/utils';
import { CodeBlock } from './markdown/CodeBlock';
import { ResponsiveTable } from './markdown/ResponsiveTable';
import { RepoImage } from './markdown/RepoImage';
import { MdLink } from './markdown/MdLink';
import { RepoVideo } from './markdown/RepoVideo';
import { FrontmatterCard } from './markdown/FrontmatterCard';
import { extractFrontmatter } from '../lib/frontmatter';

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

interface MarkdownViewerProps {
  file: MdFile | null;
  loading?: boolean;
  resolvedLinks?: Map<string, boolean>;
  onWikilinkClick?: (target: string) => void;
  onInternalLinkClick?: (repoPath: string) => void;
  onFolderClick?: (repoPath: string) => void;
  repoFullName?: string;
}

function preprocessWikilinks(content: string, resolvedLinks?: Map<string, boolean>): string {
  // Protect code blocks and inline code from wikilink replacement
  const codeSlots: string[] = [];
  const placeholder = (i: number) => `\x00CODE${i}\x00`;

  // Replace fenced code blocks first, then inline code spans
  let safe = content.replace(/```[\s\S]*?```|`[^`\n]+`/g, (m) => {
    const idx = codeSlots.length;
    codeSlots.push(m);
    return placeholder(idx);
  });

  // Replace wikilinks in the safe string
  safe = safe.replace(WIKILINK_REGEX, (_match, target: string, alias?: string) => {
    const display = alias ?? target;
    const encoded = encodeURIComponent(target.trim());
    const isResolved = resolvedLinks?.get(target.trim().toLowerCase()) ?? false;
    return `<a class="wikilink" data-wikilink="${encoded}" data-resolved="${isResolved}">${display}</a>`;
  });

  // Restore code blocks
  for (let i = 0; i < codeSlots.length; i++) {
    safe = safe.replace(placeholder(i), codeSlots[i]);
  }
  return safe;
}

export function MarkdownViewer({ file, loading, resolvedLinks, onWikilinkClick, onInternalLinkClick, onFolderClick, repoFullName }: MarkdownViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markdownTheme = useThemeStore((s) => s.markdownTheme);
  const { t } = useTranslation();

  const fileDir = file?.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';

  const handleAnchorClick = useCallback((id: string) => {
    const el = containerRef.current?.querySelector(`[id="${CSS.escape(id)}"]`)
      ?? containerRef.current?.querySelector(`[id="${CSS.escape(id.toLowerCase())}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fileContent = file?.content ?? null;

  const frontmatter = useMemo(() => {
    if (!fileContent) return null;
    const { meta } = extractFrontmatter(fileContent);
    return meta;
  }, [fileContent]);

  const content: JSX.Element | null = useMemo(() => {
    if (!fileContent) return null;

    const { body } = extractFrontmatter(fileContent);
    const preprocessed = preprocessWikilinks(body, resolvedLinks);

    try {
      const result = unified()
        .use(remarkParse)
        .use(remarkFrontmatter)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSlug)
        .use(rehypeHighlight, { detect: true, ignoreMissing: true })
        .use(rehypeReact, {
          Fragment,
          jsx: jsx as unknown as (type: string, props: Record<string, unknown>) => JSX.Element,
          jsxs: jsxs as unknown as (type: string, props: Record<string, unknown>) => JSX.Element,
          components: {
            pre: (props: Record<string, unknown>) => <CodeBlock {...props} />,
            table: (props: Record<string, unknown>) => <ResponsiveTable {...props} />,
            img: (props: Record<string, unknown>) => (
              <RepoImage
                {...props}
                repoFullName={repoFullName}
                fileDir={fileDir}
              />
            ),
            video: (props: Record<string, unknown>) => <RepoVideo {...props} />,
            a: (props: Record<string, unknown>) => (
              <MdLink
                {...props}
                onWikilinkClick={onWikilinkClick}
                onInternalLinkClick={onInternalLinkClick}
                onFolderClick={onFolderClick}
                onAnchorClick={handleAnchorClick}
                fileDir={fileDir}
              />
            ),
          },
        })
        .processSync(preprocessed);

      return result.result;
    } catch {
      return <p className="text-destructive">{t('md.renderFailed')}</p>;
    }
  }, [fileContent, resolvedLinks, repoFullName, fileDir, onWikilinkClick, onInternalLinkClick, onFolderClick, handleAnchorClick, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {t('md.selectFile')}
      </div>
    );
  }

  if (file.content === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">{t('md.loadingContent')}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('prose prose-sm dark:prose-invert max-w-none px-4 md:px-8 py-6', `md-theme-${markdownTheme}`)}
    >
      {frontmatter && <FrontmatterCard meta={frontmatter} />}
      {content}
    </div>
  );
}
