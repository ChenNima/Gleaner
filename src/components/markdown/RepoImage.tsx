import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../lib/auth';
import { getGithubProxy } from '../../lib/github';
import { Lightbox } from './Lightbox';

// Module-level cache: cacheKey → blob URL
const imageCache = new Map<string, string>();

interface RepoImageProps {
  src?: string;
  alt?: string;
  repoFullName?: string;
  fileDir?: string;
  [key: string]: unknown;
}

/** Resolves relative image paths via GitHub API, with in-memory blob caching. */
export function RepoImage({ src, alt, repoFullName, fileDir, ...rest }: RepoImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src ?? '');

  const isRelative =
    src &&
    !src.startsWith('http://') &&
    !src.startsWith('https://') &&
    !src.startsWith('data:') &&
    !src.startsWith('blob:');

  useEffect(() => {
    if (!isRelative || !src || !repoFullName) {
      setResolvedSrc(src ?? '');
      return;
    }

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

    // Check cache
    const cached = imageCache.get(cacheKey);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    // Fetch via GitHub API
    let cancelled = false;
    const [owner, repo] = repoFullName.split('/');
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;
        const proxy = getGithubProxy();
        const fetchUrl = proxy ? `${proxy}/${apiUrl}` : apiUrl;
        const resp = await fetch(
          fetchUrl,
          { headers: { ...headers, Accept: 'application/vnd.github.raw' } }
        );
        if (!resp.ok || cancelled) return;
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        imageCache.set(cacheKey, blobUrl);
        if (!cancelled) setResolvedSrc(blobUrl);
      } catch {
        // Leave original src
      }
    })();

    return () => { cancelled = true; };
  }, [src, repoFullName, fileDir, isRelative]);

  return (
    <Lightbox>
      <img src={resolvedSrc} alt={alt ?? ''} {...rest} />
    </Lightbox>
  );
}
