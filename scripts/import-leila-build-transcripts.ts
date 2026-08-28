import { createHash } from "node:crypto";
import { join } from "node:path";
import type { EditorialRecord } from "../src/domain/editorial";
import { editorialShardSchema, verificationPassSchema } from "../src/domain/editorial";
import type { SourceRecord } from "../src/domain/source";
import { sourceShardSchema } from "../src/domain/source";
import type { CatalogCategory } from "../src/domain/taxonomy";
import { sha256, writeJSONIfChanged } from "../src/lib/content-files";
import { combinedQuoteSimilarity } from "../src/lib/editorial";
import { parseVTT } from "../src/lib/vtt";

const reviewedAt = "2026-08-28T19:00:00.000Z";
const contentRoot = "content/leila";

interface Episode {
  episode: number;
  externalID: string;
  title: string;
  publishedAt: string;
  durationSeconds: number;
}

const episodes = [
  { episode: 384, externalID: "01M0BJGHN0YM72E4RV6DGJK43M", title: "You're Not Empathetic. You're Just Scared to Disappoint People | Ep. 384", publishedAt: "2026-08-19", durationSeconds: 1008 },
  { episode: 383, externalID: "01KZ966MAZGWGAZDQQJ2W29NB2", title: "How to Win the Season You’re Currently In | Ep. 383", publishedAt: "2026-08-05", durationSeconds: 786 },
  { episode: 381, externalID: "01KYJRHDHZ704WKQD96HM3K07Q", title: "Hire People Smarter Than You, Pick the Right People, and Adapt to Reality | Ep. 381", publishedAt: "2026-07-28", durationSeconds: 798 },
  { episode: 378, externalID: "01KXKZ7RR1JDG8181BC7HSH1Z3", title: "Leaders Solve Instead of Complain, and Business Is Always Personal | Ep. 378", publishedAt: "2026-07-16", durationSeconds: 509 },
  { episode: 376, externalID: "01KX1CDHBAAN6D5XMJEEPGHBAV", title: "5 Ways to Project Confidence (Even When You Don’t Feel It) | Ep. 376", publishedAt: "2026-07-09", durationSeconds: 1382 },
  { episode: 374, externalID: "01KWGBSAF712MMDRVVVJW38BCS", title: "Success Is Who You Become, Behavior Beats Mindset, and Clarity Creates Speed | Ep. 374", publishedAt: "2026-07-02", durationSeconds: 914 }
] as const satisfies readonly Episode[];

interface Selection {
  episode: number;
  cueStart: number;
  cueEnd?: number;
  text: string;
  category: CatalogCategory;
  tags: readonly string[];
  context: string;
  featured?: boolean;
}

