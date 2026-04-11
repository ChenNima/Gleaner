const en = {
  // Common
  loading: 'Loading...',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  retry: 'Retry',
  error: 'Error',
  settings: 'Settings',
  files: 'files',

  // Layout / Nav
  'nav.hideSidebar': 'Hide sidebar',
  'nav.showSidebar': 'Show sidebar',
  'nav.knowledgeGraph': 'Knowledge Graph',
  'nav.settings': 'Settings',
  'nav.hideBacklinks': 'Hide backlinks',
  'nav.showBacklinks': 'Show backlinks',
  'nav.files': 'Files',
  'nav.noBacklinks': 'No backlinks',

  // Theme
  'theme.switchToDark': 'Switch to dark mode',
  'theme.switchToLight': 'Switch to light mode',
  'theme.documentTheme': 'Document theme',

  // Markdown themes
  'mdTheme.github': 'GitHub',
  'mdTheme.github.desc': 'Clean and familiar',
  'mdTheme.obsidian': 'Obsidian',
  'mdTheme.obsidian.desc': 'Dense and wiki-like',
  'mdTheme.academic': 'Academic',
  'mdTheme.academic.desc': 'Serif fonts, paper feel',
  'mdTheme.notion': 'Notion',
  'mdTheme.notion.desc': 'Spacious and modern',
  'mdTheme.newsprint': 'Newsprint',
  'mdTheme.newsprint.desc': 'Classic reading experience',

  // Home
  'home.title': 'Hello Gleaner',
  'home.selectFile': 'Select a file from the sidebar to start reading.',
  'home.noRepos': 'No repositories configured yet.',

  // File page
  'file.goBack': 'Go back',
  'file.goForward': 'Go forward',

  // Markdown viewer
  'md.renderFailed': 'Failed to render markdown.',
  'md.selectFile': 'Select a file to view',
  'md.loadingContent': 'Loading content...',
  'md.copyCode': 'Copy code',

  // File tree
  'tree.noRepos': 'No repositories configured',
  'tree.goToSettings': 'Go to Settings to add a config repo',
  'tree.collapseAll': 'Collapse All',
  'tree.syncing': 'Syncing...',
  'tree.noMdFiles': 'No .md files found',
  'tree.syncFailed': 'Sync failed',

  // Backlinks
  'backlinks.noFile': 'No file selected',
  'backlinks.title': 'Backlinks',
  'backlinks.none': 'No backlinks',
  'backlinks.outgoing': 'Outgoing links',
  'backlinks.noOutgoing': 'No outgoing links',
  'backlinks.external': 'External links',

  // Right panel
  'panel.links': 'Links',
  'panel.graph': 'Graph',

  // Local graph
  'localGraph.noFile': 'No file selected',
  'localGraph.noConnections': 'No connections',

  // Sync status
  'sync.syncing': 'Syncing {{cached}}/{{total}}',
  'sync.errors': '{{count}} error(s)',
  'sync.files': '{{count}} files',
  'sync.refresh': 'Refresh',

  // Offline
  'offline.banner': 'You are offline — cached content is still available',
  'offline.syncDisabled': 'Sync unavailable while offline',

  // Profile switcher
  'profile.fallback': 'Profile',
  'profile.local': 'Local',
  'profile.github': 'GitHub',
  'profile.manage': 'Manage Profiles',

  // Graph page
  'graph.title': 'Graph view',
  'graph.notes': 'notes',
  'graph.links': 'links',
  'graph.external': 'External',
  'graph.noFiles': 'No files synced yet.',
  'graph.goToSettings': 'Go to Settings',
  'graph.externalLinks': 'External links',

  // Settings page
  'settings.title': 'Settings',
  'settings.configuration': 'Configuration',

  // Settings tabs
  'settings.tab.profiles': 'Profiles',
  'settings.tab.repositories': 'Repositories',
  'settings.tab.token': 'Access Token',
  'settings.tab.cache': 'Cache & Data',
  'settings.tab.importExport': 'Import / Export',

  // Profiles tab
  'settings.profiles.title': 'Profiles',
  'settings.profiles.desc': 'Switch between GitHub config repos and local YAML profiles.',
  'settings.profiles.all': 'All profiles',
  'settings.profiles.addLocal': '+ Local',
  'settings.profiles.addGithub': '+ GitHub',
  'settings.profiles.empty': 'No profiles yet. Create one to get started.',
  'settings.profiles.switched': 'Profile switched',
  'settings.profiles.newLocal': 'New Local Profile',
  'settings.profiles.newGithub': 'New GitHub Profile',

  // Repositories tab
  'settings.repos.title': 'Repositories',
  'settings.repos.desc': 'Manage which GitHub repositories are synced in the active profile.',
  'settings.repos.noProfile': 'No active profile. Select one in the Profiles tab.',
  'settings.repos.githubLabel': 'GitHub repo containing',
  'settings.repos.form': 'Form',
  'settings.repos.yaml': 'YAML',
  'settings.repos.listTitle': 'Repositories in this profile',
  'settings.repos.add': 'Add',
  'settings.repos.ownerRepo': 'owner/repo or GitHub URL',
  'settings.repos.label': 'Label',
  'settings.repos.empty': 'No repositories. Click Add to get started.',
  'settings.repos.advanced': 'Advanced',
  'settings.repos.branch': 'Branch',
  'settings.repos.branchPlaceholder': 'default branch',
  'settings.repos.commitLock': 'Pin commit',
  'settings.repos.commitSha': 'Commit SHA',
  'settings.repos.commitAutoHint': 'Will auto-lock on next sync',
  'settings.repos.commitUpdate': 'Update to latest',
  'settings.repos.includePaths': 'Include paths',
  'settings.repos.excludePaths': 'Exclude paths',
  'settings.repos.addPath': 'Add path',
  'settings.repos.pathPlaceholder': 'e.g. docs/',
  'settings.repos.saveSync': 'Save & Sync',
  'settings.repos.saved': 'Saved & syncing...',
  'settings.repos.enterConfigRepo': 'Please enter a config repo URL',
  'error.invalidRepoFormat': 'Invalid repo format: "{{input}}". Enter owner/repo, a GitHub URL, or a git address.',
  'settings.repos.clearCache': 'Clear cache',
  'settings.repos.clearCacheConfirm': 'Clear all cached files and links for {{repo}}?',
  'settings.repos.cacheCleared': 'Cache cleared for {{repo}}.',

  // Token tab
  'settings.token.title': 'Access Token',
  'settings.token.desc': 'Configure a GitHub Personal Access Token for higher API rate limits.',
  'settings.token.optional': 'optional',
  'settings.token.publicOnly': 'public repos only',
  'settings.token.info': "Without a token, you're limited to 60 API requests per hour. A fine-grained PAT with read-only Contents scope increases this to 5,000/hr. Required for private repos.",
  'settings.token.label': 'Personal Access Token',
  'settings.token.placeholder': 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'settings.token.hint': 'Generate at github.com/settings/tokens \u2014 select Fine-grained, read-only Contents.',
  'settings.token.save': 'Save Token',

  // Proxy
  'settings.proxy.label': 'GitHub API Proxy',
  'settings.proxy.info': 'If GitHub API is slow or unreliable in your region, configure a proxy service. All API requests will be routed through it.',
  'settings.proxy.placeholder': 'https://gh-proxy.com',
  'settings.proxy.hint': 'Leave empty to connect directly. The proxy URL will be prepended to all GitHub API requests.',

  // Cache tab
  'settings.cache.title': 'Cache & Data',
  'settings.cache.desc': 'Manage cached content and reset application data.',
  'settings.cache.filesTitle': 'Cached Files',
  'settings.cache.filesDesc': 'Gleaner caches file content locally in IndexedDB for offline access and faster loading. Use the per-repo clear button in the Repositories tab to remove individual repo caches.',
  'settings.cache.filesCached': 'Files cached',
  'settings.cache.linksResolved': 'Links resolved',
  'settings.cache.storageUsed': 'Storage used',
  'settings.pwa.title': 'Install App',
  'settings.pwa.desc': 'Install Gleaner as a standalone app on your device for a full-screen, native-like experience with offline access.',
  'settings.pwa.install': 'Install to Home Screen',
  'settings.pwa.installed': 'App is installed',

  'settings.cache.danger': 'Factory Reset',
  'settings.cache.dangerDesc': 'Permanently erase everything and return to the onboarding screen. This cannot be undone.',
  'settings.cache.dangerList': 'This will delete:',
  'settings.cache.dangerItem1': 'All cached files and parsed links',
  'settings.cache.dangerItem2': 'All profiles and repository configurations',
  'settings.cache.dangerItem3': 'Access token and proxy settings',
  'settings.cache.dangerItem4': 'All preferences and local state',
  'settings.cache.resetAll': 'Reset All Data',
  'settings.cache.resetConfirmLabel': 'Type RESET to confirm',
  'settings.cache.resetConfirmPlaceholder': 'RESET',
  'settings.cache.resetCancel': 'Cancel',
  'settings.cache.resetDone': 'All data erased. Redirecting...',

  // Import / Export tab
  'settings.ie.title': 'Import / Export',
  'settings.ie.desc': 'Transfer profile configurations between devices or back up to GitHub.',
  'settings.ie.importTitle': 'Import Configuration',
  'settings.ie.importDesc': 'Load a gleaner.yaml file from your local machine or pull from a GitHub config repo.',
  'settings.ie.importFile': 'Import from File',
  'settings.ie.importGithub': 'Import from GitHub',
  'settings.ie.importPlaceholder': 'owner/repo (import gleaner.yaml from this repo)',
  'settings.ie.exportTitle': 'Export Configuration',
  'settings.ie.exportDesc': "Download the current profile's configuration as a gleaner.yaml file.",
  'settings.ie.exportYaml': 'Export YAML',
  'settings.ie.importedGithub': 'Imported {{count}} repos from GitHub',
  'settings.ie.importedFile': 'Imported {{count}} repos from file',
  'settings.ie.importFailed': 'Import failed: {{error}}',

  // Onboarding
  'onboard.token.title': 'Connect to GitHub',
  'onboard.token.subtitle': 'A personal access token is recommended for the best experience.',
  'onboard.token.recommended': 'Recommended for all users',
  'onboard.token.recommendedDesc': 'Without a token, GitHub limits API requests to 60/hour — not enough for most repos. A token raises this to 5,000/hour.',
  'onboard.token.secure': 'Your token stays on your device',
  'onboard.token.secureDesc': 'Gleaner is a pure frontend app. Your token is stored locally in the browser and never sent to any server.',
  'onboard.token.readonly': 'Read-only permission is enough',
  'onboard.token.readonlyDesc': 'Create a Fine-grained PAT with read-only Contents scope. No write access needed.',
  'onboard.token.hint': 'Generate at github.com/settings/tokens — select Fine-grained, read-only Contents.',
  'onboard.proxy.label': 'GitHub API Proxy (optional)',
  'onboard.proxy.hint': 'If GitHub API is slow or unreliable in your region, enter a proxy URL. Leave empty to connect directly.',
  'onboard.lang.label': 'Language',
  'onboard.lang.system': 'System',
  'onboard.lang.en': 'English',
  'onboard.lang.zh': '中文',
  'onboard.pwa.title': 'Install as App',
  'onboard.pwa.desc': 'Gleaner is a Progressive Web App. Install it for a full-screen experience with offline access — or just use it in the browser, offline works either way.',
  'onboard.pwa.install': 'Install to Home Screen',
  'onboard.pwa.installed': 'App is installed',
  'onboard.skip': 'Skip for now',
  'onboard.continue': 'Continue',
  'onboard.back': 'Back',
  'onboard.getStarted': 'Get started',
  'onboard.repos.title': 'Set up your library',
  'onboard.repos.subtitle': 'Choose how to configure your repositories.',
  'onboard.repos.recommended': 'Recommended',
  'onboard.repos.quickstart': 'Quick start with docs',
  'onboard.repos.quickstartDesc': 'Load the Gleaner documentation as your first repo — read the docs while using the app.',
  'onboard.repos.local': 'Local configuration',
  'onboard.repos.localDesc': 'Manually add GitHub repositories. Config is stored in your browser.',
  'onboard.repos.github': 'GitHub config repo',
  'onboard.repos.githubDesc': 'Point to a repo containing a gleaner.yaml config file.',
  'onboard.repos.configRepo': 'Config repository',
  'onboard.repos.configRepoHint': 'This repo should contain a gleaner.yaml file at the root.',
  'onboard.repos.noConfigRepo': "Don't have a config repo yet?",
  'onboard.repos.noConfigRepoDesc': 'Download a sample gleaner.yaml, push it to a new GitHub repo, and enter the repo name above.',
  'onboard.repos.downloadYaml': 'Download gleaner.yaml',

  // Search
  'search.title': 'Search',
  'search.placeholder': 'Search files…',
  'search.noResults': 'No results found',
  'search.navigate': 'navigate',
  'search.open': 'open',
  'search.close': 'close',

  // Language
  'settings.tab.language': 'Language',
  'settings.lang.title': 'Language',
  'settings.lang.desc': 'Choose your preferred display language.',
  'settings.lang.en': 'English',
  'settings.lang.zh': '中文',
  'settings.lang.followSystem': 'Follow system language',
} as const;

export default en;
