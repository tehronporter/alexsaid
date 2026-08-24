import type { Metadata } from "next";
import { DiscoverView } from "@/components/discover-view";
import { PageHeader } from "@/components/page-header";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Discover", description: "Search verified business quotes by topic, collection, and source." };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic = "" } = await searchParams;
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow={`${catalog.quotes.length} verified ideas`}
        title="Discover"
        description="Search the library or browse by topic."
      />
      <DiscoverView
        key={topic}
        quotes={catalog.quotes}
        categories={catalog.categories}
        collections={catalog.collections}
        initialTopic={topic}
      />
    </main>
  );
}
