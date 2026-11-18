import { Arena3D, type SceneData } from "../scene/arena";
import { motif } from "../services/audio";
import type { Save } from "../services/storage";
import { aero, chapters, storyLink } from "./chapters";
import { available, completed, persistStory, restored, type StorySave } from "./save";
import { themes } from "./themes";

const levelNames = ["A New Ripple", "The Flowing Path", "Beneath the Surface", "Reconnect the Stream", "Guardian of the Aqueduct"];
const scenes = {
  "story-intro": {
    id:"first-spark", title:"The Last Spark", speaker:"Luma",
    lines:["Everything used to flow together. The Current carried life from island to island.",
      "Then the connections started disappearing. The aqueduct went quiet.",
      "There's still a spark left. I think it's you. Let's see what one ripple can do."],
  },
  "story-restored": {
    id:"water-returns", title:"The Water Returns", speaker:"Luma",
    lines:["Intake. Relay. Crown. The aqueduct is alive again.",
      "Look at the crystal. The islands are lighting up all the way to the canopy.",
      "A fragment came through with the water: ‘Stability directive interrupted.’ Eco Canopy is next."],
  },
} as const;

export function worldMap(main: HTMLElement, story: StorySave) {
  main.className = "story-screen";
  main.innerHTML = `<section class="story-page"><div class="story-map-header"><p class="eyebrow">Story Mode</p>
  <h1>The Fractured Ripple</h1><p>The Current once linked five worlds. Follow its last spark and reconnect the network.</p>
  <a class="primary link-button" href="#story-aero">${restored(story)?"Revisit Aero Haven":"Enter Aero Haven"} →</a></div>
  <ol class="story-worlds" aria-label="Worlds of the Current">${chapters.map(c=>{
    const theme = themes[c.theme];
    const live = c.id === "aero";
    const preview = c.id === "eco" && restored(story);
    return `<li class="story-world" style="--biome:${theme.accent};--biome-sky:${theme.sky}"><div class="world-art ${c.theme}" aria-hidden="true"><i></i></div><div class="world-copy">
      <span class="eyebrow">${live ? (restored(story)?"Restored":`${completed(story)} / 5 circuits · ${completed(story)*20}%`) : preview ? "Preview unlocked" : "Future region · Locked"}</span>
      <h2>${c.title}</h2><p>${c.subtitle}</p><small>${c.mechanic}</small>
      ${live ? '<a href="#story-aero">Open chapter →</a>' : preview ? '<a href="#story-eco">Open preview →</a>' : ""}
    </div></li>`;
  }).join("")}</ol></section>`;
}

export function chapterMap(main: HTMLElement, story: StorySave) {
  const next = aero.levelIds[Math.min(completed(story),4)];
  main.className = "story-screen";
  main.innerHTML = `<section class="story-page"><a href="#story" class="story-back">← World map</a>
    <div class="story-chapter-heading"><div><p class="eyebrow">Chapter 1 · ${restored(story)?"Restored":"The aqueduct is dormant"}</p>
    <h1>Aero Haven</h1><p>${aero.objective}</p></div><div class="story-progress"><strong>${completed(story)*20}%</strong><span>${completed(story)} of 5 circuits</span></div></div>
    <div class="story-actions">${completed(story) === 0 && !story.viewed.includes("first-spark")
      ? '<a class="primary link-button" href="#story-intro">Begin story →</a>'
      : `<a class="primary link-button" href="${storyLink(next)}">${restored(story)?"Replay aqueduct":"Continue story"} →</a><a href="#story-intro">Replay opening</a>`}
      ${restored(story) ? '<a href="#story-restored">Revisit the restoration</a><a href="#story-eco">Preview Eco Canopy →</a>' : ""}
    </div>
    <ol class="story-levels" aria-label="Aero Haven circuits">${aero.levelIds.map((id,i)=>{
      const score = story.best[id];
      const content = `<span class="story-level-number">1-${i+1}</span><span><strong>${levelNames[i]}</strong><small>${score ? `${score.pulses} pulses · ${(score.ticks/60).toFixed(2)}s · ${"★".repeat(score.stars)}` : i===4?"Aqueduct finale":["Shockwaves","Water currents","Elevation","Pressure plates"][i]}</small></span>`;
      const href = i===0 && !story.viewed.includes("first-spark") ? "#story-intro" : storyLink(id);
      return `<li>${available(story,id)?`<a href="${href}">${content}<span aria-hidden="true">→</span></a>`:`<div aria-disabled="true">${content}<span>Locked</span></div>`}</li>`;
    }).join("")}</ol></section>`;
}

