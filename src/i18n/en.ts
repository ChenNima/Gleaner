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
  'settings.repos.ownerRepo': 'owner/repo',
  'settings.repos.label': 'Label',
  'settings.repos.empty': 'No repositories. Click Add to get started.',
  'settings.repos.saveSync': 'Save & Sync',
  'settings.repos.saved': 'Saved & syncing...',
  'settings.repos.enterConfigRepo': 'Please enter a config repo URL',

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
  'settings.proxy.placeholder': 'https://ghproxy.vip',
  'settings.proxy.hint': 'Leave empty to connect directly. The proxy URL will be prepended to all GitHub API requests.',

  // Cache tab
  'settings.cache.title': 'Cache & Data',
  'settings.cache.desc': 'Manage cached content and reset application data.',
  'settings.cache.filesTitle': 'Cached Files',
  'settings.cache.filesDesc': 'Gleaner caches file content locally in IndexedDB for offline access and faster loading. Clearing the cache will re-download all files on next sync.',
  'settings.cache.filesCached': 'Files cached',
  'settings.cache.linksResolved': 'Links resolved',
  'settings.cache.storageUsed': 'Storage used',
  'settings.cache.clear': 'Clear Cache',
  'settings.cache.cleared': 'Cache cleared.',
  'settings.cache.danger': 'Danger Zone',
  'settings.cache.dangerDesc': 'This will permanently delete all cached data, profiles, tokens, and preferences. This action cannot be undone.',
  'settings.cache.resetAll': 'Reset All Data',
  'settings.cache.resetDone': 'All data reset.',

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

  // Language
  'settings.tab.language': 'Language',
  'settings.lang.title': 'Language',
  'settings.lang.desc': 'Choose your preferred display language.',
  'settings.lang.en': 'English',
  'settings.lang.zh': '中文',
  'settings.lang.followSystem': 'Follow system language',
} as const;

export default en;
