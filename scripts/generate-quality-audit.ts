import { readFile, writeFile } from "node:fs/promises";

try {
  const completed = JSON.parse(await readFile("content/quality-audits/full-catalog-2026-08-30.json", "utf8"));
  if (completed.state === "completed" && completed.cleanupApplied === true) {
    console.log(JSON.stringify(completed.summary, null, 2));
    process.exit(0);
  }
} catch {
  // No prior terminal manifest exists; generate the approval manifest below.
}

type Brand = "alex" | "leila";
type DriveFile = { fileID: string; filename: string; mimeType: string };
type DriveInventory = {
  capturedAt: string;
  folders: Record<string, { url: string; files: DriveFile[] }>;
};

type Replacement = {
  quoteID: string;
  text: string;
  startSeconds?: number;
  endSeconds?: number;
  identityStrategy: "new-id-material-excerpt" | "preserve-id-punctuation-only";
};

type AuditRecord = {
  brand: Brand;
  quoteID: string;
  text: string;
  sourceTitle: string;
  sourceURL: string;
  candidateKey: unknown;
  sourceID: unknown;
  sourceLocator: unknown;
  containsProfanity: unknown;
  driveAsset: { folderKey: string; folderURL: string; fileID: string; filename: string; mimeType: string } | null;
  decision: "keep" | "rescue" | "reject";
  failureCodes: string[];
  rationale: string;
  replacement: (Replacement & { sourceID: unknown; sourceTitle: string; sourceURL: string }) | null;
};

const AUDITED_AT = "2026-08-30T16:34:18.000Z";

