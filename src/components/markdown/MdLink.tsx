import type { ReactNode, MouseEvent } from 'react';

interface MdLinkProps {
  href?: string;
  className?: string;
  children?: ReactNode;
  'data-wikilink'?: string;
  'data-resolved'?: string;
  onWikilinkClick?: (target: string) => void;
  onInternalLinkClick?: (repoPath: string) => void;
  onAnchorClick?: (id: string) => void;
  fileDir?: string;
  [key: string]: unknown;
}

/** Handles wikilinks, internal .md links, anchor links, and external links. */
export function MdLink({
  href,
  className,
  children,
  'data-wikilink': dataWikilink,
  'data-resolved': dataResolved,
  onWikilinkClick,
  onInternalLinkClick,
  onAnchorClick,
  fileDir,
  ...rest
}: MdLinkProps) {
  // Wikilink
  if (dataWikilink != null) {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      onWikilinkClick?.(decodeURIComponent(dataWikilink));
    };
    return (
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
    );
  }

  if (!href) return <a className={className} {...rest}>{children}</a>;

  // Anchor link
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

  // External link — open normally
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  // Internal .md link — navigate via router
  if (href.endsWith('.md') || href.includes('.md#')) {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      const linkPath = href.split('#')[0];
      if (linkPath && onInternalLinkClick) {
        const parts = (fileDir ? fileDir + '/' + linkPath : linkPath).split('/');
        const resolved: string[] = [];
        for (const part of parts) {
          if (part === '.' || part === '') continue;
          if (part === '..') { resolved.pop(); continue; }
          resolved.push(part);
        }
        onInternalLinkClick(resolved.join('/'));
      }
    };
    return (
      <a href={href} className={className} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }

  // Fallback
  return <a href={href} className={className} {...rest}>{children}</a>;
}
