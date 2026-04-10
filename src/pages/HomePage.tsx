import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfigRepo, syncConfig } from '../lib/config';
import { syncAllRepos } from '../lib/sync';
import { useAppStore } from '../stores/app';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const repos = useAppStore((s) => s.repos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const configRepo = await getConfigRepo();
      if (!configRepo) {
        navigate('/settings', { replace: true });
        return;
      }

      setLoading(false);

      // Background sync
      try {
        const synced = await syncConfig();
        useAppStore.getState().setRepos(synced);
        syncAllRepos((repo) => {
          useAppStore.getState().updateRepo(repo.fullName, repo);
        });
      } catch {
        // Config might be stale, still show what we have
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Hello Gleaner</h1>
      <p className="text-muted-foreground">
        {repos.length > 0
          ? 'Select a file from the sidebar to start reading.'
          : 'No repositories configured yet.'}
      </p>
    </div>
  );
}
