import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { areContiguousCues, parseVTT } from "@/lib/vtt";
import { sha256, writeJSONIfChanged } from "@/lib/content-files";

describe("content pipeline primitives", () => {
  it("parses timestamped WebVTT cues and preserves cue contiguity", () => {
    const cues = parseVTT("WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.500\nFirst thought.\n\n2\n00:00:03.700 --> 00:00:05.000\nSecond thought.\n\n3\n00:00:06.000 --> 00:00:07.000\nThird thought.\n");
    expect(cues).toMatchObject([{ index: 0, startSeconds: 1, endSeconds: 3.5, text: "First thought." }, { index: 1, text: "Second thought." }, { index: 2, text: "Third thought." }]);
    expect(areContiguousCues(cues.slice(0, 2))).toBe(true);
    expect(areContiguousCues([cues[0], cues[2]])).toBe(false);
  });

  it("produces stable checksums and idempotent JSON writes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hormozi-content-"));
    const path = join(directory, "record.json");
    try {
      expect(sha256("same transcript")).toBe(sha256("same transcript"));
      expect(sha256("same transcript")).not.toBe(sha256("changed transcript"));
      expect(await writeJSONIfChanged(path, { stable: true })).toBe(true);
      expect(await writeJSONIfChanged(path, { stable: true })).toBe(false);
      expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ stable: true });
    } finally { await rm(directory, { recursive: true }); }
  });
});
