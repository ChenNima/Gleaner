import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronRightIcon } from 'lucide-react';
import { DocumentThemePicker } from '../components/DocumentThemePicker';
import { db } from '../db';
import type { MdFile } from '../db';
import { getFileContent } from '../lib/github';
import { resolveWikilink, extractWikilinks } from '../lib/wikilink-parser';
import { useAppStore } from '../stores/app';
import { MarkdownViewer } from '../components/MarkdownViewer';

// Scroll position memory: fileId → scrollTop
const scrollMemory = new Map<string, number>();

export default function FilePage() {
  const { owner, name, '*': filePath } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setCurrentFileId = useAppStore((s) => s.setCurrentFileId);
  const [file, setFile] = useState<MdFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedLinks, setResolvedLinks] = useState<Map<string, boolean>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const repoFullName = `${owner}/${name}`;
  const fileId = filePath ? `${repoFullName}::${filePath}` : null;

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    setCurrentFileId(fileId);
    setLoading(true);

    (async () => {
      let f = await db.files.get(fileId);

      // If file exists but content not cached, fetch it
      if (f && f.content === null && owner && name && filePath) {
        try {
          const content = await getFileContent(owner, name, filePath);
          await db.files.update(fileId, {
            content,
            backlinkContext: content.slice(0, 100),
          });
          f = await db.files.get(fileId);
        } catch {
          // Show file without content
        }
      }

      setFile(f ?? null);

      // Resolve wikilinks for styling
      if (f?.content) {
        const targets = extractWikilinks(f.content);
        const resolved = new Map<string, boolean>();
        for (const target of targets) {
          const result = await resolveWikilink(target, repoFullName);
          resolved.set(target.toLowerCase(), result !== null);
        }
        setResolvedLinks(resolved);
      }

      setLoading(false);
    })();

    return () => setCurrentFileId(null);
  }, [fileId, owner, name, filePath]);

  const handleWikilinkClick = async (target: string) => {
    const resolved = await resolveWikilink(target, repoFullName);
    if (resolved) {
      const [rOwner, rRepo] = resolved.repoFullName.split('/');
      navigate(`/repo/${rOwner}/${rRepo}/${resolved.path}`);
    }
  };

  const handleInternalLinkClick = useCallback(
    (repoPath: string) => {
      navigate(`/repo/${owner}/${name}/${repoPath}`);
    },
    [navigate, owner, name]
  );

  const handleFolderClick = useCallback(
    (repoPath: string) => {
      const fullPath = `${repoFullName}::${repoPath}`;
      useAppStore.getState().setFocusTreePath(fullPath);
      useAppStore.getState().setLeftSidebarOpen(true);
    },
    [repoFullName]
  );

  const handleBreadcrumbClick = useCallback(
    (segmentPath: string) => {
      // segmentPath is relative to repo, e.g. "docs" or "docs/blogs"
      const fullPath = `${repoFullName}::${segmentPath}`;
      useAppStore.getState().setFocusTreePath(fullPath);
      useAppStore.getState().setLeftSidebarOpen(true);
    },
    [repoFullName]
  );

  // Save scroll position on scroll (debounced)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !fileId) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        scrollMemory.set(fileId, el.scrollTop);
      }, 100);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [fileId]);

  // Restore scroll position after content loads
  useEffect(() => {
    if (loading || !fileId) return;
    const saved = scrollMemory.get(fileId);
    if (saved != null && scrollRef.current) {
      // Wait a frame for content to render
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo(0, saved);
      });
    }
  }, [loading, fileId]);

  // Build breadcrumb segments: [repo label, ...path parts]
  const pathParts = filePath?.split('/') ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb bar */}
      <div className="flex items-center h-8 px-2 border-b bg-background/80 shrink-0 gap-1 text-xs">
        <button
          onClick={() => window.history.back()}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
          title={t('file.goBack')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => window.history.forward()}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
          title={t('file.goForward')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-0.5 ml-1 min-w-0 overflow-x-auto">
          <button
            onClick={() => handleBreadcrumbClick('')}
            className="text-muted-foreground hover:text-foreground hover:underline truncate shrink-0"
          >
            {name}
          </button>
          {pathParts.map((part, i) => {
            const segmentPath = pathParts.slice(0, i + 1).join('/');
            const isLast = i === pathParts.length - 1;
            return (
              <span key={segmentPath} className="flex items-center gap-0.5 min-w-0">
                <ChevronRightIcon className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                <button
                  onClick={() => handleBreadcrumbClick(segmentPath)}
                  className={`truncate hover:underline ${isLast ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {part}
                </button>
              </span>
            );
          })}
        </div>
        <div className="ml-auto">
          <DocumentThemePicker />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <MarkdownViewer
          file={file}
          loading={loading}
          resolvedLinks={resolvedLinks}
          onWikilinkClick={handleWikilinkClick}
          onInternalLinkClick={handleInternalLinkClick}
          onFolderClick={handleFolderClick}
          repoFullName={repoFullName}
        />
      </div>
    </div>
  );
}
