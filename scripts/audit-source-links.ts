import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import catalogJSON from "../src/data/catalog.v3.json";
import { quoteCatalogV3Schema, type PublicSource } from "../src/domain/catalog";

const catalog = quoteCatalogV3Schema.parse(catalogJSON);
const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const delay = (milliseconds: number) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

function auditURL(source: PublicSource) {
  const canonical = new URL(source.canonicalURL);
  if (canonical.hostname === "youtube.com" || canonical.hostname.endsWith(".youtube.com") || canonical.hostname === "youtu.be") {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("url", source.canonicalURL);
    return endpoint.toString();
  }
  if (canonical.hostname === "x.com" || canonical.hostname.endsWith(".x.com") || canonical.hostname === "twitter.com") {
    const endpoint = new URL("https://publish.x.com/oembed");
    endpoint.searchParams.set("omit_script", "true");
    endpoint.searchParams.set("dnt", "true");
    endpoint.searchParams.set("url", source.canonicalURL.replace("x.com/", "twitter.com/"));
    return endpoint.toString();
  }
  return source.canonicalURL;
}

type Result = { sourceID: string; canonicalURL: string; auditURL: string; outcome: "ok" | "retryable-failure" | "terminal-failure"; status: number | null; attempts: number; detail: string };
const results: Result[] = [];

for (const source of catalog.sources) {
  const url = auditURL(source);
  let result: Result | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: { "user-agent": "HormoziSaidSourceAudit/1.0" } });
      if (response.ok) {
        result = { sourceID: source.sourceID, canonicalURL: source.canonicalURL, auditURL: url, outcome: "ok", status: response.status, attempts: attempt, detail: `Resolved to ${response.url}` };
        break;
      }
      const retryable = retryableStatuses.has(response.status);
      result = { sourceID: source.sourceID, canonicalURL: source.canonicalURL, auditURL: url, outcome: retryable ? "retryable-failure" : "terminal-failure", status: response.status, attempts: attempt, detail: `HTTP ${response.status} ${response.statusText}` };
      if (!retryable) break;
    } catch (error) {
      result = { sourceID: source.sourceID, canonicalURL: source.canonicalURL, auditURL: url, outcome: "retryable-failure", status: null, attempts: attempt, detail: error instanceof Error ? error.message : String(error) };
    }
    if (attempt < 3) await delay(500 * attempt);
  }
  results.push(result!);
  const label = result!.outcome === "ok" ? "OK" : result!.outcome === "retryable-failure" ? "RETRYABLE" : "TERMINAL";
  console.log(`${label} ${source.sourceID} -> ${source.canonicalURL} (${result!.detail})`);
}

const report = { generatedAt: new Date().toISOString(), sourceCount: catalog.sources.length, results };
await writeFile(resolve("content/link-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const failures = results.filter((result) => result.outcome !== "ok");
if (failures.length > 0) {
  console.error(`Source-link audit failed: ${failures.filter((result) => result.outcome === "retryable-failure").length} retryable, ${failures.filter((result) => result.outcome === "terminal-failure").length} terminal`);
  process.exit(1);
}
console.log(`Validated ${catalog.quotes.length} quotes through ${catalog.sources.length} normalized direct sources.`);
