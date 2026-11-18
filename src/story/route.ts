import type { Save } from "../services/storage";
import { archive, chapterMap, worldMap } from "./map";
import { aftermath, films, isFilmRoute } from "./film/boards";
import { isStoryId, storyLink, aero } from "./chapters";
import { available, loadStory, persistStory, presentation, recordStory, restorationStage, type StorySave } from "./save";
import { themes } from "./themes";

let progress: StorySave | undefined;
export async function openStory(main:HTMLElement, route:string, save:Save, storage:Storage|undefined,
  notify:(text:string)=>void, current:()=>boolean) {
  const story = progress ??= loadStory(storage);
  const options = presentation(story);
  if (route === "story") return worldMap(main,story);
  if (route === "story-aero") return chapterMap(main,story);
  if (route === "story-archive") return archive(main,story,storage);
  if (isFilmRoute(route)) {
    if (restorationStage(story)<films[route].stage) return chapterMap(main,story);
    const {cinematic}=await import("./cinematics");
    if(!current())return;
    return cinematic(main,route,story,save,storage,current);
  }
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
  const filmRoute=aftermath[level.id-1];
  const offerFilm=()=>!options.skipScenes && !story.viewed.includes(films[filmRoute].id) &&
    restorationStage(story)>=films[filmRoute].stage;
  return mountNative(main,code,save,storage,notify,{
    level,theme:themes.aero,stage:()=>restorationStage(story),best:()=>story.best[id],
    record(result) {
      const improved = recordStory(story,id,result);
      if (!persistStory(story,storage)) notify("Storage unavailable. Story progress stays in this session.");
      return improved;
    },
    next: () => offerFilm() ? "#"+filmRoute : next ? storyLink(next) : "#story-aero",
    canContinue: () => !!story.best[id],
    nextLabel: () => offerFilm() ? "Watch "+films[filmRoute].title+" →" : next ? "Next story circuit →" : "Return to Aero Haven →",
    music: () => options.music,
    largeText: () => options.largeText,
  });
}
