import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/app';

export function SyncStatus({ onRefresh }: { onRefresh?: () => void }) {
  const repos = useAppStore((s) => s.repos);
  const { t } = useTranslation();

  const syncing = repos.filter((r) => r.syncStatus === 'syncing');
  const errors = repos.filter((r) => r.syncStatus === 'error');
  const totalCached = repos.reduce((sum, r) => sum + r.cachedFiles, 0);
  const totalFiles = repos.reduce((sum, r) => sum + r.totalFiles, 0);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {syncing.length > 0 ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{t('sync.syncing', { cached: totalCached, total: totalFiles })}</span>
        </>
      ) : errors.length > 0 ? (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          <span>{t('sync.errors', { count: errors.length })}</span>
        </>
      ) : repos.length > 0 ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{t('sync.files', { count: totalFiles })}</span>
        </>
      ) : null}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1 rounded hover:bg-accent"
          title={t('sync.refresh')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
