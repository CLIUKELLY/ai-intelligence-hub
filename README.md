# AI Intelligence Hub

**AI 最新动态，看清更新，也看清边界。**

A focused, bilingual AI news desk. Models, products, developer tools and infrastructure — with source links, practical context and clear open questions.

[阅读新闻 / Read the news](https://cliukelly.github.io/ai-intelligence-hub/)

## Editorial scope

We cover concrete changes: models becoming available, products shipping, developer interfaces evolving, inference stacks improving and safety findings affecting deployment. China and global developments share one workflow.

This is a public, topic-focused news site. There is no personal relevance score or claim of comprehensive coverage.

Each story separates facts, practical implications and open questions:
- **更新要点 / What changed:** the specific change, availability or new evidence.
- **实际意义 / Why it matters:** practical implications, distinguished from confirmed facts.
- **待验证的问题 / What remains unverified:** a specific question and the evidence needed to answer it.
- **来源与验证 / Sources:** clickable original references and provenance.

## Lightweight architecture

GPT cloud research → versioned JSON → GitHub Actions validation and build → GitHub Pages.

The configured cloud task is the only daily content writer. The default path needs no database, always-on backend or separate OpenAI API key. Account usage limits, connected GitHub permissions and unattended cloud-tool capabilities still apply. GitHub services are subject to their usage limits.

Search and filtering run in the browser. Bookmarks stay in browser local storage. The site is a static snapshot.

## Daily updates

Paste the full [Scheduler prompt](config/scheduler-prompt.txt) into the existing cloud task. This repository file does **not** create or update a schedule automatically.

Research the previous 24 hours and scan for missed events since the last successful update. Aim for 20 independent new events, normally 12–20. Widen research before accepting a sparse batch; never fabricate stories to meet a quota. Older discoveries retain their actual publication dates.

Retain a seven-day dataset within the 80-event limit. Stable IDs and first-seen times support the 24-hour, 3-day and 7-day filters. Those filters use first inclusion; publication dates are shown separately.

New and substantively updated events include complete Chinese and English analysis. Legacy events without English analysis are explicitly identified in English mode. The cloud task should backfill their translations.

## Evidence and publication

Official announcements, documentation, repositories and original research anchor coverage. Multiple pages from one organization do not establish independent corroboration. Editorial scores are ranking aids, not calibrated accuracy measurements.

Every push to main, including JSON-only changes, triggers validation, a static build and Pages deployment. Check the Actions run for the exact commit before claiming publication. The Scheduler prompt includes a workflow-dispatch fallback when no run appears and permissions allow.

Failed validation stops deployment. Research failures must preserve the previous successful content timestamps. Structural validation does not prove factual accuracy.

## Repository map

| File | Role |
| --- | --- |
| config/focus-profile.json | Public editorial scope |
| config/dashboard.schema.json | Data structure |
| config/scheduler-prompt.txt | Copyable cloud-task instructions |
| data/dashboard.json | Rolling news snapshot |
| scripts/prepare-dashboard.mjs | Normalization and validation |
| app/page.tsx | Reading interface |
| .github/workflows/daily-update.yml | Build and deployment |

## Development

```bash
npm ci
npm run validate:data
npm run dev
npm run build:pages
```

To reuse the project, fork it, enable Pages through GitHub Actions, adapt the editorial scope and connect an authorized cloud research task.
