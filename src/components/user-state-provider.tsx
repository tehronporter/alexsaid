"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { LocalUserStateV1 } from "@/domain/catalog";
import { defaultLocalState, LOCAL_STATE_KEY, readLocalState, writeLocalState } from "@/lib/local-state";

interface LocalStore {
  currentState: LocalUserStateV1;
  initialized: boolean;
  listeners: Set<() => void>;
}

const stores = new Map<string, LocalStore>();

function getStore(storageKey: string) {
  let store = stores.get(storageKey);
  if (!store) {
    store = { currentState: defaultLocalState, initialized: false, listeners: new Set() };
    stores.set(storageKey, store);
  }
  return store;
}

function emit(storageKey: string) {
  for (const listener of getStore(storageKey).listeners) listener();
}

function initializeStore(storageKey: string) {
  const store = getStore(storageKey);
  if (typeof window !== "undefined" && !store.initialized) {
    store.currentState = readLocalState(undefined, storageKey);
    store.initialized = true;
  }
  return store.currentState;
}

function subscribe(storageKey: string, listener: () => void) {
  const store = getStore(storageKey);
  store.listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      store.currentState = readLocalState(undefined, storageKey);
      emit(storageKey);
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => { store.listeners.delete(listener); window.removeEventListener("storage", handleStorage); };
}

function updateStore(storageKey: string, next: LocalUserStateV1) {
  const store = getStore(storageKey);
  store.currentState = next;
  store.initialized = true;
  writeLocalState(next, storageKey);
  emit(storageKey);
}

interface UserStateContextValue {
  state: LocalUserStateV1;
  update: (update: Partial<LocalUserStateV1>) => void;
  toggleSaved: (quoteID: string) => void;
  toggleFavoriteCategory: (category: string) => void;
  reset: () => void;
}

const UserStateContext = createContext<UserStateContextValue | null>(null);

export function UserStateProvider({ storageKey = LOCAL_STATE_KEY, children }: { storageKey?: string; children: React.ReactNode }) {
  const subscribeToStore = useCallback((listener: () => void) => subscribe(storageKey, listener), [storageKey]);
  const readStore = useCallback(() => initializeStore(storageKey), [storageKey]);
  const state = useSyncExternalStore(subscribeToStore, readStore, () => defaultLocalState);
  const update = useCallback((partial: Partial<LocalUserStateV1>) => updateStore(storageKey, { ...initializeStore(storageKey), ...partial, schemaVersion: 1 }), [storageKey]);
  const toggleSaved = useCallback((quoteID: string) => {
    const previous = initializeStore(storageKey);
    const savedIDs = previous.savedIDs.includes(quoteID) ? previous.savedIDs.filter((id) => id !== quoteID) : [...previous.savedIDs, quoteID];
    updateStore(storageKey, { ...previous, savedIDs });
  }, [storageKey]);
  const toggleFavoriteCategory = useCallback((category: string) => {
    const previous = initializeStore(storageKey);
    const favoriteCategories = previous.favoriteCategories.includes(category) ? previous.favoriteCategories.filter((item) => item !== category) : [...previous.favoriteCategories, category];
    updateStore(storageKey, { ...previous, favoriteCategories });
  }, [storageKey]);
  const reset = useCallback(() => updateStore(storageKey, defaultLocalState), [storageKey]);
  const value = useMemo(() => ({ state, update, toggleSaved, toggleFavoriteCategory, reset }), [state, update, toggleSaved, toggleFavoriteCategory, reset]);
  return <UserStateContext.Provider value={value}>{children}</UserStateContext.Provider>;
}

export function useUserState() {
  const value = useContext(UserStateContext);
  if (!value) throw new Error("useUserState must be used within UserStateProvider");
  return value;
}
