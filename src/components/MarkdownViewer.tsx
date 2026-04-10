import { useMemo, useEffect, useRef } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import type { MdFile } from '../db';
import { Loader2 } from 'lucide-react';
import { getAuthHeaders } from '../lib/auth';

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

interface MarkdownViewerProps {
  file: MdFile | null;
  loading?: boolean;
  resolvedLinks?: Map<string, boolean>; // targetTitle -> resolved
  onWikilinkClick?: (target: string) => void;
  onInternalLinkClick?: (repoPath: string) => void;
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

// Module-level cache: repo::path → blob URL (persists across re-renders, cleared on page reload)
const imageCache = new Map<string, string>();

export function MarkdownViewer({ file, loading, resolvedLinks, onWikilinkClick, onInternalLinkClick, repoFullName }: MarkdownViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => {
    if (!file?.content) return '';

    const preprocessed = preprocessWikilinks(file.content, resolvedLinks);

    try {
      const result = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeSlug)
        .use(rehypeHighlight, { detect: true, ignoreMissing: true })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .processSync(preprocessed);

      return String(result);
    } catch {
      return `<p class="text-destructive">Failed to render markdown.</p>`;
    }
  }, [file?.content, resolvedLinks]);

  // Resolve relative image paths to GitHub raw content URLs
  useEffect(() => {
    const el = contentRef.current;
    if (!el || !file || !repoFullName) return;
    const fileDir = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';

    const imgs = el.querySelectorAll('img[src]');
    imgs.forEach(async (img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) return;

      // Resolve relative path
      const parts = (fileDir ? fileDir + '/' + src : src).split('/');
      const resolved: string[] = [];
      for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') { resolved.pop(); continue; }
        resolved.push(part);
      }
      const fullPath = resolved.join('/');
      const cacheKey = `${repoFullName}::${fullPath}`;

      // Check cache first
      const cached = imageCache.get(cacheKey);
      if (cached) { img.setAttribute('src', cached); return; }

      // Fetch via GitHub API with auth
      const [owner, repo] = repoFullName.split('/');
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;
      try {
        const headers = await getAuthHeaders();
        const resp = await fetch(apiUrl, {
          headers: { ...headers, Accept: 'application/vnd.github.raw' },
        });
        if (!resp.ok) return;
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        imageCache.set(cacheKey, blobUrl);
        img.setAttribute('src', blobUrl);
      } catch {
        // Leave broken image
      }
    });
  }, [html, file, repoFullName]);

  const handleClick = (e: React.MouseEvent) => {
    // Wikilinks
    const wikilink = (e.target as HTMLElement).closest('[data-wikilink]');
    if (wikilink) {
      e.preventDefault();
      const wikilinkTarget = decodeURIComponent(
        wikilink.getAttribute('data-wikilink') ?? ''
      );
      onWikilinkClick?.(wikilinkTarget);
      return;
    }

    // Regular <a> clicks
    const anchor = (e.target as HTMLElement).closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;

    // Anchor links (#section) — scroll to element
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = decodeURIComponent(href.slice(1));
      const el = contentRef.current?.querySelector(`[id="${CSS.escape(id)}"]`)
        ?? contentRef.current?.querySelector(`[id="${CSS.escape(id.toLowerCase())}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // External links — let browser handle normally
    if (href.startsWith('http://') || href.startsWith('https://')) return;

    // Internal .md links — navigate via router
    if (href.endsWith('.md') || href.includes('.md#')) {
      e.preventDefault();
      const linkPath = href.split('#')[0];
      if (linkPath && onInternalLinkClick && file) {
        // Resolve relative path against current file's directory
        const fileDir = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
        const parts = (fileDir ? fileDir + '/' + linkPath : linkPath).split('/');
        const resolved: string[] = [];
        for (const part of parts) {
          if (part === '.' || part === '') continue;
          if (part === '..') { resolved.pop(); continue; }
          resolved.push(part);
        }
        onInternalLinkClick(resolved.join('/'));
      }
      return;
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
      ref={contentRef}
      className="prose prose-sm dark:prose-invert max-w-none px-8 py-6"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
