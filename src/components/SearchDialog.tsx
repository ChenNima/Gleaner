import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, FileText, X } from 'lucide-react';
import { searchFiles, type SearchResult } from '../lib/search';
import { cn } from '../lib/utils';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      // Wait for next frame so the element is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setResults([]);
      setSelectedIdx(0);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchFiles(query);
      setResults(res);
      setSelectedIdx(0);
      setSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, open]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      const [owner, repo] = result.file.repoFullName.split('/');
      navigate(`/repo/${owner}/${repo}/${result.file.path}`);
      onClose();
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        navigateToResult(results[selectedIdx]);
        return;
      }
    },
    [results, selectedIdx, navigateToResult, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="fixed inset-x-0 top-[20%] mx-auto z-50 w-[calc(100vw-2rem)] max-w-[600px] md:top-[20%]">
        <div
          className="bg-popover border rounded-lg shadow-2xl overflow-hidden"
          onKeyDown={onKeyDown}
        >
          {/* Search header */}
          <div className="flex items-center gap-2 px-3 h-12 border-b">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              data-testid="search-input"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="p-0.5 rounded hover:bg-accent text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[360px] overflow-y-auto"
            data-testid="search-results"
          >
            {query.trim() && results.length === 0 && !searching && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t('search.noResults')}
              </div>
            )}
            {results.map((result, i) => {
              const repoLabel = result.file.repoFullName.split('/')[1] ?? result.file.repoFullName;
              return (
                <button
                  key={result.file.id}
                  onClick={() => navigateToResult(result)}
                  className={cn(
                    'flex items-start gap-2.5 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors',
                    i === selectedIdx && 'bg-accent'
                  )}
                  data-testid="search-result-item"
                >
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {result.file.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                        {repoLabel}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {highlightSnippet(result.snippet, query)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                      {result.file.path}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer - keyboard hints (desktop only) */}
          <div className="hidden md:flex items-center gap-3 px-3 h-8 border-t text-[10px] text-muted-foreground">
            <span><kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">↑↓</kbd> {t('search.navigate')}</span>
            <span><kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">↵</kbd> {t('search.open')}</span>
            <span><kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">esc</kbd> {t('search.close')}</span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Highlight the query within the snippet by wrapping it in <mark> */
function highlightSnippet(snippet: string, query: string): React.ReactNode {
  if (!query.trim()) return snippet;

  const lower = snippet.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);

  if (idx === -1) return snippet;

  const before = snippet.slice(0, idx);
  const match = snippet.slice(idx, idx + query.length);
  const after = snippet.slice(idx + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-800 text-foreground rounded-sm px-0.5">{match}</mark>
      {after}
    </>
  );
}
