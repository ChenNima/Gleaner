import { Link, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Network, Settings } from 'lucide-react';
import { useAppStore } from '../stores/app';
import { ThemeToggle } from './ThemeToggle';
import { SyncStatus } from './SyncStatus';
import { FileTree } from './FileTree';
import { cn } from '../lib/utils';

export function Layout({
  children,
  rightPanel,
}: {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}) {
  const leftOpen = useAppStore((s) => s.leftSidebarOpen);
  const rightOpen = useAppStore((s) => s.rightSidebarOpen);
  const toggleLeft = useAppStore((s) => s.toggleLeftSidebar);
  const toggleRight = useAppStore((s) => s.toggleRightSidebar);
  const location = useLocation();

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
          <aside className="w-60 shrink-0 border-r overflow-y-auto bg-sidebar-background text-sidebar-foreground">
            <FileTree />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Right sidebar - backlinks */}
        {rightOpen && (
          <aside className="w-60 shrink-0 border-l overflow-y-auto bg-sidebar-background text-sidebar-foreground">
            {rightPanel ?? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                No backlinks
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
