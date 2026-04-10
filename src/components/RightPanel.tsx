import { useState } from 'react';
import { Link2, Network } from 'lucide-react';
import { BacklinksPanel } from './BacklinksPanel';
import { LocalGraph } from './LocalGraph';
import { cn } from '../lib/utils';

interface RightPanelProps {
  fileId: string | null;
}

type Tab = 'links' | 'graph';

export function RightPanel({ fileId }: RightPanelProps) {
  const [tab, setTab] = useState<Tab>('links');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b shrink-0">
        <button
          onClick={() => setTab('links')}
          className={cn(
            'flex items-center gap-1 flex-1 justify-center px-2 py-1.5 text-xs font-medium transition-colors',
            tab === 'links'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link2 className="h-3 w-3" />
          Links
        </button>
        <button
          onClick={() => setTab('graph')}
          className={cn(
            'flex items-center gap-1 flex-1 justify-center px-2 py-1.5 text-xs font-medium transition-colors',
            tab === 'graph'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Network className="h-3 w-3" />
          Graph
        </button>
      </div>

      {/* Panel content */}
      <div className={tab === 'graph' ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto'}>
        {tab === 'links' ? (
          <BacklinksPanel fileId={fileId} />
        ) : (
          <LocalGraph fileId={fileId} />
        )}
      </div>
    </div>
  );
}
