# AI Intelligence Hub

**A personalized AI news feed that runs on tools you already have.**

AI Intelligence Hub researches the AI topics you care about, merges repetitive coverage into events, explains what changed, and publishes a focused Chinese briefing to a static website you own.

> 不追逐每一条新闻，只保留会改变判断的信号。

[Open the live Market Pulse →](https://cliukelly.github.io/ai-intelligence-hub/)

![AI Intelligence Hub Market Pulse](./public/og.png)

## Why this exists

AI news is abundant; attention and context are not. Most feeds optimize for volume, recency, or engagement. This project optimizes for **personal relevance**:

- What changed compared with before?
- Why does it matter to the reader's stated interests?
- Which claims are supported by first-party evidence?
- What should be watched next?

It is personal-first rather than platform-first. Fork the repository, edit one transparent focus profile, and the same lightweight system becomes your own news feed.

## What makes it different

| | Typical aggregator | AI Intelligence Hub |
| --- | --- | --- |
| Selection | Popularity and volume | Explicit interests in `focus-profile.json` |
| Unit of information | Articles | Deduplicated events |
| Explanation | Headline or summary | What changed, why it matters, what to watch |
| China ↔ global | Usually one-sided | Both markets in one research pass |
| Evidence | Often opaque | Clickable, tiered source links |
| Ownership | Platform account | Your GitHub repository and JSON |
| Infrastructure | Database, crawler, API stack | Scheduled GPT research + static JSON |

Most feeds optimize for engagement. This one optimizes for relevance you can inspect and change.

## Focus Profile

Personalization is controlled by [`config/focus-profile.json`](./config/focus-profile.json), not by a hidden recommendation model. It contains public-safe preferences such as:

- priority topics and weights;
- companies to prioritize or watch;
- preferred language, timezone, and daily reading volume;
- editorial preferences and explicit exclusions.

The profile should never contain private work information, identity records, financial information, health information, credentials, or other sensitive context—this repository is public.

## Lightweight by design

The default architecture uses free resources or services the owner already subscribes to:

| Capability | Default resource | Additional bill |
| --- | --- | ---: |
| Daily web research | GPT cloud Scheduler | None beyond the existing plan |
| Data storage | Versioned JSON in GitHub | $0 |
| Validation and publishing | GitHub Actions | $0 within free limits |
| Hosting | GitHub Pages | $0 |
| Search and filtering | Browser-side computation | $0 |
| Bookmarks | Browser `localStorage` | $0 |

No database. No vector store. No crawler fleet. No always-on backend. No separate OpenAI API key is required for the default workflow.

## How it works

```text
focus-profile.json
        ↓
GPT cloud research
        ↓
source verification + event clustering
        ↓
Chinese editorial analysis
        ↓
dashboard.json
        ↓
schema validation + GitHub Pages
```

The GPT Scheduler is the only daily content writer. It researches the previous 24 hours, merges results with the rolling seven-day dataset, and commits `data/dashboard.json`. GitHub Actions validates, builds, and deploys that committed snapshot. RSS remains an explicit manual fallback and never competes with the daily writer.

## Editorial principles

1. **Signal over volume.** Three meaningful events are better than twenty weak ones.
2. **Fact before interpretation.** Facts, implications, and open questions are written separately.
3. **First-party evidence first.** Official sources anchor important claims whenever possible.
4. **Uncertainty stays visible.** Single-source stories are labelled as such.
5. **No simulated activity.** Trends and counts are calculated from retained events.
6. **The last good snapshot survives.** A failed research run never replaces valid public data.

## Trust model

- **Tier 1:** official or first-party sources—company releases, documentation, papers, regulators, and official repositories.
- **Tier 2:** established technology, business, and specialist reporting.
- **Tier 3:** community discovery signals and supplementary discussion.

Multiple pages from the same organization do not automatically count as independent confirmation. Important or disputed events should include independent corroboration when it exists. Every displayed source remains clickable.

## Repository map

```text
config/focus-profile.json       Reader-controlled interests
config/dashboard.schema.json    Public data contract
data/dashboard.json             Current rolling seven-day snapshot
scripts/prepare-dashboard.mjs   Deterministic validation
app/page.tsx                    Market Pulse interface
.github/workflows/              Validation and GitHub Pages deployment
```

## Local development

```bash
npm ci
npm run validate:data
npm run dev
```

Create the static GitHub Pages build with:

```bash
npm run build:pages
```

## Use it as your own feed

1. Fork the repository.
2. Edit `config/focus-profile.json` with public-safe interests.
3. Configure a GPT cloud schedule to read the profile and update `data/dashboard.json`.
4. Enable GitHub Pages with **GitHub Actions** as the source.

The result is a personal AI intelligence feed you can inspect, modify, and keep—without adopting another news platform or subscription.
