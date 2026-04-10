import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { getConfigRepo, setConfigRepo, syncConfig } from '../lib/config';
import { getPat, setPat, clearPat } from '../lib/auth';
import { syncAllRepos } from '../lib/sync';
import { useAppStore } from '../stores/app';
import { useThemeStore } from '../stores/theme';
import { ThemeToggle } from '../components/ThemeToggle';
import { db } from '../db';
import { resetHydration } from '../lib/hydrate';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [configRepoUrl, setConfigRepoUrl] = useState('');
  const [pat, setPatValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const setRepos = useAppStore((s) => s.setRepos);

  useEffect(() => {
    (async () => {
      const repo = await getConfigRepo();
      if (repo) setConfigRepoUrl(repo);
      const token = await getPat();
      if (token) setPatValue(token);
    })();
  }, []);

  const handleSave = async () => {
    if (!configRepoUrl.trim()) {
      setError('Please enter a config repo URL (e.g., owner/repo)');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save config repo
      await setConfigRepo(configRepoUrl.trim());

      // Save PAT if provided
      if (pat.trim()) {
        await setPat(pat.trim());
      } else {
        await clearPat();
      }

      // Sync config and repos
      const repos = await syncConfig();
      setRepos(repos);

      // Start background sync
      syncAllRepos((repo) => {
        useAppStore.getState().updateRepo(repo.fullName, repo);
      });

      setSuccess(`Syncing ${repos.length} repositories...`);

      // Navigate to home after a short delay
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    await db.files.clear();
    await db.links.clear();
    await db.repos.toCollection().modify({ treeSha: null, cachedFiles: 0, syncStatus: 'idle' });
    useAppStore.getState().setRepos(await db.repos.toArray());
    useAppStore.getState().clearFileTree();
    setSuccess('Cache cleared. Repos will re-sync on next Save & Sync.');
  };

  const handleResetAll = async () => {
    await db.delete();
    await db.open();
    resetHydration();
    useAppStore.getState().setRepos([]);
    useAppStore.getState().clearFileTree();
    setConfigRepoUrl('');
    setPatValue('');
    setSuccess('All data reset.');
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between h-11 px-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Settings</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Config Repo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Config Repository</label>
            <p className="text-xs text-muted-foreground">
              GitHub repo containing your <code className="bg-muted px-1 rounded">gleaner.yaml</code> config file.
            </p>
            <input
              type="text"
              value={configRepoUrl}
              onChange={(e) => setConfigRepoUrl(e.target.value)}
              placeholder="owner/repo"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* PAT */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Personal Access Token <span className="text-muted-foreground">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground">
              For private repos and higher API rate limits (5000/hr vs 60/hr).
            </p>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPatValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground capitalize">
                {useThemeStore.getState().theme} mode
              </span>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-md">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save & Sync
            </button>

            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </button>

            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-destructive text-destructive rounded-md hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
