import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  FoldVertical,
} from 'lucide-react';
import { useAppStore } from '../stores/app';
import type { Repo, MdFile } from '../db';
import { cn } from '../lib/utils';

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: MdFile;
}

function buildTree(files: MdFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = {
          name,
          path,
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  const sortAll = (nodes: TreeNode[]): TreeNode[] => {
    return sortNodes(nodes).map((n) => ({
      ...n,
      children: sortAll(n.children),
    }));
  };

  return sortAll(root);
}

function TreeNodeItem({
  node,
  depth,
  repoFullName,
  focusPath,
  focusTs,
}: {
  node: TreeNode;
  depth: number;
  repoFullName: string;
  focusPath: string | null;
  focusTs: number;
}) {
  const isFocusTarget = focusPath === node.path;
  const isOnFocusPath = focusPath ? focusPath.startsWith(node.path + '/') : false;
  const [expanded, setExpanded] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const navigate = useNavigate();
  const currentFileId = useAppStore((s) => s.currentFileId);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Auto-expand if on the focus path
  useEffect(() => {
    if (node.isDir && isOnFocusPath) setExpanded(true);
  }, [isOnFocusPath, node.isDir, focusTs]);

  // Highlight + scroll into view when this is the focus target
  useEffect(() => {
    if (!isFocusTarget) {
      setHighlighted(false);
      return;
    }
    setHighlighted(true);
    btnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const timer = setTimeout(() => setHighlighted(false), 3000);
    return () => clearTimeout(timer);
  }, [isFocusTarget, focusTs]);

  const fileId = node.file ? `${repoFullName}::${node.path}` : null;
  const isActive = fileId === currentFileId;

  const handleClick = () => {
    if (node.isDir) {
      setExpanded(!expanded);
    } else if (node.file) {
      const [owner, repo] = repoFullName.split('/');
      navigate(`/repo/${owner}/${repo}/${node.path}`);
      if (window.innerWidth < 768) {
        useAppStore.getState().setLeftSidebarOpen(false);
      }
    }
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1 w-full text-left px-2 py-1 text-sm hover:bg-accent rounded-sm truncate transition-colors duration-500',
          isActive && 'bg-accent text-accent-foreground font-medium',
          highlighted && !isActive && 'bg-primary/20 text-primary'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDir ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDir && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              repoFullName={repoFullName}
              focusPath={focusPath}
              focusTs={focusTs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RepoSyncStatus({ repo }: { repo: Repo }) {
  const { t } = useTranslation();
  if (repo.syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>
          {repo.cachedFiles}/{repo.totalFiles}
        </span>
      </div>
    );
  }
  if (repo.syncStatus === 'error') {
    return (
      <div className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        <span>{t('error')}</span>
      </div>
    );
  }
  if (repo.syncStatus === 'done') {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        <span>{repo.totalFiles}</span>
      </div>
    );
  }
  return null;
}

function RepoSection({ repo, onRetry, defaultExpanded = true }: { repo: Repo; onRetry?: (fullName: string) => void; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { t } = useTranslation();
  const fileTree = useAppStore((s) => s.fileTree);
  const focusTree = useAppStore((s) => s.focusTreePath);
  const files = fileTree.get(repo.fullName) ?? [];
  const tree = buildTree(files);

  // The focus path for this repo (strip "repoFullName::" prefix)
  const repoFocusPath = focusTree?.path.startsWith(repo.fullName + '::')
    ? focusTree.path.slice(repo.fullName.length + 2)
    : null;
  const focusTs = focusTree?.ts ?? 0;

  // Auto-expand repo when a path inside it is focused
  useEffect(() => {
    if (repoFocusPath) setExpanded(true);
  }, [repoFocusPath, focusTs]);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <div className="flex items-center gap-1">
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span className="truncate">{repo.label || repo.fullName}</span>
        </div>
        <RepoSyncStatus repo={repo} />
      </button>
      {expanded && (
        <div>
          {repo.syncStatus === 'error' && (
            <div className="px-3 py-2 text-xs text-destructive">
              <p className="truncate">{repo.syncError ?? t('tree.syncFailed')}</p>
              <button
                onClick={() => onRetry?.(repo.fullName)}
                className="flex items-center gap-1 mt-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                {t('retry')}
              </button>
            </div>
          )}
          {tree.length === 0 && repo.syncStatus !== 'error' && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {repo.syncStatus === 'syncing' ? t('tree.syncing') : t('tree.noMdFiles')}
            </p>
          )}
          {tree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              repoFullName={repo.fullName}
              focusPath={repoFocusPath}
              focusTs={focusTs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ onRetry }: { onRetry?: (fullName: string) => void }) {
  const repos = useAppStore((s) => s.repos);
  const [collapseKey, setCollapseKey] = useState(0);
  const { t } = useTranslation();

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">{t('tree.noRepos')}</p>
        <a
          href="/settings"
          className="text-sm text-primary hover:underline"
        >
          {t('tree.goToSettings')}
        </a>
      </div>
    );
  }

  return (
    <div className="py-2 overflow-y-auto h-full">
      <div className="flex justify-end px-2 mb-1">
        <button
          onClick={() => setCollapseKey((k) => k + 1)}
          title={t('tree.collapseAll')}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <FoldVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      {repos.map((repo) => (
        <RepoSection key={`${repo.fullName}-${collapseKey}`} repo={repo} onRetry={onRetry} defaultExpanded={collapseKey === 0} />
      ))}
    </div>
  );
}
