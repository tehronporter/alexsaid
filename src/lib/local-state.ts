import { localUserStateSchema, type LocalUserStateV1 } from "@/domain/catalog";

export const LOCAL_STATE_KEY = "hormozi-said:user-state:v1";

export const defaultLocalState: LocalUserStateV1 = {
  schemaVersion: 1,
  savedIDs: [],
  favoriteCategories: [],
  hideProfanity: true,
  feedScope: "all",
  onboardingComplete: false,
  lastQuoteID: null
};

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function migrateLocalState(value: unknown): LocalUserStateV1 {
  const current = localUserStateSchema.safeParse(value);
  if (current.success) return current.data;
  if (!value || typeof value !== "object") return defaultLocalState;
  const legacy = value as Record<string, unknown>;
  const migrated = localUserStateSchema.safeParse({
    schemaVersion: 1,
    savedIDs: stringArray(legacy.savedIDs ?? legacy.saved),
    favoriteCategories: stringArray(legacy.favoriteCategories ?? legacy.favoriteTopics),
    hideProfanity: typeof legacy.hideProfanity === "boolean" ? legacy.hideProfanity : (typeof legacy.profanityHidden === "boolean" ? legacy.profanityHidden : true),
    feedScope: legacy.feedScope === "favorite-topics" || legacy.scope === "favorite-topics" ? "favorite-topics" : "all",
    onboardingComplete: typeof legacy.onboardingComplete === "boolean" ? legacy.onboardingComplete : Boolean(legacy.onboarded),
    lastQuoteID: typeof legacy.lastQuoteID === "string" ? legacy.lastQuoteID : null
  });
  return migrated.success ? migrated.data : defaultLocalState;
}

export function readLocalState(validQuoteIDs?: ReadonlySet<string>): LocalUserStateV1 {
  if (typeof window === "undefined") return defaultLocalState;
  try {
    const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return defaultLocalState;
    const parsed = migrateLocalState(JSON.parse(raw));
    if (!validQuoteIDs) return parsed;
    return {
      ...parsed,
      savedIDs: parsed.savedIDs.filter((id) => validQuoteIDs.has(id)),
      lastQuoteID: parsed.lastQuoteID && validQuoteIDs.has(parsed.lastQuoteID) ? parsed.lastQuoteID : null
    };
  } catch {
    return defaultLocalState;
  }
}

export function writeLocalState(state: LocalUserStateV1) {
  window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

export function exportLocalState(state: LocalUserStateV1) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hormozi-said-data.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
