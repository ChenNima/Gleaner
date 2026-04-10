import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getActiveProfile, switchProfile } from '../lib/profile';
import { useAppStore } from '../stores/app';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const repos = useAppStore((s) => s.repos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await getActiveProfile();
      if (!profile) {
        navigate('/onboard', { replace: true });
        return;
      }

      setLoading(false);

      // Background sync via profile system
      try {
        await switchProfile(profile.id);
      } catch {
        // Config might be stale, still show what we have
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-semibold text-foreground">{t('home.title')}</h1>
      <p className="text-muted-foreground">
        {repos.length > 0 ? t('home.selectFile') : t('home.noRepos')}
      </p>
    </div>
  );
}