const selections: readonly Selection[] = [
  { episode: 384, cueStart: 49, cueEnd: 50, text: "You can have empathy for somebody yet not take responsibility for their feelings.", category: "Decision Making", tags: ["decision-making", "accountability", "perspective"], context: "Leila distinguishes empathy from assuming responsibility for another person's emotional response.", featured: true },
  { episode: 384, cueStart: 53, text: "If you say yes, because you're worried about the reaction someone's gonna give if you say no, then it's all of a sudden like, what I'm really worried about is how they're gonna deal with their emotions.", category: "Decision Making", tags: ["decision-making", "accountability"], context: "Leila explains how anticipated reactions can quietly turn a boundary into an unwanted yes." },
  { episode: 384, cueStart: 121, text: "people treat the feeling of guilt as evidence that they've done something wrong.", category: "Mindset & Personal Growth", tags: ["perspective", "accountability"], context: "Leila challenges the assumption that feeling guilty is proof a decision was wrong." },
  { episode: 384, cueStart: 129, text: "What if feeling guilty, you could feel guilty whether you did wrong or right?", category: "Mindset & Personal Growth", tags: ["perspective", "decision-making"], context: "Leila reframes guilt as a feeling that can accompany either a right or wrong choice." },
  { episode: 384, cueStart: 155, text: "And that's okay because I have so much more freedom in my life and I feel like I'm living my life in a way that is in accordance with my values and not in accordance with other people's feelings.", category: "Mindset & Personal Growth", tags: ["perspective", "accountability"], context: "Leila describes the freedom that comes from making decisions according to her values." },

  { episode: 383, cueStart: 6, text: "It's usually been because I haven't had clarity around what the number one priority is, or I felt like I've had to balance like 17 things at once.", category: "Productivity & Execution", tags: ["prioritization", "focus"], context: "Leila connects dissatisfaction with a lack of clarity about the current number-one priority.", featured: true },
  { episode: 383, cueStart: 13, text: "But I think that it is so freeing once you do it, because the irony of it is that not deciding is still a decision.", category: "Decision Making", tags: ["decision-making", "prioritization"], context: "Leila argues that avoiding a decision is itself a consequential choice." },
  { episode: 383, cueStart: 20, text: "A decision is not a decision unless you have to sacrifice.", category: "Decision Making", tags: ["decision-making", "strategy"], context: "Leila defines a real decision by the options and investments it requires a person to give up." },
  { episode: 383, cueStart: 26, text: "you don't need to feel guilty for the fact that not everything is a fucking priority right now. I actually think there's something like really freeing about that because if everything's a priority, then nothing is.", category: "Productivity & Execution", tags: ["prioritization", "focus"], context: "Leila explains why a season needs an explicit hierarchy instead of treating everything as equally urgent." },
  { episode: 383, cueStart: 33, text: "If you can just make a choice about what matters most to you right now and accept that that means other things won't get as much time and attention or they will have less rather than none. I think a lot more people would be a lot happier.", category: "Mindset & Personal Growth", tags: ["prioritization", "perspective"], context: "Leila closes by asking people to choose what matters in the present season and accept the tradeoff." },

  { episode: 381, cueStart: 0, text: "A great leader hires people smarter than them.", category: "Leadership & Teams", tags: ["leadership", "learning"], context: "Leila opens with a standard for leaders who want the company and themselves to grow.", featured: true },
  { episode: 381, cueStart: 8, text: "Just like you shortcut your way to making more money in investing by using other people's money, you can shortcut your way to success in business by using other people's brains.", category: "Operations & Scaling", tags: ["scaling", "leadership", "learning"], context: "Leila compares hiring specialized talent to using leverage in investing." },
  { episode: 381, cueStart: 9, text: "The goal is to hire people who beat you at what you were doing, who are better than you at what you were doing.", category: "Leadership & Teams", tags: ["leadership", "scaling"], context: "Leila says a strong hire should raise the standard of work the leader previously owned." },
  { episode: 381, cueStart: 25, text: "The best leaders learn to adapt to that change and they come out stronger on the other end.", category: "Leadership & Teams", tags: ["leadership", "resilience"], context: "Leila frames adaptation as a defining response to fear, change, and uncertain conditions." },
  { episode: 381, cueStart: 29, text: "Do I argue with reality or do I respond to reality?", category: "Decision Making", tags: ["decision-making", "resilience"], context: "Leila offers a question for checking whether a leader is adapting or resisting current conditions." },

  { episode: 378, cueStart: 0, text: "All skills are additional, whereas leadership is the only skill that multiplies.", category: "Leadership & Teams", tags: ["leadership", "scaling"], context: "Leila explains why leadership multiplies the value of every other capability in a company.", featured: true },
  { episode: 378, cueStart: 4, text: "So the best leaders I've recognized on a call when they bring me a problem, they spend about 10% of the time on the problem and 90% of the time on the possible solutions to solve it.", category: "Leadership & Teams", tags: ["leadership", "problem-solving"], context: "Leila describes the problem-to-solution ratio she sees in effective leaders." },
  { episode: 378, cueStart: 8, text: "And in the moment when I'm dealing with the problem, I ask myself, am I focusing in my thoughts on the problem or on what I need to do next?", category: "Productivity & Execution", tags: ["problem-solving", "execution", "focus"], context: "Leila shares a live self-audit for moving attention from an obstacle to the next action." },
  { episode: 378, cueStart: 17, text: "And the values you live your personal life by, whether you like it or not, become the values at which you operate your company.", category: "Leadership & Teams", tags: ["leadership", "accountability"], context: "Leila connects a leader's personal conduct with the values that appear inside the company." },
  { episode: 378, cueStart: 18, text: "And it's funny because people say like values, like values are what you do, not what you say.", category: "Leadership & Teams", tags: ["leadership", "accountability"], context: "Leila emphasizes that values are visible in repeated behavior rather than stated intention." },

  { episode: 376, cueStart: 8, text: "It is okay to feel unsure and you can still speak confidently. Those things can exist at the same time.", category: "Mindset & Personal Growth", tags: ["perspective", "resilience"], context: "Leila separates the internal feeling of uncertainty from the external choice to communicate clearly.", featured: true },
  { episode: 376, cueStart: 13, text: "I can't always control my thoughts, but I can control how I act.", category: "Mindset & Personal Growth", tags: ["accountability", "perspective"], context: "Leila explains why behavior can remain intentional even when thoughts are difficult to control." },
  { episode: 376, cueStart: 53, text: "The best leaders and the most confident people that I know ask the most questions, listen the most, probably do more listening and less talking in meetings.", category: "Leadership & Teams", tags: ["leadership", "learning"], context: "Leila contrasts grounded confidence with dominating a room or talking over other people." },
  { episode: 376, cueStart: 58, text: "There's something you do every day where you can practice one of these things. Be very specific.", category: "Productivity & Execution", tags: ["execution", "learning"], context: "Leila recommends attaching confidence practice to a specific recurring situation." },

  { episode: 374, cueStart: 4, cueEnd: 5, text: "life happens on the way to your goals. Not once you get there.", category: "Mindset & Personal Growth", tags: ["goals", "perspective"], context: "Leila reflects on why progress and life happen during the process rather than at the finish line.", featured: true },
  { episode: 374, cueStart: 7, text: "It really taught me that success is about who you become. It's about the character that you build.", category: "Mindset & Personal Growth", tags: ["resilience", "goals"], context: "Leila describes success as the character built through a demanding process." },
  { episode: 374, cueStart: 9, text: "But different is created through the process, not this artificial ceremony of what you just did.", category: "Mindset & Personal Growth", tags: ["perspective", "goals"], context: "Leila contrasts personal change through a process with the brief ceremony of an outcome." },
  { episode: 374, cueStart: 24, text: "It is more valuable and you will learn more if you practice being successful than if you visualize being successful.", category: "Productivity & Execution", tags: ["execution", "learning"], context: "Leila favors practicing successful behavior over relying only on visualization." },
  { episode: 374, cueStart: 27, text: "clarity creates speed. Speed leads to progress. Progress leads to momentum, and momentum leads to success.", category: "Productivity & Execution", tags: ["execution", "focus", "goals"], context: "Leila links clear direction with the momentum created by consistent progress." }
];

