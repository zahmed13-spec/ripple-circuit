import { worldContent } from "../content";
import { themes } from "./themes";

const aeroIds = ["aero-1", "aero-2", "aero-3", "aero-4", "aero-5"] as const;
export const expansionWorlds = ["eco","terra","metro","null"] as const;
export type ExpansionWorld = typeof expansionWorlds[number];
export type StoryId = typeof aeroIds[number] | `${ExpansionWorld}-${1|2|3|4|5}`;
const worldIds = (world:ExpansionWorld): StoryId[] => [1,2,3,4,5].map(number=>`${world}-${number}` as StoryId);
export type StoryChapter = {
  id: string;
  title: string;
  subtitle: string;
  theme: keyof typeof themes;
  objective: string;
  levelIds: readonly StoryId[];
  requires?: string;
  opening?: string;
  closing?: string;
  mechanic: string;
};
export const chapters: readonly StoryChapter[] = [
  {...worldContent.aero,theme:"aero",levelIds:aeroIds,opening:"first-spark",closing:"water-returns"},
  {...worldContent.eco,theme:"eco",levelIds:worldIds("eco"),requires:"aero"},
  {...worldContent.terra,theme:"terra",levelIds:worldIds("terra"),requires:"eco"},
  {...worldContent.metro,theme:"metro",levelIds:worldIds("metro"),requires:"terra"},
  {...worldContent.null,theme:"null",levelIds:worldIds("null"),requires:"metro"},
];
export const aero = chapters[0];
export const campaignIds = chapters.flatMap(chapter=>chapter.levelIds);
export const isStoryId = (value: string): value is StoryId => campaignIds.some(id => id === value);
export const chapterFor = (id:StoryId) => chapters.find(chapter=>chapter.levelIds.includes(id))!;
export const storyLink = (id: StoryId) => `?c=${id.startsWith("aero-") ? "st4" : "st6"}-${id}#story-play`;

export const chapterHash = (world:StoryChapter["theme"]) => world==="aero" ? "story-aero" : `story-world-${world}`;
