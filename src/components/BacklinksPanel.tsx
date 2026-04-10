import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { getBacklinks } from '../lib/wikilink-parser';
import type { MdFile } from '../db';

interface BacklinksPanelProps {
  fileId: string | null;
}

interface BacklinkEntry {
  source: MdFile;
  context: string;
}

export function BacklinksPanel({ fileId }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!fileId) {
      setBacklinks([]);
      return;
    }
    getBacklinks(fileId).then(setBacklinks);
  }, [fileId]);

  if (!fileId) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No file selected
      </div>
    );
  }

  if (backlinks.length === 0) {
    return (
      <div className="p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Backlinks
        </h3>
        <p className="text-xs text-muted-foreground">No backlinks found</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Backlinks ({backlinks.length})
      </h3>
      <div className="space-y-2">
        {backlinks.map((bl) => {
          const [owner, repo] = bl.source.repoFullName.split('/');
          return (
            <button
              key={bl.source.id}
              onClick={() => navigate(`/repo/${owner}/${repo}/${bl.source.path}`)}
              className="flex flex-col gap-0.5 w-full text-left p-2 rounded hover:bg-accent text-xs"
            >
              <div className="flex items-center gap-1 text-foreground font-medium">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">{bl.source.title}</span>
              </div>
              <span className="text-muted-foreground truncate pl-4">
                {bl.source.repoFullName}
              </span>
              <span className="text-muted-foreground line-clamp-2 pl-4">
                {bl.context}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