export function ecoPreview(main:HTMLElement, story:StorySave) {
  if (!restored(story)) { worldMap(main,story); return; }
  main.className = "story-screen";
  main.innerHTML = `<section class="story-page eco-preview"><a href="#story" class="story-back">← World map</a>
  <p class="eyebrow">Chapter 2 preview · In development</p><h1>Eco Canopy</h1>
  <p>Glass greenhouses trace the forest's old energy paths. When the Current reaches them, living bridges will connect the islands again.</p>
  <div class="world-art eco" aria-hidden="true"><i></i></div><a href="#story-aero">Return to Aero Haven</a></section>`;
}

function cinematicData(on: boolean): SceneData {
  const blocks = [
    {id:"arrival",x:-3,y:.25,z:1,w:5,h:.5,d:4},
    {id:"aqueduct",x:2.1,y:.65,z:-1.5,w:5,h:.6,d:3},
    {id:"conduit",x:.3,y:.1,z:0,w:2,h:.2,d:3},
  ];
  return {native:true,blocks,orbs:[{id:0,x:-3,y:.85,z:1,radius:.35,color:"#18c1c8",state:"docked"}],
    goals:[],switches:[],story:{theme:themes.aero,restored:on,
      currents:[{id:"aqueduct",x:2.1,y:.95,z:-1.5,w:4.7,d:1.4,force:{x:6,y:0,z:0},switchId:"power"}]}};
}

export function cinematic(main:HTMLElement, route:keyof typeof scenes, story:StorySave, save:Save, storage?:Storage) {
  const closing = route === "story-restored";
  if (closing && !restored(story)) { chapterMap(main,story); return; }
  const sequence = scenes[route];
  main.className = "story-screen";
  main.innerHTML = `<section class="story-page story-cinematic"><a href="#story-aero" class="story-back">← Aero Haven</a>
    <p class="eyebrow">Aero Haven</p><h1>${sequence.title}</h1>
    <div class="story-shot"><canvas aria-label="Aero Haven islands and aqueduct"></canvas></div>
    <div class="story-dialogue"><span class="luma-badge" aria-hidden="true">✦</span><div><strong>${sequence.speaker}</strong><p aria-live="polite"></p></div></div>
    <div class="story-actions"><button type="button" class="primary" id="story-scene-next">Continue</button>
    <button type="button" class="secondary" id="story-scene-skip">Skip scene</button></div></section>`;
  const canvas = main.querySelector("canvas")!;
  let scene: Arena3D | undefined;
  try {
    scene = new Arena3D(canvas,cinematicData(!closing));
    scene.setQuality("low");
    scene.setCamera("isometric");
  } catch {
    canvas.replaceWith(Object.assign(document.createElement("div"),{className:"story-shot-fallback"}));
  }
  const dialogue = main.querySelector(".story-dialogue p")!;
  const next = main.querySelector<HTMLButtonElement>("#story-scene-next")!;
  let index = 0, frame = 0, last = 0;
  function render() {
    dialogue.textContent = sequence.lines[index];
    next.textContent = index < sequence.lines.length-1 ? "Continue" : closing ? "Preview Eco Canopy →" : "Play A New Ripple →";
    if (scene?.story) {
      const powered = closing ? index > 0 : index === 0;
      scene.story.restore(powered);
      scene.story.update(powered ? ["power"] : []);
    }
    scene?.setCamera(index===1?"classic":"isometric",!save.settings.reduced);
  }
  function finish() {
    if (!story.viewed.includes(sequence.id)) story.viewed.push(sequence.id);
    persistStory(story,storage);
    location.href = closing ? "#story-eco" : storyLink("aero-1");
  }
  next.onclick = () => {
    if (index === 0) motif(closing ? themes.aero.notes : themes.aero.notes.slice(0,3),save.settings.sound);
    if (++index < sequence.lines.length) render();
    else finish();
  };
  main.querySelector<HTMLButtonElement>("#story-scene-skip")!.onclick = finish;
  function draw(time:number) {
    if (!document.hidden) scene?.draw(last ? Math.min(.1,(time-last)/1000) : 0,save.settings.reduced,true);
    last = time;
    frame = requestAnimationFrame(draw);
  }
  const resize = () => scene?.resize();
  window.addEventListener("resize",resize);
  render();
  if (scene) frame = requestAnimationFrame(draw);
  return {pause() {},dispose() { cancelAnimationFrame(frame); window.removeEventListener("resize",resize); scene?.dispose(); }};
}
