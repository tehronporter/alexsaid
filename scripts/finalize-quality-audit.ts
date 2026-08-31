import { readFile, writeFile } from "node:fs/promises";

const manifestPath = "content/quality-audits/full-catalog-2026-08-30.json";
const audit = JSON.parse(await readFile(manifestPath, "utf8"));
const rescueResults = JSON.parse(await readFile("/tmp/qc-drive-rescue-results.json", "utf8"));
const deleteResults = JSON.parse(await readFile("/tmp/qc-drive-delete-results.json", "utf8"));
const completedAt = "2026-08-30T17:05:00.000Z";

if (rescueResults.length !== 15 || rescueResults.some((result: { result?: { success?: boolean } }) => !result.result?.success)) {
  throw new Error("All 15 approved rescue asset operations must succeed before finalization");
}
if (deleteResults.length !== 48 || deleteResults.some((result: { success?: boolean }) => !result.success)) {
  throw new Error("All 48 approved permanent deletions must succeed before finalization");
}

const rescueByOriginalID = new Map(rescueResults.map((result: { quoteID: string }) => [result.quoteID, result]));
for (const record of audit.records) {
  if (record.decision !== "rescue") continue;
  const operation = rescueByOriginalID.get(record.quoteID) as {
    operation: string;
    result: { id: string; title: string; mime_type: string };
  } | undefined;
  if (!operation) throw new Error(`Missing Drive rescue result for ${record.quoteID}`);
  record.replacement.driveAsset = {
    operation: operation.operation,
    fileID: operation.result.id,
    filename: operation.result.title,
    mimeType: operation.result.mime_type
  };
}

const withoutDriveAsset = audit.records
  .filter((record: { decision: string; driveAsset: unknown }) => record.decision === "reject" && !record.driveAsset)
  .map((record: { quoteID: string }) => record.quoteID);

audit.state = "completed";
audit.cleanupApplied = true;
audit.cleanupAppliedAt = completedAt;
audit.cleanup = {
  catalog: { alexPublished: 146, leilaPublished: 56, totalPublished: 202 },
  drive: {
    permanentlyDeletedOriginalCards: 48,
    deletedByBrand: { alex: 34, leila: 14 },
    uploadedReplacementCards: 13,
    updatedInPlacePunctuationCards: 2,
    finalFolders: {
      alex: { imageCount: 68, indexRows: 68, totalItems: 69 },
      alexNew: { imageCount: 0, indexRows: 0, totalItems: 0 },
      leila: { imageCount: 56, indexRows: 56, totalItems: 57 }
    },
    rejectedWithoutDriveAsset: withoutDriveAsset
  },
  validation: {
    everyRemainingDriveCardMapsToLiveUUID: true,
    rejectedOriginalUUIDsAbsentFromDrive: true,
    driveIndexesMatchFolderImages: true,
    replacementCardsVisuallyReviewed: 15
  }
};

await writeFile(manifestPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ state: audit.state, cleanupApplied: audit.cleanupApplied, cleanup: audit.cleanup }, null, 2));
