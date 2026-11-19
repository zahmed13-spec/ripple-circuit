import cinematics from "./cinematics.json" with { type: "json" };
import dialogue from "./dialogue.json" with { type: "json" };
import characters from "./characters.json" with { type: "json" };
import worlds from "./worlds.json" with { type: "json" };

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

export { default as levelContent } from "./levels.json" with { type: "json" };
export { default as siteContent } from "./site.json" with { type: "json" };
