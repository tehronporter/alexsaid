import type { LocalUserStateV1, Quote } from "@/domain/catalog";

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
  const random = randomFromSeed(hashSeed(`hormozi-said:${localDateKey(date)}`));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
