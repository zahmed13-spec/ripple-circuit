import { aero, campaignIds, chapterFor, isStoryId, type StoryId } from "./chapters";

import { legacyFilms, sceneIds } from "./film/boards";

export const STORY_KEY = "ripple-circuit-story-v1";
export const EXPANSION_STORY_KEY = "ripple-circuit-story-v2";
export type StoryResult = { pulses: number; ticks: number; stars: number };
export type StorySave = {
  version: 2;
  best: Partial<Record<StoryId, StoryResult>>;
  viewed: string[];
  presentation?: {music:boolean; largeText:boolean; skipScenes:boolean};
};

const blank = (): StorySave => ({version:2,best:{},viewed:[]});
function validResult(r?: StoryResult): r is StoryResult {
  return !!r && Number.isInteger(r.pulses) && r.pulses >= 1 && r.pulses <= 8 &&
    Number.isInteger(r.ticks) && r.ticks >= 1 && r.ticks <= 7200 &&
    Number.isInteger(r.stars) && r.stars >= 1 && r.stars <= 3;
}
export function loadStory(storage?: Pick<Storage,"getItem">): StorySave {
  const save = blank();
  const read = (key:string,version:number) => {
    try {
      const raw=JSON.parse(storage?.getItem(key)??"null") as (Omit<StorySave,"version">&{version:number}) | null;
      return raw?.version===version ? raw : null;
    } catch { return null; }
  };
  const current=read(EXPANSION_STORY_KEY,2);
  const legacy=read(STORY_KEY,1);
  for (const id of campaignIds) {
    const result=current?.best?.[id];
    const prior=legacy?.best?.[id];
    if(!validResult(result) && !validResult(prior))break;
    if(validResult(result)&&validResult(prior)){
      save.best[id]=prior.pulses<result.pulses || (prior.pulses===result.pulses&&prior.ticks<result.ticks) ? prior : result;
    } else save.best[id]=validResult(result)?result:prior;
  }
  save.viewed=sceneIds.filter(id=>(Array.isArray(current?.viewed)&&current.viewed.includes(id)) ||
    (Array.isArray(legacy?.viewed)&&legacy.viewed.includes(id)));
  const settings=current?.presentation??legacy?.presentation;
  if(settings && typeof settings==="object"){
    save.presentation={music:settings.music!==false,largeText:settings.largeText===true,skipScenes:settings.skipScenes===true};
  }
  return save;
}
export const completed = (save: StorySave, chapter = aero) => chapter.levelIds.filter(id => save.best[id]).length;
export const campaignCompleted = (save:StorySave) => campaignIds.filter(id=>save.best[id]).length;
export const storyStage = (save:StorySave,id:StoryId) => completed(save,chapterFor(id));
export const restorationStage = completed;
export const restored = (save: StorySave) => completed(save) === aero.levelIds.length;
export const available = (save: StorySave, id: StoryId) =>
  isStoryId(id) && campaignIds.indexOf(id) <= campaignCompleted(save);

export function recordStory(save: StorySave, id: StoryId, result: StoryResult) {
  if (!available(save,id) || !validResult(result)) return false;
  const best = save.best[id];
  if (best && (best.pulses < result.pulses || best.pulses === result.pulses && best.ticks <= result.ticks)) return false;
  save.best[id] = result;
  return true;
}
export function persistStory(save: StorySave, storage?: Pick<Storage,"setItem">) {
  if(!storage)return false;
  try {
    storage.setItem(EXPANSION_STORY_KEY,JSON.stringify(save));
    const best=Object.fromEntries(aero.levelIds.filter(id=>save.best[id]).map(id=>[id,save.best[id]]));
    const legacyIds=Object.values(legacyFilms).map(film=>String(film.id));
    const viewed=save.viewed.filter(id=>legacyIds.includes(id));
    storage.setItem(STORY_KEY,JSON.stringify({...save,version:1,best,viewed}));
    return true;
  } catch { return false; }
}

export function presentation(save:StorySave) {
  return save.presentation ??= {music:true,largeText:false,skipScenes:false};
}

export function markViewed(save:StorySave, id:string) {
  if (!sceneIds.some(scene => scene === id) || save.viewed.includes(id)) return false;
  save.viewed.push(id);
  return true;
}
