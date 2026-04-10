**中文** | [English](./README.md)

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
