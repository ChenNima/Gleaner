import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, HardDrive, Globe, Settings, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/app';
import { switchProfile } from '../lib/profile';
import { cn } from '../lib/utils';

export function ProfileSwitcher() {
  const profiles = useAppStore((s) => s.profiles);
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (profiles.length === 0) return null;

  async function handleSwitch(id: string) {
    if (id === activeProfileId) { setOpen(false); return; }
    setSwitching(true);
    setOpen(false);
    try {
      await switchProfile(id);
      // switchProfile already updates repos in store; refresh profiles
      const { getProfiles: loadProfiles, getActiveProfileId: loadActiveId } = await import('../lib/profile');
      useAppStore.getState().setProfiles(await loadProfiles());
      useAppStore.getState().setActiveProfileId(await loadActiveId());
    } catch {
      // ignore
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-accent text-muted-foreground max-w-[140px]"
      >
        {switching ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : activeProfile?.type === 'local' ? (
          <HardDrive className="h-3 w-3 shrink-0" />
        ) : (
          <Globe className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">{activeProfile?.name ?? 'Profile'}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>

      {open && (
        <div className={cn(
          'absolute top-full mt-1 bg-popover border rounded-md shadow-lg z-50 py-1 min-w-[180px]',
          // On mobile, position from left edge; on desktop, normal
          'right-0 md:left-0'
        )}>
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            return (
              <button
                key={p.id}
                onClick={() => handleSwitch(p.id)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-left"
              >
                <span className="w-3.5 shrink-0">
                  {isActive && <Check className="h-3 w-3 text-primary" />}
                </span>
                {p.type === 'local' ? (
                  <HardDrive className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{p.name}</span>
                <span className={cn(
                  'text-[9px] px-1 py-0.5 rounded-full ml-auto shrink-0',
                  p.type === 'local'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                )}>
                  {p.type === 'local' ? 'Local' : 'GitHub'}
                </span>
              </button>
            );
          })}
          <div className="border-t my-1" />
          <button
            onClick={() => { setOpen(false); navigate('/settings'); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent text-muted-foreground"
          >
            <span className="w-3.5 shrink-0" />
            <Settings className="h-3 w-3" />
            <span>Manage Profiles</span>
          </button>
        </div>
      )}
    </div>
  );
}