const rejectEntries: [string, string, string][] = [
  ["6783a7fb-8603-44f7-8f1b-ffa8730b5eb7", "CONTEXT_DEPENDENT", "“It” and “the thing” depend on a prior proposed action; the excerpt reads like coaching-session continuation rather than a finished quote."],
  ["0b0561a4-7944-4289-b3ed-d35158c70d8f", "GENERIC_OVERCLAIM", "Absolute claim with little distinctive insight; it is too broad to earn a standalone card."],
  ["6654b49a-614c-4953-9c01-50e180d0ebb9", "UNRESOLVED_REFERENT", "“Those purchases” requires the preceding discussion, so a cold reader cannot identify the example set."],
  ["ce9cc2b1-ee31-47fe-84d3-15e60081d807", "UNRESOLVED_REFERENT", "“Includes none” and “the rest” refer to an omitted five-part framework."],
  ["6e3afa72-19f0-4dc8-a224-18eac10c9433", "UNRESOLVED_REFERENT", "“The same thing” has no visible referent and the isolated line does not deliver a complete lesson."],
  ["40e58abf-10d4-44d8-a722-607874f507f5", "LOW_VALUE", "Complete sentence, but too generic to provide a useful or memorable takeaway."],
  ["b38ad39a-717c-4c95-aebe-935332ad5ed3", "TRANSCRIPT_LIKE", "“Unlock how much you can care” is awkward and abstract; the idea is not clean enough for a quote card."],
  ["e4a6b2ab-37fc-42f1-a14b-9d024b399fdb", "CONTEXT_DEPENDENT", "The unnamed goal and team make this read as a recap of a specific event, not an independent insight."],
  ["fd119285-2e0b-4b2d-a29a-0e2abec63af6", "LOW_VALUE", "A rhetorical confirmation rather than a developed or distinctive thought."],
  ["036417fe-09f8-4580-817a-50e8acfad420", "COPY_ERROR", "The source wording contains the malformed phrase “Failure become success,” making the card read as unfinished copy."],
  ["e0907345-1076-4a63-a597-38fe2bd06027", "TOO_VAGUE", "“Build capacity” is undefined and does not tell a cold reader what capacity means here."],
  ["296ac19b-9922-43a1-a647-7821fbe301a8", "REDUNDANT_FRAGMENT", "Generic command already contained in the stronger full endurance passage."],
  ["c0274244-a59b-4db9-9dbc-2549ed7de69e", "REDUNDANT_FRAGMENT", "Fragment from the longer published endurance passage; it adds no distinct idea."],
  ["ef32746e-b0bd-4159-887c-d0d1a2b2b972", "UNRESOLVED_REFERENT", "“Each of these” points to ten omitted life categories."],
  ["34f52958-19ed-4427-903c-b10cfcf6b72f", "REDUNDANT_FRAGMENT", "Subset of the stronger full endurance passage already in the catalog."],
  ["cdaad756-4486-456a-b5e4-78fb4bb53e5f", "FRAGMENT", "Two-word continuation with no independent claim or useful takeaway."],
  ["22e81132-5887-4192-85f6-6d75df9b88b7", "TOO_VAGUE", "Unexplained violent metaphor; neither the threat nor the practical takeaway is defined."],
  ["46cc1fec-08f9-4fa3-88cb-633eca4af067", "UNRESOLVED_REFERENT", "The subject “they” and the options being allowed to expire are both omitted."],
  ["cad5c998-ab0b-462c-a199-f544b33aff98", "UNRESOLVED_REFERENT", "“There’s only one” never names priority, leaving the key noun outside the excerpt."],
  ["a2e35269-10d0-4204-9261-71f43e5ddacd", "CONTEXT_DEPENDENT", "The isolated declaration lacks the surrounding explanation and is weaker than the retained self-accountability quote from the same passage."],
  ["0deb99c2-cb48-4e7e-b54d-18dbf91594fc", "TOO_VAGUE", "Hedged and abstract; it does not explain what mastery of life means."],
  ["bed670de-7730-4b14-ad13-32bec73bc234", "UNRESOLVED_REFERENT", "Unnamed “they” makes the observation dependent on the preceding discussion."],
  ["ab30f8e1-c988-450d-ba64-7feb94b50ddc", "UNRESOLVED_REFERENT", "“Those 10 things” refers to an omitted list and cannot stand alone."],
  ["9e61ee52-1f4b-4a99-b615-de90cb451544", "UNCLEAR_MEANING", "The phrase “Make reality your today” is not idiomatic or sufficiently intelligible as written."],
  ["094b9b9e-0c22-4014-9106-85437aa66720", "SUPERSEDED", "This fragment is incorporated into the proposed complete decision-making replacement."],
  ["65c3c703-2481-420a-b7f2-b619cc95db37", "TRANSCRIPT_LIKE", "The nested clauses and agreement error make the reflective question difficult to parse on one read."],
  ["13f9a520-b0b9-4c8a-a94e-73e97e4ac99f", "TRANSCRIPT_LIKE", "Clumsy spoken syntax and repeated “game” obscure an otherwise interesting idea."],
  ["2a906219-18ce-4569-a67c-577ffc3cd437", "REDUNDANT_FRAGMENT", "Dependent “because” clause and duplicate subset of the stronger full endurance passage."],
  ["70a98a34-ea0a-4490-b886-020c6ef4e94a", "SUPERSEDED", "Generic fragment incorporated into the proposed complete decision-making replacement."],
  ["141e0cf5-b19c-4535-9812-dc84f3dd3712", "REDUNDANT_FRAGMENT", "Generic subset of the stronger full endurance passage."],
  ["29e38145-2a37-491f-8210-3122fc29295a", "LOW_VALUE", "Tautological repetition without a distinctive or practical insight."],
  ["79ea4098-1a9b-4ccf-934c-ab5d36c666c5", "GENERIC", "Familiar cliché and redundant with the sharper retained line “Whatever you don’t have is what you want.”"],
  ["3df7b74d-fd76-4d59-a957-b6eb3660139b", "TRANSCRIPT_LIKE", "Long, filler-heavy delivery; the core priority idea is already expressed more cleanly elsewhere in the Leila catalog."],
  ["c39d2c61-0fd8-4c8c-a662-e073eb243961", "REDUNDANT", "Long and syntactically loose version of the stronger retained priority/season material."],
  ["67f62413-ed33-4b76-a98a-4ac5a109280a", "TRANSCRIPT_LIKE", "Conversational filler and an indirect ending weaken an idea already captured cleanly by the adjacent empathy quote."],
  ["04dca221-c60d-46d5-aaa1-a3e023d8c907", "COPY_ERROR", "The question is grammatically awkward and its insight is already stated more clearly by the retained guilt quote."],
  ["bba5362a-65a6-417e-80c6-b5bdff472246", "UNRESOLVED_REFERENT", "“All of this” points to omitted caption material; the isolated line does not identify what must be learned."],
  ["70680e2e-7b34-4bb2-afd7-ccfc7b2c27b9", "COPY_ERROR", "“Becoming someone that you’re worth staying with” is grammatically confused and changes the apparent meaning."]
];

