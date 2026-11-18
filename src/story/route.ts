import type { Save } from "../services/storage";
import { archive, chapterMap, worldMap } from "./map";
import { cinematic } from "./cinematics";
import { isStoryId, storyLink, aero } from "./chapters";
import { available, loadStory, persistStory, presentation, recordStory, restorationStage, restored, type StorySave } from "./save";
import { themes } from "./themes";

let progress: StorySave | undefined;
export async function openStory(main:HTMLElement, route:string, save:Save, storage:Storage|undefined,
  notify:(text:string)=>void, current:()=>boolean) {
  const story = progress ??= loadStory(storage);
  const options = presentation(story);
  if (route === "story") return worldMap(main,story);
  if (route === "story-aero") return chapterMap(main,story);
  if (route === "story-archive") return archive(main,story,storage);
  if (route === "story-intro") return cinematic(main,route,story,save,storage);
  if (route === "story-eco" || route === "story-restored")
    return restored(story) ? cinematic(main,route,story,save,storage) : chapterMap(main,story);
  if (route === "story-survey") {
    if (!available(story,"aero-5")) return chapterMap(main,story);
    const {storyLevels}=await import("./levels");
    if(!current())return;
    const finale=storyLevels[4];
    return cinematic(main,route,story,save,storage,{...finale,native:true,story:{
      theme:themes.aero,currents:finale.currents,stage:restorationStage(story),
    }});
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
  const showClosing = () => !options.skipScenes&&!story.viewed.includes("water-returns");
  return mountNative(main,code,save,storage,notify,{
    level,theme:themes.aero,stage:()=>restorationStage(story),best:()=>story.best[id],
    record(result) {
      const improved = recordStory(story,id,result);
      if (!persistStory(story,storage)) notify("Storage unavailable. Story progress stays in this session.");
      return improved;
    },
    next: () => next ? storyLink(next) : showClosing() ? "#story-restored" : "#story-aero",
    canContinue: () => !!story.best[id],
    nextLabel: () => next ? "Next story circuit →" : showClosing() ? "See Aero Haven restored →" : "Return to Aero Haven →",
    music: () => options.music,
    largeText: () => options.largeText,
  });
}