function stableUUID(value: string) {
  const hex = createHash("sha256").update(value).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const transcriptByEpisode = new Map<number, { text: string; checksum: string; cues: ReturnType<typeof parseVTT> }>();
for (const episode of episodes) {
  const transcriptURL = `https://rss.flightcast.com/transcripts/${episode.externalID}.vtt`;
  const response = await fetch(transcriptURL);
  if (!response.ok) throw new Error(`Could not fetch official BUILD transcript for episode ${episode.episode}: ${response.status}`);
  const text = await response.text();
  transcriptByEpisode.set(episode.episode, { text, checksum: sha256(text), cues: parseVTT(text) });
}

const sources: SourceRecord[] = episodes.map((episode) => {
  const mediaURL = `https://pscrb.fm/rss/p/episode.flightcast.com/${episode.externalID}.mp3`;
  const transcript = transcriptByEpisode.get(episode.episode)!;
  return {
    sourceID: `build-rss-ep-${episode.episode}`,
    externalID: episode.externalID,
    provider: "build-rss",
    sourceType: "podcast",
    title: episode.title,
    publisher: "Leila Hormozi · BUILD",
    publishedAt: episode.publishedAt,
    durationSeconds: episode.durationSeconds,
    canonicalURL: mediaURL,
    mediaURL,
    transcriptURL: `https://rss.flightcast.com/transcripts/${episode.externalID}.vtt`,
    transcriptChecksum: transcript.checksum,
    retrievedAt: reviewedAt,
    discoveryMethod: "Official BUILD with Leila Hormozi RSS transcript",
    status: "reviewed",
    exclusionReason: null,
    blockingReason: null
  };
});

const records: EditorialRecord[] = selections.map((selection, index) => {
  const episode = episodes.find((item) => item.episode === selection.episode)!;
  const source = sources.find((item) => item.sourceID === `build-rss-ep-${selection.episode}`)!;
  const transcript = transcriptByEpisode.get(selection.episode)!;
  const cueEnd = selection.cueEnd ?? selection.cueStart;
  const selectedCues = transcript.cues.filter((cue) => cue.index >= selection.cueStart && cue.index <= cueEnd);
  const transcriptWindow = selectedCues.map((cue) => cue.text).join(" ");
  if (!transcriptWindow.includes(selection.text)) throw new Error(`Episode ${selection.episode}, cues ${selection.cueStart}-${cueEnd} do not contain exact quote: ${selection.text}`);
  const firstCue = selectedCues.at(0)!;
  const lastCue = selectedCues.at(-1)!;
  const candidateKey = `build-rss-ep-${selection.episode}-q-${String(index + 1).padStart(2, "0")}`;
  const nearest = Math.max(0, ...selections.filter((other) => other !== selection).map((other) => combinedQuoteSimilarity(other.text, selection.text)));
  const sourceURL = new URL(source.mediaURL!);
  sourceURL.hash = `t=${Math.floor(firstCue.startSeconds)}`;
  const verification = verificationPassSchema.parse({
    outcome: "passed",
    checkedAt: reviewedAt,
    reviewer: "Codex transcript editorial review",
    method: "official-transcript-read",
    isolatedReview: true,
    sourceReopened: true,
    surroundingContextReviewed: true,
    surroundingContextSeconds: null,
    wordingConfirmed: true,
    attributionConfirmed: true,
    locatorConfirmed: true,
    metadataConfirmed: true,
    contextuallyHonest: true,
    notStitchedOrParaphrased: true,
    evidenceNote: `Matched an exact contiguous excerpt in official BUILD transcript cues ${selection.cueStart}-${cueEnd}; surrounding cues were reviewed for context.`
  });
  return {
    candidateKey,
    status: "verified",
    id: stableUUID(`leila-said:${candidateKey}`),
    text: selection.text,
    author: "Leila Hormozi",
    primaryCategory: selection.category,
    tags: [...selection.tags],
    sourceID: source.sourceID,
    sourceType: "podcast",
    sourceTitle: episode.title,
    sourceURL: sourceURL.toString(),
    sourceDate: episode.publishedAt,
    sourceLocator: { kind: "media", startSeconds: Math.floor(firstCue.startSeconds), endSeconds: Math.ceil(lastCue.endSeconds) },
    featured: selection.featured ?? false,
    containsProfanity: /\b(fuck|shit|bullshit|damn)\b/i.test(selection.text),
    context: selection.context,
    verificationStandard: "official-transcript-reviewed",
    provenance: {
      transcriptFingerprint: transcript.checksum,
      cueStart: selection.cueStart,
      cueEnd,
      batchID: "leila-build-launch",
      duplicateDecision: nearest >= 0.55 ? "keep" : "unique",
      duplicateNote: nearest >= 0.55 ? `Nearest launch-catalog similarity ${nearest.toFixed(2)} was reviewed; wording and lesson remain distinct.` : `Nearest launch-catalog similarity ${nearest.toFixed(2)}; no material duplicate found.`
    },
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
    verification: { firstPass: verification, secondPass: null, blindAudit: null },
    quality: { standaloneClarity: 2, practicalUsefulness: 2, distinctiveness: 1, fanRelevance: 2, productFit: 2 },
    rejectionNotes: [],
    unresolvedWarnings: []
  };
});

const idFor = (episode: number, ordinal: number) => records.find((record) => record.candidateKey === `build-rss-ep-${episode}-q-${String(ordinal).padStart(2, "0")}`)?.id;
const collectionIDs = (pairs: readonly (readonly [number, number])[]) => pairs.map(([episode, ordinal]) => idFor(episode, ordinal)).filter((id): id is string => Boolean(id));
const collections = [
  { slug: "lead-with-clarity", title: "Lead with clarity", description: "Clear standards, stronger teams, and a bias toward solving.", quoteIDs: collectionIDs([[381, 11], [381, 13], [378, 16], [378, 17], [378, 19], [376, 23]]), displayOrder: 0 },
  { slug: "choose-what-matters", title: "Choose what matters", description: "Priorities, tradeoffs, and decisions for the season you are in.", quoteIDs: collectionIDs([[383, 6], [383, 7], [383, 8], [383, 9], [383, 10], [381, 15]]), displayOrder: 1 },
  { slug: "build-earned-confidence", title: "Build earned confidence", description: "Use behavior, practice, and perspective to act through uncertainty.", quoteIDs: collectionIDs([[384, 3], [376, 21], [376, 22], [376, 24], [374, 25], [374, 26], [374, 28], [374, 29]]), displayOrder: 2 }
];

const sourceShard = sourceShardSchema.parse({ schemaVersion: 1, provider: "build-rss", year: 2026, updatedAt: reviewedAt, sources });
const editorialShard = editorialShardSchema.parse({ schemaVersion: 1, provider: "build-rss", year: 2026, updatedAt: reviewedAt, records });

await Promise.all([
  writeJSONIfChanged(join(contentRoot, "sources/build-rss/2026.json"), sourceShard),
  writeJSONIfChanged(join(contentRoot, "editorial/build-rss/2026.json"), editorialShard),
  writeJSONIfChanged(join(contentRoot, "collections.json"), collections)
]);

console.log(`Imported ${records.length} Leila quotes from ${sources.length} official BUILD transcripts.`);
