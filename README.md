# AI Intelligence Hub · Market Pulse

A Chinese-first AI market intelligence dashboard. A scheduled Codex research task produces one cited daily snapshot; deterministic scripts validate and normalize the data; GitHub Actions only builds and publishes the site.

## Daily pipeline

1. The local scheduled research task searches the previous 24 hours and checks official sources, GitHub releases, research organizations, reliable media, and Chinese-market coverage.
2. It writes candidates to `data/dashboard.draft.json`, never directly over the last successful snapshot.
3. `npm run prepare:data` validates URLs, timestamps, categories, source tiers, and required editorial fields, then calculates deterministic totals and promotes the draft.
4. `npm run publish:data` performs a second validation and atomically commits only `data/dashboard.json` through the GitHub API.
5. `.github/workflows/daily-update.yml` validates the committed snapshot, builds the static export, and deploys GitHub Pages.

The scheduled task uses the signed-in desktop Codex environment rather than an API key. The computer must be on and the ChatGPT desktop app must be running at the scheduled time.

RSS and Atom ingestion remains available as an explicit manual fallback in `.github/workflows/manual-rss-fallback.yml`. It is not allowed to compete with the scheduled research task for daily writes.

## Local use

```bash
npm ci
npm run validate:data
npm run dev
```

Prepare a reviewed draft:

```bash
npm run prepare:data
npm run publish:data
```

The publishing command uses the existing authenticated GitHub CLI session. Never put GitHub tokens or private context in the public JSON.

## GitHub Pages

The workflow in `.github/workflows/daily-update.yml` runs on changes to `main`, validates `data/dashboard.json`, builds the static export, and deploys `dist/client` to GitHub Pages. It can also be run manually.

Set the repository Pages source to **GitHub Actions**.

## Trust model

- Tier 3: first-party company, lab, project, or official release source
- Tier 2: established technical media or developer community source
- Tier 1: community discovery signal

Multiple articles are not treated as independent confirmation when they resolve to the same canonical source. Every displayed source remains clickable so readers can inspect the evidence.

High-impact stories should have two independent sources whenever possible. Missing or invalid evidence fails validation; unchanged research does not create a new commit; failed research preserves the last successful public snapshot.
