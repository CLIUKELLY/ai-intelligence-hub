# There Goes AI Again · 又整啥了

**Catch up on AI. Get back to your day.**

**English** · [简体中文](README.zh-CN.md)

[Read the news](https://cliukelly.github.io/there-goes-ai-again/) · [How daily updates work](#daily-updates) · [Run locally](#run-locally)

[![There Goes AI Again · Build & Deploy](https://github.com/CLIUKELLY/there-goes-ai-again/actions/workflows/daily-update.yml/badge.svg?branch=main)](https://github.com/CLIUKELLY/there-goes-ai-again/actions/workflows/daily-update.yml)

A bilingual AI news site that started with a personal reading problem: keeping up with models, products and developer tools without getting lost in the feed. It brings selected developments, original sources and practical context into a place I want to open each day — and share with people who feel the same.

## Why I built this

AI moves quickly, and sometimes I feel a step behind.

There are plenty of useful news tools, but the things I care about are often scattered across different feeds. Social media helps me discover stories, yet a search for one AI update can turn into a much longer scroll. By the end, I may have spent more time consuming the feed than understanding what changed.

I was already experimenting with AI subscriptions and scheduled research. They could help gather a daily briefing, but I wanted a better way to browse it: original links, a clear reading structure, and a website with some personality.

So I built **There Goes AI Again**. It is a personal experiment in turning information gathering into a reading habit I actually enjoy.

## What this offers

**A focused daily read, with enough context to decide what deserves more of your attention.**

- **Selection with intent.** Follow concrete developments in models, products and developer tools, with repetitive coverage combined into events.
- **Context you can inspect.** Keep original sources alongside summaries, editorial interpretation and questions that still need evidence.
- **A point of view, with taste.** From selection and writing to visuals and interaction, the site has its own judgment and personality.

The aim is simple: stay curious, find something useful, and get back to the rest of your day.

## What you can read

Coverage centers on **models and usable capabilities, AI products, developer tools, Agent engineering, and inference and deployment infrastructure**. Related open-source releases, safety findings and business developments enter the feed when they affect those areas.

China and global developments share the same editorial workflow. Selection follows a public [editorial profile](config/focus-profile.json). All readers see the same curated feed; individual recommendation profiles are not part of the current site.

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
git clone https://github.com/CLIUKELLY/there-goes-ai-again.git
cd there-goes-ai-again
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

[Read the news](https://cliukelly.github.io/there-goes-ai-again/) · [简体中文](README.zh-CN.md)

<sub>Built by <a href="https://github.com/CLIUKELLY">Kelly</a>.</sub>
