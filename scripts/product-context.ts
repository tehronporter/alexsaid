import { resolve } from "node:path";
import { productIDSchema, type ProductID } from "../src/domain/product";

function argumentValue(argv: readonly string[]) {
  const inline = argv.find((value) => value.startsWith("--brand="));
  if (inline) return inline.slice("--brand=".length);
  const index = argv.indexOf("--brand");
  return index >= 0 ? argv[index + 1] : undefined;
}

export function selectedProduct(argv = process.argv.slice(2)): ProductID {
  return productIDSchema.parse(argumentValue(argv) ?? process.env.SAID_PRODUCT ?? "alex");
}

export function productContentContext(product = selectedProduct()) {
  const leila = product === "leila";
  return {
    product,
    author: leila ? "Leila Hormozi" as const : "Alex Hormozi" as const,
    contentRoot: resolve(leila ? "content/leila" : "content"),
    sourceRoot: resolve(leila ? "content/leila/sources" : "content/sources"),
    ledgerPath: resolve(leila ? "content/leila/editorial-ledger.json" : "content/editorial-ledger.json"),
    catalogV2Path: resolve(leila ? "src/data/leila/catalog.json" : "src/data/catalog.json"),
    catalogV3Path: resolve(leila ? "src/data/leila/catalog.v3.json" : "src/data/catalog.v3.json"),
    taxonomyPath: resolve("content/taxonomy.json")
  };
}
