import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, Lock, KeyRound, Rocket, FolderPlus, GitBranch,
  ArrowRight, ArrowLeft, Download, Plus, X, Check,
} from 'lucide-react';
import { setPat } from '../lib/auth';
import {
  createProfile, updateProfile, switchProfile,
  repoConfigsToYaml, type RepoConfig,
} from '../lib/profile';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { setGithubProxy } from '../lib/github';
import { setLanguage, getLanguageSetting } from '../i18n';

const DOCS_REPO = 'ChenNima/Gleaner-Docs';

const SAMPLE_YAML = `repos:
  - url: ChenNima/Gleaner-Docs
    label: Gleaner Docs
`;

type RepoOption = 'quickstart' | 'local' | 'github';

interface LocalRepo {
  url: string;
  label: string;
}

export default function OnboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [token, setToken] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [lang, setLang] = useState<'en' | 'zh' | 'system'>(getLanguageSetting());

  // Step 2
  const [selectedOption, setSelectedOption] = useState<RepoOption>('quickstart');
  const [localRepos, setLocalRepos] = useState<LocalRepo[]>([{ url: '', label: '' }]);
  const [githubConfigRepo, setGithubConfigRepo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStep1Next = async () => {
    if (token.trim()) {
      await setPat(token.trim());
    }
    if (proxyUrl.trim()) {
      setGithubProxy(proxyUrl.trim());
    }
    setLanguage(lang);
    setStep(2);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (selectedOption === 'quickstart') {
        const profile = await createProfile('Default', 'local');
        const configs: RepoConfig[] = [{ url: DOCS_REPO, label: 'Gleaner Docs' }];
        await updateProfile(profile.id, { yamlContent: repoConfigsToYaml(configs) });
        await switchProfile(profile.id);
      } else if (selectedOption === 'local') {
        const profile = await createProfile('Default', 'local');
        const configs: RepoConfig[] = localRepos
          .filter((r) => r.url.trim())
          .map((r) => ({ url: r.url.trim(), label: r.label.trim() || r.url.trim() }));
        if (configs.length === 0) {
          configs.push({ url: DOCS_REPO, label: 'Gleaner Docs' });
        }
        await updateProfile(profile.id, { yamlContent: repoConfigsToYaml(configs) });
        await switchProfile(profile.id);
      } else {
        const profile = await createProfile('Default', 'github');
        await updateProfile(profile.id, { githubRepo: githubConfigRepo.trim() });
        await switchProfile(profile.id);
      }
      navigate('/', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  const downloadSampleYaml = () => {
    const blob = new Blob([SAMPLE_YAML], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gleaner.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addLocalRepo = () => setLocalRepos([...localRepos, { url: '', label: '' }]);
  const removeLocalRepo = (i: number) => setLocalRepos(localRepos.filter((_, idx) => idx !== i));
  const updateLocalRepo = (i: number, field: 'url' | 'label', value: string) => {
    const next = [...localRepos];
    next[i] = { ...next[i], [field]: value };
    setLocalRepos(next);
  };

  const canFinish =
    selectedOption === 'quickstart' ||
    (selectedOption === 'local' && localRepos.some((r) => r.url.trim())) ||
    (selectedOption === 'github' && githubConfigRepo.trim());

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between h-11 px-3 border-b shrink-0">
        <span className="text-sm font-semibold text-foreground">Gleaner</span>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={cn('h-2 w-2 rounded-full', step === 1 ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <div className="h-0.5 w-8 rounded bg-muted-foreground/20" />
            <div className={cn('h-2 w-2 rounded-full', step === 2 ? 'bg-primary' : 'bg-muted-foreground/30')} />
          </div>

          {step === 1 ? (
            <Step1
              token={token}
              setToken={setToken}
              proxyUrl={proxyUrl}
              setProxyUrl={setProxyUrl}
              lang={lang}
              setLang={setLang}
              onNext={handleStep1Next}
              t={t}
            />
          ) : (
            <Step2
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              localRepos={localRepos}
              addLocalRepo={addLocalRepo}
              removeLocalRepo={removeLocalRepo}
              updateLocalRepo={updateLocalRepo}
              githubConfigRepo={githubConfigRepo}
              setGithubConfigRepo={setGithubConfigRepo}
              downloadSampleYaml={downloadSampleYaml}
              canFinish={!!canFinish}
              saving={saving}
              onBack={() => setStep(1)}
              onFinish={handleFinish}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Token ─── */

function Step1({ token, setToken, proxyUrl, setProxyUrl, lang, setLang, onNext, t }: {
  token: string;
  setToken: (v: string) => void;
  proxyUrl: string;
  setProxyUrl: (v: string) => void;
  lang: 'en' | 'zh' | 'system';
  setLang: (v: 'en' | 'zh' | 'system') => void;
  onNext: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">{t('onboard.token.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('onboard.token.subtitle')}</p>
      </div>

      {/* Info cards */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <InfoRow icon={ShieldCheck} title={t('onboard.token.recommended')} desc={t('onboard.token.recommendedDesc')} />
        <InfoRow icon={Lock} title={t('onboard.token.secure')} desc={t('onboard.token.secureDesc')} />
        <InfoRow icon={KeyRound} title={t('onboard.token.readonly')} desc={t('onboard.token.readonlyDesc')} />
      </div>

      {/* Token input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('settings.token.label')}</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
        />
        <p className="text-xs text-muted-foreground">
          {t('onboard.token.hint')}
        </p>
      </div>

      {/* Proxy input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('onboard.proxy.label')}</label>
        <input
          type="text"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          placeholder="https://gh-proxy.com"
          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          {t('onboard.proxy.hint')}
        </p>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('onboard.lang.label')}</label>
        <div className="flex gap-2">
          {(['system', 'en', 'zh'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => { setLang(opt); setLanguage(opt); }}
              className={cn(
                'flex-1 px-3 py-2 text-sm border rounded-md transition-colors',
                lang === opt
                  ? 'border-primary bg-primary/5 text-foreground font-medium'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/30'
              )}
            >
              {t(`onboard.lang.${opt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onNext}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('onboard.skip')}
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t('onboard.continue')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Step 2: Repo Config ─── */

function Step2({
  selectedOption, setSelectedOption,
  localRepos, addLocalRepo, removeLocalRepo, updateLocalRepo,
  githubConfigRepo, setGithubConfigRepo,
  downloadSampleYaml,
  canFinish, saving,
  onBack, onFinish,
  t,
}: {
  selectedOption: RepoOption;
  setSelectedOption: (v: RepoOption) => void;
  localRepos: LocalRepo[];
  addLocalRepo: () => void;
  removeLocalRepo: (i: number) => void;
  updateLocalRepo: (i: number, field: 'url' | 'label', value: string) => void;
  githubConfigRepo: string;
  setGithubConfigRepo: (v: string) => void;
  downloadSampleYaml: () => void;
  canFinish: boolean;
  saving: boolean;
  onBack: () => void;
  onFinish: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">{t('onboard.repos.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('onboard.repos.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {/* Option 1: Quick Start */}
        <OptionCard
          selected={selectedOption === 'quickstart'}
          onClick={() => setSelectedOption('quickstart')}
          icon={Rocket}
          title={t('onboard.repos.quickstart')}
          desc={t('onboard.repos.quickstartDesc')}
          badge={t('onboard.repos.recommended')}
        />

        {/* Option 2: Local Config */}
        <OptionCard
          selected={selectedOption === 'local'}
          onClick={() => setSelectedOption('local')}
          icon={FolderPlus}
          title={t('onboard.repos.local')}
          desc={t('onboard.repos.localDesc')}
        >
          {selectedOption === 'local' && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {localRepos.map((repo, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={repo.url}
                    onChange={(e) => updateLocalRepo(i, 'url', e.target.value)}
                    placeholder="owner/repo"
                    className="flex-1 px-2.5 py-1.5 text-xs border rounded bg-background outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    value={repo.label}
                    onChange={(e) => updateLocalRepo(i, 'label', e.target.value)}
                    placeholder={t('settings.repos.label')}
                    className="w-28 px-2.5 py-1.5 text-xs border rounded bg-background outline-none focus:ring-1 focus:ring-ring"
                  />
                  {localRepos.length > 1 && (
                    <button onClick={() => removeLocalRepo(i)} className="p-1 rounded hover:bg-accent text-muted-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addLocalRepo}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <Plus className="h-3 w-3" />
                {t('settings.repos.add')}
              </button>
            </div>
          )}
        </OptionCard>

        {/* Option 3: GitHub Config */}
        <OptionCard
          selected={selectedOption === 'github'}
          onClick={() => setSelectedOption('github')}
          icon={GitBranch}
          title={t('onboard.repos.github')}
          desc={t('onboard.repos.githubDesc')}
        >
          {selectedOption === 'github' && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">{t('onboard.repos.configRepo')}</label>
                <input
                  value={githubConfigRepo}
                  onChange={(e) => setGithubConfigRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="w-full px-2.5 py-1.5 text-xs border rounded bg-background outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground">{t('onboard.repos.configRepoHint')}</p>
              </div>
              <div className="rounded border bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">{t('onboard.repos.noConfigRepo')}</p>
                <p className="text-[11px] text-muted-foreground">{t('onboard.repos.noConfigRepoDesc')}</p>
                <button
                  onClick={downloadSampleYaml}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t('onboard.repos.downloadYaml')}
                </button>
              </div>
            </div>
          )}
        </OptionCard>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('onboard.back')}
        </button>
        <button
          onClick={onFinish}
          disabled={!canFinish || saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? t('loading') : t('onboard.getStarted')}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function OptionCard({
  selected, onClick, icon: Icon, title, desc, badge, children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Rocket;
  title: string;
  desc: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border p-4 cursor-pointer transition-colors',
        selected ? 'border-primary bg-card ring-1 ring-primary' : 'border-border bg-card hover:border-muted-foreground/30'
      )}
    >
      <div className="flex gap-3">
        <div className={cn(
          'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
          selected ? 'bg-primary/10' : 'bg-muted'
        )}>
          <Icon className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{badge}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <div className={cn(
          'shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        )}>
          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>
      {children}
    </div>
  );
}
