# Accuracy-first editorial workflow

The catalog has no size target. Accuracy, contextual honesty, and fan value are the release gate.

## Source hierarchy

Use only material where Alex Hormozi can be heard or read directly: complete recordings, complete third-party interviews where he is clearly the speaker, verified posts, articles, newsletters, and legally accessed books. Captions and transcripts can surface candidates, but a media quote is verified by listening to the recording.

Never use search snippets, quote sites, fan accounts, compilations, isolated unattributed clips, or AI summaries as evidence. Reject a statement Alex attributes to someone else.

## Record lifecycle

Records move through `candidate`, `in_review`, `verified`, or `rejected`. Import always creates candidates; it never publishes content. A stable UUID is assigned only when an `in_review` record is accepted.

For each candidate:

1. Capture the exact words, direct URL, date, source title, context, and a discriminated locator.
2. Review at least 30 seconds before and after recorded speech, or the surrounding passage for written material.
3. Confirm that Alex is the speaker and the excerpt remains honest on its own.
4. Reopen the direct source for a separate second check of every word, attribution, locator, and metadata field.
5. Score standalone clarity, practical usefulness, distinctiveness, fan relevance, and product fit from 0–2.
6. Accept only totals of at least 8/10 with no zero dimension and no unresolved warning.
7. Blind-audit at least 10% of each accepted batch. A critical discrepancy sends the batch back through review.

The ledger records the result of each pass, not copyrighted evidence. Keep downloaded recordings, screenshots, book scans, and long transcript excerpts in private storage outside this repository.

## Exact-wording rules

Normalize only whitespace, capitalization, quotation marks, and terminal punctuation. Do not remove fillers, repair grammar, combine separated passages, or paraphrase. `shortVersion` and `shareCardVersion` must be exact excerpts; include an ellipsis wherever words are omitted.

Media locators require start timestamps and direct timestamped URLs. Book locators require edition, publisher, publication year, chapter, and a page or digital location. Web/social records require a direct post or article URL rather than a profile, homepage, or search result.

## Commands and release

```bash
npm run content:import -- candidates.csv content/editorial-ledger.import.json
npm run content:generate
npm run content:validate
npm run content:audit-links
npm run content:validate:release
npm run launch:validate
```

`content:generate` publishes only verified ledger records and derives visible categories from that inventory. It rejects failed/single-pass reviews, low scores, missing locators, imprecise or aggregator URLs, invalid excerpts, duplicate UUIDs, high-confidence near duplicates, unresolved warnings, insufficient blind-audit coverage, and invalid collection references.

Before release, open every accepted source and inspect every quote in Quote, Discover, Saved, Source, and share-card views. Complete a seven-day private beta with at least five Alex Hormozi fans. Launch only after at least 80% of beta-rated quotes are worth saving, sharing, or seeing again and legal/content review of the unofficial fan app is complete.

Record non-identifying tester codes and ratings in `content/launch-readiness.json`. `launch:validate` intentionally fails until the beta duration, fan count, rating coverage, 80% threshold, padding/repetition checks, accuracy concerns, and all review sign-offs pass.