const rescueEntries: [string, string, string, Replacement][] = [
  ["9fd38292-744b-4827-a2e2-47463c15ca7d", "TRANSCRIPT_LIKE", "Remove setup and filler while retaining a complete contiguous source sentence.", { quoteID: "c25d6a8c-ee89-43e3-96b6-696401564fc6", text: "Do nothing so commonly is the correct answer.", startSeconds: 648, endSeconds: 652, identityStrategy: "new-id-material-excerpt" }],
  ["f4e4bf60-2700-48be-84bc-a499d14f36ea", "TRANSCRIPT_LIKE", "Drop the spoken transition so the claim begins directly and stands alone.", { quoteID: "f79ca397-963e-4763-96e1-6d1a98f6c158", text: "A lot of lack of focus is actually intellectual laziness.", startSeconds: 111, endSeconds: 116, identityStrategy: "new-id-material-excerpt" }],
  ["cb07c3db-17da-4c74-a479-fc4a0534fd5c", "COPY_ERROR", "The source contains one continuous sentence; normalize the erroneous period without changing any words.", { quoteID: "cb07c3db-17da-4c74-a479-fc4a0534fd5c", text: "You can change your entire bloodline the moment you realize that what you do next always matters more than what you did last.", startSeconds: 411, endSeconds: 420, identityStrategy: "preserve-id-punctuation-only" }],
  ["5d73332f-7ef7-4150-8e97-153d088d4ab2", "INCOMPLETE_THOUGHT", "Begin at the complete source example and continue through its intended contrast.", { quoteID: "f0ed207d-b0ef-4099-a09e-68a5f78aec48", text: "There's something in your life right now that earlier on in your life you said, “If I had this, I would be happy.” And yet here we are.", startSeconds: 643, endSeconds: 650, identityStrategy: "new-id-material-excerpt" }],
  ["5f0ab598-1f6b-4d64-96bc-095ead2bfc49", "LOW_VALUE_FRAGMENT", "Replace three overlapping generic fragments with the complete contiguous decision-making sequence.", { quoteID: "85b01838-e87d-44c6-9a48-31bf749d6dae", text: "At some point, you have to pull the trigger. You have to make the call. You have to make the decision. You have to cut off one future.", startSeconds: 222, endSeconds: 228, identityStrategy: "new-id-material-excerpt" }],
  ["7faf94a6-afe8-4014-9fd3-e75fe2cc040f", "UNRESOLVED_REFERENT", "Add the immediately preceding source clause so the sacrifice has a clear purpose.", { quoteID: "b55b47ce-c4e6-4fdf-b48a-df657948d35d", text: "You can be a master of your own life to a degree if you can just say, “I'm willing to give up these other things for the things that I care about most.”", startSeconds: 738, endSeconds: 745, identityStrategy: "new-id-material-excerpt" }],
  ["5bafcc5e-113c-44d9-a318-acaf855662e7", "CONTEXT_DEPENDENT", "Remove “It really taught me that,” which refers to an omitted competition story, and begin at the complete source claim.", { quoteID: "9454c290-6e70-4fc5-941a-2665a12a1ce2", text: "Success is about who you become. It's about the character that you build.", startSeconds: 158, endSeconds: 184, identityStrategy: "new-id-material-excerpt" }],
  ["946eda23-cd38-4abd-a560-947705179116", "UNRESOLVED_REFERENT", "Replace “different,” “the process,” and “what you just did” with the complete contiguous conclusion in the next transcript cue.", { quoteID: "47aeb09e-883b-4444-a014-b169fe4ff032", text: "It wasn't about winning. It wasn't about the prize. It was about who I was going to become on the way.", startSeconds: 229, endSeconds: 257, identityStrategy: "new-id-material-excerpt" }],
  ["6e465bd1-9ceb-4c13-a7ac-dbcbfb31585e", "UNRESOLVED_REFERENT", "Replace “one of these things” with the strongest complete source formulation in the same cue.", { quoteID: "45b6566d-02c0-43d8-b70e-0012007f069f", text: "You do not build habits in the abstract. You build them in the specific.", startSeconds: 1265, endSeconds: 1293, identityStrategy: "new-id-material-excerpt" }],
  ["e6809ea5-e6b4-4fcd-a811-d3026e8faeb1", "TRANSCRIPT_LIKE", "Remove the spoken filler and retain the exact independent claim.", { quoteID: "cbc43468-43c7-4a8f-a7d4-52abf90375d0", text: "Values are what you do, not what you say.", startSeconds: 416, endSeconds: 442, identityStrategy: "new-id-material-excerpt" }],
  ["79fe5f7f-6add-464a-aae5-8ddc544cbde4", "UNRESOLVED_REFERENT", "Replace “that change” with the transcript's explicit definition of adaptation from the preceding contiguous cue.", { quoteID: "adc1b845-6bdd-4c8f-b380-49eca2246abf", text: "Adapting means a change in the environment occurs. So you change your behavior as well.", startSeconds: 552, endSeconds: 570, identityStrategy: "new-id-material-excerpt" }],
  ["69240406-e257-4d34-a07b-e5428150328f", "CONTEXT_DEPENDENT", "Replace the dangling explanation with the strongest complete source sentence from the same cue.", { quoteID: "183efe3f-cd52-4638-a1c5-f69f264b0d8f", text: "I set myself up to fail because I didn't define my priorities.", startSeconds: 124, endSeconds: 148, identityStrategy: "new-id-material-excerpt" }],
  ["febe0264-dec5-4fe9-ae3e-966404895bfc", "UNRESOLVED_REFERENT", "Remove “once you do it” and retain the self-contained decision insight that follows in the same cue.", { quoteID: "f7fdd384-c5d1-4a74-93c9-fc89370a0bca", text: "Not deciding is still a decision. It's just one that you don't have to take credit for if it's not good.", startSeconds: 288, endSeconds: 313, identityStrategy: "new-id-material-excerpt" }],
  ["b2906975-297a-40b5-a1bf-43f7ea9fbbf2", "CONTEXT_DEPENDENT", "Drop “And that's okay because,” then continue through the next contiguous source sentence to complete the value judgment.", { quoteID: "228bf8a8-02b8-4b1d-933a-0940c54222aa", text: "I have so much more freedom in my life and I feel like I'm living my life in a way that is in accordance with my values and not in accordance with other people's feelings. And that's way more important to me.", startSeconds: 758, endSeconds: 769, identityStrategy: "new-id-material-excerpt" }],
  ["2d0ace26-8777-4b6b-bedb-c56dcc45ff2f", "COPY_ERROR", "Normalize the duplicated ellipsis while preserving every source word and the existing identity.", { quoteID: "2d0ace26-8777-4b6b-bedb-c56dcc45ff2f", text: "Titles don't make leaders. Actions do.", identityStrategy: "preserve-id-punctuation-only" }]
];

