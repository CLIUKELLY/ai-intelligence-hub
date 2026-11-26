# 又整啥了 · There Goes AI Again

**看看 AI 又整啥了，然后回去做自己的事。**

[English](README.md) · **简体中文**

[开始阅读](https://cliukelly.github.io/there-goes-ai-again/) · [每日更新流程](#每日更新) · [本地运行](#本地运行)

[![There Goes AI Again · Build & Deploy](https://github.com/CLIUKELLY/there-goes-ai-again/actions/workflows/daily-update.yml/badge.svg?branch=main)](https://github.com/CLIUKELLY/there-goes-ai-again/actions/workflows/daily-update.yml)

一个从个人阅读需求出发的中英文 AI 新闻网站：把自己关心的模型、产品与开发工具进展，整理成有原始来源、有阅读结构、每天愿意打开的一页，也分享给有同样困扰的人。

## 为什么做这个站

AI 变化太快，我有时也会担心自己跟不上。

已经有不少好用的新闻工具，但我关心的内容常常散在不同的信息流里。社交媒体能帮我发现新东西，不过，原本只是想看一条 AI 动态，最后却可能刷了很久。花了时间，也未必更清楚今天发生了什么。

我也在尝试用已有的 AI 工具订阅和定时任务整理每日信息。它们能帮忙收集内容，但我还想要一个更舒服的阅读入口：有原始链接，有清楚的层次，也有一点自己的 taste。

于是做了「又整啥了」，把每天想看的 AI 动态，整理到一个读起来舒服的网站里。

## 它提供什么

**一份聚焦的每日阅读，让你有足够的上下文，判断哪些变化值得继续点开。**

- **内容有取舍**：关注模型、产品和开发工具的具体进展，合并重复报道，以事件组织信息。
- **信息有层次**：把原始来源、摘要、编辑解读和待验证的问题放在一起，方便自己判断。
- **按自己的节奏阅读**：浏览每日精选，打开原始来源，再深入自己感兴趣的内容。

保持好奇，找到有用的东西，然后回去做自己的事。

## 关注什么

内容聚焦 **模型与可用能力、AI 产品、开发工具、Agent 工程，以及推理和部署基础设施**。与这些领域直接相关的开源发布、安全发现和商业变化，也会进入新闻流。

中国与全球进展采用同一套编辑流程，选题依据公开的[编辑配置](config/focus-profile.json)。目前所有读者看到同一份精选新闻流，尚不提供逐人定制的推荐。

每条新闻分开回答：

| 内容层次 | 回答的问题 |
| --- | --- |
| 摘要 | 谁发布了什么？目前可以怎样使用？ |
| 更新要点 | 相比之前，具体发生了什么变化？ |
| 实际意义 | 对使用、开发或部署有什么实际影响？ |
| 待验证的问题 | 哪个具体问题还需要证据？ |
| 来源与验证 | 可以去哪里核对原始信息？ |

优先使用官方公告、文档、官方仓库和原始研究；在条件允许时补充独立报道，提供背景和交叉佐证。单一官方来源会如实标注，同一机构的多个页面不等于独立核验。

## 阅读体验

- 全屏每日精选，引导进入可搜索的新闻列表与详情。
- 互动放大镜揭示新闻关键词，沙粒背景带有轻微起伏。
- 按**首次收录时间**筛选 24 小时、3 天或 7 天的内容；新闻原始发布时间另行显示。
- 按浏览器语言偏好选择中英文，无法识别时默认英文；手动选择会保存在当前浏览器。
- 收藏保存在浏览器本地。
- 遵循“减少动态效果”偏好，关闭自动示范、环境动效和平滑滚动。

新增或实质更新的新闻要求完整中英文分析。部分保留的历史新闻仍待补译，英文模式会明确提示缺失。

## 轻量化架构

利用已有的 GPT 云端任务和 GitHub 资源运行：

```text
公开编辑配置 + 上一份新闻快照
              ↓
GPT 云端研究、筛选与双语撰写
              ↓
data/dashboard.json
              ↓
GitHub Actions：校验 → 构建 → 部署
              ↓
GitHub Pages
```

| 环节 | 实现 |
| --- | --- |
| 前端 | React、TypeScript、Vinext / Vite、CSS 与 Canvas |
| 内容 | GitHub 中可追溯的静态 JSON |
| 研究 | 单独配置的 GPT 云端任务 |
| 发布 | GitHub Actions 与 GitHub Pages |
| 搜索、筛选、收藏 | 浏览器端实现 |

默认流程无需数据库、常驻后端或单独的 OpenAI API key。云端任务能力及 GitHub 连接权限取决于账号，仍受订阅和 GitHub 服务用量限制。

## 每日更新

云端任务是唯一的日常内容生成者。每轮研究过去 24 小时的进展，补扫上次成功更新以来的遗漏，再合并到最多 80 条事件的七天滚动快照。

通常以新增 12–20 个独立事件为编辑目标。信息偏少时应先扩大检索；补漏保留真实发布时间，不能为了数量编造新闻。

配置流程：

1. 将 GitHub Pages 的发布来源设为 **GitHub Actions**。
2. 为云端任务连接已授权的 GitHub 读写能力。
3. 把[完整版 Scheduler 提示词](config/scheduler-prompt.txt)粘贴到云端任务，并在那里设置运行时间。
4. 手动运行一次，检查数据提交、对应的 Actions 运行结果和线上页面。

仓库中的提示词文件用于记录任务要求；提交该文件不会自动创建或修改云端日程。

推送到 `main`，包括只更新 JSON，都会触发校验和静态构建。新增或实质修改的事件缺少完整英文分析时，会停止发布；未改动的历史内容允许逐步补译。

研究失败时应保留上次成功的内容时间，校验失败时停止发布。结构检查不能证明事实准确，提交成功也不等于网站已部署成功。

## 本地运行

建议使用 **Node.js 24**，与 CI 保持一致。

```bash
git clone https://github.com/CLIUKELLY/there-goes-ai-again.git
cd there-goes-ai-again
npm ci
npm run validate:data
npm run dev
```

构建 GitHub Pages 静态页面：

```bash
npm run build:pages
```

产物位于 `dist/client`。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| [app/page.tsx](app/page.tsx) | 新闻界面、语言选择与筛选 |
| [app/news-lens.tsx](app/news-lens.tsx) | 放大镜交互与沙粒动效 |
| [app/globals.css](app/globals.css) | 视觉样式与响应式布局 |
| [config/focus-profile.json](config/focus-profile.json) | 编辑范围和优先级 |
| [config/dashboard.schema.json](config/dashboard.schema.json) | JSON 数据结构 |
| [config/scheduler-prompt.txt](config/scheduler-prompt.txt) | 可复制的云端任务提示词 |
| [data/dashboard.json](data/dashboard.json) | 滚动新闻快照 |
| [scripts/prepare-dashboard.mjs](scripts/prepare-dashboard.mjs) | 数据整理与校验 |
| [scripts/validate-news-update.mjs](scripts/validate-news-update.mjs) | 对照前一次提交检查英文完整性 |
| [.github/workflows/daily-update.yml](.github/workflows/daily-update.yml) | 构建与 Pages 部署 |

---

[开始阅读](https://cliukelly.github.io/there-goes-ai-again/) · [English](README.md)

<sub>© 2026 <a href="https://github.com/CLIUKELLY">Kelly L.</a></sub>
