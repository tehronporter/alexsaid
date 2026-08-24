# Hormozi Said

A purple-first, text-focused quote PWA built with Next.js 16, React 19, TypeScript, Tailwind CSS, and owned shadcn/Radix components.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Core checks:

```bash
npm run content:validate
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e:production
npm run test:visual
npm run test:lighthouse # with a production server running on port 3000
```

## Content safety gate

`src/data/catalog.json` is generated output, not an editorial workspace. The build-only ledger at `content/editorial-ledger.json` is the source of truth. A quote can enter the public catalog through either two direct-media checks or an editorial review of contiguous cues from an official timestamped transcript. The public catalog identifies the standard used for each quote. Every published quote also needs a quality score of at least 9/10 with no zero dimension and no unresolved source or context warnings. The 20% blind-audit requirement applies to the twice-checked direct-source cohort. There is no numerical quote minimum.

Import candidate JSON or CSV into a separate review ledger, then review and generate:

```bash
npm run content:import -- path/to/editorial-ledger.json
npm run content:import -- path/to/candidates.csv content/editorial-ledger.import.json
npm run content:generate
npm run content:curate:transcripts             # preview the maintained editorial selection
npm run content:curate:transcripts -- --apply  # publish it after reading every preview and context
npm run content:validate:release
npm run content:audit-links
npm run launch:validate # stays closed until the real beta and reviews are complete
```

Never edit the public catalog directly. See `docs/EDITORIAL_WORKFLOW.md` for the source hierarchy, review fields, exact-wording policy, and release procedure. Private screenshots, scans, downloaded media, and long transcript evidence must stay outside the public repository.

## Persistence and offline behavior

Favorites, topic settings, onboarding status, and recent-quote state remain in versioned browser storage. There are no accounts. The service worker is registered in production; set `NEXT_PUBLIC_SW_ENABLED=true` only for local PWA testing.

## Push notifications

Scheduled delivery remains feature-disabled until Supabase and VAPID are configured. See `docs/PUSH_ACTIVATION.md`. Do not advertise daily notifications before that activation checklist passes.

## Deployment

Connect the repository to Vercel Pro, enable Web Analytics and Speed Insights, and use preview deployments for review. The checked-in workflow runs content validation, linting, type checking, unit tests, production build, and Chromium end-to-end tests.
