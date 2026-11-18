import { aero, isStoryId, type StoryId } from "./chapters";

export const STORY_KEY = "ripple-circuit-story-v1";
export type StoryResult = { pulses: number; ticks: number; stars: number };
export type StorySave = {
  version: 1;
  best: Partial<Record<StoryId, StoryResult>>;
  viewed: string[];
};

const blank = (): StorySave => ({version:1,best:{},viewed:[]});
function validResult(r?: StoryResult): r is StoryResult {
  return !!r && Number.isInteger(r.pulses) && r.pulses >= 1 && r.pulses <= 8 &&
    Number.isInteger(r.ticks) && r.ticks >= 1 && r.ticks <= 7200 &&
    Number.isInteger(r.stars) && r.stars >= 1 && r.stars <= 3;
}
export function loadStory(storage?: Pick<Storage,"getItem">): StorySave {
  const save = blank();
  try {
    const raw = JSON.parse(storage?.getItem(STORY_KEY) ?? "null") as StorySave | null;
    if (raw?.version !== 1) return save;
    for (const id of aero.levelIds) {
      const result = raw.best?.[id];
      if (!validResult(result)) break;
      save.best[id] = result;
    }
    if (Array.isArray(raw.viewed)) save.viewed = ["first-spark","water-returns"].filter(s => raw.viewed.includes(s));
  } catch { /* A corrupt or unavailable save starts a fresh story. */ }
  return save;
}
export const completed = (save: StorySave) => aero.levelIds.filter(id => save.best[id]).length;
export const restored = (save: StorySave) => completed(save) === aero.levelIds.length;
export const available = (save: StorySave, id: StoryId) =>
  isStoryId(id) && aero.levelIds.indexOf(id) <= completed(save);

export function recordStory(save: StorySave, id: StoryId, result: StoryResult) {
  if (!available(save,id) || !validResult(result)) return false;
  const best = save.best[id];
  if (best && (best.pulses < result.pulses || best.pulses === result.pulses && best.ticks <= result.ticks)) return false;
  save.best[id] = result;
  return true;
}
export function persistStory(save: StorySave, storage?: Pick<Storage,"setItem">) {
  try { storage?.setItem(STORY_KEY, JSON.stringify(save)); return !!storage; }
  catch { return false; }
}
