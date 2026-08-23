import type { Quote } from "@/domain/catalog";

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function quoteSearchScore(quote: Quote, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return 0;
  const category = normalize(quote.primaryCategory);
  const tags = quote.tags.map(normalize);
  const source = normalize(quote.sourceTitle ?? "");
  const text = normalize(quote.text);
  let score = 0;
  if (category === query) score += 100;
  if (tags.includes(query)) score += 90;
  if (category.includes(query)) score += 55;
  if (tags.some((tag) => tag.includes(query))) score += 45;
  if (source.includes(query)) score += 30;
  if (text.includes(query)) score += 20;
  for (const token of query.split(/\s+/)) {
    if (text.includes(token)) score += 4;
  }
  return score;
}

export function rankQuotes(quotes: readonly Quote[], query: string) {
  return quotes
    .map((quote) => ({ quote, score: quoteSearchScore(quote, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.quote.text.localeCompare(b.quote.text))
    .map(({ quote }) => quote);
}
