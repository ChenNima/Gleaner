import { useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Network, Settings } from 'lucide-react';
import { useAppStore } from '../stores/app';
import { ThemeToggle } from './ThemeToggle';
import { SyncStatus } from './SyncStatus';
import { FileTree } from './FileTree';
import { cn } from '../lib/utils';
import { hydrateStoreFromDB } from '../lib/hydrate';

function ResizeHandle({ side, widthRef, setWidth, min, max }: {
  side: 'left' | 'right';
  widthRef: React.RefObject<number>;
  setWidth: (w: number) => void;
  min: number;
  max: number;
}) {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widthRef.current;

    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      const delta = side === 'left' ? diff : -diff;
      const newW = Math.max(min, Math.min(max, startWidth + delta));
      setWidth(newW);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [side, widthRef, setWidth, min, max]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-1 shrink-0 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors"
    />
  );
}

export function Layout({
  children,
  rightPanel,
}: {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}) {
  useEffect(() => {
    hydrateStoreFromDB();
  }, []);

  const leftOpen = useAppStore((s) => s.leftSidebarOpen);
  const rightOpen = useAppStore((s) => s.rightSidebarOpen);
  const toggleLeft = useAppStore((s) => s.toggleLeftSidebar);
  const toggleRight = useAppStore((s) => s.toggleRightSidebar);
  const leftWidth = useAppStore((s) => s.leftSidebarWidth);
  const rightWidth = useAppStore((s) => s.rightSidebarWidth);
  const setLeftWidth = useAppStore((s) => s.setLeftSidebarWidth);
  const setRightWidth = useAppStore((s) => s.setRightSidebarWidth);
  const location = useLocation();

  // Use refs so mousemove handler always reads current width
  const leftWidthRef = useRef(leftWidth);
  leftWidthRef.current = leftWidth;
  const rightWidthRef = useRef(rightWidth);
  rightWidthRef.current = rightWidth;

  return (
    <div className="flex flex-col h-screen">
      {/* Top navbar */}
      <header className="flex items-center justify-between h-11 px-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLeft}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
            title={leftOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {leftOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
          <Link to="/" className="text-sm font-semibold text-foreground">
            Gleaner
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <SyncStatus />
          <Link
            to="/graph"
            className={cn(
              'p-1.5 rounded hover:bg-accent text-muted-foreground',
              location.pathname === '/graph' && 'bg-accent text-foreground'
            )}
            title="Knowledge Graph"
          >
            <Network className="h-4 w-4" />
          </Link>
          <Link
            to="/settings"
            className={cn(
              'p-1.5 rounded hover:bg-accent text-muted-foreground',
              location.pathname === '/settings' && 'bg-accent text-foreground'
            )}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          <button
            onClick={toggleRight}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
            title={rightOpen ? 'Hide backlinks' : 'Show backlinks'}
          >
            {rightOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - file tree */}
        {leftOpen && (
          <>
            <aside
              className="shrink-0 border-r overflow-y-auto bg-sidebar-background text-sidebar-foreground"
              style={{ width: leftWidth }}
            >
              <FileTree />
            </aside>
            <ResizeHandle side="left" widthRef={leftWidthRef} setWidth={setLeftWidth} min={160} max={400} />
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Right sidebar */}
        {rightOpen && (
          <>
            <ResizeHandle side="right" widthRef={rightWidthRef} setWidth={setRightWidth} min={200} max={600} />
            <aside
              className="shrink-0 border-l flex flex-col bg-sidebar-background text-sidebar-foreground"
              style={{ width: rightWidth }}
            >
              {rightPanel ?? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No backlinks
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
