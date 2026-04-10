[中文](#中文) | **English**

# Gleaner

A read-only knowledge base reader that turns GitHub repositories into an Obsidian-like browsing experience — directly in your browser.

![Reading view](./screenshots/reading.png)

## Features

- **Markdown rendering** — GFM, code highlighting, inline HTML, `<video>` support
- **`[[Wikilinks]]`** — Bidirectional links with backlink tracking and cross-repo resolution
- **Knowledge graph** — Interactive force-directed visualization of note relationships
- **Cmd+K search** — Instant full-text search across all cached files
- **Multi-repo** — Aggregate multiple GitHub repositories into a single reading interface
- **Profiles** — Switch between different repo configurations (local YAML or GitHub-hosted)
- **Advanced repo config** — Branch selection, commit pinning, include/exclude path filters
- **Offline capable** — Content cached in IndexedDB, reads work without network
- **i18n** — English and Chinese interface
- **Dark mode** — System-aware theme with 5 document styles (GitHub, Obsidian, Academic, Notion, Newsprint)
- **GitHub API proxy** — Configurable proxy for regions with restricted access
- **Pure frontend** — No backend, no server, no data leaves your browser

![Knowledge graph](./screenshots/graph.png)

## Quick Start

Visit a deployed instance, or run locally:

```bash
git clone https://github.com/ChenNima/Gleaner.git
cd Gleaner
pnpm install
pnpm run dev
```

The onboarding wizard walks you through token setup and repo configuration.

![Onboarding](./screenshots/onboard.png)

## Configuration

Repositories are configured through a `gleaner.yaml` file:

```yaml
repos:
  - url: ChenNima/Gleaner-Docs
    label: Gleaner Docs
  - url: my-org/wiki
    label: Team Wiki
    branch: develop
    commit: pin
    includePaths:
      - docs/
    excludePaths:
      - docs/drafts/
```

See the [documentation](https://github.com/ChenNima/Gleaner-Docs) for details.

## Tech Stack

Vite + React 19 + TypeScript · Zustand · IndexedDB (Dexie.js) · Tailwind CSS 4 + shadcn/ui · unified (remark/rehype) · react-force-graph-2d · Playwright

## License

MIT

---

<a id="中文"></a>

**中文** | [English](#gleaner)

# Gleaner

将 GitHub 仓库变成类似 Obsidian 的阅读体验——直接在浏览器中使用。

![阅读界面](./screenshots/reading.png)

## 功能

- **Markdown 渲染** — GFM、代码高亮、内嵌 HTML、`<video>` 支持
- **`[[双向链接]]`** — 反向链接追踪，跨仓库解析
- **知识图谱** — 交互式力导向图，可视化笔记关系
- **Cmd+K 搜索** — 本地全文即时搜索
- **多仓库聚合** — 将多个 GitHub 仓库整合到同一个阅读界面
- **配置文件** — 在不同仓库配置间切换（本地 YAML 或 GitHub 托管）
- **仓库高级配置** — 分支选择、版本锁定、路径包含/排除
- **离线可用** — 内容缓存在 IndexedDB，无网络也能阅读
- **中英双语** — 界面支持中文和英文
- **暗色模式** — 跟随系统，5 种文档主题（GitHub、Obsidian、学术、Notion、报纸）
- **GitHub API 代理** — 为网络受限地区配置代理
- **纯前端** — 无后端，无服务器，数据不离开浏览器

![知识图谱](./screenshots/graph.png)

## 快速开始

访问部署实例，或本地运行：

```bash
git clone https://github.com/ChenNima/Gleaner.git
cd Gleaner
pnpm install
pnpm run dev
```

首次使用会进入引导流程，完成 Token 配置和仓库设置。

![引导流程](./screenshots/onboard.png)

## 配置

通过 `gleaner.yaml` 配置仓库：

```yaml
repos:
  - url: ChenNima/Gleaner-Docs
    label: Gleaner 文档
  - url: my-org/wiki
    label: 团队 Wiki
    branch: develop
    commit: pin
    includePaths:
      - docs/
    excludePaths:
      - docs/drafts/
```

详见[使用文档](https://github.com/ChenNima/Gleaner-Docs)。

## 技术栈

Vite + React 19 + TypeScript · Zustand · IndexedDB (Dexie.js) · Tailwind CSS 4 + shadcn/ui · unified (remark/rehype) · react-force-graph-2d · Playwright

## 许可证

MIT
