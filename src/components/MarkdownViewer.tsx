import { useMemo, useRef, useCallback, type JSX } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
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
  return content.replace(WIKILINK_REGEX, (_match, target: string, alias?: string) => {
    const display = alias ?? target;
    const encoded = encodeURIComponent(target.trim());
    const isResolved = resolvedLinks?.get(target.trim().toLowerCase()) ?? false;
    return `<a class="wikilink" data-wikilink="${encoded}" data-resolved="${isResolved}">${display}</a>`;
  });
}

export function MarkdownViewer({ file, loading, resolvedLinks, onWikilinkClick, onInternalLinkClick, onFolderClick, repoFullName }: MarkdownViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markdownTheme = useThemeStore((s) => s.markdownTheme);

  const fileDir = file?.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';

  const handleAnchorClick = useCallback((id: string) => {
    const el = containerRef.current?.querySelector(`[id="${CSS.escape(id)}"]`)
      ?? containerRef.current?.querySelector(`[id="${CSS.escape(id.toLowerCase())}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const content: JSX.Element | null = useMemo(() => {
    if (!file?.content) return null;

    const preprocessed = preprocessWikilinks(file.content, resolvedLinks);

    try {
      const result = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSlug)
        .use(rehypeHighlight, { detect: true, ignoreMissing: true })
        .use(rehypeReact, {
          Fragment,
          jsx: jsx as any,
          jsxs: jsxs as any,
          components: {
            pre: (props: any) => <CodeBlock {...props} />,
            table: (props: any) => <ResponsiveTable {...props} />,
            img: (props: any) => (
              <RepoImage
                {...props}
                repoFullName={repoFullName}
                fileDir={fileDir}
              />
            ),
            a: (props: any) => (
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
      return <p className="text-destructive">Failed to render markdown.</p>;
    }
  }, [file?.content, resolvedLinks, repoFullName, fileDir, onWikilinkClick, onInternalLinkClick, onFolderClick, handleAnchorClick]);

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
        Select a file to view
      </div>
    );
  }

  if (file.content === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading content...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('prose prose-sm dark:prose-invert max-w-none px-8 py-6', `md-theme-${markdownTheme}`)}
    >
      {content}
    </div>
  );
}
