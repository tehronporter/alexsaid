"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { quoteCatalogV3Schema, type Quote, type QuoteCatalogV2, type QuoteCatalogV3 } from "@/domain/catalog";
import { createQuoteSearchIndex } from "@/lib/search";

interface CatalogContextValue {
  catalog: QuoteCatalogV2 | null;
  catalogV3: QuoteCatalogV3 | null;
  loading: boolean;
  error: string | null;
  search: (query: string) => readonly Quote[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function hydrateCatalog(v3: QuoteCatalogV3): QuoteCatalogV2 {
  const sourceByID = new Map(v3.sources.map((source) => [source.sourceID, source]));
  return {
    schemaVersion: 2,
    generatedAt: v3.generatedAt,
    developmentFixture: v3.developmentFixture,
    categories: v3.categories,
    collections: v3.collections,
    quotes: v3.quotes.map((quote) => {
      const source = sourceByID.get(quote.sourceID);
      if (!source) throw new Error(`Catalog source is missing: ${quote.sourceID}`);
      let sourceURL = source.canonicalURL;
      if (source.mediaURL && quote.sourceLocator.kind === "media") {
        const media = new URL(source.mediaURL);
        if (media.hostname === "youtube.com" || media.hostname.endsWith(".youtube.com") || media.hostname === "youtu.be") media.searchParams.set("t", `${quote.sourceLocator.startSeconds}s`);
        else media.hash = `t=${quote.sourceLocator.startSeconds}`;
        sourceURL = media.toString();
      }
      return { ...quote, sourceType: source.sourceType, sourceTitle: source.title, sourceURL, sourceDate: source.publishedAt };
    })
  };
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalogV3, setCatalogV3] = useState<QuoteCatalogV3 | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/catalog.v3.json", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
        return quoteCatalogV3Schema.parse(await response.json());
      })
      .then(setCatalogV3)
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Catalog request failed");
      });
    return () => controller.abort();
  }, []);

  const catalog = useMemo(() => catalogV3 ? hydrateCatalog(catalogV3) : null, [catalogV3]);
  const index = useMemo(() => createQuoteSearchIndex(catalog?.quotes ?? []), [catalog?.quotes]);
  const value = useMemo(() => ({ catalog, catalogV3, loading: !catalogV3 && !error, error, search: index.search }), [catalog, catalogV3, error, index.search]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used within CatalogProvider");
  return value;
}

export function useOptionalCatalog() {
  return useContext(CatalogContext);
}
