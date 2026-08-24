import { readFile } from "node:fs/promises";
import { sourceShardSchema, type SourceRecord } from "../src/domain/source";
import { writeJSONIfChanged } from "../src/lib/content-files";
import { loadSources, sourceShardPath } from "../src/lib/source-inventory";

const SITEMAP_URL = "https://www.acquisition.com/sitemap.xml";
const CONCURRENCY = 10;

function decodeEntities(value: string) {
  return value.replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/\s+/g, " ").trim();
}

function externalID(url: URL) {
  return url.pathname.replace(/^\/+|\/+$/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-") || "home";
}

async function pageMetadata(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const title = decodeEntities(html.match(/property="og:title" content="([^"]+)"/i)?.[1] ?? html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? new URL(url).pathname);
  const author = decodeEntities(html.match(/name="author" content="([^"]+)"/i)?.[1] ?? "Acquisition.com");
  const youtubeIDs = [...new Set([...html.matchAll(/youtube\.com\/(?:embed\/|watch\?v=)([A-Za-z0-9_-]{11})/g)].map((match) => match[1]))];
  return { title, author, youtubeIDs };
}

const sitemapResponse = await fetch(SITEMAP_URL);
if (!sitemapResponse.ok) throw new Error(`Acquisition.com sitemap failed: ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(https:\/\/www\.acquisition\.com\/[^<]*)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => {
    const path = new URL(url).pathname;
    return path === "/training" || path.startsWith("/training/") || path.includes("audiobook");
  });
const existingSources = await loadSources();
const existingByID = new Map(existingSources.map((source) => [source.sourceID, source]));
const youtubeByExternalID = new Map(existingSources.filter((source) => source.provider === "youtube").map((source) => [source.externalID, source]));
const retrievedAt = new Date().toISOString();
const sources: SourceRecord[] = [];

for (let offset = 0; offset < urls.length; offset += CONCURRENCY) {
  const batch = urls.slice(offset, offset + CONCURRENCY);
  const normalized = await Promise.all(batch.map(async (urlValue): Promise<SourceRecord> => {
    const url = new URL(urlValue);
    const id = externalID(url);
    const sourceID = `acquisition-com-${id}`;
    const existing = existingByID.get(sourceID);
    try {
      const page = await pageMetadata(urlValue);
      const matchedVideo = page.youtubeIDs.map((videoID) => youtubeByExternalID.get(videoID)).find(Boolean);
      const mediaURL = page.youtubeIDs[0] ? `https://www.youtube.com/watch?v=${page.youtubeIDs[0]}` : null;
      const duplicate = Boolean(matchedVideo);
      return {
        sourceID,
        externalID: id,
        provider: "acquisition-com",
        sourceType: mediaURL ? "video" : "article",
        title: page.title,
        publisher: page.author,
        publishedAt: matchedVideo?.publishedAt ?? existing?.publishedAt ?? null,
        durationSeconds: matchedVideo?.durationSeconds ?? null,
        canonicalURL: urlValue,
        mediaURL,
        transcriptURL: null,
        transcriptChecksum: null,
        retrievedAt: existing?.retrievedAt ?? retrievedAt,
        discoveryMethod: "official-acquisition-com-sitemap",
        status: duplicate ? "excluded" : "blocked",
        exclusionReason: duplicate ? `Embedded official YouTube upload is already inventoried as ${matchedVideo!.sourceID}` : null,
        blockingReason: duplicate ? null : mediaURL ? "Free official training media requires direct speaker attribution and two listening passes" : "Public page has no direct Alex Hormozi byline or stable media transcript and requires manual attribution review"
      };
    } catch (error) {
      return {
        sourceID,
        externalID: id,
        provider: "acquisition-com",
        sourceType: "article",
        title: existing?.title ?? url.pathname,
        publisher: "Acquisition.com",
        publishedAt: existing?.publishedAt ?? null,
        durationSeconds: null,
        canonicalURL: urlValue,
        mediaURL: null,
        transcriptURL: null,
        transcriptChecksum: null,
        retrievedAt: existing?.retrievedAt ?? retrievedAt,
        discoveryMethod: "official-acquisition-com-sitemap",
        status: "blocked",
        exclusionReason: null,
        blockingReason: `Official page retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }));
  sources.push(...normalized);
  process.stdout.write(`\rInventoried ${Math.min(offset + CONCURRENCY, urls.length)}/${urls.length} official training/audiobook pages`);
}
process.stdout.write("\n");

let changed = 0;
for (const [year, yearSources] of Map.groupBy(sources, (source) => source.publishedAt ? Number(source.publishedAt.slice(0, 4)) : null)) {
  const path = sourceShardPath("acquisition-com", year);
  let oldUpdatedAt: string | null = null;
  let existing: string | null = null;
  try {
    const old = sourceShardSchema.parse(JSON.parse(await readFile(path, "utf8")));
    oldUpdatedAt = old.updatedAt;
    existing = JSON.stringify(old);
  } catch { /* New shard. */ }
  const sorted = yearSources.sort((left, right) => (left.publishedAt ?? "").localeCompare(right.publishedAt ?? "") || left.sourceID.localeCompare(right.sourceID));
  const stable = sourceShardSchema.parse({ schemaVersion: 1, provider: "acquisition-com", year, updatedAt: oldUpdatedAt ?? retrievedAt, sources: sorted });
  const shard = existing === JSON.stringify(stable) ? stable : { ...stable, updatedAt: retrievedAt };
  if (await writeJSONIfChanged(path, sourceShardSchema.parse(shard))) changed += 1;
}
console.log(`Acquisition.com inventory: ${sources.length} free training/audiobook pages (${sources.filter((source) => source.status === "excluded").length} matched official videos, ${sources.filter((source) => source.status === "blocked").length} blocked with reasons, ${changed} shards changed)`);
