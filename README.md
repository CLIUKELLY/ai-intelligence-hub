# There Goes AI Again · 又整啥了

**AI keeps moving. Find what’s worth a closer look.**

**English** · [简体中文](README.zh-CN.md)

[Read the news](https://cliukelly.github.io/ai-intelligence-hub/) · [How daily updates work](#daily-updates) · [Run locally](#run-locally)

[![Build and deploy](https://github.com/CLIUKELLY/ai-intelligence-hub/actions/workflows/daily-update.yml/badge.svg?branch=main)](https://github.com/CLIUKELLY/ai-intelligence-hub/actions/workflows/daily-update.yml)

An independent, bilingual news site for people following AI products and development. It selects developments in models, tools and infrastructure, then explains what changed, why it matters and where to read the original source.

Built by [Kelly](https://github.com/CLIUKELLY). The repository keeps its original name, `ai-intelligence-hub`.

## Why this exists

AI news moves quickly. Understanding a release often means piecing together an announcement, documentation, a repository and several reports.

This site brings the useful parts into one reading experience:

- **Selection with intent.** Focus on concrete releases and meaningful developments; combine repetitive coverage into events.
- **Context you can inspect.** Separate reported facts, editorial interpretation and open questions, with links to the underlying sources.
- **A point of view, with taste.** From selection and writing to visuals and interaction, the site has its own judgment and personality.

The goal is to help readers decide what deserves a closer look.

## What you can read

Coverage centers on **models and usable capabilities, AI products, developer tools, Agent engineering, and inference and deployment infrastructure**. Related open-source releases, safety findings and business developments enter the feed when they affect those areas.

China and global developments share the same editorial workflow. Selection follows a public [editorial profile](config/focus-profile.json).

Each story provides:

| Layer | What it answers |
| --- | --- |
| Summary | Who announced what, and what is available? |
| What changed | What is new compared with the previous state? |
| Why it matters | What are the practical implications? |
| What remains unverified | What specific question still needs evidence? |
| Sources | Where can the reader check the claims? |

First-party announcements, documentation, official repositories and original research are preferred. Independent reporting adds context and corroboration where available. A single official source is identified as such; multiple pages from one organization do not establish independent confirmation.

## The reading experience

- A full-screen daily selection leads into a searchable news list and article view.
- An interactive magnifying glass reveals story keywords in a gently moving grain landscape.
- Filters cover stories first added within **24 hours, 3 days or 7 days**. Original publication dates remain visible separately.
- The interface selects a supported language from browser preferences, with English as the fallback. A manual choice is remembered in the current browser.
- Bookmarks stay in browser local storage.
- Reduced-motion preferences disable automatic demonstrations, ambient movement and smooth scrolling.

New and substantively updated stories require complete Chinese and English analysis. Some retained historical stories still await English translations; English mode identifies those gaps.

## Lightweight by design

The project uses an existing GPT cloud task and GitHub infrastructure:

```text
Public editorial profile + previous snapshot
                    ↓
GPT cloud research, selection and bilingual writing
                    ↓
data/dashboard.json
                    ↓
GitHub Actions: validate → build → deploy
                    ↓
GitHub Pages
```

| Part | Implementation |
| --- | --- |
| Interface | React, TypeScript, Vinext / Vite, CSS and Canvas |
| Content | Versioned static JSON |
| Research | A separately configured GPT cloud task |
| Publishing | GitHub Actions and GitHub Pages |
| Search, filters, bookmarks | Browser-side behavior |

The default workflow needs no database, always-on backend or separate OpenAI API key. Cloud-task availability and connected GitHub permissions depend on the account; subscription and GitHub usage limits apply.

## Daily updates

The cloud task is the sole daily content writer. It researches the previous 24 hours, scans for missed developments since the last successful update, and merges the results into a rolling seven-day snapshot of up to 80 events.

The editorial target is normally 12–20 new independent events. A sparse research pass should expand its search before stopping. Older discoveries keep their real publication dates, and event targets never justify invented stories.

To configure the task:

1. Enable GitHub Pages with **GitHub Actions** as its publishing source.
2. Give the cloud task the authorized GitHub capabilities needed to read and update this repository.
3. Paste the full [Scheduler prompt](config/scheduler-prompt.txt) into the cloud task and configure its schedule there.
4. Run once and verify the data commit, its corresponding Actions run and the published site.

The prompt file documents the task; committing that file does not create or update the cloud schedule automatically.

Every push to `main`, including a JSON-only change, triggers validation and a static build. New or substantively changed events without complete English analysis fail the publishing check. Unchanged historical records can be translated gradually.

Research failures must preserve the previous successful content timestamps. Validation failures stop publication. Structural checks do not establish factual accuracy, and a successful commit alone does not prove deployment succeeded.

## Run locally

Use **Node.js 24** to match CI.

```bash
git clone https://github.com/CLIUKELLY/ai-intelligence-hub.git
cd ai-intelligence-hub
npm ci
npm run validate:data
npm run dev
```

Build for GitHub Pages:

```bash
npm run build:pages
```

The static output is written to `dist/client`.

## Repository map

| Path | Purpose |
| --- | --- |
| [app/page.tsx](app/page.tsx) | News interface, language selection and filtering |
| [app/news-lens.tsx](app/news-lens.tsx) | Interactive lens and ambient grain animation |
| [app/globals.css](app/globals.css) | Visual system and responsive layout |
| [config/focus-profile.json](config/focus-profile.json) | Editorial scope and priorities |
| [config/dashboard.schema.json](config/dashboard.schema.json) | JSON data contract |
| [config/scheduler-prompt.txt](config/scheduler-prompt.txt) | Copyable cloud-task instructions |
| [data/dashboard.json](data/dashboard.json) | Rolling news snapshot |
| [scripts/prepare-dashboard.mjs](scripts/prepare-dashboard.mjs) | Normalization and validation |
| [scripts/validate-news-update.mjs](scripts/validate-news-update.mjs) | English completeness check against the previous commit |
| [.github/workflows/daily-update.yml](.github/workflows/daily-update.yml) | Build and Pages deployment |

---

[Built by Kelly](https://github.com/CLIUKELLY) · [Read the news](https://cliukelly.github.io/ai-intelligence-hub/) · [简体中文](README.zh-CN.md)
