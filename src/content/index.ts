import cinematics from "./cinematics.json";
import dialogue from "./dialogue.json";
import characters from "./characters.json";
import worlds from "./worlds.json";

const byId = <T extends { id: string }>(items: readonly T[]): Record<string, T> =>
  Object.fromEntries(items.map(item => [item.id, item]));

export const filmContent = byId(cinematics.films);
export const shotContent = byId(cinematics.films.flatMap(film => film.shots));
export const dialogueContent = byId(dialogue.lines);
export const characterContent = byId(characters.characters);
export const worldContent = byId(worlds.worlds);

export const html = (text: string) => text.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

export { default as levelContent } from "./levels.json";
export { default as siteContent } from "./site.json";