const rejects = new Map(rejectEntries.map(([id, code, rationale]) => [id, { code, rationale }]));
const rescues = new Map(rescueEntries.map(([id, code, rationale, replacement]) => [id, { code, rationale, replacement }]));

function escapeTable(value: unknown) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

const definitions: [Brand, string, string][] = [
  ["alex", "src/data/catalog.v3.json", "content/editorial-ledger.json"],
  ["leila", "src/data/leila/catalog.v3.json", "content/leila/editorial-ledger.json"]
];

const inventory = JSON.parse(await readFile("content/quality-audits/drive-card-inventory-2026-08-30.json", "utf8")) as DriveInventory;
const assetByID = new Map<string, { folderKey: string; folderURL: string; fileID: string; filename: string; mimeType: string }>();
for (const [folderKey, folder] of Object.entries(inventory.folders)) {
  for (const file of folder.files) {
    const id = file.filename.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    if (id) assetByID.set(id, { folderKey, folderURL: folder.url, ...file });
  }
}

const records: AuditRecord[] = [];
for (const [brand, catalogPath, ledgerPath] of definitions) {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  const ledgerByID = new Map(ledger.records.filter((record: { id?: string }) => record.id).map((record: { id: string }) => [record.id, record]));
  for (const quote of catalog.quotes) {
    const editorial = ledgerByID.get(quote.id) as Record<string, unknown> | undefined;
    if (!editorial) throw new Error(`Missing editorial record for ${quote.id}`);
    const base = {
      brand,
      quoteID: quote.id,
      text: quote.text,
      sourceTitle: quote.sourceTitle,
      sourceURL: quote.sourceURL,
      candidateKey: editorial.candidateKey,
      sourceID: editorial.sourceID,
      sourceLocator: editorial.sourceLocator,
      containsProfanity: editorial.containsProfanity,
      driveAsset: assetByID.get(quote.id) ?? null
    };
    const reject = rejects.get(quote.id);
    const rescue = rescues.get(quote.id);
    if (reject) records.push({ ...base, decision: "reject", failureCodes: [reject.code], rationale: reject.rationale, replacement: null });
    else if (rescue) records.push({
      ...base,
      decision: "rescue",
      failureCodes: [rescue.code],
      rationale: rescue.rationale,
      replacement: {
        ...rescue.replacement,
        sourceID: editorial.sourceID,
        sourceTitle: quote.sourceTitle,
        sourceURL: quote.sourceURL
      }
    });
    else records.push({
      ...base,
      decision: "keep",
      failureCodes: [],
      rationale: "Cold-read pass: complete, understandable without hidden context, and sufficiently specific or memorable for app/social use.",
      replacement: null
    });
  }
}

