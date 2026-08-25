import { access, mkdir, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { sourceShardSchema, type SourceRecord } from "../src/domain/source";
import { CACHE_ROOT, writeJSONIfChanged } from "../src/lib/content-files";
import { loadSources, sourceShardPath } from "../src/lib/source-inventory";

const execute = promisify(execFile);
const CHANNEL_URL = "https://www.youtube.com/@AlexHormozi/videos";
const VENV = join(CACHE_ROOT, "yt-dlp-venv");
const YT_DLP = join(VENV, "bin", "yt-dlp");
const CONCURRENCY = 12;

async function ensureYTDLP() {
  try { await access(YT_DLP); return; } catch { /* Bootstrap the gitignored free source-enumeration tool. */ }
  await mkdir(CACHE_ROOT, { recursive: true });
  await execute("python3", ["-m", "venv", VENV]);
  await execute(join(VENV, "bin", "pip"), ["install", "--quiet", "yt-dlp==2026.8.19"], { maxBuffer: 10_000_000 });
}

function decodeEntities(value: string) {
  return value.replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/\s+/g, " ").trim();
}

function titleKey(value: string) {
  return decodeEntities(value).toLocaleLowerCase().replace(/\s*\|\s*ep\s*\d+\s*$/i, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function stableSourceID(videoID: string) {
  return `youtube-${videoID.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

async function uploadDate(videoID: string) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoID}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const value = html.match(/"uploadDate":"(\d{4}-\d{2}-\d{2})[^" ]*"/)?.[1] ?? html.match(/itemprop="uploadDate" content="(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!value) throw new Error("YouTube watch page omitted uploadDate");
  return value;
}

await ensureYTDLP();
const { stdout } = await execute(YT_DLP, ["--no-check-certificates", "--flat-playlist", "--dump-single-json", CHANNEL_URL], { maxBuffer: 30_000_000 });
const playlist = JSON.parse(stdout) as { channel?: string; channel_id?: string; channel_is_verified?: boolean; entries?: { id: string; title: string; duration?: number | null; url?: string }[] };
if (playlist.channel !== "Alex Hormozi" || playlist.channel_id !== "UCUyDOdBWhC1MCxEjC46d-zw" || !playlist.channel_is_verified) throw new Error("YouTube enumeration did not resolve the verified official Alex Hormozi channel");
const entries = playlist.entries ?? [];
const existingSources = await loadSources();
const existingByID = new Map(existingSources.map((source) => [source.sourceID, source]));
const podcastTitles = new Set(existingSources.filter((source) => source.provider === "the-game-rss").map((source) => titleKey(source.title)));
const retrievedAt = new Date().toISOString();
const sources: SourceRecord[] = [];

for (let offset = 0; offset < entries.length; offset += CONCURRENCY) {
  const batch = entries.slice(offset, offset + CONCURRENCY);
  const normalized = await Promise.all(batch.map(async (entry): Promise<SourceRecord> => {
    const sourceID = stableSourceID(entry.id);
    const existing = existingByID.get(sourceID);
    const canonicalURL = `https://www.youtube.com/watch?v=${entry.id}`;
    let publishedAt: string;
    try { publishedAt = existing?.publishedAt ?? await uploadDate(entry.id); }
    catch (error) { throw new Error(`${sourceID}: ${error instanceof Error ? error.message : String(error)}`); }
    const duplicatePodcast = podcastTitles.has(titleKey(entry.title));
    const status = existing?.status === "reviewed" ? "reviewed" as const : duplicatePodcast ? "excluded" as const : "blocked" as const;
    return {
      sourceID,
      externalID: entry.id,
      provider: "youtube",
      sourceType: "video",
      title: decodeEntities(entry.title),
      publisher: "Alex Hormozi · YouTube",
      publishedAt,
      durationSeconds: entry.duration ? Math.round(entry.duration) : existing?.durationSeconds ?? null,
      canonicalURL,
      mediaURL: canonicalURL,
      transcriptURL: null,
      transcriptChecksum: existing?.transcriptChecksum ?? null,
      retrievedAt: existing?.retrievedAt ?? retrievedAt,
      discoveryMethod: "verified-official-youtube-channel-enumeration",
      status,
      exclusionReason: duplicatePodcast ? "Title matches an episode already inventoried from the official The Game RSS archive" : null,
      blockingReason: status === "blocked" ? "YouTube captions are discovery-only and no stable public transcript URL is exposed; direct media mining and two listening passes are required" : null
    };
  }));
  sources.push(...normalized);
  process.stdout.write(`\rEnumerated ${Math.min(offset + CONCURRENCY, entries.length)}/${entries.length} official YouTube uploads`);
}
process.stdout.write("\n");

let changed = 0;
for (const [year, yearSources] of Map.groupBy(sources, (source) => Number(source.publishedAt!.slice(0, 4)))) {
  const path = sourceShardPath("youtube", year);
  let oldUpdatedAt: string | null = null;
  let existing: string | null = null;
  try {
    const old = sourceShardSchema.parse(JSON.parse(await readFile(path, "utf8")));
    oldUpdatedAt = old.updatedAt;
    existing = JSON.stringify(old);
  } catch { /* New shard. */ }
  const sorted = yearSources.sort((left, right) => left.publishedAt!.localeCompare(right.publishedAt!) || left.sourceID.localeCompare(right.sourceID));
  const stable = sourceShardSchema.parse({ schemaVersion: 1, provider: "youtube", year, updatedAt: oldUpdatedAt ?? retrievedAt, sources: sorted });
  const shard = existing === JSON.stringify(stable) ? stable : { ...stable, updatedAt: retrievedAt };
  if (await writeJSONIfChanged(path, sourceShardSchema.parse(shard))) changed += 1;
}
console.log(`YouTube inventory: ${sources.length} verified-channel uploads (${sources.filter((source) => source.status === "excluded").length} matched to RSS, ${sources.filter((source) => source.status === "blocked").length} blocked for media review, ${changed} shards changed)`);
