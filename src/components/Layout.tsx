import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Network, Settings, Search, X, MoreVertical } from 'lucide-react';
import { useAppStore } from '../stores/app';
import { ThemeToggle } from './ThemeToggle';
import { SyncStatus } from './SyncStatus';
import { FileTree } from './FileTree';
import { SearchDialog } from './SearchDialog';
import { cn } from '../lib/utils';
import { hydrateStoreFromDB } from '../lib/hydrate';
import { ProfileSwitcher } from './ProfileSwitcher';
import { OfflineBar } from './OfflineBar';

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const check = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  const ref = useRef(check());
  useEffect(() => {
    const onResize = () => { ref.current = check(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Return ref so it's always current without re-renders
  return ref;
}

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
      className="w-1 shrink-0 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors hidden md:block"
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
  const isMobileRef = useIsMobile();
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [mobileMenuOpen]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    hydrateStoreFromDB();
    // Close sidebars on mobile by default
    if (isMobileRef.current) {
      useAppStore.getState().setLeftSidebarOpen(false);
      useAppStore.getState().setRightSidebarOpen(false);
    }
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

  const leftWidthRef = useRef(leftWidth);
  leftWidthRef.current = leftWidth;
  const rightWidthRef = useRef(rightWidth);
  rightWidthRef.current = rightWidth;

  return (
    <div className="flex flex-col h-dvh">
      <OfflineBar />
      {/* Top navbar */}
      <header className="flex items-center justify-between h-11 px-2 md:px-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={toggleLeft}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
            title={leftOpen ? t('nav.hideSidebar') : t('nav.showSidebar')}
          >
            {leftOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <img src="/gleaner.png" alt="Gleaner" className="h-5 w-5" />
            Gleaner
          </Link>
          <ProfileSwitcher />
        </div>

        <div className="flex items-center gap-0.5 md:gap-1">
          <SyncStatus />
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground flex items-center gap-1"
            title={t('search.title')}
            data-testid="search-trigger"
          >
            <Search className="h-4 w-4" />
            <kbd className="hidden md:inline text-[10px] px-1 py-0.5 rounded border bg-muted text-muted-foreground">⌘K</kbd>
          </button>

          {/* Desktop actions */}
          <Link
            to="/graph"
            className={cn(
              'hidden md:flex p-1.5 rounded hover:bg-accent text-muted-foreground',
              location.pathname === '/graph' && 'bg-accent text-foreground'
            )}
            title={t('nav.knowledgeGraph')}
          >
            <Network className="h-4 w-4" />
          </Link>
          <Link
            to="/settings"
            className={cn(
              'hidden md:flex p-1.5 rounded hover:bg-accent text-muted-foreground',
              location.pathname === '/settings' && 'bg-accent text-foreground'
            )}
            title={t('nav.settings')}
          >
            <Settings className="h-4 w-4" />
          </Link>
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          <button
            onClick={toggleRight}
            className="hidden md:flex p-1.5 rounded hover:bg-accent text-muted-foreground"
            title={rightOpen ? t('nav.hideBacklinks') : t('nav.showBacklinks')}
          >
            {rightOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>

          {/* Mobile action menu */}
          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-md border bg-popover shadow-lg z-50 py-1">
                <Link
                  to="/graph"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full',
                    location.pathname === '/graph' && 'text-foreground font-medium'
                  )}
                >
                  <Network className="h-4 w-4" />
                  {t('nav.knowledgeGraph')}
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full',
                    location.pathname === '/settings' && 'text-foreground font-medium'
                  )}
                >
                  <Settings className="h-4 w-4" />
                  {t('nav.settings')}
                </Link>
                <button
                  onClick={() => { toggleRight(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                >
                  {rightOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                  {rightOpen ? t('nav.hideBacklinks') : t('nav.showBacklinks')}
                </button>
                <div className="flex items-center gap-2 px-3 py-2 text-sm">
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar - overlay on mobile, inline on desktop */}
        {leftOpen && (
          <>
            {/* Backdrop on mobile */}
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={toggleLeft}
            />
            <aside
              className={cn(
                'shrink-0 border-r overflow-y-auto bg-sidebar-background text-sidebar-foreground z-40',
                'fixed inset-y-0 left-0 top-11 md:relative md:top-0'
              )}
              style={{ width: isMobileRef.current ? 280 : leftWidth }}
            >
              {/* Close button on mobile */}
              <div className="flex items-center justify-between px-2 py-1.5 border-b md:hidden">
                <span className="text-xs font-semibold text-muted-foreground">{t('nav.files')}</span>
                <button onClick={toggleLeft} className="p-1 rounded hover:bg-accent">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <FileTree />
            </aside>
            <ResizeHandle side="left" widthRef={leftWidthRef} setWidth={setLeftWidth} min={160} max={400} />
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Right sidebar - overlay on mobile, inline on desktop */}
        {rightOpen && (
          <>
            <ResizeHandle side="right" widthRef={rightWidthRef} setWidth={setRightWidth} min={200} max={600} />
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={toggleRight}
            />
            <aside
              className={cn(
                'shrink-0 border-l flex flex-col bg-sidebar-background text-sidebar-foreground z-40',
                'fixed inset-y-0 right-0 top-11 md:relative md:top-0'
              )}
              style={{ width: isMobileRef.current ? 300 : rightWidth }}
            >
              {/* Close button on mobile */}
              <div className="flex items-center justify-end px-2 py-1.5 border-b md:hidden">
                <button onClick={toggleRight} className="p-1 rounded hover:bg-accent">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {rightPanel ?? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  {t('nav.noBacklinks')}
                </div>
              )}
            </aside>
          </>
        )}
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
