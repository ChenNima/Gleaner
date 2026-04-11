import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/app';

export function OfflineBar() {
  const isOnline = useAppStore((s) => s.isOnline);
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-medium border-b border-amber-500/20 shrink-0">
      <WifiOff className="h-3.5 w-3.5" />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
