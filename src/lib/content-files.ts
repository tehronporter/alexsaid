import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";

export const CONTENT_ROOT = resolve("content");
export const CACHE_ROOT = resolve(".content-cache");

export function sha256(value: string | Uint8Array) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export async function readJSON<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function writeJSONIfChanged(path: string, value: unknown) {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  let previous: string | null = null;
  try { previous = await readFile(path, "utf8"); } catch { /* New file. */ }
  if (previous === next) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, next, "utf8");
  return true;
}

export async function listJSONFiles(directory: string): Promise<string[]> {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return []; }
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listJSONFiles(path);
    return entry.isFile() && entry.name.endsWith(".json") ? [path] : [];
  }));
  return nested.flat().sort();
}
