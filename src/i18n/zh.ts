const zh = {
  // Common
  loading: '加载中...',
  save: '保存',
  cancel: '取消',
  delete: '删除',
  retry: '重试',
  error: '错误',
  settings: '设置',
  files: '文件',

  // Layout / Nav
  'nav.hideSidebar': '隐藏侧边栏',
  'nav.showSidebar': '显示侧边栏',
  'nav.knowledgeGraph': '知识图谱',
  'nav.settings': '设置',
  'nav.hideBacklinks': '隐藏反向链接',
  'nav.showBacklinks': '显示反向链接',
  'nav.files': '文件',
  'nav.noBacklinks': '无反向链接',

  // Theme
  'theme.switchToDark': '切换到深色模式',
  'theme.switchToLight': '切换到浅色模式',
  'theme.documentTheme': '文档主题',

  // Markdown themes
  'mdTheme.github': 'GitHub',
  'mdTheme.github.desc': '简洁熟悉',
  'mdTheme.obsidian': 'Obsidian',
  'mdTheme.obsidian.desc': '紧凑的维基风格',
  'mdTheme.academic': '学术',
  'mdTheme.academic.desc': '衬线字体，纸质质感',
  'mdTheme.notion': 'Notion',
  'mdTheme.notion.desc': '宽敞现代',
  'mdTheme.newsprint': '报纸',
  'mdTheme.newsprint.desc': '经典阅读体验',

  // Home
  'home.title': 'Hello Gleaner',
  'home.selectFile': '从侧边栏选择一个文件开始阅读。',
  'home.noRepos': '尚未配置任何仓库。',

  // File page
  'file.goBack': '后退',
  'file.goForward': '前进',

  // Markdown viewer
  'md.renderFailed': 'Markdown 渲染失败。',
  'md.selectFile': '选择一个文件查看',
  'md.loadingContent': '加载内容中...',
  'md.copyCode': '复制代码',

  // File tree
  'tree.noRepos': '未配置仓库',
  'tree.goToSettings': '前往设置添加配置仓库',
  'tree.collapseAll': '全部折叠',
  'tree.syncing': '同步中...',
  'tree.noMdFiles': '未找到 .md 文件',
  'tree.syncFailed': '同步失败',

  // Backlinks
  'backlinks.noFile': '未选择文件',
  'backlinks.title': '反向链接',
  'backlinks.none': '无反向链接',
  'backlinks.outgoing': '出链',
  'backlinks.noOutgoing': '无出链',
  'backlinks.external': '外部链接',

  // Right panel
  'panel.links': '链接',
  'panel.graph': '图谱',

  // Local graph
  'localGraph.noFile': '未选择文件',
  'localGraph.noConnections': '无连接',

  // Sync status
  'sync.syncing': '同步中 {{cached}}/{{total}}',
  'sync.errors': '{{count}} 个错误',
  'sync.files': '{{count}} 个文件',
  'sync.refresh': '刷新',

  // Profile switcher
  'profile.fallback': '配置',
  'profile.local': '本地',
  'profile.github': 'GitHub',
  'profile.manage': '管理配置',

  // Graph page
  'graph.title': '图谱视图',
  'graph.notes': '笔记',
  'graph.links': '链接',
  'graph.external': '外部',
  'graph.noFiles': '尚未同步任何文件。',
  'graph.goToSettings': '前往设置',
  'graph.externalLinks': '外部链接',

  // Settings page
  'settings.title': '设置',
  'settings.configuration': '配置',

  // Settings tabs
  'settings.tab.profiles': '配置文件',
  'settings.tab.repositories': '仓库',
  'settings.tab.token': '访问令牌',
  'settings.tab.cache': '缓存与数据',
  'settings.tab.importExport': '导入/导出',

  // Profiles tab
  'settings.profiles.title': '配置文件',
  'settings.profiles.desc': '在 GitHub 配置仓库和本地 YAML 配置之间切换。',
  'settings.profiles.all': '所有配置',
  'settings.profiles.addLocal': '+ 本地',
  'settings.profiles.addGithub': '+ GitHub',
  'settings.profiles.empty': '暂无配置。创建一个来开始使用。',
  'settings.profiles.switched': '已切换配置',
  'settings.profiles.newLocal': '新建本地配置',
  'settings.profiles.newGithub': '新建 GitHub 配置',

  // Repositories tab
  'settings.repos.title': '仓库',
  'settings.repos.desc': '管理当前配置中要同步的 GitHub 仓库。',
  'settings.repos.noProfile': '无活动配置。请先在"配置文件"选项卡中选择一个。',
  'settings.repos.githubLabel': '包含以下文件的 GitHub 仓库',
  'settings.repos.form': '表单',
  'settings.repos.yaml': 'YAML',
  'settings.repos.listTitle': '此配置中的仓库',
  'settings.repos.add': '添加',
  'settings.repos.ownerRepo': '所有者/仓库名',
  'settings.repos.label': '标签',
  'settings.repos.empty': '暂无仓库。点击添加来开始。',
  'settings.repos.saveSync': '保存并同步',
  'settings.repos.saved': '已保存，同步中...',
  'settings.repos.enterConfigRepo': '请输入配置仓库地址',

  // Token tab
  'settings.token.title': '访问令牌',
  'settings.token.desc': '配置 GitHub 个人访问令牌以获取更高的 API 速率限制。',
  'settings.token.optional': '可选',
  'settings.token.publicOnly': '仅公开仓库',
  'settings.token.info': '未配置令牌时，API 请求限制为每小时 60 次。配置具有只读 Contents 权限的细粒度 PAT 可将限制提升至 5,000 次/小时。访问私有仓库必须配置。',
  'settings.token.label': '个人访问令牌',
  'settings.token.placeholder': 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'settings.token.hint': '在 github.com/settings/tokens 生成——选择 Fine-grained，只读 Contents 权限。',
  'settings.token.save': '保存令牌',

  // Proxy
  'settings.proxy.label': 'GitHub API 代理',
  'settings.proxy.info': '如果 GitHub API 在您所在地区访问缓慢或不稳定，可以配置代理服务。所有 API 请求将通过代理转发。',
  'settings.proxy.placeholder': 'https://ghproxy.vip',
  'settings.proxy.hint': '留空则直连 GitHub。代理地址会作为前缀添加到所有 GitHub API 请求中。',

  // Cache tab
  'settings.cache.title': '缓存与数据',
  'settings.cache.desc': '管理缓存内容和重置应用数据。',
  'settings.cache.filesTitle': '已缓存文件',
  'settings.cache.filesDesc': 'Gleaner 将文件内容缓存到本地 IndexedDB 中，以支持离线访问和快速加载。清除缓存将在下次同步时重新下载所有文件。',
  'settings.cache.filesCached': '已缓存文件',
  'settings.cache.linksResolved': '已解析链接',
  'settings.cache.storageUsed': '存储占用',
  'settings.cache.clear': '清除缓存',
  'settings.cache.cleared': '缓存已清除。',
  'settings.cache.danger': '危险区域',
  'settings.cache.dangerDesc': '此操作将永久删除所有缓存数据、配置文件、令牌和偏好设置。此操作不可撤销。',
  'settings.cache.resetAll': '重置所有数据',
  'settings.cache.resetDone': '所有数据已重置。',

  // Import / Export tab
  'settings.ie.title': '导入/导出',
  'settings.ie.desc': '在设备之间传输配置或备份到 GitHub。',
  'settings.ie.importTitle': '导入配置',
  'settings.ie.importDesc': '从本地文件加载 gleaner.yaml 或从 GitHub 配置仓库拉取。',
  'settings.ie.importFile': '从文件导入',
  'settings.ie.importGithub': '从 GitHub 导入',
  'settings.ie.importPlaceholder': '所有者/仓库名（从此仓库导入 gleaner.yaml）',
  'settings.ie.exportTitle': '导出配置',
  'settings.ie.exportDesc': '将当前配置导出为 gleaner.yaml 文件下载。',
  'settings.ie.exportYaml': '导出 YAML',
  'settings.ie.importedGithub': '已从 GitHub 导入 {{count}} 个仓库',
  'settings.ie.importedFile': '已从文件导入 {{count}} 个仓库',
  'settings.ie.importFailed': '导入失败：{{error}}',

  // Language
  'settings.tab.language': '语言',
  'settings.lang.title': '语言',
  'settings.lang.desc': '选择您偏好的界面显言。',
  'settings.lang.en': 'English',
  'settings.lang.zh': '中文',
  'settings.lang.followSystem': '跟随系统语言',
} as const;

export default zh;
