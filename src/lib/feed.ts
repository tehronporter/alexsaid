import type { LocalUserStateV1, Quote } from "@/domain/catalog";

function sourceKey(quote: Quote) {
  if (!quote.sourceURL) return quote.sourceTitle ?? quote.id;
  try {
    const url = new URL(quote.sourceURL);
    url.searchParams.delete("t");
    url.searchParams.delete("start");
    url.hash = "";
    return url.toString();
  } catch { return quote.sourceURL; }
}

function textSimilarity(left: string, right: string) {
  const tokens = (value: string) => new Set(value.toLocaleLowerCase().match(/[a-z0-9]+/g) ?? []);
  const a = tokens(left);
  const b = tokens(right);
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.max(1, a.size + b.size - intersection);
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed: number) {
  let value = seed || 1;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function eligibleQuotes(quotes: readonly Quote[], state: LocalUserStateV1) {
  const filtered = quotes.filter((quote) => {
    if (state.hideProfanity && quote.containsProfanity) return false;
    if (state.feedScope === "favorite-topics" && state.favoriteCategories.length > 0) {
      return state.favoriteCategories.includes(quote.primaryCategory);
    }
    return true;
  });

  return filtered.length > 0 ? filtered : quotes;
}

export function dailyQuoteOrder(
  quotes: readonly Quote[],
  state: LocalUserStateV1,
  date = new Date()
) {
  const result = [...eligibleQuotes(quotes, state)];
  const productSeed = quotes[0]?.author === "Leila Hormozi" ? "leila-said" : "hormozi-said";
  const random = randomFromSeed(hashSeed(`${productSeed}:${localDateKey(date)}`));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  const diversified: Quote[] = [];
  while (result.length > 0) {
    const previous = diversified.at(-1);
    const preferredIndex = previous ? result.findIndex((candidate) => sourceKey(candidate) !== sourceKey(previous) && candidate.primaryCategory !== previous.primaryCategory && textSimilarity(candidate.text, previous.text) < 0.62) : 0;
    const sourceSafeIndex = previous ? result.findIndex((candidate) => sourceKey(candidate) !== sourceKey(previous)) : 0;
    const index = preferredIndex >= 0 ? preferredIndex : sourceSafeIndex >= 0 ? sourceSafeIndex : 0;
    diversified.push(result.splice(index, 1)[0]);
  }
  return diversified;
}
