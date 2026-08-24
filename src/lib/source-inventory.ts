import { join } from "node:path";
import { sourceShardSchema, type SourceRecord, type SourceShard } from "@/domain/source";
import { CONTENT_ROOT, listJSONFiles, readJSON } from "@/lib/content-files";

export const SOURCE_INVENTORY_ROOT = join(CONTENT_ROOT, "sources");

export async function loadSourceShards() {
  const files = await listJSONFiles(SOURCE_INVENTORY_ROOT);
  return Promise.all(files.map(async (file) => ({ file, shard: sourceShardSchema.parse(await readJSON<unknown>(file)) })));
}

export async function loadSources(): Promise<SourceRecord[]> {
  const shards = await loadSourceShards();
  return shards.flatMap(({ shard }) => shard.sources).sort((left, right) => left.sourceID.localeCompare(right.sourceID));
}

export function sourceShardPath(provider: SourceShard["provider"], year: number | null) {
  return join(SOURCE_INVENTORY_ROOT, provider, `${year ?? "undated"}.json`);
}

export function indexSources(sources: readonly SourceRecord[]) {
  return new Map(sources.map((source) => [source.sourceID, source]));
}
