# Alex Said + Leila Said

Two source-verified quote PWAs built from one Next.js 16, React 19, and TypeScript product system.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Alex is the safe default. Run the Leila product locally with:

```bash
SAID_PRODUCT=leila npm run dev
```

Core checks:

```bash
npm run content:validate
npm run content:validate:leila
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e:production
npm run test:visual
npm run test:lighthouse # with a production server running on port 3000
```

## Content safety gate

`src/data/catalog.json` and `src/data/leila/catalog.json` are generated outputs, not editorial workspaces. Alex uses `content/editorial-ledger.json`; Leila uses `content/leila/editorial-ledger.json`. A quote can enter a public catalog through either two direct-media checks or an editorial review of contiguous cues from an official timestamped transcript. The compiler rejects an Alex quote in Leila's catalog, or a Leila quote in Alex's catalog.

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

Import the same GitHub repository into two Vercel projects:

- Existing Alex project: `SAID_PRODUCT=alex` (or omit it), `NEXT_PUBLIC_SITE_URL` set to the existing Alex production URL, and `LEILA_SITE_URL` set to the final Leila production URL.
- New Leila project (`leilasaid`): `SAID_PRODUCT=leila` and `NEXT_PUBLIC_SITE_URL=https://leilasaid.vercel.app`.

Set those variables for Production and Preview. Do not add domains, rewrites, or DNS. The Leila project opens the app at `/`; Alex retains its case study at `/` and app at `/app`. See `docs/TWO_PRODUCT_RELEASE.md` for the exact release checklist.

The checked-in workflow runs content validation, linting, type checking, unit tests, a production build, and Chromium end-to-end tests for both products. Social publishing automation is archived in `experiments/instagram-automation` and is not part of either deployment.
