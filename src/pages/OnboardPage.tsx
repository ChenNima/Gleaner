import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, Lock, KeyRound, Rocket, FolderPlus, GitBranch,
  ArrowRight, ArrowLeft, Download, Plus, X, Check, Smartphone,
  BookOpen, Link2,
} from 'lucide-react';
import { setPat } from '../lib/auth';
import {
  createProfile, updateProfile, switchProfile,
  repoConfigsToYaml, type RepoConfig,
} from '../lib/profile';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { setGithubProxy, normalizeRepoSlug } from '../lib/github';
import { setLanguage, getLanguageSetting } from '../i18n';
import { canInstall, isInstalled, installPWA, onInstallChange } from '../lib/pwa';

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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [token, setToken] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [lang, setLang] = useState<'en' | 'zh' | 'system'>(getLanguageSetting());

  // Step 2
  const [selectedOption, setSelectedOption] = useState<RepoOption>('quickstart');
  const [localRepos, setLocalRepos] = useState<LocalRepo[]>([{ url: '', label: '' }]);
  const [githubConfigRepo, setGithubConfigRepo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleWelcomeNext = () => {
    setLanguage(lang);
    setStep(2);
  };

  const handleTokenNext = async () => {
    if (token.trim()) {
      await setPat(token.trim());
    }
    if (proxyUrl.trim()) {
      setGithubProxy(proxyUrl.trim());
    }
    setStep(3);
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
          .map((r) => ({ url: normalizeRepoSlug(r.url), label: r.label.trim() || r.url.trim() }));
        if (configs.length === 0) {
          configs.push({ url: DOCS_REPO, label: 'Gleaner Docs' });
        }
        await updateProfile(profile.id, { yamlContent: repoConfigsToYaml(configs) });
        await switchProfile(profile.id);
      } else {
        const profile = await createProfile('Default', 'github');
        await updateProfile(profile.id, { githubRepo: normalizeRepoSlug(githubConfigRepo) });
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
    <div className="flex flex-col h-dvh bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between h-11 px-3 border-b shrink-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <img src="/gleaner.png" alt="Gleaner" className="h-5 w-5" />
          Gleaner
        </span>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/ChenNima/Gleaner"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-accent text-muted-foreground text-xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="hidden sm:inline">ChenNima/Gleaner</span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={cn('h-2 w-2 rounded-full', step === 1 ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <div className="h-0.5 w-8 rounded bg-muted-foreground/20" />
            <div className={cn('h-2 w-2 rounded-full', step === 2 ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <div className="h-0.5 w-8 rounded bg-muted-foreground/20" />
            <div className={cn('h-2 w-2 rounded-full', step === 3 ? 'bg-primary' : 'bg-muted-foreground/30')} />
          </div>

          {step === 1 ? (
            <Welcome
              lang={lang}
              setLang={setLang}
              onNext={handleWelcomeNext}
              t={t}
            />
          ) : step === 2 ? (
            <Step1
              token={token}
              setToken={setToken}
              proxyUrl={proxyUrl}
              setProxyUrl={setProxyUrl}
              onBack={() => setStep(1)}
              onNext={handleTokenNext}
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
              onBack={() => setStep(2)}
              onFinish={handleFinish}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Welcome: Introduction ─── */

function Welcome({ lang, setLang, onNext, t }: {
  lang: 'en' | 'zh' | 'system';
  setLang: (v: 'en' | 'zh' | 'system') => void;
  onNext: () => void;
  t: (key: string) => string;
}) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    return onInstallChange(() => forceUpdate((n) => n + 1));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero with logo */}
      <div className="text-center space-y-4">
        <img src="/gleaner.png" alt="Gleaner" className="h-20 w-20 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('onboard.welcome.title')}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t('onboard.welcome.subtitle')}</p>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <InfoRow icon={BookOpen} color="text-amber-600" title={t('onboard.welcome.feature1')} desc={t('onboard.welcome.feature1Desc')} />
        <InfoRow icon={Link2} color="text-blue-600" title={t('onboard.welcome.feature2')} desc={t('onboard.welcome.feature2Desc')} />
        <InfoRow icon={ShieldCheck} color="text-green-600" title={t('onboard.welcome.feature3')} desc={t('onboard.welcome.feature3Desc')} />
      </div>

      {/* PWA Install */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <Smartphone className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('onboard.pwa.title')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('onboard.pwa.desc')}</p>
          </div>
        </div>
        {canInstall() ? (
          <button
            onClick={() => installPWA()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            {t('onboard.pwa.install')}
          </button>
        ) : isInstalled() ? (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            <span>{t('onboard.pwa.installed')}</span>
          </div>
        ) : null}
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

      {/* Action */}
      <div className="flex items-center justify-center">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t('onboard.continue')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 1: Token ─── */

function Step1({ token, setToken, proxyUrl, setProxyUrl, onBack, onNext, t }: {
  token: string;
  setToken: (v: string) => void;
  proxyUrl: string;
  setProxyUrl: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">{t('onboard.token.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('onboard.token.subtitle')}</p>
      </div>

      {/* Info cards */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <InfoRow icon={ShieldCheck} color="text-amber-600" title={t('onboard.token.recommended')} desc={t('onboard.token.recommendedDesc')} />
        <InfoRow icon={Lock} color="text-green-600" title={t('onboard.token.secure')} desc={t('onboard.token.secureDesc')} />
        <InfoRow icon={KeyRound} color="text-blue-600" title={t('onboard.token.readonly')} desc={t('onboard.token.readonlyDesc')} />
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('onboard.back')}
        </button>
        <div className="flex items-center gap-3">
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
    </div>
  );
}

function InfoRow({ icon: Icon, color, title, desc }: { icon: typeof ShieldCheck; color?: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5">
        <Icon className={cn('h-4 w-4', color ?? 'text-primary')} />
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
          color="text-amber-600"
          title={t('onboard.repos.quickstart')}
          desc={t('onboard.repos.quickstartDesc')}
          badge={t('onboard.repos.recommended')}
        />

        {/* Option 2: Local Config */}
        <OptionCard
          selected={selectedOption === 'local'}
          onClick={() => setSelectedOption('local')}
          icon={FolderPlus}
          color="text-green-600"
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
          color="text-blue-600"
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
  selected, onClick, icon: Icon, color, title, desc, badge, children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Rocket;
  color?: string;
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
          <Icon className={cn('h-4 w-4', color ?? (selected ? 'text-primary' : 'text-muted-foreground'))} />
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
