import type { ReactNode, MouseEvent } from 'react';
import { FileText, ExternalLink, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface MdLinkProps {
  href?: string;
  className?: string;
  children?: ReactNode;
  'data-wikilink'?: string;
  'data-resolved'?: string;
  onWikilinkClick?: (target: string) => void;
  onInternalLinkClick?: (repoPath: string) => void;
  onFolderClick?: (repoPath: string) => void;
  onAnchorClick?: (id: string) => void;
  fileDir?: string;
  [key: string]: unknown;
}

function LinkTooltip({ icon, tip, children }: { icon: ReactNode; tip: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <span className="flex items-center gap-1.5">
          {icon}
          <span className="break-all">{tip}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** Resolve a relative href against the current file's directory. */
function resolvePath(href: string, fileDir?: string): string {
  const decoded = decodeURIComponent(href);
  const parts = (fileDir ? fileDir + '/' + decoded : decoded).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') { resolved.pop(); continue; }
    resolved.push(part);
  }
  return resolved.join('/');
}

/** Derive a display name for an internal .md path. */
function mdDisplayName(resolvedPath: string): string {
  const name = resolvedPath.split('/').pop()?.replace(/\.md$/i, '') ?? resolvedPath;
  return name;
}

/** Check if an href points to an internal folder (not a file). */
function isFolderLink(href: string): boolean {
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) return false;
  // Ends with / or has no extension
  if (href.endsWith('/')) return true;
  const lastSegment = href.split('/').pop() ?? '';
  return !lastSegment.includes('.');
}

/** Handles wikilinks, internal .md links, folder links, anchor links, and external links. */
export function MdLink({
  href,
  className,
  children,
  'data-wikilink': dataWikilink,
  'data-resolved': dataResolved,
  onWikilinkClick,
  onInternalLinkClick,
  onFolderClick,
  onAnchorClick,
  fileDir,
  ...rest
}: MdLinkProps) {
  // Wikilink
  if (dataWikilink != null) {
    const target = decodeURIComponent(dataWikilink);
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      onWikilinkClick?.(target);
    };
    return (
      <LinkTooltip icon={<FileText className="h-3 w-3 shrink-0" />} tip={target}>
        <a
          href="#"
          className={className ?? 'wikilink'}
          data-wikilink={dataWikilink}
          data-resolved={dataResolved}
          onClick={handleClick}
          {...rest}
        >
          {children}
        </a>
      </LinkTooltip>
    );
  }

  if (!href) return <a className={className} {...rest}>{children}</a>;

  // Anchor link — no tooltip
  if (href.startsWith('#')) {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      onAnchorClick?.(decodeURIComponent(href.slice(1)));
    };
    return (
      <a href={href} className={className} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }

  // External link
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <LinkTooltip icon={<ExternalLink className="h-3 w-3 shrink-0" />} tip={href}>
        <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      </LinkTooltip>
    );
  }

  // Internal folder link
  if (isFolderLink(href)) {
    const resolved = resolvePath(href.replace(/\/$/, ''), fileDir);
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      onFolderClick?.(resolved);
    };
    return (
      <LinkTooltip icon={<FolderOpen className="h-3 w-3 shrink-0" />} tip={resolved}>
        <a href={href} className={className} onClick={handleClick} {...rest}>
          {children}
        </a>
      </LinkTooltip>
    );
  }

  // Internal .md link
  if (href.endsWith('.md') || href.includes('.md#')) {
    const resolved = resolvePath(href.split('#')[0], fileDir);
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      onInternalLinkClick?.(resolved);
    };
    return (
      <LinkTooltip icon={<FileText className="h-3 w-3 shrink-0" />} tip={`${mdDisplayName(resolved)}  (${resolved})`}>
        <a href={href} className={className} onClick={handleClick} {...rest}>
          {children}
        </a>
      </LinkTooltip>
    );
  }

  // Fallback
  return <a href={href} className={className} {...rest}>{children}</a>;
}
