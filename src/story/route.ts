import type { Save } from "../services/storage";
import { chapterMap, cinematic, ecoPreview, worldMap } from "./map";
import { isStoryId, storyLink, aero } from "./chapters";
import { available, loadStory, persistStory, recordStory, restored, type StorySave } from "./save";
import { themes } from "./themes";

let progress: StorySave | undefined;
export async function openStory(main:HTMLElement, route:string, save:Save, storage:Storage|undefined,
  notify:(text:string)=>void, current:()=>boolean) {
  const story = progress ??= loadStory(storage);
  if (route === "story") return worldMap(main,story);
  if (route === "story-aero") return chapterMap(main,story);
  if (route === "story-eco") return ecoPreview(main,story);
  if (route === "story-intro" || route === "story-restored") return cinematic(main,route,story,save,storage);
  const code = new URLSearchParams(location.search).get("c") ?? "";
  const id = code.startsWith("st4-") ? code.slice(4) : "";
  if (!isStoryId(id) || !available(story,id)) {
    chapterMap(main,story);
    notify(isStoryId(id) ? "Complete the previous circuit to unlock this one." : "Unknown story circuit. Choose a level from Aero Haven.");
    return;
  }
  const [{ storyLevels },{ mountNative }] = await Promise.all([import("./levels"),import("../native/ui")]);
  if (!current()) return;
  const level = storyLevels.find(level => level.storyId === id)!;
  const next = aero.levelIds[level.id];
  return mountNative(main,code,save,storage,notify,{
    level,theme:themes.aero,isRestored:()=>restored(story),best:()=>story.best[id],
    record(result) {
      const improved = recordStory(story,id,result);
      if (!persistStory(story,storage)) notify("Storage unavailable. Story progress stays in this session.");
      return improved;
    },
    next: () => next ? storyLink(next) : "#story-restored",
    canContinue: () => !!story.best[id],
    nextLabel: next ? "Next story circuit →" : "See Aero Haven restored →",
  });
}
