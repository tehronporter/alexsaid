import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const audit = JSON.parse(readFileSync("content/quality-audits/full-catalog-2026-08-30.json", "utf8"));
const inventory = JSON.parse(readFileSync("content/quality-audits/drive-card-inventory-2026-08-30.json", "utf8"));
const alex = JSON.parse(readFileSync("src/data/catalog.v3.json", "utf8"));
const leila = JSON.parse(readFileSync("src/data/leila/catalog.v3.json", "utf8"));

const liveIDs = new Set([...alex.quotes, ...leila.quotes].map((quote) => quote.id));
const auditedIDs = audit.records.map((record: { quoteID: string }) => record.quoteID);
const inventoryFiles = Object.values(inventory.folders).flatMap((folder) => (folder as { files: unknown[] }).files) as {
  fileID: string;
  filename: string;
  mimeType: string;
}[];
const driveFileByQuoteID = new Map(
  inventoryFiles.flatMap((file) => {
    const quoteID = file.filename.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    return quoteID ? [[quoteID, file] as const] : [];
  })
);

describe("full catalog quality audit", () => {
  it("accounts for every starting quote and the approved catalog result", () => {
    expect(alex.quotes).toHaveLength(146);
    expect(leila.quotes).toHaveLength(56);
    expect(auditedIDs).toHaveLength(240);
    expect(new Set(auditedIDs).size).toBe(240);
    expect(liveIDs.size).toBe(audit.summary.total.proposedFinalLive);
    for (const record of audit.records) {
      if (record.decision === "keep" || record.replacement?.identityStrategy === "preserve-id-punctuation-only") {
        expect(liveIDs.has(record.quoteID)).toBe(true);
      } else {
        expect(liveIDs.has(record.quoteID)).toBe(false);
      }
    }
  });

  it("records the approved cleanup as completed", () => {
    expect(audit.state).toBe("completed");
    expect(audit.cleanupApplied).toBe(true);
    expect(audit.cleanup.catalog).toEqual({ alexPublished: 146, leilaPublished: 56, totalPublished: 202 });
    expect(audit.cleanup.drive).toMatchObject({
      permanentlyDeletedOriginalCards: 48,
      uploadedReplacementCards: 13,
      updatedInPlacePunctuationCards: 2
    });
  });

  it("has internally consistent editorial totals", () => {
    expect(audit.summary).toMatchObject({
      alex: { starting: 178, keep: 140, rescue: 6, reject: 32, withDriveAsset: 97 },
      leila: { starting: 62, keep: 47, rescue: 9, reject: 6, withDriveAsset: 62 },
      total: {
        starting: 240,
        keep: 187,
        rescue: 15,
        reject: 38,
        withDriveAsset: 159,
        proposedFinalLive: 202,
        materialReplacementCount: 13,
        inPlacePunctuationRescues: 2
      }
    });
    expect(audit.records.filter((record: { decision: string }) => record.decision !== "reject")).toHaveLength(202);
  });

  it("reserves safe identities for every proposed rescue", () => {
    const rescues = audit.records.filter((record: { decision: string }) => record.decision === "rescue");
    const replacementIDs = rescues.map((record: { replacement: { quoteID: string } }) => record.replacement.quoteID);
    expect(new Set(replacementIDs).size).toBe(15);
    for (const record of rescues) {
      expect(record.replacement).toBeTruthy();
      expect(record.failureCodes).toHaveLength(1);
      if (record.replacement.identityStrategy === "new-id-material-excerpt") {
        expect(record.replacement.quoteID).not.toBe(record.quoteID);
        expect(liveIDs.has(record.replacement.quoteID)).toBe(true);
      } else {
        expect(record.replacement.identityStrategy).toBe("preserve-id-punctuation-only");
        expect(record.replacement.quoteID).toBe(record.quoteID);
      }
    }
  });

  it("matches every recorded Drive asset by both UUID and file ID", () => {
    expect(inventoryFiles.filter((file) => file.mimeType === "image/png")).toHaveLength(159);
    for (const record of audit.records) {
      const inventoryFile = driveFileByQuoteID.get(record.quoteID);
      if (!inventoryFile) {
        expect(record.driveAsset).toBeNull();
        continue;
      }
      expect(record.driveAsset).toMatchObject({
        fileID: inventoryFile.fileID,
        filename: inventoryFile.filename,
        mimeType: inventoryFile.mimeType
      });
    }
    expect(audit.records.filter((record: { decision: string; driveAsset: unknown }) => record.decision !== "keep" && record.driveAsset)).toHaveLength(50);
  });
});
