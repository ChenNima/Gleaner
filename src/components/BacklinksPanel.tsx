import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowDownLeft, ArrowUpRight, Globe } from 'lucide-react';
import { getBacklinks, getOutgoingLinks, getExternalLinks } from '../lib/wikilink-parser';
import type { MdFile } from '../db';

interface BacklinksPanelProps {
  fileId: string | null;
}

interface BacklinkEntry {
  source: MdFile;
  context: string;
}

interface OutgoingEntry {
  target: MdFile;
  title: string;
}

interface ExternalEntry {
  title: string;
  url: string;
}

export function BacklinksPanel({ fileId }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingEntry[]>([]);
  const [external, setExternal] = useState<ExternalEntry[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!fileId) {
      setBacklinks([]);
      setOutgoing([]);
      setExternal([]);
      return;
    }
    getBacklinks(fileId).then(setBacklinks);
    getOutgoingLinks(fileId).then(setOutgoing);
    getExternalLinks(fileId).then(setExternal);
  }, [fileId]);

  if (!fileId) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        {t('backlinks.noFile')}
      </div>
    );
  }

  const navigateToFile = (file: MdFile) => {
    const [owner, repo] = file.repoFullName.split('/');
    navigate(`/repo/${owner}/${repo}/${file.path}`);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Backlinks (incoming) */}
      <div>
        <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          <ArrowDownLeft className="h-3 w-3" />
          {t('backlinks.title')} {backlinks.length > 0 && `(${backlinks.length})`}
        </h3>
        {backlinks.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-4">{t('backlinks.none')}</p>
        ) : (
          <div className="space-y-1">
            {backlinks.map((bl) => (
              <button
                key={bl.source.id}
                onClick={() => navigateToFile(bl.source)}
                className="flex items-center gap-1 w-full text-left px-2 py-1 rounded hover:bg-accent text-xs"
              >
                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{bl.source.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing links */}
      <div>
        <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          <ArrowUpRight className="h-3 w-3" />
          {t('backlinks.outgoing')} {outgoing.length > 0 && `(${outgoing.length})`}
        </h3>
        {outgoing.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-4">{t('backlinks.noOutgoing')}</p>
        ) : (
          <div className="space-y-1">
            {outgoing.map((ol) => (
              <button
                key={ol.target.id}
                onClick={() => navigateToFile(ol.target)}
                className="flex items-center gap-1 w-full text-left px-2 py-1 rounded hover:bg-accent text-xs"
              >
                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{ol.target.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* External links */}
      {external.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Globe className="h-3 w-3" />
            {t('backlinks.external')} ({external.length})
          </h3>
          <div className="space-y-1">
            {external.map((el) => (
              <a
                key={el.url}
                href={el.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 w-full text-left px-2 py-1 rounded hover:bg-accent text-xs"
              >
                <Globe className="h-3 w-3 shrink-0 text-amber-500" />
                <span className="truncate">{el.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
