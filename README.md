# AI Intelligence Hub · Market Pulse

A Chinese-first AI market intelligence dashboard. It collects public first-party feeds, groups similar events, calculates real dashboard metrics, preserves source links, and can optionally use the OpenAI Responses API for daily web research, Chinese summaries, and impact analysis.

## Core pipeline

1. Fetch configured RSS and Atom sources from `config/sources.json`.
2. Normalize titles, timestamps, summaries, source tier, and region.
3. De-duplicate URLs and cluster similar titles with deterministic token similarity.
4. Calculate event impact, trend scores, source health, and dashboard totals.
5. If `OPENAI_API_KEY` is available, run one daily Responses API research job with web search and structured output.
6. Write the reproducible snapshot to `data/dashboard.json` and build a static site.

The pipeline still works without an OpenAI key. In that mode it publishes the feed-derived results and deterministic analysis.

## Local use

```bash
npm ci
npm run update:news
npm run dev
```

Optional AI enrichment:

```bash
OPENAI_API_KEY=your_key npm run update:news
```

Never commit API keys. For GitHub Actions, add `OPENAI_API_KEY` as a repository Actions secret.

## GitHub Pages

The workflow in `.github/workflows/daily-update.yml` runs every day at 08:15 Asia/Shanghai, updates the committed data snapshot, builds the static export, and deploys `dist/client` to GitHub Pages. It can also be run manually.

Set the repository Pages source to **GitHub Actions**. The default model is `gpt-6.2-sol`; override it with a repository variable named `OPENAI_MODEL`.

## Trust model

- Tier 3: first-party company, lab, project, or official release source
- Tier 2: established technical media or developer community source
- Tier 1: community discovery signal

Multiple articles are not treated as independent confirmation when they resolve to the same canonical source. Every displayed source remains clickable so readers can inspect the evidence.
