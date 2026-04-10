import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Loader2, Plus, X, GripVertical,
  Globe, HardDrive, Check, Pencil, Code, List, Download, Upload, FileUp,
  User, BookOpen, Key, Database,
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

type SettingsTab = 'profiles' | 'repositories' | 'token' | 'cache' | 'import-export';

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profiles', label: 'Profiles', icon: User },
  { id: 'repositories', label: 'Repositories', icon: BookOpen },
  { id: 'token', label: 'Access Token', icon: Key },
  { id: 'cache', label: 'Cache & Data', icon: Database },
  { id: 'import-export', label: 'Import / Export', icon: FileUp },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SettingsTab>('profiles');
  const [profiles, setProfilesList] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [pat, setPatValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const [cacheStats, setCacheStats] = useState({ files: 0, links: 0 });

  useEffect(() => {
    (async () => {
      const all = await getProfiles();
      const active = await getActiveProfile();
      setProfilesList(all);
      setActiveProfileState(active);
      if (active) loadProfileEditor(active);
      const token = await getPat();
      if (token) setPatValue(token);
      const fileCount = await db.files.count();
      const linkCount = await db.links.count();
      setCacheStats({ files: fileCount, links: linkCount });
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
    const fileCount = await db.files.count();
    const linkCount = await db.links.count();
    setCacheStats({ files: fileCount, links: linkCount });
  }

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

  async function handleSave() {
    if (!activeProfile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (pat.trim()) await setPat(pat.trim());
      else await clearPat();

      if (activeProfile.type === 'github') {
        if (!githubRepo.trim()) { setError('Please enter a config repo URL'); setSaving(false); return; }
        await updateProfile(activeProfile.id, { githubRepo: githubRepo.trim() });
      } else {
        const yamlContent = editorTab === 'yaml' ? yamlText : repoConfigsToYaml(localRepos);
        await updateProfile(activeProfile.id, { yamlContent });
      }
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

  function handleTabSwitch(t: 'form' | 'yaml') {
    if (t === 'yaml' && editorTab === 'form') {
      setYamlText(repoConfigsToYaml(localRepos));
      setYamlError(null);
    } else if (t === 'form' && editorTab === 'yaml') {
      try { setLocalRepos(parseLocalYaml(yamlText)); setYamlError(null); } catch { /* keep form state */ }
    }
    setEditorTab(t);
  }

  function handleYamlChange(text: string) {
    setYamlText(text);
    try { parseLocalYaml(text); setYamlError(null); } catch (e) { setYamlError(e instanceof Error ? e.message : 'Invalid YAML'); }
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

  function addRepo() { setLocalRepos([...localRepos, { url: '', label: '' }]); }
  function updateRepo(idx: number, field: 'url' | 'label', value: string) {
    const next = [...localRepos];
    next[idx] = { ...next[idx], [field]: value };
    setLocalRepos(next);
  }
  function removeRepo(idx: number) { setLocalRepos(localRepos.filter((_, i) => i !== idx)); }
  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...localRepos];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setLocalRepos(next);
    setDragIdx(idx);
  }
  function handleDragEnd() { setDragIdx(null); }

  async function handleClearCache() {
    await db.files.clear();
    await db.links.clear();
    await db.repos.toCollection().modify({ treeSha: null, cachedFiles: 0, syncStatus: 'idle' });
    useAppStore.getState().setRepos(await db.repos.toArray());
    useAppStore.getState().clearFileTree();
    await refreshProfiles();
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
    setCacheStats({ files: 0, links: 0 });
    setSuccess('All data reset.');
  }

  const repos = useAppStore((s) => s.repos);

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <header className="flex items-center justify-between h-11 px-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="p-1.5 rounded hover:bg-accent text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Settings</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0 border-r bg-sidebar-background p-4 space-y-1 hidden md:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Configuration</p>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 w-full px-2.5 py-2 text-sm rounded-md transition-colors',
                tab === t.id
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="flex md:hidden border-b overflow-x-auto shrink-0 bg-background absolute top-11 left-0 right-0 z-10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors',
                tab === t.id
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent text-muted-foreground'
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto md:pt-0 pt-10">
          <div className="max-w-3xl px-6 md:px-10 py-8 space-y-6">
            {/* Alerts */}
            {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
            {success && <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-md">{success}</div>}

            {tab === 'profiles' && <ProfilesTab
              profiles={profiles}
              activeProfile={activeProfile}
              editingName={editingName}
              newName={newName}
              saving={saving}
              onSelect={handleSelectProfile}
              onCreate={handleCreateProfile}
              onRename={handleRenameProfile}
              onDelete={handleDeleteProfile}
              onEditStart={(id, name) => { setEditingName(id); setNewName(name); }}
              onNameChange={setNewName}
            />}

            {tab === 'repositories' && <RepositoriesTab
              activeProfile={activeProfile}
              githubRepo={githubRepo}
              localRepos={localRepos}
              editorTab={editorTab}
              yamlText={yamlText}
              yamlError={yamlError}
              dragIdx={dragIdx}
              repos={repos}
              onGithubRepoChange={setGithubRepo}
              onTabSwitch={handleTabSwitch}
              onYamlChange={handleYamlChange}
              onAddRepo={addRepo}
              onUpdateRepo={updateRepo}
              onRemoveRepo={removeRepo}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onSave={handleSave}
              saving={saving}
            />}

            {tab === 'token' && <TokenTab pat={pat} onPatChange={setPatValue} onSave={handleSave} saving={saving} />}

            {tab === 'cache' && <CacheTab stats={cacheStats} onClearCache={handleClearCache} onResetAll={handleResetAll} />}

            {tab === 'import-export' && <ImportExportTab
              importGithubUrl={importGithubUrl}
              importing={importing}
              onImportGithubUrlChange={setImportGithubUrl}
              onImportFromGithub={handleImportFromGithub}
              onImportFromFile={handleImportFromFile}
              onExport={handleExport}
            />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Tab Components ============ */

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border rounded-lg bg-card', className)}>{children}</div>;
}

/* -- Profiles Tab -- */
function ProfilesTab({ profiles, activeProfile, editingName, newName, saving, onSelect, onCreate, onRename, onDelete, onEditStart, onNameChange }: {
  profiles: Profile[];
  activeProfile: Profile | null;
  editingName: string | null;
  newName: string;
  saving: boolean;
  onSelect: (id: string) => void;
  onCreate: (type: 'local' | 'github') => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onEditStart: (id: string, name: string) => void;
  onNameChange: (name: string) => void;
}) {
  return (
    <>
      <SectionHeader title="Profiles" desc="Switch between GitHub config repos and local YAML profiles." />
      <hr className="border-border" />
      <Card>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All profiles</span>
          <div className="flex gap-1">
            <button onClick={() => onCreate('local')} className="flex items-center gap-1 px-2.5 py-1 text-xs border rounded-md hover:bg-accent">
              <HardDrive className="h-3 w-3" /> + Local
            </button>
            <button onClick={() => onCreate('github')} className="flex items-center gap-1 px-2.5 py-1 text-xs border rounded-md hover:bg-accent">
              <Globe className="h-3 w-3" /> + GitHub
            </button>
          </div>
        </div>
        {profiles.map((p) => {
          const isActive = p.id === activeProfile?.id;
          return (
            <div
              key={p.id}
              className={cn(
                'flex items-center justify-between px-5 py-3 border-b last:border-b-0 transition-colors',
                isActive ? 'bg-accent/50' : 'hover:bg-accent/30 cursor-pointer'
              )}
              onClick={() => !isActive && !saving && onSelect(p.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                {!isActive && <div className="w-3.5 shrink-0" />}
                {editingName === p.id ? (
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => onNameChange(e.target.value)}
                    onBlur={() => onRename(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && onRename(p.id)}
                    className="text-sm bg-transparent border-b border-primary outline-none w-40"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm truncate">{p.name}</span>
                )}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                  p.type === 'local'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                )}>
                  {p.type}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditStart(p.id, p.name); }}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
        {profiles.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No profiles yet. Create one to get started.</p>
        )}
      </Card>
    </>
  );
}

/* -- Repositories Tab -- */
function RepositoriesTab({ activeProfile, githubRepo, localRepos, editorTab, yamlText, yamlError, dragIdx, repos, onGithubRepoChange, onTabSwitch, onYamlChange, onAddRepo, onUpdateRepo, onRemoveRepo, onDragStart, onDragOver, onDragEnd, onSave, saving }: {
  activeProfile: Profile | null;
  githubRepo: string;
  localRepos: RepoConfig[];
  editorTab: 'form' | 'yaml';
  yamlText: string;
  yamlError: string | null;
  dragIdx: number | null;
  repos: any[];
  onGithubRepoChange: (v: string) => void;
  onTabSwitch: (t: 'form' | 'yaml') => void;
  onYamlChange: (v: string) => void;
  onAddRepo: () => void;
  onUpdateRepo: (idx: number, field: 'url' | 'label', value: string) => void;
  onRemoveRepo: (idx: number) => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDragEnd: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!activeProfile) return <p className="text-sm text-muted-foreground">No active profile. Select one in the Profiles tab.</p>;

  return (
    <>
      <SectionHeader title="Repositories" desc="Manage which GitHub repositories are synced in the active profile." />
      <hr className="border-border" />

      {activeProfile.type === 'github' ? (
        <Card className="p-5 space-y-3">
          <label className="text-xs font-medium text-muted-foreground">
            GitHub repo containing <code className="bg-muted px-1 rounded">gleaner.yaml</code>
          </label>
          <input
            type="text"
            value={githubRepo}
            onChange={(e) => onGithubRepoChange(e.target.value)}
            placeholder="owner/repo"
            className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => onTabSwitch('form')}
                className={cn('flex items-center gap-1 px-3 py-1.5 text-xs', editorTab === 'form' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              >
                <List className="h-3 w-3" /> Form
              </button>
              <button
                onClick={() => onTabSwitch('yaml')}
                className={cn('flex items-center gap-1 px-3 py-1.5 text-xs', editorTab === 'yaml' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              >
                <Code className="h-3 w-3" /> YAML
              </button>
            </div>
          </div>

          {editorTab === 'yaml' ? (
            <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>}>
              <YamlEditor value={yamlText} onChange={onYamlChange} error={yamlError} />
            </Suspense>
          ) : (
            <Card>
              <div className="px-5 py-3 border-b flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repositories in this profile</span>
                <button onClick={onAddRepo} className="flex items-center gap-1 px-2.5 py-1 text-xs border rounded-md hover:bg-accent">
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {localRepos.map((repo, idx) => {
                const syncInfo = repos.find((r) => r.fullName === repo.url);
                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 border-b last:border-b-0',
                      dragIdx === idx && 'opacity-50'
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                    <div className="flex items-center gap-2 shrink-0">
                      {syncInfo?.syncStatus === 'done' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      {syncInfo?.syncStatus === 'syncing' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      {syncInfo?.syncStatus === 'error' && <div className="w-2 h-2 rounded-full bg-destructive" />}
                      {!syncInfo && <div className="w-2 h-2 rounded-full bg-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={repo.url}
                        onChange={(e) => onUpdateRepo(idx, 'url', e.target.value)}
                        placeholder="owner/repo"
                        className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                      />
                      {syncInfo && (
                        <span className="text-[11px] text-muted-foreground">{syncInfo.cachedFiles}/{syncInfo.totalFiles} files</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={repo.label}
                      onChange={(e) => onUpdateRepo(idx, 'label', e.target.value)}
                      placeholder="Label"
                      className="w-24 text-sm text-right bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                    <button onClick={() => onRemoveRepo(idx)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {localRepos.length === 0 && (
                <p className="px-5 py-6 text-sm text-muted-foreground text-center">No repositories. Click Add to get started.</p>
              )}
            </Card>
          )}
        </>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save & Sync
      </button>
    </>
  );
}

/* -- Token Tab -- */
function TokenTab({ pat, onPatChange, onSave, saving }: {
  pat: string;
  onPatChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <SectionHeader title="Access Token" desc="Configure a GitHub Personal Access Token for higher API rate limits." />
      <hr className="border-border" />
      <Card className="p-5 space-y-4">
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">optional</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">public repos only</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Without a token, you're limited to 60 API requests per hour. A fine-grained PAT with read-only Contents scope increases this to 5,000/hr. Required for private repos.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Personal Access Token</label>
          <div className="flex items-center gap-2 border rounded-md bg-muted/30 px-3 py-2">
            <Key className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="password"
              value={pat}
              onChange={(e) => onPatChange(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Generate at github.com/settings/tokens — select Fine-grained, read-only Contents.</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Token
        </button>
      </Card>
    </>
  );
}

/* -- Cache & Data Tab -- */
function CacheTab({ stats, onClearCache, onResetAll }: {
  stats: { files: number; links: number };
  onClearCache: () => void;
  onResetAll: () => void;
}) {
  return (
    <>
      <SectionHeader title="Cache & Data" desc="Manage cached content and reset application data." />
      <hr className="border-border" />
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Cached Files</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Gleaner caches file content locally in IndexedDB for offline access and faster loading. Clearing the cache will re-download all files on next sync.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-xl font-bold">{stats.files.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">Files cached</div>
          </div>
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-xl font-bold">{stats.links.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">Links resolved</div>
          </div>
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="text-xl font-bold">—</div>
            <div className="text-[11px] text-muted-foreground">Storage used</div>
          </div>
        </div>
        <button
          onClick={onClearCache}
          className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-accent"
        >
          <Trash2 className="h-4 w-4" /> Clear Cache
        </button>
      </Card>

      <Card className="p-5 space-y-3 border-destructive/50">
        <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This will permanently delete all cached data, profiles, tokens, and preferences. This action cannot be undone.
        </p>
        <button
          onClick={onResetAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
        >
          <Trash2 className="h-4 w-4" /> Reset All Data
        </button>
      </Card>
    </>
  );
}

/* -- Import / Export Tab -- */
function ImportExportTab({ importGithubUrl, importing, onImportGithubUrlChange, onImportFromGithub, onImportFromFile, onExport }: {
  importGithubUrl: string;
  importing: boolean;
  onImportGithubUrlChange: (v: string) => void;
  onImportFromGithub: () => void;
  onImportFromFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}) {
  return (
    <>
      <SectionHeader title="Import / Export" desc="Transfer profile configurations between devices or back up to GitHub." />
      <hr className="border-border" />

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Import Configuration</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Load a gleaner.yaml file from your local machine or pull from a GitHub config repo.
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-accent cursor-pointer">
            <Upload className="h-4 w-4" /> Import from File
            <input type="file" accept=".yaml,.yml" onChange={onImportFromFile} className="hidden" />
          </label>
          <button
            onClick={onImportFromGithub}
            disabled={importing || !importGithubUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Import from GitHub
          </button>
        </div>
        <input
          type="text"
          value={importGithubUrl}
          onChange={(e) => onImportGithubUrlChange(e.target.value)}
          placeholder="owner/repo (import gleaner.yaml from this repo)"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Export Configuration</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Download the current profile's configuration as a gleaner.yaml file.
        </p>
        <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-accent">
          <Download className="h-4 w-4" /> Export YAML
        </button>
      </Card>
    </>
  );
}
