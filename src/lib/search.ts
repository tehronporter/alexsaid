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

export function createQuoteSearchIndex(quotes: readonly Quote[]) {
  const documents = quotes.map((quote) => ({ quote, category: normalize(quote.primaryCategory), tags: quote.tags.map(normalize), source: normalize(quote.sourceTitle ?? ""), text: normalize(quote.text) }));
  return {
    search(queryValue: string) {
      const query = normalize(queryValue);
      if (!query) return [];
      const queryTokens = query.split(/\s+/);
      return documents.map((document) => {
        let score = 0;
        if (document.category === query) score += 100;
        if (document.tags.includes(query)) score += 90;
        if (document.category.includes(query)) score += 55;
        if (document.tags.some((tag) => tag.includes(query))) score += 45;
        if (document.source.includes(query)) score += 30;
        if (document.text.includes(query)) score += 20;
        for (const token of queryTokens) if (document.text.includes(token)) score += 4;
        return { quote: document.quote, score };
      }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || left.quote.text.localeCompare(right.quote.text)).map(({ quote }) => quote);
    }
  };
}
