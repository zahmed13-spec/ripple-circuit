import type { Save } from "../services/storage";
import { archive, chapterMap, worldMap } from "./map";
import { aftermath, films, isFilmRoute } from "./film/boards";
import { expansionRoute } from "./film/expansion";
import { aero, campaignIds, chapters, chapterFor, chapterHash, isStoryId, storyLink, type ExpansionWorld } from "./chapters";
import { available, campaignCompleted, loadStory, persistStory, presentation, recordStory, storyStage, type StorySave } from "./save";
import { themes } from "./themes";

let progress: StorySave | undefined;
export async function openStory(main:HTMLElement, route:string, save:Save, storage:Storage|undefined,
  notify:(text:string)=>void, current:()=>boolean) {
  const story = progress ??= loadStory(storage);
  const options = presentation(story);
  if (route === "story") return worldMap(main,story);
  if (route === "story-archive") return archive(main,story,storage);
  const chapterMapRoute=chapters.find(chapter=>route===chapterHash(chapter.theme));
  if (chapterMapRoute) return renderChapter(chapterMapRoute.theme);
  if (isFilmRoute(route)) {
    const film=films[route];
    if (campaignCompleted(story)<film.stage) return chapterMap(main,story);
    const {cinematic}=await import("./cinematics");
    if(!current())return;
    return cinematic(main,route,story,save,storage,current);
  }
  const code = new URLSearchParams(location.search).get("c") ?? "";
  const match = /^(st4|st6)-(.+)$/.exec(code);
  const id = match?.[2] ?? "";
  if (!isStoryId(id) || (id.startsWith("aero-") ? match?.[1]!=="st4" : match?.[1]!=="st6") || !available(story,id)) {
    chapterMap(main,story);
    notify(isStoryId(id) ? "Complete the previous circuit to unlock this one." : "Unknown story circuit. Choose a level from Aero Haven.");
    return;
  }
  const chapter=chapterFor(id);
  const [levels,{mountNative}] = await Promise.all([loadChapter(chapter.theme),import("../native/ui")]);
  if (!current()) return;
  const level=levels.find(level=>level.storyId===id)!;
  const next=campaignIds[campaignIds.indexOf(id)+1];
  const filmRoute=chapter.theme==="aero" ? aftermath[level.id-1] : expansionRoute(chapter.theme,level.id);
  const offerFilm=()=>!options.skipScenes && !story.viewed.includes(films[filmRoute].id) &&
    campaignCompleted(story)>=films[filmRoute].stage;
  const nextChapter=next ? chapterFor(next) : undefined;
  function nextLocation() {
    if(offerFilm())return "#"+filmRoute;
    if(!next || !nextChapter)return "#story";
    if(nextChapter!==chapter && !options.skipScenes){
      const opening=expansionRoute(nextChapter.theme as ExpansionWorld,0);
      if(!story.viewed.includes(films[opening].id))return "#"+opening;
    }
    return storyLink(next);
  }
  return mountNative(main,code,save,storage,notify,{
    level,theme:themes[chapter.theme],stage:()=>storyStage(story,id),best:()=>story.best[id],
    record(result) {
      const improved = recordStory(story,id,result);
      if (!persistStory(story,storage)) notify("Storage unavailable. Story progress stays in this session.");
      return improved;
    },
    next:nextLocation,
    canContinue: () => !!story.best[id],
    nextLabel: () => offerFilm() ? "Watch "+films[filmRoute].title+" →" : next ? "Next story circuit →" : "Return to the world map →",
    music: () => options.music,
    largeText: () => options.largeText,
  });

  async function renderChapter(world:typeof aero.theme) {
    if (world==="aero") return chapterMap(main,story!);
    const target=chapters.find(entry=>entry.theme===world)!;
    if(!available(story!,target.levelIds[0]))return worldMap(main,story!);
    const levels=await loadChapter(world);
    if(current())chapterMap(main,story!,target,levels);
  }
}

const chapterLoaders={
  aero:()=>import("./levels").then(module=>module.storyLevels),
  eco:()=>import("./worlds/eco").then(module=>module.ecoLevels),
  terra:()=>import("./worlds/terra").then(module=>module.terraLevels),
  metro:()=>import("./worlds/metro").then(module=>module.metroLevels),
  null:()=>import("./worlds/null").then(module=>module.nullLevels),
};
const loadChapter = (world:typeof aero.theme) => chapterLoaders[world]();