if (records.length !== 240) throw new Error(`Expected 240 audited records; found ${records.length}`);
for (const id of [...rejects.keys(), ...rescues.keys()]) {
  if (!records.some((record) => record.quoteID === id)) throw new Error(`Decision references a non-live UUID: ${id}`);
}

function counts(brand?: Brand) {
  const selected = brand ? records.filter((record) => record.brand === brand) : records;
  return {
    starting: selected.length,
    keep: selected.filter((record) => record.decision === "keep").length,
    rescue: selected.filter((record) => record.decision === "rescue").length,
    reject: selected.filter((record) => record.decision === "reject").length,
    withDriveAsset: selected.filter((record) => record.driveAsset).length
  };
}

const summary = {
  alex: counts("alex"),
  leila: counts("leila"),
  total: {
    ...counts(),
    proposedFinalLive: records.filter((record) => record.decision !== "reject").length,
    materialReplacementCount: records.filter((record) => (record.replacement as Replacement | null)?.identityStrategy === "new-id-material-excerpt").length,
    inPlacePunctuationRescues: records.filter((record) => (record.replacement as Replacement | null)?.identityStrategy === "preserve-id-punctuation-only").length
  }
};

const manifest = {
  schemaVersion: 1,
  auditID: "full-catalog-cold-read-2026-08-30",
  state: "awaiting_user_approval",
  cleanupApplied: false,
  auditedAt: AUDITED_AT,
  reviewer: "Codex · senior editorial cold-read and source-context review",
  startingCatalog: { alex: 178, leila: 62, total: 240 },
  editorialRubric: [
    "Understandable on one cold read without source title or hidden context.",
    "Complete subject, claim, and takeaway with no unresolved referents.",
    "Deliberately quotable rather than an arbitrary transcript slice.",
    "Specific, useful, distinctive, or memorable enough to earn a card.",
    "One coherent idea with acceptable app and social-card readability.",
    "Faithful to one contiguous source passage; no paraphrasing or stitching."
  ],
  driveSnapshot: {
    capturedAt: inventory.capturedAt,
    folders: Object.fromEntries(Object.entries(inventory.folders).map(([key, folder]) => [key, {
      url: folder.url,
      itemCount: folder.files.length,
      imageCount: folder.files.filter((file) => file.mimeType === "image/png").length,
      indexFiles: folder.files.filter((file) => file.filename === "000-card-index.csv")
    }]))
  },
  summary,
  records
};

