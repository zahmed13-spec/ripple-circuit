import { worldContent } from "../content";
import { themes } from "./themes";

const aeroIds = ["aero-1", "aero-2", "aero-3", "aero-4", "aero-5"] as const;
export type StoryId = typeof aeroIds[number];
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
  {...worldContent.eco,theme:"eco",levelIds:[],requires:"aero"},
  {...worldContent.terra,theme:"terra",levelIds:[],requires:"eco"},
  {...worldContent.metro,theme:"metro",levelIds:[],requires:"terra"},
  {...worldContent.null,theme:"null",levelIds:[],requires:"metro"},
];
export const aero = chapters[0];
export const isStoryId = (value: string): value is StoryId => aeroIds.some(id => id === value);
export const storyLink = (id: StoryId) => `?c=st4-${id}#story-play`;
