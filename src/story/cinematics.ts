import { Vector3 } from "three";
import { Arena3D, type SceneData } from "../scene/arena";
import type { Save } from "../services/storage";
import { motif } from "../services/audio";
import { storyLink } from "./chapters";
import { markViewed, persistStory, presentation, type StorySave } from "./save";
import { sequences, shots, type SceneRoute } from "./narrative";
import { Soundscape } from "./soundscape";
import { themes } from "./themes";

const landing = {
  blocks:[{id:"arrival-island",x:0,y:-.2,z:0,w:10,h:.4,d:6}],
  orbs:[{id:0,x:-2,y:.28,z:0,radius:.28,color:"#10a4ba",state:"docked"}],
  goals:[{id:0,x:2.1,y:0,z:0,radius:.67,color:"#10a4ba"}],
  switches:[],
};
function cinematicData(route:SceneRoute, survey?: SceneData):SceneData {
  if(survey)return survey;
  if(route==="story-eco")return {native:true,blocks:[],orbs:[],goals:[],switches:[],story:{theme:themes.eco,stage:3}};
  return {...landing,native:true,story:{
    theme:themes.aero,stage:route==="story-intro"?5:4,
    currents:[{id:"aqueduct",x:1,y:0,z:1,w:7,d:1.15,force:{x:6,y:0,z:0},switchId:"power"}],
  }};
}

export function cinematic(main:HTMLElement, route:SceneRoute, story:StorySave, save:Save, storage?:Storage, survey?:SceneData) {
  const sequence=sequences[route];
  const options=presentation(story);
  const isEco=route==="story-eco";
  const theme=isEco?themes.eco:themes.aero;
  const soundtrack=new Soundscape(()=>options.music);
  const returnLink=route==="story-intro"?storyLink("aero-1"):route==="story-survey"?storyLink("aero-5"):
    route==="story-restored"?"#story-eco":"#story-aero";
  main.className=`story-screen ${options.largeText?"living-large-text":""}`;
  main.innerHTML=`<section class="story-page story-cinematic living-cinematic ${isEco?"living-eco":""}">
    <a href="#story-aero" class="story-back">← Aero Haven</a>
    <p class="eyebrow">${sequence.chapter}</p><h1>${sequence.title}</h1>
    <div class="story-shot"><canvas role="img" aria-label="${isEco?"Eco Canopy's glass greenhouses and energy tree":"Aero Haven's reservoirs, terraces and aqueduct crown"}"></canvas>
    <div class="shot-caption"><span id="shot-position"></span><strong id="shot-label"></strong></div></div>
    <div class="story-dialogue"><span class="luma-face" aria-hidden="true"></span><div><strong>Luma</strong><p aria-live="polite"></p></div></div>
    <div class="story-actions"><button type="button" class="primary" id="story-scene-next">Continue</button>
    <button type="button" class="secondary" id="story-scene-skip">Skip scene</button>
    <button type="button" id="story-scene-auto" aria-pressed="false">Auto advance</button>
    <button type="button" id="story-scene-music" aria-pressed="${options.music}">Scene music</button></div></section>`;
  const canvas=main.querySelector("canvas")!;
  let scene:Arena3D|undefined;
  try {
    scene=new Arena3D(canvas,cinematicData(route,survey));
    const quality=storage?.getItem("ripple-graphics");
    scene.setQuality(quality==="high"?"high":quality==="medium"?"medium":"low");
  }catch{
    scene?.dispose();
    scene=undefined;
    canvas.replaceWith(Object.assign(document.createElement("div"),{className:"story-shot-fallback"}));
  }
  const line=main.querySelector(".story-dialogue p")!;
  const next=main.querySelector<HTMLButtonElement>("#story-scene-next")!;
  const auto=main.querySelector<HTMLButtonElement>("#story-scene-auto")!;
  const music=main.querySelector<HTMLButtonElement>("#story-scene-music")!;
  let index=0, frame=0, last=0, elapsed=0, autoplay=false;
  const reduced=()=>save.settings.reduced||matchMedia("(prefers-reduced-motion: reduce)").matches;
  function render() {
    elapsed=0;
    const beat=sequence.beats[index];
    const signal="signal" in beat?beat.signal:"";
    line.textContent=beat.text;
    main.querySelector("#shot-position")!.textContent=`${index+1} / ${sequence.beats.length}`;
    main.querySelector("#shot-label")!.textContent=beat.label;
    next.textContent=index+1<sequence.beats.length?"Continue":sequence.next+" →";
    scene?.cinematicShot(shots[beat.shot],index>0&&!reduced());
    scene?.story?.setStage(beat.stage,signal);
    scene?.story?.update(beat.stage===5?["power"]:[]);
    scene?.story?.placeLuma("focusLuma" in beat?[-3.45,1.12,-.4]:undefined);
    scene?.story?.react(beat.mood,new Vector3(...shots[beat.shot].focus),Infinity);
    soundtrack.set(beat.stage);
  }
  const finish=()=>{
    markViewed(story,sequence.id);
    persistStory(story,storage);
    location.href=returnLink;
  };
  function advance() {
    if(index+1===sequence.beats.length){finish();return;}
    index++;
    render();
    if(index===1)motif(theme.notes.slice(0,3),save.settings.sound);
  }
  next.onclick=()=>{soundtrack.start();advance();};
  main.querySelector<HTMLButtonElement>("#story-scene-skip")!.onclick=finish;
  auto.onclick=()=>{
    autoplay=!autoplay;
    elapsed=0;
    auto.setAttribute("aria-pressed",String(autoplay));
    if(autoplay)soundtrack.start();
  };
  music.onclick=()=>{
    options.music=!options.music;
    music.setAttribute("aria-pressed",String(options.music));
    persistStory(story,storage);
    if(options.music)soundtrack.start();else soundtrack.setActive(false);
  };
  function draw(time:number) {
    const dt=last?Math.min(.12,(time-last)/1000):0;
    last=time;
    const active=!document.hidden&&!document.querySelector("dialog[open]");
    soundtrack.setActive(active);
    if(active){
      elapsed+=dt;
      if(autoplay&&elapsed>=13&&index+1<sequence.beats.length)advance();
      scene?.draw(dt,reduced(),true);
    }
    frame=requestAnimationFrame(draw);
  }
  const resize=()=>scene?.resize();
  window.addEventListener("resize",resize);
  render();
  frame=requestAnimationFrame(draw);
  return {pause(){soundtrack.setActive(false);},dispose(){cancelAnimationFrame(frame);window.removeEventListener("resize",resize);soundtrack.dispose();scene?.dispose();}};
}
