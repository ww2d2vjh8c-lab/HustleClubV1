# HustleClub — Pipeline Guide

## Overview

Four pipelines run automatically based on git events:

```
Developer pushes branch
  └── CI (lint + typecheck + tests) runs on every push

Developer opens PR against main
  └── PR Checks (CI + bundle size + preview deploy + migration diff)

Merge to main
  └── Deploy → Staging (CI gate → Supabase migrations → Vercel → smoke test)

Tag pushed (v1.2.3)
  └── Deploy → Production (CI gate → manual approval → migrations → Vercel → smoke test → GitHub Release)
```

Plus one data pipeline:

```
Daily at 00:30 IST (Supabase pg_cron)
  └── aggregate-analytics Edge Function runs
      └── Writes daily snapshot to analytics_daily_snapshots
      └── Updates creator_stats rolling totals
```

---

## GitHub Secrets Required

Add these in **GitHub → Settings → Secrets and variables → Actions**:

### Supabase

| Secret | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role key |
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens → Generate new token |
| `SUPABASE_STAGING_PROJECT_REF` | Staging project ID from Supabase dashboard URL |
| `SUPABASE_PRODUCTION_PROJECT_REF` | Production project ID from Supabase dashboard URL |

### Vercel

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | vercel.com → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | vercel.com → Project → Settings → General → Project ID |

### Optional (Slack notifications)

| Secret | Where to get it |
|---|---|
| `SLACK_WEBHOOK_URL` | api.slack.com → Incoming Webhooks → Add to Slack |

---

## Workflows

### `ci.yml` — Continuous Integration
**Triggers**: Every push to any branch + every pull request

Steps: Install → Lint → Typecheck → Tests

All three must pass. If any fail, the job is red and the PR cannot be merged (configure branch protection rules in GitHub).

---

### `pr-checks.yml` — Pull Request Checks
**Triggers**: PR opened/updated against `main`

Steps:
1. **PR title check** — must follow conventional commits (`feat:`, `fix:`, `security:`, etc.)
2. **CI gate** — same as `ci.yml`
3. **Bundle size** — builds Next.js and comments bundle ID on the PR
4. **Preview deploy** — Vercel preview URL posted as a PR comment automatically
5. **Migration diff** — if new migration files are in the PR, posts a warning comment listing them

---

### `deploy-staging.yml` — Staging Deploy
**Triggers**: Push to `main` (i.e., after a PR is merged)

Steps:
1. CI gate (full lint + typecheck + test)
2. `supabase db push` against staging project
3. Vercel deploy aliased to `staging.hustleclub.in`
4. Health check against `/api/health` — retries 5x with 10s gaps
5. Slack notification on failure

**To set staging domain**: In Vercel, add `staging.hustleclub.in` as a domain on your project.

---

### `deploy-production.yml` — Production Deploy
**Triggers**: Git tag matching `v*.*.*` (e.g. `v1.0.0`)

Steps:
1. CI gate
2. **Manual approval** (GitHub Environments gate — see setup below)
3. `supabase db push` against production project
4. Vercel `--prod` deploy
5. Health check against `https://hustleclub.in/api/health`
6. GitHub Release created with auto-generated release notes
7. Slack notification (success or failure)

**To deploy a release:**
```bash
git tag v1.0.0
git push origin v1.0.0
# Then approve in GitHub → Actions → Deploy → Production → Review deployments
```

**To set up manual approval:**
1. GitHub → Settings → Environments → New environment → name it `production`
2. Enable "Required reviewers" → add yourself
3. The migration and deploy jobs will pause for approval before running

---

## Data Pipeline — Analytics Aggregation

**What it does**: Runs daily at 00:30 IST. Counts new users, creators, jobs, applications, orders, and revenue in the past 24 hours. Writes to `analytics_daily_snapshots`. Updates per-creator rolling stats in `creator_stats`.

**Required DB tables** (add via migration):

```sql
-- Run once in Supabase SQL editor or as a migration

create table if not exists analytics_daily_snapshots (
  snapshot_date         date primary key,
  new_users             integer not null default 0,
  new_creators          integer not null default 0,
  new_jobs              integer not null default 0,
  new_applications      integer not null default 0,
  new_orders            integer not null default 0,
  gross_revenue_paise   bigint not null default 0,
  active_users          integer not null default 0,
  created_at            timestamptz not null default now()
);

create table if not exists creator_stats (
  creator_id            uuid primary key references profiles(id) on delete cascade,
  total_orders          integer not null default 0,
  total_revenue_paise   bigint not null default 0,
  total_jobs            integer not null default 0,
  last_updated          timestamptz not null default now()
);
```

**Deploy the Edge Function:**
```bash
supabase functions deploy aggregate-analytics --project-ref <your-project-ref>
```

**Schedule it (run once in Supabase SQL editor):**
```sql
select cron.schedule(
  'aggregate-analytics-daily',
  '0 19 * * *',
  $$
    select net.http_post(
      url := 'https://<your-project>.supabase.co/functions/v1/aggregate-analytics',
      headers := '{"Authorization": "Bearer <your-anon-key>"}'::jsonb
    );
  $$
);
```

**Test manually:**
```bash
curl -X POST https://<project>.supabase.co/functions/v1/aggregate-analytics \
  -H "Authorization: Bearer <anon-key>"
```

---

## Branch Protection Setup (Recommended)

In GitHub → Settings → Branches → Add rule for `main`:

- Require a pull request before merging
- Require status checks to pass: `Lint · Typecheck · Test`, `PR hygiene`
- Require branches to be up to date before merging
- Do not allow bypassing the above settings (even for admins)

---

## Full Event → Action Map

| Git event | Workflow | Key result |
|---|---|---|
| Push any branch | CI | Green/red badge on commit |
| Open PR → main | PR Checks | Preview URL + migration warning + bundle comment |
| Merge PR → main | Deploy → Staging | Live on staging.hustleclub.in |
| Push `v*.*.*` tag | Deploy → Production | Live on hustleclub.in + GitHub Release |
| Daily 00:30 IST | aggregate-analytics | Analytics snapshot in DB |
