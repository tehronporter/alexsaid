# Two-product release checklist

## Vercel projects

Use the same repository and production branch for both projects.

### Existing Alex project

- `SAID_PRODUCT=alex` (optional because Alex is the default)
- `NEXT_PUBLIC_SITE_URL=https://<existing-alex-domain>`
- `LEILA_SITE_URL=https://leilasaid.vercel.app`

Keep every existing domain and route. `/` remains the case study and `/app` remains the app.

### New Leila project

- `SAID_PRODUCT=leila`
- `NEXT_PUBLIC_SITE_URL=https://leilasaid.vercel.app`

Use the free Vercel production domain. `/` is the canonical app entry; `/app` permanently redirects to `/`.

Set the variables in Preview and Production, then redeploy after any value changes. Do not configure custom DNS, host detection, rewrites, or a third project.

## Local release gates

```bash
npm ci
npm run content:validate:alex
npm run content:validate:leila
npm run lint
npm run typecheck

SAID_PRODUCT=alex npm test
SAID_PRODUCT=alex npm run build
SAID_PRODUCT=alex E2E_PRODUCTION=true npm run test:e2e -- --project=chromium

SAID_PRODUCT=leila npm test
SAID_PRODUCT=leila npm run build
SAID_PRODUCT=leila E2E_PRODUCTION=true npm run test:e2e -- --project=chromium
```

For visual review, run `npm run test:visual` against each completed product build. Manually verify native sharing, square/story downloads, installation, offline fallback, and external source playback on a phone.

## Promotion order

1. Deploy Leila as a preview.
2. Verify `/`, `/app`, quote/source pages, catalog endpoint, manifest, icons, Open Graph cards, robots, and sitemap.
3. Promote Leila to production.
4. Set the final Leila URL as `LEILA_SITE_URL` in the Alex project.
5. Redeploy Alex and verify the dated “I kept building after applying” link.

## 60-second recording outline

- 0–10s: Alex case study and live Alex feed.
- 10–25s: Leila URL opening directly into the visually related white-and-purple feed.
- 25–40s: open a Leila source and show its timestamped official BUILD transcript provenance.
- 40–52s: save a quote and generate square and story cards.
- 52–60s: return to the Alex case study's dated continuation section and show the direct Leila link.

Follow-up note: “I kept building after applying. Alex Said is now a reusable, source-verified product system, and I used it to launch Leila Said from the same codebase without changing the original links. Here’s the 60-second walkthrough: <recording URL>.”
