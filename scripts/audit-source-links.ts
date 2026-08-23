import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { editorialLedgerSchema } from "../src/domain/editorial";

const ledgerPath = resolve(process.argv[2] ?? "content/editorial-ledger.json");
const ledger = editorialLedgerSchema.parse(JSON.parse(await readFile(ledgerPath, "utf8")));
const sources = [...new Map(ledger.records
  .filter(({ status }) => status === "verified")
  .map((record) => [record.sourceURL, record])).values()];
const failures: string[] = [];

for (const record of sources) {
  try {
    const response = await fetch(record.sourceURL, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) failures.push(`${record.candidateKey}: HTTP ${response.status} for ${record.sourceURL}`);
    else console.log(`OK ${response.status} ${record.candidateKey} -> ${response.url}`);
  } catch (error) {
    failures.push(`${record.candidateKey}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Opened ${sources.length} accepted direct-source deep links.`);
