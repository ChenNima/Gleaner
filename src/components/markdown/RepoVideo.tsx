import { getGithubProxy } from '../../lib/github';

interface RepoVideoProps {
  src?: string;
  [key: string]: unknown;
}

/** Converts GitHub web URLs to raw URLs and applies proxy. */
export function RepoVideo({ src, ...rest }: RepoVideoProps) {
  const resolvedSrc = resolveVideoSrc(src ?? '');
  return <video src={resolvedSrc} {...rest} />;
}

/**
 * Convert GitHub web URLs to raw.githubusercontent.com, then apply proxy.
 *
 * github.com/{owner}/{repo}/blob/{ref}/{path}  → raw.githubusercontent.com/...
 * github.com/{owner}/{repo}/edit/{ref}/{path}  → raw.githubusercontent.com/...
 * github.com/{owner}/{repo}/raw/{ref}/{path}   → raw.githubusercontent.com/...
 */
function resolveVideoSrc(url: string): string {
  if (!url) return url;

  let resolved = url;

  // Convert github.com web URLs to raw.githubusercontent.com
  const ghMatch = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|edit|raw)\/(.+)$/
  );
  if (ghMatch) {
    const [, owner, repo, refAndPath] = ghMatch;
    resolved = `https://raw.githubusercontent.com/${owner}/${repo}/${refAndPath}`;
  }

  // Apply proxy to GitHub raw URLs
  const proxy = getGithubProxy();
  if (proxy && (resolved.startsWith('https://raw.githubusercontent.com/') || resolved.startsWith('https://github.com/'))) {
    return `${proxy}/${resolved}`;
  }

  return resolved;
}
