import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { legacyFilms as films } from "../src/story/film/boards";
import { characterContent, dialogueContent, levelContent, siteContent, worldContent } from "../src/content";
import cinema from "../src/content/cinematics.json" with { type: "json" };
import dialogue from "../src/content/dialogue.json" with { type: "json" };
import characters from "../src/content/characters.json" with { type: "json" };
import worlds from "../src/content/worlds.json" with { type: "json" };

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error("Story content · " + message);
}
function text(value: unknown, name: string, limit = 300) {
  check(typeof value === "string" && value.trim() && value.length <= limit, name + " requires plain text");
}
function order(actual: string[], expected: string[], section: string) {
  check(actual.length === expected.length && actual.every((id, index) => id === expected[index]), section + " IDs must retain their order and spelling");
}

export function validateContent(root = process.cwd()) {
  order(characters.characters.map(x=>x.id), ["Luma","System","Ripple"], "Character");
  order(worlds.worlds.map(x=>x.id), ["aero","eco","terra","metro","null"], "World");
  order(levelContent.levels.map(x=>x.id), ["aero-1","aero-2","aero-3","aero-4","aero-5"], "Puzzle");
  order(cinema.films.map(x=>x.id), Object.keys(films), "Film");
  check(levelContent.milestones.length === 6, "Keep six milestones");
  for (const key of ["title", "description", "homeTitle", "homeEmphasis", "homeIntro", "storyTitle", "storyIntro", "worldImage"] as const) text(siteContent[key], key, 500);
  for (const world of Object.values(worldContent)) {
    for (const key of ["title", "subtitle", "objective", "mechanic"] as const) text(world[key], world.id + "/" + key);
    check(/^#[a-f0-9]{6}$/i.test(world.accent) && /^#[a-f0-9]{6}$/i.test(world.sky), world.id + " colors must be #RRGGBB");
  }
  for (const row of levelContent.levels) {
    for (const key of ["title", "hint", "narrative", "before", "after", "clue", "fragment"] as const) text(row[key], row.id + "/" + key, 500);
  }
  for (const row of levelContent.milestones) {
    for (const key of ["name", "landmark", "detail"] as const) text(row[key], "Milestone " + key, 500);
  }
  const art = siteContent.worldImage.replace(/^\//,"");
  check(/^assets\/[a-z0-9][a-z0-9._-]*\.(svg|webp|png|jpe?g)$/i.test(art) && existsSync(resolve(root,"public",art)),
    "World art must reference an existing approved image under /assets");
  for (const character of Object.values(characterContent)) {
    text(character.name, character.id + " display name", 32);
  }
  const spokenIds = Object.values(films).flatMap(film=>film.shots.flatMap(shot=>shot.line ? [shot.line.id] : []));
  check(spokenIds.length === new Set(dialogue.lines.map(x=>x.id)).size && dialogue.lines.length===spokenIds.length &&
    spokenIds.every(id=>dialogueContent[id]), "Dialogue IDs must match the animated shots");
  const shotIds = cinema.films.flatMap(film => film.shots.map(shot => shot.id));
  check(new Set(shotIds).size === shotIds.length, "Shot IDs must be unique");
  for (const film of cinema.films) {
    text(film.title, film.id+" title", 90);
    order(film.shots.map(x=>x.id), films[film.id as keyof typeof films].shots.map(shot=>shot.id), film.id + " shot");
    for (const shot of film.shots) text(shot.label, shot.id+" label", 90);
  }
  for (const film of Object.values(films)) {
    for (const shot of film.shots) {
      if (!shot.line) continue;
      const line = dialogueContent[shot.line.id];
      text(line.text,line.id);
      check(Object.hasOwn(characterContent,line.speaker), line.id + " has an unknown speaker");
      check(Number.isFinite(line.start)&&line.start>=0&&line.start<shot.seconds-.25, line.id+" starts outside the shot");
      check(["neutral","excited","curious","concerned","thoughtful","determined","relieved"].includes(line.emotion),
        line.id + " has an unapproved direction");
    }
  }
  return { scenes: Object.keys(films).length, lines: spokenIds.length };
}
