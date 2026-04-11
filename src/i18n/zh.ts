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
  'nav.backToArticle': '返回文章',
  'nav.settings': '设置',
  'nav.hideBacklinks': '隐藏反向链接',
  'nav.showBacklinks': '显示反向链接',
  'nav.files': '文件',
  'nav.noBacklinks': '无反向链接',

  // Theme
  'theme.switchToDark': '切换到深色模式',
  'theme.switchToLight': '切换到浅色模式',
  'theme.documentTheme': '文档主题',
  'theme.darkMode': '深色模式',

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

  // Offline
  'offline.banner': '当前处于离线模式 — 已缓存内容仍可浏览',
  'offline.syncDisabled': '离线时无法同步',

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
  'settings.repos.ownerRepo': '所有者/仓库名 或 GitHub 地址',
  'settings.repos.label': '标签',
  'settings.repos.empty': '暂无仓库。点击添加来开始。',
  'settings.repos.advanced': '高级配置',
  'settings.repos.branch': '分支',
  'settings.repos.branchPlaceholder': '默认分支',
  'settings.repos.commitLock': '锁定版本',
  'settings.repos.commitSha': 'Commit SHA',
  'settings.repos.commitAutoHint': '下次同步时自动锁定',
  'settings.repos.commitUpdate': '更新到最新',
  'settings.repos.includePaths': '包含路径',
  'settings.repos.excludePaths': '排除路径',
  'settings.repos.addPath': '添加路径',
  'settings.repos.pathPlaceholder': '例如 docs/',
  'settings.repos.saveSync': '保存并同步',
  'settings.repos.saved': '已保存，同步中...',
  'settings.repos.enterConfigRepo': '请输入配置仓库地址',
  'error.invalidRepoFormat': '仓库格式无效："{{input}}"。请输入 owner/repo、GitHub 网址或 git 地址。',
  'settings.repos.clearCache': '清除缓存',
  'settings.repos.clearCacheConfirm': '确认清除 {{repo}} 的所有缓存文件和链接？',
  'settings.repos.cacheCleared': '{{repo}} 的缓存已清除。',

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
  'settings.proxy.placeholder': 'https://gh-proxy.com',
  'settings.proxy.hint': '留空则直连 GitHub。代理地址会作为前缀添加到所有 GitHub API 请求中。',

  // Cache tab
  'settings.cache.title': '缓存与数据',
  'settings.cache.desc': '管理缓存内容和重置应用数据。',
  'settings.cache.filesTitle': '已缓存文件',
  'settings.cache.filesDesc': 'Gleaner 将文件内容缓存到本地 IndexedDB 中，以支持离线访问和快速加载。可在"仓库"选项卡中按仓库清除缓存。',
  'settings.cache.filesCached': '已缓存文件',
  'settings.cache.linksResolved': '已解析链接',
  'settings.cache.storageUsed': '存储占用',
  'settings.pwa.title': '安装应用',
  'settings.pwa.desc': '将 Gleaner 安装为独立应用，获得全屏、无浏览器 UI 干扰的原生体验，支持离线访问。',
  'settings.pwa.install': '安装到主屏幕',
  'settings.pwa.installed': '应用已安装',

  'settings.cache.danger': '恢复出厂设置',
  'settings.cache.dangerDesc': '永久清除所有数据并返回引导页面。此操作不可撤销。',
  'settings.cache.dangerList': '将删除以下内容：',
  'settings.cache.dangerItem1': '所有缓存文件和已解析链接',
  'settings.cache.dangerItem2': '所有配置文件和仓库设置',
  'settings.cache.dangerItem3': '访问令牌和代理设置',
  'settings.cache.dangerItem4': '所有偏好设置和本地状态',
  'settings.cache.resetAll': '重置所有数据',
  'settings.cache.resetConfirmLabel': '输入 RESET 以确认',
  'settings.cache.resetConfirmPlaceholder': 'RESET',
  'settings.cache.resetCancel': '取消',
  'settings.cache.resetDone': '所有数据已清除，正在跳转...',

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

  // Onboarding
  'onboard.token.title': '连接 GitHub',
  'onboard.token.subtitle': '建议配置个人访问令牌以获得最佳体验。',
  'onboard.token.recommended': '建议所有用户配置',
  'onboard.token.recommendedDesc': '不配置令牌时，GitHub API 请求限制为 60 次/小时——对大多数仓库来说不够用。配置后可提升至 5,000 次/小时。',
  'onboard.token.secure': '令牌仅存储在本地',
  'onboard.token.secureDesc': 'Gleaner 是纯前端应用，令牌保存在浏览器本地数据库中，不会发送到任何服务器。',
  'onboard.token.readonly': '只读权限即可',
  'onboard.token.readonlyDesc': '创建 Fine-grained PAT，只需 Contents 只读权限，无需写入权限。',
  'onboard.token.hint': '在 github.com/settings/tokens 生成——选择 Fine-grained，只读 Contents 权限。',
  'onboard.proxy.label': 'GitHub API 代理（可选）',
  'onboard.proxy.hint': '如果 GitHub API 访问不稳定，可以配置代理地址。留空则直连。',
  'onboard.lang.label': '界面语言',
  'onboard.lang.system': '跟随系统',
  'onboard.lang.en': 'English',
  'onboard.lang.zh': '中文',
  'onboard.pwa.title': '安装为应用',
  'onboard.pwa.desc': 'Gleaner 是一个渐进式 Web 应用 (PWA)。安装后可获得全屏体验和离线访问 — 也可以直接在浏览器中使用，离线功能同样可用。',
  'onboard.pwa.install': '安装到主屏幕',
  'onboard.pwa.installed': '应用已安装',
  'onboard.skip': '暂时跳过',
  'onboard.continue': '继续',
  'onboard.back': '返回',
  'onboard.getStarted': '开始使用',
  'onboard.repos.title': '配置你的知识库',
  'onboard.repos.subtitle': '选择仓库配置方式。',
  'onboard.repos.recommended': '推荐',
  'onboard.repos.quickstart': '使用文档快速开始',
  'onboard.repos.quickstartDesc': '加载 Gleaner 文档作为第一个仓库——边用边看文档。',
  'onboard.repos.local': '本地配置',
  'onboard.repos.localDesc': '手动添加 GitHub 仓库，配置保存在浏览器中。',
  'onboard.repos.github': 'GitHub 配置仓库',
  'onboard.repos.githubDesc': '指向一个包含 gleaner.yaml 配置文件的仓库。',
  'onboard.repos.configRepo': '配置仓库',
  'onboard.repos.configRepoHint': '该仓库根目录下需要有 gleaner.yaml 文件。',
  'onboard.repos.noConfigRepo': '还没有配置仓库？',
  'onboard.repos.noConfigRepoDesc': '下载示例 gleaner.yaml，推送到新的 GitHub 仓库，然后在上方输入仓库名。',
  'onboard.repos.downloadYaml': '下载 gleaner.yaml',

  // Search
  'search.title': '搜索',
  'search.placeholder': '搜索文件…',
  'search.noResults': '未找到结果',
  'search.navigate': '导航',
  'search.open': '打开',
  'search.close': '关闭',

  // Language
  'settings.tab.language': '语言',
  'settings.lang.title': '语言',
  'settings.lang.desc': '选择您偏好的界面显言。',
  'settings.lang.en': 'English',
  'settings.lang.zh': '中文',
  'settings.lang.followSystem': '跟随系统语言',
} as const;

export default zh;
