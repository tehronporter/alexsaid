export interface VTTCue {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

function timestampToSeconds(value: string) {
  const parts = value.replace(",", ".").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  throw new Error(`Invalid WebVTT timestamp: ${value}`);
}

function cleanCueText(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseVTT(input: string): VTTCue[] {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("WEBVTT")) throw new Error("Transcript is not WebVTT");
  const blocks = normalized.split(/\n{2,}/).slice(1);
  const cues: VTTCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) continue;
    const match = lines[timingIndex].match(/^([^ ]+)\s+-->\s+([^ ]+)/);
    if (!match) continue;
    const text = cleanCueText(lines.slice(timingIndex + 1).join(" "));
    if (!text) continue;
    cues.push({ index: cues.length, startSeconds: timestampToSeconds(match[1]), endSeconds: timestampToSeconds(match[2]), text });
  }
  return cues;
}

export function areContiguousCues(cues: readonly VTTCue[]) {
  return cues.every((cue, index) => index === 0 || cue.index === cues[index - 1].index + 1);
}
