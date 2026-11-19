import { html, levelContent, siteContent, worldContent } from "../content";
import { aero, chapters, storyLink } from "./chapters";
import { available, completed, persistStory, presentation, restored, type StorySave } from "./save";
import { themes } from "./themes";
import { archiveEntries, milestones } from "./narrative";
import { aftermath, films } from "./film/boards";

export function worldMap(main: HTMLElement, story: StorySave) {
  main.className = "story-screen";
  const stage=completed(story);
  main.innerHTML = `<section class="story-page living-map"><div class="story-map-header"><p class="eyebrow">Story Mode</p>
  <h1>${html(siteContent.storyTitle)}</h1><p>${html(siteContent.storyIntro)}</p>
  <a class="primary link-button" href="#story-aero">${restored(story)?"Revisit Aero Haven":"Enter Aero Haven"} →</a><a class="living-archive-link" href="#story-archive">Current Archive</a></div>
  <div class="living-network" data-stage="${stage}">
    <div class="network-caption"><strong>Network status</strong><span>${html(milestones[stage].name)} · ${html(milestones[stage].landmark)}</span></div>
    <svg viewBox="0 0 1000 96" preserveAspectRatio="none" aria-hidden="true">
      <path class="network-base" d="M100 55Q200 0 300 53T500 58T700 45T900 57"/>
      <path class="network-local" pathLength="100" style="--complete:${stage*20} 100" d="M100 55Q200 0 300 53"/>
      <path class="network-hidden-route" d="M100 55Q330 106 500 58"/>
      <circle cx="100" cy="55" r="9"/><circle cx="300" cy="53" r="8"/><circle cx="500" cy="58" r="8"/><circle cx="700" cy="45" r="8"/><circle cx="900" cy="57" r="8"/>
    </svg>
  </div>
  <ol class="story-worlds" aria-label="Worlds of the Current">${chapters.map(c=>{
    const editable = worldContent[c.theme];
    const theme = themes[c.theme];
    const accent = /^#[a-f0-9]{6}$/i.test(editable.accent) ? editable.accent : theme.accent;
    const sky = /^#[a-f0-9]{6}$/i.test(editable.sky) ? editable.sky : theme.sky;
    const live = c.id === "aero";
    const preview = c.id === "eco" && restored(story);
    return `<li class="story-world" data-open="${live||preview}" style="--biome:${accent};--biome-sky:${sky}"><div class="world-art ${c.theme}" aria-hidden="true"><i></i></div><div class="world-copy">
      <span class="eyebrow">${live ? (restored(story)?"Restored":`${completed(story)} / 5 circuits · ${completed(story)*20}%`) : preview ? "Preview unlocked" : "Future region · Locked"}</span>
      <h2>${html(c.title)}</h2><p>${html(c.subtitle)}</p><small>${html(c.mechanic)}</small>
      ${live ? '<a href="#story-aero">Open chapter →</a>' : preview ? '<a href="#story-eco">Open preview →</a>' : ""}
    </div></li>`;
  }).join("")}</ol></section>`;
  const art = siteContent.worldImage.replace(/^\//,"");
  if (/^assets\/[a-z0-9][a-z0-9._-]*\.(svg|webp|png|jpe?g)$/i.test(art)) {
    main.querySelector<HTMLElement>(".story-map-header")?.style.setProperty("--story-art", `url("${import.meta.env.BASE_URL}${art}")`);
  }
}

export function chapterMap(main: HTMLElement, story: StorySave) {
  const stage=completed(story);
  const next = aero.levelIds[Math.min(stage,4)];
  main.className = "story-screen";
  main.innerHTML = `<section class="story-page"><a href="#story" class="story-back">← World map</a>
    <div class="story-chapter-heading"><div><p class="eyebrow">Chapter 1 · ${html(milestones[stage].name)}</p>
    <h1>${html(aero.title)}</h1><p>${html(aero.objective)} ${html(milestones[stage].detail)}</p></div><div class="story-progress"><strong>${completed(story)*20}%</strong><span>${completed(story)} of 5 circuits</span></div></div>
    <ol class="restoration-meter" aria-label="Restoration milestones">${milestones.slice(1).map((m,i)=>`<li data-connected="${i<stage}"><span aria-hidden="true"></span>${html(m.landmark)}</li>`).join("")}</ol>
    <div class="story-actions">${stage === 0 && !story.viewed.includes("first-spark") && !presentation(story).skipScenes
      ? '<a class="primary link-button" href="#story-intro">Begin story →</a>'
      : `<a class="primary link-button" href="${storyLink(next)}">${restored(story)?"Replay aqueduct":"Continue story"} →</a><a href="#story-intro">Replay opening</a>`}
      ${restored(story) ? '<a href="#story-restored">Revisit the restoration</a><a href="#story-eco">Preview Eco Canopy →</a>' : ""}
    </div>
    <ol class="story-levels" aria-label="Aero Haven circuits">${aero.levelIds.map((id,i)=>{
      const score = story.best[id];
      const content = `<span class="story-level-number">1-${i+1}</span><span><strong>${html(levelContent.levels[i].title)}</strong><small>${score ? `${score.pulses} pulses · ${(score.ticks/60).toFixed(2)}s · ${"★".repeat(score.stars)}` : i===4?"Aqueduct finale":["Shockwaves","Water currents","Elevation","Pressure plates"][i]}</small></span>`;
      const href = i===0 && !story.viewed.includes("first-spark") && !presentation(story).skipScenes ? "#story-intro" : storyLink(id);
      return `<li>${available(story,id)?`<a href="${href}">${content}<span aria-hidden="true">→</span></a>`:`<div aria-disabled="true">${content}<span>Locked</span></div>`}</li>`;
    }).join("")}</ol><div class="story-actions"><a href="#story-archive">Read the Current Archive →</a>${stage>=4?'<a href="#story-survey">Survey the aqueduct</a>':""}</div></section>`;
}


export function archive(main:HTMLElement, story:StorySave, storage?:Storage) {
  const entries=archiveEntries(completed(story));
  const options=presentation(story);
  main.className="story-screen";
  main.innerHTML=`<section class="story-page living-archive">
    <a href="#story-aero" class="story-back">← Aero Haven</a><h1>The Current Archive</h1>
    <p>Luma keeps a record of what the aqueduct reveals. Each new connection adds an entry.</p>
    <a href="#story-intro">Replay opening film →</a><div class="archive-cards">${entries.length?entries.map((entry,i)=>`<article>
      <span class="archive-symbol ${entry.icon}" aria-hidden="true"></span>
      <div><small>Aero Haven · Circuit 1-${i+1}</small><h2>${html(entry.clue)}</h2><p>${html(entry.fragment)}</p>
      <div class="archive-film-links"><a href="#${aftermath[i]}">Watch ${html(films[aftermath[i]].title)} →</a>
      ${i===4?'<a href="#story-eco">Replay Eco preview</a>':""}</div></div></article>`).join("")
      :'<p>Complete A New Ripple to record the first discovery.</p>'}</div>
    <details class="living-preferences"><summary>Story presentation settings</summary>
    <label><input type="checkbox" data-story-option="music" ${options.music?"checked":""}> Music and ambience</label>
    <label><input type="checkbox" data-story-option="largeText" ${options.largeText?"checked":""}> Larger dialogue text</label>
    <label><input type="checkbox" data-story-option="skipScenes" ${options.skipScenes?"checked":""}> Go straight to puzzles and chapter map</label>
    <p>Sound effects and reduced motion are available in the main Settings menu.</p></details></section>`;
  for(const button of main.querySelectorAll<HTMLInputElement>("[data-story-option]")){
    button.onchange=()=>{
      const key=button.dataset.storyOption as keyof typeof options;
      options[key]=button.checked;
      persistStory(story,storage);
    };
  }
}
