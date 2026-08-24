import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { sourceShardSchema, type SourceRecord } from "../src/domain/source";
import { CACHE_ROOT, sha256, writeJSONIfChanged } from "../src/lib/content-files";
import { loadSources, sourceShardPath } from "../src/lib/source-inventory";

const FEED_URL = "https://rss2.flightcast.com/zz5nwp81tktx53wb8fw6qq7j.xml";
const CONCURRENCY = 10;
const metadataOnly = process.argv.includes("--metadata-only");

type RSSValue = string | number | { "#text"?: string; "@_url"?: string } | undefined;
type RSSItem = Record<string, RSSValue>;

function textValue(value: RSSValue) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?.["#text"] ?? "";
}

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLocaleLowerCase()] ?? entity;
  });
}

function attrURL(value: RSSValue) {
  return typeof value === "object" ? value?.["@_url"] ?? null : null;
}

function durationSeconds(value: RSSValue) {
  const raw = textValue(value);
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);
  const parts = raw.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function stableExternalID(item: RSSItem) {
  const guid = textValue(item.guid).replace(/^flightcast:/, "");
  if (guid) return guid.toLocaleLowerCase();
  const transcript = attrURL(item["podcast:transcript"]);
  const transcriptID = transcript?.match(/\/([^/]+)\.vtt(?:\?|$)/)?.[1];
  if (transcriptID) return transcriptID.toLocaleLowerCase();
  throw new Error(`RSS item has no stable external ID: ${textValue(item.title)}`);
}

async function transcriptData(source: SourceRecord, previous?: SourceRecord) {
  if (!source.transcriptURL || metadataOnly) return { checksum: previous?.transcriptChecksum ?? null, status: source.transcriptURL ? "ready" as const : "blocked" as const };
  const cachePath = join(CACHE_ROOT, "transcripts", source.provider, `${source.externalID}.vtt`);
  let transcript: string | null = null;
  try { transcript = await readFile(cachePath, "utf8"); } catch { /* Cache miss. */ }
  if (transcript === null) {
    const response = await fetch(source.transcriptURL);
    if (!response.ok) throw new Error(`${response.status} ${source.transcriptURL}`);
    transcript = await response.text();
    await mkdir(join(CACHE_ROOT, "transcripts", source.provider), { recursive: true });
    await writeFile(cachePath, transcript, "utf8");
  }
  return { checksum: sha256(transcript), status: "ready" as const };
}

const response = await fetch(FEED_URL);
if (!response.ok) throw new Error(`RSS sync failed: ${response.status} ${response.statusText}`);
const xml = await response.text();
const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" }).parse(xml) as { rss: { channel: { item: RSSItem[] } } };
const items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
const previous = new Map((await loadSources()).map((source) => [source.sourceID, source]));
const retrievedAt = new Date().toISOString();
const sources: SourceRecord[] = [];

for (let offset = 0; offset < items.length; offset += CONCURRENCY) {
  const batch = items.slice(offset, offset + CONCURRENCY);
  const normalized = await Promise.all(batch.map(async (item): Promise<SourceRecord> => {
    const externalID = stableExternalID(item);
    const sourceID = `the-game-rss-${externalID}`;
    const old = previous.get(sourceID);
    const mediaURL = attrURL(item.enclosure);
    const transcriptURL = attrURL(item["podcast:transcript"]);
    const publishedAt = new Date(textValue(item.pubDate)).toISOString().slice(0, 10);
    const base: SourceRecord = {
      sourceID,
      externalID,
      provider: "the-game-rss",
      sourceType: "podcast",
      title: decodeEntities(textValue(item["itunes:title"] ?? item.title)),
      publisher: "Alex Hormozi · The Game",
      publishedAt,
      durationSeconds: durationSeconds(item["itunes:duration"]),
      canonicalURL: mediaURL ?? FEED_URL,
      mediaURL,
      transcriptURL,
      transcriptChecksum: old?.transcriptChecksum ?? null,
      retrievedAt: old?.retrievedAt ?? retrievedAt,
      discoveryMethod: "official-the-game-rss",
      status: transcriptURL && mediaURL ? "ready" : "blocked",
      exclusionReason: null,
      blockingReason: transcriptURL && mediaURL ? null : "Official RSS item is missing direct audio or a public transcript"
    };
    try {
      const transcript = await transcriptData(base, old);
      return sourceShardSchema.shape.sources.element.parse({
        ...base,
        transcriptChecksum: transcript.checksum,
        status: old && ["mined", "reviewed", "excluded"].includes(old.status) ? old.status : transcript.status,
        blockingReason: transcript.status === "blocked" ? base.blockingReason : null
      });
    } catch (error) {
      return sourceShardSchema.shape.sources.element.parse({
        ...base,
        status: "blocked",
        blockingReason: `Transcript retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }));
  sources.push(...normalized);
  process.stdout.write(`\rSynchronized ${Math.min(offset + CONCURRENCY, items.length)}/${items.length} sources`);
}
process.stdout.write("\n");

const byYear = Map.groupBy(sources, (source) => Number(source.publishedAt!.slice(0, 4)));
let changed = 0;
for (const [year, yearSources] of [...byYear.entries()].sort(([left], [right]) => left - right)) {
  const path = sourceShardPath("the-game-rss", year);
  let oldUpdatedAt: string | null = null;
  try { oldUpdatedAt = sourceShardSchema.parse(JSON.parse(await readFile(path, "utf8"))).updatedAt; } catch { /* New shard. */ }
  const sorted = yearSources.sort((left, right) => left.publishedAt!.localeCompare(right.publishedAt!) || left.sourceID.localeCompare(right.sourceID));
  const provisional = { schemaVersion: 1 as const, provider: "the-game-rss" as const, year, updatedAt: oldUpdatedAt ?? retrievedAt, sources: sorted };
  const stableOld = oldUpdatedAt ? JSON.stringify({ ...provisional, updatedAt: oldUpdatedAt }) : null;
  let existing: string | null = null;
  try { existing = JSON.stringify(JSON.parse(await readFile(path, "utf8"))); } catch { /* New shard. */ }
  const shard = sourceShardSchema.parse(existing === stableOld ? provisional : { ...provisional, updatedAt: retrievedAt });
  if (await writeJSONIfChanged(path, shard)) changed += 1;
}

console.log(`Source inventory: ${sources.length} official RSS episodes across ${byYear.size} years (${changed} shards changed)`);

await import("./sync-youtube-sources");
await import("./sync-acquisition-sources");
