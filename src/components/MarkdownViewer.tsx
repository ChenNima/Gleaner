import { useMemo } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import type { MdFile } from '../db';
import { Loader2 } from 'lucide-react';

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

interface MarkdownViewerProps {
  file: MdFile | null;
  loading?: boolean;
  resolvedLinks?: Map<string, boolean>; // targetTitle -> resolved
  onWikilinkClick?: (target: string) => void;
}

function preprocessWikilinks(content: string, resolvedLinks?: Map<string, boolean>): string {
  return content.replace(WIKILINK_REGEX, (_match, target: string, alias?: string) => {
    const display = alias ?? target;
    const encoded = encodeURIComponent(target.trim());
    const isResolved = resolvedLinks?.get(target.trim().toLowerCase()) ?? false;
    return `<a class="wikilink" data-wikilink="${encoded}" data-resolved="${isResolved}">${display}</a>`;
  });
}

export function MarkdownViewer({ file, loading, resolvedLinks, onWikilinkClick }: MarkdownViewerProps) {
  const html = useMemo(() => {
    if (!file?.content) return '';

    const preprocessed = preprocessWikilinks(file.content, resolvedLinks);

    try {
      const result = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeHighlight, { detect: true, ignoreMissing: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(preprocessed);

      return String(result);
    } catch {
      return `<p class="text-destructive">Failed to render markdown.</p>`;
    }
  }, [file?.content, resolvedLinks]);

  const handleClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-wikilink]');
    if (target) {
      e.preventDefault();
      const wikilinkTarget = decodeURIComponent(
        target.getAttribute('data-wikilink') ?? ''
      );
      onWikilinkClick?.(wikilinkTarget);
    }
  };

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
      className="prose prose-sm dark:prose-invert max-w-none px-8 py-6"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
