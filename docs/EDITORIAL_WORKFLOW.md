# Production quote-catalog workflow

The catalog has no quote-count target. A release is complete only when enumerable sources are exhausted and every published record clears the direct-source gates below.

## Storage model

- `content/sources/<provider>/<year>.json` is the versioned source inventory. Source states are `discovered`, `ready`, `mined`, `reviewed`, `excluded`, or `blocked`; exclusions and blocks always carry a reason.
- `content/candidates/<provider>/<year>.json` contains transcript-discovered, contiguous cue windows. Candidates are not publishable evidence.
- `content/editorial/<provider>/<year>.json` contains review decisions and reproducible provenance. `content/editorial-ledger.json` is a deterministic compiled artifact retained for compatibility.
- `content/taxonomy.json` owns the ten categories, canonical tag definitions, and aliases. Quotes use two to five canonical lowercase tag slugs.
- `.content-cache/` holds transcripts, review packets, and temporary media. It is gitignored. Never commit complete transcripts, recordings, screenshots, scans, or paid material.
- `src/data/catalog.v3.json` is the normalized public catalog. `src/data/catalog.json` is its exact v2 compatibility projection.

## Source order and limits

Process the official The Game RSS archive first, followed by official YouTube uploads not represented in the feed, free official Acquisition.com material, best-effort direct X posts, and clearly attributable third-party interviews. Paid APIs, paid books, snippet-only books, transcription services, and storage services are excluded.

The official RSS sync records stable provider IDs, dates, durations, direct audio and transcript URLs, transcript SHA-256 checksums, retrieval metadata, and explicit terminal failures. X is best-effort: its official public embed is used for known direct posts, and text hidden by a truncated embed is blocked rather than inferred from a mirror.

## Mining and review

Mining joins only consecutive WebVTT cues from one uninterrupted passage. It accepts 3–70 words and at most 420 characters, then rejects obvious ads, introductions, fillers, attribution phrases, fragments, and overlapping lower-ranked windows. It is discovery only.

For every publishable quote:

1. Reopen the direct source in an isolated review.
2. For media, listen to at least 30 seconds before and after the excerpt. A transcript or automatic caption cannot replace this step.
3. Confirm Alex is the speaker and is not quoting someone else.
4. Confirm every word, normalized punctuation, title, date, locator, cue range, context, and transcript fingerprint.
5. Confirm the statement is contiguous, understandable alone, and has not been silently repaired.
6. Repeat the process in a second isolated pass under a distinct reviewer label.
7. Score clarity, usefulness, distinctiveness, fan relevance, and product fit from 0–2. Every dimension must be nonzero and the total must be at least 9/10.
8. Resolve exact, token-similar, and character-ngram duplicate warnings with an explicit `unique`, `keep`, or `reject` decision.
9. Blind-audit at least 20% of published records. A critical discrepancy quarantines the affected source batch for complete re-review.

Agent-only review does not mean certainty. Product language may say “checked twice against the direct source.” If the active agent cannot consume audio, media candidates remain unpublished until an audio-capable isolated reviewer completes both passes.

## Commands

```bash
npm run content:sources:sync
npm run content:candidates:mine                 # deterministic 50-source pilot
npm run content:candidates:mine -- --all        # complete ready archive
npm run content:review:packet -- --stage=first --limit=25
npm run content:review:packet -- --stage=second --limit=25
npm run content:review:packet -- --stage=blind --limit=25
npm run content:review:apply -- .content-cache/review-packets/completed.json
npm run content:compile
npm run content:coverage
npm run content:release
```

`content:release` compiles v3 and v2, validates all editorial and public contracts, audits direct links, and writes the coverage report. It never promotes a mined candidate.

## Runtime and regression budgets

The client fetches `/catalog.v3.json` once through the app-level catalog provider. The service worker caches v3 for offline use, the search index is built once, and quote/source routes render on demand with CDN revalidation. Server components send only the first-paint quote or route metadata instead of the entire catalog.

The synthetic 5,000-quote test enforces these local budgets: search-index construction under 500 ms, representative search under 250 ms, source-aware full-feed ordering under 2 seconds, and a serialized hydrated fixture under 8 MB. Production build, browser, accessibility, offline, and source-action tests remain release requirements.

## Completion and launch boundaries

Backfill is complete only when all official RSS and freely enumerable official sources are terminal, no source or candidate remains in a working state, two weekly X/interview sweeps find no new direct sources, and coverage has no warnings or unexplained gaps.

This pipeline does not pass the separate human-beta, copyright, or unofficial-fan-app launch gates. `launch:validate` must continue to fail until those checks are completed independently; pipeline progress must never be used to mark them passed.
