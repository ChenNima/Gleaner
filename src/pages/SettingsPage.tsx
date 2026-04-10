import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Loader2, Plus, X, GripVertical,
  Globe, HardDrive, Check, Pencil, Code, List, Download, Upload, FileUp,
} from 'lucide-react';

const YamlEditor = lazy(() => import('../components/YamlEditor').then((m) => ({ default: m.YamlEditor })));
import { getPat, setPat, clearPat } from '../lib/auth';
import {
  getProfiles, getActiveProfile, createProfile, updateProfile,
  deleteProfile, switchProfile, parseLocalYaml, repoConfigsToYaml,
  importFromGithub, importFromYamlString, exportAsYamlFile,
  type RepoConfig,
} from '../lib/profile';
import type { Profile } from '../db';
import { useAppStore } from '../stores/app';
import { ThemeToggle } from '../components/ThemeToggle';
import { db } from '../db';
import { resetHydration } from '../lib/hydrate';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [profiles, setProfilesList] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [pat, setPatValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile editor state
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [localRepos, setLocalRepos] = useState<RepoConfig[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [editorTab, setEditorTab] = useState<'form' | 'yaml'>('form');
  const [yamlText, setYamlText] = useState('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [importGithubUrl, setImportGithubUrl] = useState('');
  const [importing, setImporting] = useState(false);

  // Load data
  useEffect(() => {
    (async () => {
      const all = await getProfiles();
      const active = await getActiveProfile();
      setProfilesList(all);
      setActiveProfileState(active);
      if (active) loadProfileEditor(active);
      const token = await getPat();
      if (token) setPatValue(token);
    })();
  }, []);

  function loadProfileEditor(profile: Profile) {
    if (profile.type === 'github') {
      setGithubRepo(profile.githubRepo ?? '');
    } else {
      const content = profile.yamlContent ?? 'repos: []\n';
      const repos = parseLocalYaml(content);
      setLocalRepos(repos);
      setYamlText(content);
      setYamlError(null);
    }
  }

  async function refreshProfiles() {
    const all = await getProfiles();
    const active = await getActiveProfile();
    setProfilesList(all);
    setActiveProfileState(active);
    useAppStore.getState().setProfiles(all);
    if (active) {
      useAppStore.getState().setActiveProfileId(active.id);
      loadProfileEditor(active);
    }
  }

  // Profile CRUD
  async function handleCreateProfile(type: 'local' | 'github') {
    const name = type === 'local' ? 'New Local Profile' : 'New GitHub Profile';
    const profile = await createProfile(name, type);
    await switchProfile(profile.id);
    await refreshProfiles();
    setEditingName(profile.id);
    setNewName(name);
  }

  async function handleRenameProfile(id: string) {
    if (!newName.trim()) return;
    await updateProfile(id, { name: newName.trim() });
    setEditingName(null);
    await refreshProfiles();
  }

  async function handleDeleteProfile(id: string) {
    try {
      await deleteProfile(id);
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSelectProfile(id: string) {
    setSaving(true);
    setError(null);
    try {
      await switchProfile(id);
      await refreshProfiles();
      setSuccess('Profile switched');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  // Save & Sync
  async function handleSave() {
    if (!activeProfile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Save PAT
      if (pat.trim()) {
        await setPat(pat.trim());
      } else {
        await clearPat();
      }

      // Save profile config
      if (activeProfile.type === 'github') {
        if (!githubRepo.trim()) {
          setError('Please enter a config repo URL');
          setSaving(false);
          return;
        }
        await updateProfile(activeProfile.id, { githubRepo: githubRepo.trim() });
      } else {
        const yamlContent = editorTab === 'yaml' ? yamlText : repoConfigsToYaml(localRepos);
        await updateProfile(activeProfile.id, { yamlContent });
      }

      // Switch profile to trigger sync
      await switchProfile(activeProfile.id);
      await refreshProfiles();
      setSuccess('Saved & syncing...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  // Local repo editor
  // Sync form → yaml when switching to yaml tab
  function handleTabSwitch(tab: 'form' | 'yaml') {
    if (tab === 'yaml' && editorTab === 'form') {
      setYamlText(repoConfigsToYaml(localRepos));
      setYamlError(null);
    } else if (tab === 'form' && editorTab === 'yaml') {
      try {
        const parsed = parseLocalYaml(yamlText);
        setLocalRepos(parsed);
        setYamlError(null);
      } catch {
        // Keep current form state if YAML is invalid
      }
    }
    setEditorTab(tab);
  }

  function handleYamlChange(text: string) {
    setYamlText(text);
    try {
      parseLocalYaml(text);
      setYamlError(null);
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : 'Invalid YAML');
    }
  }

  async function handleImportFromGithub() {
    if (!importGithubUrl.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const repos = await importFromGithub(importGithubUrl.trim());
      setLocalRepos(repos);
      setYamlText(repoConfigsToYaml(repos));
      setSuccess(`Imported ${repos.length} repos from GitHub`);
      setImportGithubUrl('');
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  }

  function handleImportFromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const repos = importFromYamlString(content);
        setLocalRepos(repos);
        setYamlText(content);
        setYamlError(null);
        setSuccess(`Imported ${repos.length} repos from file`);
      } catch (err) {
        setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleExport() {
    const configs = editorTab === 'yaml' ? parseLocalYaml(yamlText) : localRepos;
    exportAsYamlFile(configs);
  }

  function addRepo() {
    setLocalRepos([...localRepos, { url: '', label: '' }]);
  }

  function updateRepo(idx: number, field: 'url' | 'label', value: string) {
    const next = [...localRepos];
    next[idx] = { ...next[idx], [field]: value };
    setLocalRepos(next);
  }

  function removeRepo(idx: number) {
    setLocalRepos(localRepos.filter((_, i) => i !== idx));
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...localRepos];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setLocalRepos(next);
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  // Clear / Reset
  async function handleClearCache() {
    await db.files.clear();
    await db.links.clear();
    await db.repos.toCollection().modify({ treeSha: null, cachedFiles: 0, syncStatus: 'idle' });
    useAppStore.getState().setRepos(await db.repos.toArray());
    useAppStore.getState().clearFileTree();
    setSuccess('Cache cleared.');
  }

  async function handleResetAll() {
    await db.delete();
    await db.open();
    resetHydration();
    useAppStore.getState().setRepos([]);
    useAppStore.getState().clearFileTree();
    useAppStore.getState().setProfiles([]);
    useAppStore.getState().setActiveProfileId(null);
    setProfilesList([]);
    setActiveProfileState(null);
    setGithubRepo('');
    setLocalRepos([]);
    setPatValue('');
    setSuccess('All data reset.');
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between h-11 px-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-1.5 rounded hover:bg-accent text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Settings</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

          {/* Profiles Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Profiles</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCreateProfile('local')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border rounded-md hover:bg-accent"
                >
                  <HardDrive className="h-3 w-3" /> + Local
                </button>
                <button
                  onClick={() => handleCreateProfile('github')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border rounded-md hover:bg-accent"
                >
                  <Globe className="h-3 w-3" /> + GitHub
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile?.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md border cursor-pointer transition-colors',
                      isActive ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    )}
                    onClick={() => !isActive && handleSelectProfile(p.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {editingName === p.id ? (
                        <input
                          autoFocus
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => handleRenameProfile(p.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameProfile(p.id)}
                          className="text-sm bg-transparent border-b border-primary outline-none w-32"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm truncate">{p.name}</span>
                      )}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                        p.type === 'local'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      )}>
                        {p.type === 'local' ? 'Local' : 'GitHub'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingName(p.id); setNewName(p.name); }}
                        className="p-1 rounded hover:bg-accent text-muted-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Active Profile Editor */}
          {activeProfile && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">
                Configure: {activeProfile.name}
              </h2>

              {activeProfile.type === 'github' ? (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    GitHub repo containing <code className="bg-muted px-1 rounded">gleaner.yaml</code>
                  </label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="owner/repo"
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Repositories</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <button
                        onClick={() => handleTabSwitch('form')}
                        className={cn('flex items-center gap-1 px-2 py-1 text-xs', editorTab === 'form' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                      >
                        <List className="h-3 w-3" /> Form
                      </button>
                      <button
                        onClick={() => handleTabSwitch('yaml')}
                        className={cn('flex items-center gap-1 px-2 py-1 text-xs', editorTab === 'yaml' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                      >
                        <Code className="h-3 w-3" /> YAML
                      </button>
                    </div>
                  </div>

                  {editorTab === 'yaml' ? (
                    <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>}>
                      <YamlEditor value={yamlText} onChange={handleYamlChange} error={yamlError} />
                    </Suspense>
                  ) : (
                  <>
                  <div className="space-y-1">
                    {localRepos.map((repo, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'flex items-center gap-2 p-2 border rounded-md bg-background',
                          dragIdx === idx && 'opacity-50'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                        <input
                          type="text"
                          value={repo.url}
                          onChange={(e) => updateRepo(idx, 'url', e.target.value)}
                          placeholder="owner/repo"
                          className="flex-1 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          type="text"
                          value={repo.label}
                          onChange={(e) => updateRepo(idx, 'label', e.target.value)}
                          placeholder="Label"
                          className="w-28 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                          onClick={() => removeRepo(idx)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addRepo}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-dashed rounded-md hover:bg-accent text-muted-foreground w-full justify-center"
                  >
                    <Plus className="h-3 w-3" /> Add Repository
                  </button>
                  </>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Import / Export (for local profiles) */}
          {activeProfile?.type === 'local' && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Import / Export</h2>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-accent cursor-pointer">
                  <FileUp className="h-3 w-3" /> Import from File
                  <input type="file" accept=".yaml,.yml" onChange={handleImportFromFile} className="hidden" />
                </label>
                <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-accent">
                  <Download className="h-3 w-3" /> Export YAML
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importGithubUrl}
                  onChange={(e) => setImportGithubUrl(e.target.value)}
                  placeholder="owner/repo (import gleaner.yaml)"
                  className="flex-1 px-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={handleImportFromGithub}
                  disabled={importing}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-accent disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Import from GitHub
                </button>
              </div>
            </section>
          )}

          {/* PAT */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Personal Access Token <span className="text-muted-foreground font-normal">(optional, global)</span></h2>
            <p className="text-xs text-muted-foreground">For private repos and higher API rate limits (5000/hr vs 60/hr).</p>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPatValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Error / Success */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-md">{success}</div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save & Sync
            </button>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" /> Clear Cache
            </button>
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-destructive text-destructive rounded-md hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Reset All Data
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
