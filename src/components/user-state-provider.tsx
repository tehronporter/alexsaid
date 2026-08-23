"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { LocalUserStateV1 } from "@/domain/catalog";
import { defaultLocalState, LOCAL_STATE_KEY, readLocalState, writeLocalState } from "@/lib/local-state";

let currentState = defaultLocalState;
let initialized = false;
const listeners = new Set<() => void>();

function emit() { for (const listener of listeners) listener(); }

function initializeStore() {
  if (typeof window !== "undefined" && !initialized) {
    currentState = readLocalState();
    initialized = true;
  }
  return currentState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_STATE_KEY) { currentState = readLocalState(); emit(); }
  };
  window.addEventListener("storage", handleStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", handleStorage); };
}

function updateStore(next: LocalUserStateV1) {
  currentState = next;
  initialized = true;
  writeLocalState(next);
  emit();
}

interface UserStateContextValue {
  state: LocalUserStateV1;
  update: (update: Partial<LocalUserStateV1>) => void;
  toggleSaved: (quoteID: string) => void;
  toggleFavoriteCategory: (category: string) => void;
  reset: () => void;
}

const UserStateContext = createContext<UserStateContextValue | null>(null);

export function UserStateProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, initializeStore, () => defaultLocalState);
  const update = useCallback((partial: Partial<LocalUserStateV1>) => updateStore({ ...initializeStore(), ...partial, schemaVersion: 1 }), []);
  const toggleSaved = useCallback((quoteID: string) => {
    const previous = initializeStore();
    const savedIDs = previous.savedIDs.includes(quoteID) ? previous.savedIDs.filter((id) => id !== quoteID) : [...previous.savedIDs, quoteID];
    updateStore({ ...previous, savedIDs });
  }, []);
  const toggleFavoriteCategory = useCallback((category: string) => {
    const previous = initializeStore();
    const favoriteCategories = previous.favoriteCategories.includes(category) ? previous.favoriteCategories.filter((item) => item !== category) : [...previous.favoriteCategories, category];
    updateStore({ ...previous, favoriteCategories });
  }, []);
  const reset = useCallback(() => updateStore(defaultLocalState), []);
  const value = useMemo(() => ({ state, update, toggleSaved, toggleFavoriteCategory, reset }), [state, update, toggleSaved, toggleFavoriteCategory, reset]);
  return <UserStateContext.Provider value={value}>{children}</UserStateContext.Provider>;
}

export function useUserState() {
  const value = useContext(UserStateContext);
  if (!value) throw new Error("useUserState must be used within UserStateProvider");
  return value;
}
