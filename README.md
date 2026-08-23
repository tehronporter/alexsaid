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

`src/data/catalog.json` is explicitly marked as a development fixture. It exists to exercise the interface and is not a launch-ready quote library. `npm run content:validate:release` intentionally fails until the catalog contains at least 500 independently verified records and `developmentFixture` is false.

Import normalized JSON or the documented CSV columns with:

```bash
npm run content:import -- path/to/catalog.json
npm run content:import -- path/to/quotes.csv src/data/catalog.json
```

## Persistence and offline behavior

Favorites, topic settings, onboarding status, and recent-quote state remain in versioned browser storage. There are no accounts. The service worker is registered in production; set `NEXT_PUBLIC_SW_ENABLED=true` only for local PWA testing.

## Push notifications

Scheduled delivery remains feature-disabled until Supabase and VAPID are configured. See `docs/PUSH_ACTIVATION.md`. Do not advertise daily notifications before that activation checklist passes.

## Deployment

Connect the repository to Vercel Pro, enable Web Analytics and Speed Insights, and use preview deployments for review. The checked-in workflow runs content validation, linting, type checking, unit tests, production build, and Chromium end-to-end tests.
