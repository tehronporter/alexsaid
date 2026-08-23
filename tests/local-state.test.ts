import { beforeEach, describe, expect, it } from "vitest";
import { catalog } from "@/lib/catalog";
import { defaultLocalState, LOCAL_STATE_KEY, migrateLocalState, readLocalState, writeLocalState } from "@/lib/local-state";

describe("local user state", () => {
  beforeEach(() => localStorage.clear());

  it("returns a safe default when stored data is invalid", () => {
    localStorage.setItem(LOCAL_STATE_KEY, "not json");
    expect(readLocalState()).toEqual(defaultLocalState);
  });

  it("persists saved IDs and prunes unknown catalog IDs", () => {
    const known = catalog.quotes[0].id;
    writeLocalState({ ...defaultLocalState, savedIDs: [known, "20000000-0000-4000-8000-000000000001"] });
    expect(readLocalState(new Set(catalog.quotes.map(({ id }) => id))).savedIDs).toEqual([known]);
  });

  it("migrates the legacy local shape into schema version one", () => {
    const known = catalog.quotes[0].id;
    expect(migrateLocalState({ saved: [known], favoriteTopics: ["Sales"], profanityHidden: false, scope: "favorite-topics", onboarded: true })).toEqual({
      ...defaultLocalState,
      savedIDs: [known],
      favoriteCategories: ["Sales"],
      hideProfanity: false,
      feedScope: "favorite-topics",
      onboardingComplete: true
    });
  });
});