await writeFile("content/quality-audits/full-catalog-2026-08-30.json", `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const nonKeeps = records.filter((record) => record.decision !== "keep");
let markdown = `# Quote Catalog Quality Audit — Approval Manifest

Status: **awaiting user approval**. No catalog records or Drive assets have been removed.

## Summary

| Catalog | Starting | Keep | Rescue | Reject | Drive-backed |
|---|---:|---:|---:|---:|---:|
| Alex | ${summary.alex.starting} | ${summary.alex.keep} | ${summary.alex.rescue} | ${summary.alex.reject} | ${summary.alex.withDriveAsset} |
| Leila | ${summary.leila.starting} | ${summary.leila.keep} | ${summary.leila.rescue} | ${summary.leila.reject} | ${summary.leila.withDriveAsset} |
| Total | ${summary.total.starting} | ${summary.total.keep} | ${summary.total.rescue} | ${summary.total.reject} | ${summary.total.withDriveAsset} |

If approved as written, the projected live catalog is **${summary.total.proposedFinalLive} quotes**. The audit proposes ${summary.total.materialReplacementCount} new-ID source rescues and ${summary.total.inPlacePunctuationRescues} punctuation-only in-place rescues.

## Rescue recommendations

| Brand | Original UUID | Current text | Proposed replacement | Replacement UUID | Drive asset | Reason |
|---|---|---|---|---|---|---|
`;
for (const record of nonKeeps) {
  if (record.decision !== "rescue") continue;
  if (!record.replacement) throw new Error(`Rescue is missing replacement data: ${record.quoteID}`);
  const asset = record.driveAsset ? `\`${record.driveAsset.filename}\` / \`${record.driveAsset.fileID}\`` : "none";
  markdown += `| ${record.brand} | \`${record.quoteID}\` | ${escapeTable(record.text)} | ${escapeTable(record.replacement.text)} | \`${record.replacement.quoteID}\` | ${asset} | ${escapeTable(record.rationale)} |\n`;
}
markdown += `
## Rejection recommendations

| Brand | UUID | Current text | Drive asset | Failure | Reason |
|---|---|---|---|---|---|
`;
for (const record of nonKeeps.filter((record) => record.decision === "reject")) {
  const asset = record.driveAsset ? `\`${record.driveAsset.filename}\` / \`${record.driveAsset.fileID}\`` : "none";
  markdown += `| ${record.brand} | \`${record.quoteID}\` | ${escapeTable(record.text)} | ${asset} | \`${record.failureCodes[0]}\` | ${escapeTable(record.rationale)} |\n`;
}
markdown += `
## Approval boundary

Approval authorizes the next cleanup pass to mark the listed originals rejected, add the approved replacements, recompile both catalogs, permanently delete only the UUID-matched Drive images listed above, update both Drive index CSVs, and run the complete validation suite.

The machine-readable record accounts for all 240 starting UUIDs in \`content/quality-audits/full-catalog-2026-08-30.json\`.
`;
await writeFile("docs/QUOTE_CATALOG_QC_2026-08-30.md", markdown, "utf8");

console.log(JSON.stringify(summary, null, 2));
