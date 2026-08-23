import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { editorialLedgerSchema } from "../src/domain/editorial";
import { generatePublicCatalog } from "../src/lib/editorial";

const input = resolve(process.argv[2] ?? "content/editorial-ledger.json");
const output = resolve(process.argv[3] ?? "src/data/catalog.json");
const ledger = editorialLedgerSchema.parse(JSON.parse(await readFile(input, "utf8")));
const catalog = generatePublicCatalog(ledger);
await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Generated ${catalog.quotes.length} verified quotes in ${output}`);
