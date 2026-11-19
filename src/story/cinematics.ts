import { html } from "../content";
import type { Save } from "../services/storage";
import { motif } from "../services/audio";
import { isStoryId, storyLink } from "./chapters";
import { markViewed, persistStory, presentation, type StorySave } from "./save";
import { films, type FilmRoute } from "./film/boards";
import { FilmStage } from "./film/stage";
import { loadCast } from "./film/cast";
import { Soundscape } from "./soundscape";

export async function cinematic(main:HTMLElement, route:FilmRoute, story:StorySave, save:Save, storage?:Storage,
  stillCurrent:()=>boolean=()=>true) {
  const cast=await loadCast();
  if(!stillCurrent()){
    if(cast)for(const resource of cast.resources)resource.dispose();
    return;
  }
  const film=films[route], options=presentation(story);
  const isEco=route==="story-eco";
  const soundscape=new Soundscape(()=>options.music);
  const viewportMotion=matchMedia("(prefers-reduced-motion: reduce)");
  const reduced=()=>save.settings.reduced||viewportMotion.matches;
  const ticket=film.next;
  const returnLink= isStoryId(ticket)?storyLink(ticket)
    : ticket==="story-survey"&&(options.skipScenes||story.viewed.includes(films["story-survey"].id))
      ?storyLink("aero-5"):"#"+ticket;
  main.className=`story-screen ${options.largeText?"living-large-text":""}`;
  main.innerHTML=`<section class="story-page living-cinematic film-page ${isEco?"living-eco":""}">
    <div class="film-heading"><div><a href="#story-aero" class="story-back">← Aero Haven</a>
    <p class="eyebrow">${html(film.chapter)}</p><h1>${html(film.title)}</h1></div>
    <span>Animated story<br>Subtitles</span></div>
    <div class="film-frame">
      <canvas role="img" aria-label="${html(film.title)}, an original cel-shaded animated scene"></canvas>
      <div class="film-preview-label" id="film-fallback" hidden>Animation unavailable. Read the scene below.</div>
      <div class="film-dip" aria-hidden="true"></div>
      <div class="film-lettering"><span id="shot-position"></span><strong id="shot-label"></strong></div>
    </div>
    <div class="film-captions" aria-live="polite" aria-atomic="true"><strong id="film-speaker"></strong><p id="film-line"></p></div>
    <div class="film-transport">
      <button type="button" id="film-toggle" class="secondary">Pause</button>
      <button type="button" id="film-previous" aria-label="Previous shot">‹</button>
      <label class="film-scrubber"><span class="sr-only">Scene time</span><input type="range" aria-label="Scene time" min="0" step="0.1"></label>
      <time id="film-time" aria-hidden="true"></time>
      <button type="button" id="story-scene-next" aria-label="Next shot">›</button>
      <button type="button" id="story-scene-music" aria-pressed="${options.music}">${options.music?"Enable sound":"Music"}</button>
    </div>
    <div class="story-actions film-actions"><button type="button" class="primary" id="story-scene-skip">Skip scene</button>
      <details><summary>Read transcript</summary><ol>${film.shots.map(shot=>`<li><strong>${html(shot.label)}</strong>${shot.line?`<p><b>${html(shot.line.speaker)}:</b> ${html(shot.line.text)}</p>`:""}</li>`).join("")}</ol></details>
    </div></section>`;
  const $=<T extends HTMLElement>(id:string)=>main.querySelector<T>("#"+id)!;
  const canvas=main.querySelector("canvas")!;
  const offsets:number[]=[];
  let runtime=0;
  for(const shot of film.shots){offsets.push(runtime);runtime+=shot.seconds;}
  const slider=main.querySelector<HTMLInputElement>(".film-scrubber input")!;
  slider.max=String(runtime);
  slider.value="0";
  const fallback=$("film-fallback");
  const dip=main.querySelector<HTMLElement>(".film-dip")!;
  let renderer:FilmStage|undefined;
  try {
    let quality:string|null|undefined;
    try{quality=storage?.getItem("ripple-graphics");}catch{}
    renderer=new FilmStage(canvas,isEco,quality==="high"?"high":quality==="medium"?"medium":"low",cast);
  } catch {
    if(cast)for(const resource of cast.resources)resource.dispose();
    fallback.hidden=false;
  }
  const speaker=$("film-speaker"),line=$("film-line"),toggle=$<HTMLButtonElement>("film-toggle");
  const previous=$<HTMLButtonElement>("film-previous"),next=$<HTMLButtonElement>("story-scene-next");
  const skip=$<HTMLButtonElement>("story-scene-skip"),music=$<HTMLButtonElement>("story-scene-music");
  let index=-1, elapsed=0, last=0, frame=0, lastRender=-1;
  let paused=reduced()||!renderer, ended=false, gesture=false, disposed=false, cuePlayed=false;
  const format=(t:number)=>Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0");

  function requestSound() {
    if(!gesture){
      gesture=true;
      music.textContent="Music";
    }
    if(options.music)soundscape.start();
  }
  function refresh(force=false) {
    let at=offsets.length-1;
    while(at>0&&offsets[at]>elapsed)at--;
    const shot=film.shots[at];
    const within=Math.min(shot.seconds,elapsed-offsets[at]);
    if(index!==at){
      index=at;
      cuePlayed=false;
      $("shot-position").textContent=`${at+1} / ${film.shots.length}`;
      $("shot-label").textContent=shot.label;
      next.disabled=at===film.shots.length-1;
      previous.disabled=at===0;
      force=true;
    }
    const dipIn=within<.28 ? 1-within/.28 : 0;
    const dipOut=shot.seconds-within<.20 ? 1-(shot.seconds-within)/.20 : 0;
    dip.style.opacity=(!reduced()&&!paused?Math.max(dipIn,dipOut)*.7:0).toFixed(2);
    const spoken=shot.line;
    const caption=spoken&&((within>=spoken.in&&within<spoken.out)||paused&&reduced()||!renderer);
    const who=caption?spoken!.speaker:"";
    const words=caption?spoken!.text:"";
    if(speaker.textContent!==who)speaker.textContent=who;
    if(line.textContent!==words)line.textContent=words;
    if(!slider.matches(":active"))slider.value=String(elapsed);
    $("film-time").textContent=`${format(elapsed)} / ${format(runtime)}`;
    if(force || (elapsed!==lastRender&&!reduced())) {
      renderer?.draw(shot,within,reduced());
      lastRender=elapsed;
      if(renderer) {
        canvas.dataset.stage=String(film.stage);
        canvas.dataset.restored=String(film.stage===5&&shot.power[shot.power.length-1][1]>.9);
        canvas.dataset.signal=shot.effect;
        canvas.closest(".film-frame")?.setAttribute("data-shot",String(at));
      }
    }
    if(gesture&&shot.cue&&!cuePlayed&&within>=shot.cue[0]&&within<shot.cue[0]+.2){
      cuePlayed=true;
      motif(shot.cue[1],save.settings.sound&&options.music);
    }
    const power=Number(canvas.dataset.energy??shot.power[0][1]);
    soundscape.set(Math.min(5,Math.round(power*5)),shot.effect==="restore"?2:0);
  }
  function setPaused(value:boolean) {
    paused=value;
    toggle.textContent=ended?"Replay":value?"Play":"Pause";
    main.querySelector(".film-frame")!.setAttribute("data-paused",String(value));
  }
  function changeTime(time:number) {
    elapsed=Math.min(runtime,Math.max(0,time));
    if(ended&&elapsed<runtime){ended=false;setPaused(true);}
    cuePlayed=true;
    refresh(true);
  }
  function finish() {
    markViewed(story,film.id);
    persistStory(story,storage);
    location.href=returnLink;
  }
  function end() {
    ended=true;
    if(markViewed(story,film.id))persistStory(story,storage);
    dip.style.opacity="0";
    setPaused(true);
    skip.textContent=isEco?"Return to Aero Haven":"Continue the story";
  }
  toggle.onclick=()=>{
    requestSound();
    if(ended){ended=false;skip.textContent="Skip scene";changeTime(0);}
    setPaused(!paused);
    refresh(true);
  };
  skip.onclick=finish;
  previous.onclick=()=>{requestSound();changeTime(offsets[Math.max(0,index-1)]);};
  next.onclick=()=>{requestSound();changeTime(offsets[Math.min(index+1,offsets.length-1)]);};
  slider.oninput=()=>changeTime(Number(slider.value));
  music.onclick=()=>{
    if(!gesture&&options.music){requestSound();return;}
    options.music=!options.music;
    music.setAttribute("aria-pressed",String(options.music));
    persistStory(story,storage);
    if(options.music)requestSound();
    else soundscape.setActive(false);
  };
  function loop(time:number) {
    if(disposed)return;
    const dt=last?Math.min(.13,(time-last)/1000):0;
    last=time;
    const active=!document.hidden&&!document.querySelector("dialog[open]");
    if(renderer?.lost) {
      fallback.hidden=false;
      if(!paused)setPaused(true);
    } else if(renderer) fallback.hidden=true;
    soundscape.setActive(active&&!paused&&options.music);
    if(active&&!paused){
      elapsed=Math.min(runtime,elapsed+dt);
      // 30 fps camera and water, plus deliberate 15 fps character poses.
      if(elapsed-lastRender>=.031||elapsed===runtime)refresh();
      if(elapsed===runtime)end();
    }
    frame=requestAnimationFrame(loop);
  }
  const resize=()=>refresh(true);
  const motionChanged=()=>{
    if(reduced())setPaused(true);
    resize();
  };
  viewportMotion.addEventListener("change",motionChanged);
  window.addEventListener("resize",resize);
  setPaused(paused);
  refresh(true);
  frame=requestAnimationFrame(loop);
  return {
    pause(){setPaused(true);},
    dispose(){
      disposed=true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize",resize);
      viewportMotion.removeEventListener("change",motionChanged);
      renderer?.dispose();
      soundscape.dispose();
    },
  };
}
