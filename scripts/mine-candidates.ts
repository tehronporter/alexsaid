import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { candidateShardSchema, type CandidateRecord } from "../src/domain/editorial";
import { sourceShardSchema, type SourceRecord } from "../src/domain/source";
import { CACHE_ROOT, CONTENT_ROOT, listJSONFiles, readJSON, sha256, writeJSONIfChanged } from "../src/lib/content-files";
import { loadSourceShards } from "../src/lib/source-inventory";
import { areContiguousCues, parseVTT, type VTTCue } from "../src/lib/vtt";

const mineAll = process.argv.includes("--all");
const requestedLimit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 50);
const perSourceLimit = Number(process.argv.find((arg) => arg.startsWith("--per-source="))?.split("=")[1] ?? 12);
const now = new Date().toISOString();

const blockedPatterns = /\b(download|subscribe|sponsor|disclosure|copyright|free trial|link in (?:the )?description|welcome (?:back )?to|in this (?:video|episode)|today's episode|terms and conditions)\b/i;
const weakStart = /^(and|but|so|because|which|that|then|like|or|uh|um)\b/i;
const firstPersonAttribution = /\b(he said|she said|they said|my (?:friend|mentor|dad|father|mother) (?:said|told me)|quote unquote)\b/i;

function wordCount(value: string) { return value.trim().split(/\s+/).filter(Boolean).length; }
function completeThought(value: string) {
  return /[.!?]["']?$/.test(value) && !/(?:\.\.\.|…)\s*$/.test(value) && !/[:;,]\s*$/.test(value);
}

function candidateScore(text: string) {
  const words = wordCount(text);
  let score = 0;
  if (words >= 7 && words <= 34) score += 4;
  else if (words <= 50) score += 2;
  if (completeThought(text)) score += 3;
  if (/\b(if|because|when|the reason|the fastest|the easiest|the biggest|you|your|business|customer|sales|offer|money|focus|decision)\b/i.test(text)) score += 2;
  if (weakStart.test(text)) score -= 2;
  if (/\b(uh|um|you know|kind of|sort of)\b/i.test(text)) score -= 2;
  return score;
}

function mineCueWindows(source: SourceRecord, cues: readonly VTTCue[], fingerprint: string): CandidateRecord[] {
  const candidates: CandidateRecord[] = [];
  for (let start = 0; start < cues.length; start += 1) {
    for (let length = 1; length <= 4 && start + length <= cues.length; length += 1) {
      const window = cues.slice(start, start + length);
      if (!areContiguousCues(window)) throw new Error(`Non-contiguous cue window in ${source.sourceID}`);
      const text = window.map((cue) => cue.text).join(" ").replace(/\s+/g, " ").trim();
      const words = wordCount(text);
      if (words > 70 || text.length > 420) break;
      if (words < 3 || !completeThought(text) || blockedPatterns.test(text) || firstPersonAttribution.test(text)) continue;
      const score = candidateScore(text);
      if (score < 4) continue;
      const keyHash = sha256(`${source.sourceID}:${window[0].index}:${window.at(-1)!.index}:${text}`).slice(7, 19);
      candidates.push({
        candidateKey: `${source.sourceID}-${keyHash}`,
        sourceID: source.sourceID,
        provider: source.provider,
        transcriptFingerprint: fingerprint,
        cueStart: window[0].index,
        cueEnd: window.at(-1)!.index,
        startSeconds: window[0].startSeconds,
        endSeconds: window.at(-1)!.endSeconds,
        text,
        wordCount: words,
        score,
        status: "candidate",
        minedAt: now,
        rejectionReason: null
      });
    }
  }
  const ranked = candidates.sort((left, right) => right.score - left.score || left.startSeconds - right.startSeconds);
  const accepted: CandidateRecord[] = [];
  for (const candidate of ranked) {
    const overlaps = accepted.some((other) => candidate.cueStart <= other.cueEnd && candidate.cueEnd >= other.cueStart);
    if (!overlaps) accepted.push(candidate);
    if (accepted.length >= perSourceLimit) break;
  }
  return accepted.sort((left, right) => left.startSeconds - right.startSeconds);
}

function stratified(sources: SourceRecord[], limit: number) {
  if (sources.length <= limit) return sources;
  const years = [...Map.groupBy(sources, (source) => source.publishedAt!.slice(0, 4)).entries()].sort(([left], [right]) => right.localeCompare(left));
  const selected: SourceRecord[] = [];
  let round = 0;
  while (selected.length < limit) {
    let added = false;
    for (const [, yearSources] of years) {
      const sorted = yearSources.sort((left, right) => right.publishedAt!.localeCompare(left.publishedAt!) || left.sourceID.localeCompare(right.sourceID));
      if (round >= sorted.length) continue;
      selected.push(sorted[round]);
      added = true;
      if (selected.length === limit) break;
    }
    if (!added) break;
    round += 1;
  }
  return selected;
}

async function transcriptFor(source: SourceRecord) {
  if (!source.transcriptURL) throw new Error("No transcript URL");
  const path = join(CACHE_ROOT, "transcripts", source.provider, `${source.externalID}.vtt`);
  let text: string;
  try { text = await readFile(path, "utf8"); }
  catch {
    const response = await fetch(source.transcriptURL);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    text = await response.text();
    await mkdir(join(CACHE_ROOT, "transcripts", source.provider), { recursive: true });
    await writeFile(path, text, "utf8");
  }
  const checksum = sha256(text);
  if (source.transcriptChecksum && checksum !== source.transcriptChecksum) throw new Error(`Transcript checksum changed for ${source.sourceID}; run content:sources:sync and review the source`);
  return { text, checksum };
}

const sourceShards = await loadSourceShards();
const eligible = sourceShards.flatMap(({ shard }) => shard.sources).filter((source) => source.provider === "the-game-rss" && source.status === "ready" && source.transcriptURL);
const selected = mineAll ? eligible : stratified(eligible, requestedLimit);
const existingFiles = await listJSONFiles(join(CONTENT_ROOT, "candidates"));
const existingShards = await Promise.all(existingFiles.map(async (file) => candidateShardSchema.parse(await readJSON<unknown>(file))));
const existingByKey = new Map(existingShards.flatMap((shard) => shard.candidates).map((candidate) => [candidate.candidateKey, candidate]));
const minedByYear = new Map<number, CandidateRecord[]>();
const minedSourceIDs = new Set<string>();

for (const [index, source] of selected.entries()) {
  try {
    const transcript = await transcriptFor(source);
    const mined = mineCueWindows(source, parseVTT(transcript.text), transcript.checksum).map((candidate) => {
      const old = existingByKey.get(candidate.candidateKey);
      return old ? { ...candidate, status: old.status, minedAt: old.minedAt, rejectionReason: old.rejectionReason } : candidate;
    });
    const year = Number(source.publishedAt!.slice(0, 4));
    minedByYear.set(year, [...(minedByYear.get(year) ?? []), ...mined]);
    minedSourceIDs.add(source.sourceID);
  } catch (error) {
    console.error(`\nSkipped ${source.sourceID}: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.stdout.write(`\rMined ${index + 1}/${selected.length} ${mineAll ? "archive" : "pilot"} sources`);
}
process.stdout.write("\n");

for (const [year, newCandidates] of minedByYear) {
  const previous = existingShards.find((shard) => shard.provider === "the-game-rss" && shard.year === year)?.candidates ?? [];
  const minedIDs = new Set(newCandidates.map((candidate) => candidate.sourceID));
  const candidates = [...previous.filter((candidate) => !minedIDs.has(candidate.sourceID)), ...newCandidates].sort((left, right) => left.sourceID.localeCompare(right.sourceID) || left.startSeconds - right.startSeconds);
  await writeJSONIfChanged(join(CONTENT_ROOT, "candidates", "the-game-rss", `${year}.json`), candidateShardSchema.parse({ schemaVersion: 1, provider: "the-game-rss", year, updatedAt: now, candidates }));
}

for (const { file, shard } of sourceShards) {
  const changed = shard.sources.some((source) => minedSourceIDs.has(source.sourceID));
  if (!changed) continue;
  await writeJSONIfChanged(file, sourceShardSchema.parse({
    ...shard,
    updatedAt: now,
    sources: shard.sources.map((source) => minedSourceIDs.has(source.sourceID) && source.status === "ready" ? { ...source, status: "mined" as const } : source)
  }));
}

const count = [...minedByYear.values()].flat().length;
console.log(`Candidate mining complete: ${selected.length} sources, ${count} contiguous candidates (${perSourceLimit} max/source)`);
