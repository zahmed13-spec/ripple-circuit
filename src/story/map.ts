import { expansionRoute } from "./film/expansion";
import type { StoryLevel } from "./levels";
import { characterContent, html, levelContent, siteContent, worldContent } from "../content";
import { aero, campaignIds, chapterFor, chapterHash, chapters, storyLink, type ExpansionWorld, type StoryChapter } from "./chapters";
import { available, campaignCompleted, completed, persistStory, presentation, restored, type StorySave } from "./save";
import { themes } from "./themes";
import { archiveEntries, milestones } from "./narrative";
import { aftermath, films } from "./film/boards";

export function worldMap(main: HTMLElement, story: StorySave) {
  main.className = "story-screen";
  const stage=completed(story);
  const total=campaignCompleted(story);
  const nextChapter=chapterFor(campaignIds[Math.min(total,campaignIds.length-1)]);
  main.innerHTML = `<section class="story-page living-map"><div class="story-map-header"><p class="eyebrow">Story Mode</p>
  <h1>${html(siteContent.storyTitle)}</h1><p>${html(siteContent.storyIntro)}</p>
  <a class="primary link-button" href="#${chapterHash(nextChapter.theme)}">${total===25?"Revisit the Current":html(total ? "Continue · "+nextChapter.title : "Enter Aero Haven")} →</a><a class="living-archive-link" href="#story-archive">Current Archive</a></div>
  <div class="living-network" data-stage="${stage}">
    <div class="network-caption"><strong>Network status</strong><span>${total} / 25 circuits restored</span></div>
    <svg viewBox="0 0 1000 96" preserveAspectRatio="none" aria-hidden="true">
      <path class="network-base" d="M100 55Q200 0 300 53T500 58T700 45T900 57"/>
      <path class="network-local" pathLength="100" style="--complete:${total*4} 100" d="M100 55Q200 0 300 53T500 58T700 45T900 57"/>
      <path class="network-hidden-route" d="M100 55Q330 106 500 58"/>
      <circle cx="100" cy="55" r="9"/><circle cx="300" cy="53" r="8"/><circle cx="500" cy="58" r="8"/><circle cx="700" cy="45" r="8"/><circle cx="900" cy="57" r="8"/>
    </svg>
  </div>
  <ol class="story-worlds" aria-label="Worlds of the Current">${chapters.map(c=>{
    const editable = worldContent[c.theme];
    const theme = themes[c.theme];
    const accent = /^#[a-f0-9]{6}$/i.test(editable.accent) ? editable.accent : theme.accent;
    const sky = /^#[a-f0-9]{6}$/i.test(editable.sky) ? editable.sky : theme.sky;
    const live = available(story,c.levelIds[0]);
    const count = completed(story,c);
    return `<li class="story-world" data-open="${live}" style="--biome:${accent};--biome-sky:${sky}"><div class="world-art ${c.theme}" aria-hidden="true"><i></i></div><div class="world-copy">
      <span class="eyebrow">${live ? (count===5?"Restored":`${count} / 5 circuits`) : "Locked"}</span>
      <h2>${html(c.title)}</h2><p>${html(c.subtitle)}</p><small>${html(c.mechanic)}</small>
      ${live ? `<a href="#${chapterHash(c.theme)}">Open chapter →</a>` : ""}
    </div></li>`;
  }).join("")}</ol></section>`;
  const art = siteContent.worldImage.replace(/^\//,"");
  if (/^assets\/[a-z0-9][a-z0-9._-]*\.(svg|webp|png|jpe?g)$/i.test(art)) {
    main.querySelector<HTMLElement>(".story-map-header")?.style.setProperty("--story-art", `url("${import.meta.env.BASE_URL}${art}")`);
  }
}

export function chapterMap(main: HTMLElement, story: StorySave, chapter:StoryChapter=aero, levels?:StoryLevel[]) {
  if(levels){
    const stage=completed(story,chapter);
    const opening=expansionRoute(chapter.theme as ExpansionWorld,0);
    const next=levels[Math.min(stage,4)];
    const showOpening=!story.viewed.includes(films[opening].id) && !presentation(story).skipScenes;
    main.className="story-screen";
    main.innerHTML=`<section class="story-page"><a href="#story" class="story-back">← World map</a>
      <div class="story-chapter-heading"><div><p class="eyebrow">Chapter ${chapters.indexOf(chapter)+1}</p>
      <h1>${html(chapter.title)}</h1><p>${html(chapter.objective)}</p></div><div class="story-progress"><strong>${stage*20}%</strong><span>${stage} of 5 circuits</span></div></div>
      <div class="story-actions"><a class="primary link-button" href="${showOpening?"#"+opening:storyLink(next.storyId)}">${showOpening?"Begin chapter":"Continue chapter"} →</a>
      <a href="#${opening}">Replay opening</a><a href="#story-archive">Current Archive</a></div>
      <ol class="story-levels">${levels.map(level=>{
        const score=story.best[level.storyId];
        const label=`<span class="story-level-number">${level.id}</span><span><strong>${html(level.title)}</strong><small>${html(level.narrative)}</small>${score?`<small>${score.pulses} pulses · ${(score.ticks/60).toFixed(2)}s</small>`:""}</span>`;
        return available(story,level.storyId)?`<li><a href="${storyLink(level.storyId)}">${label}<span aria-hidden="true">→</span></a></li>`:`<li><div aria-disabled="true">${label}<span>Locked</span></div></li>`;
      }).join("")}</ol></section>`;
    return;
  }
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
      ${restored(story) ? '<a href="#story-restored">Revisit the restoration</a><a href="#story-world-eco">Continue to Eco Canopy →</a><a href="#story-eco">Replay the Canopy signal</a>' : ""}
    </div>
    <ol class="story-levels" aria-label="Aero Haven circuits">${aero.levelIds.map((id,i)=>{
      const score = story.best[id];
      const level = levelContent.levels[i];
      const content = `<span class="story-level-number">1-${i+1}</span><span><strong>${html(level.title)}</strong><small>${score ? `${score.pulses} pulses · ${(score.ticks/60).toFixed(2)}s · ${"★".repeat(score.stars)}` : i===4?"Aqueduct finale":["Shockwaves","Water currents","Elevation","Pressure plates"][i]}</small><small>${html(level.narrative.replace(/^Luma:\s*/, () => characterContent.Luma.name+" · "))}</small></span>`;
      const href = i===0 && !story.viewed.includes("first-spark") && !presentation(story).skipScenes ? "#story-intro" : storyLink(id);
      return `<li>${available(story,id)?`<a href="${href}">${content}<span aria-hidden="true">→</span></a>`:`<div aria-disabled="true">${content}<span>Locked</span></div>`}</li>`;
    }).join("")}</ol><div class="story-actions"><a href="#story-archive">Read the Current Archive →</a>${stage>=4?'<a href="#story-survey">Survey the aqueduct</a>':""}</div></section>`;
}


export function archive(main:HTMLElement, story:StorySave, storage?:Storage) {
  const entries=archiveEntries(completed(story));
  const options=presentation(story);
  const expansionArchive=chapters.slice(1).filter(chapter=>available(story,chapter.levelIds[0])).map(chapter=>{
    const world=chapter.theme as ExpansionWorld;
    const entries=Array.from({length:completed(story,chapter)+1},(_,index)=>films[expansionRoute(world,index)]);
    return `<section class="expansion-archive"><h2>${html(chapter.title)}</h2><ul>${entries.map(film=>`<li><a href="#${film.id}">${html(film.title)} →</a></li>`).join("")}</ul></section>`;
  }).join("");
  main.className="story-screen";
  main.innerHTML=`<section class="story-page living-archive">
    <a href="#story-aero" class="story-back">← Aero Haven</a><h1>The Current Archive</h1>
    <p>${html(characterContent.Luma.name)} keeps a record of what the aqueduct reveals. Each new connection adds an entry.</p>
    <a href="#story-intro">Replay opening film →</a><div class="archive-cards">${entries.length?entries.map((entry,i)=>`<article>
      <span class="archive-symbol ${entry.icon}" aria-hidden="true"></span>
      <div><small>Aero Haven · Circuit 1-${i+1}</small><h2>${html(entry.clue)}</h2><p>${html(entry.fragment)}</p>
      <div class="archive-film-links"><a href="#${aftermath[i]}">Watch ${html(films[aftermath[i]].title)} →</a>
      ${i===4?'<a href="#story-eco">Replay Eco preview</a>':""}</div></div></article>`).join("")
      :'<p>Complete A New Ripple to record the first discovery.</p>'}</div>
    ${expansionArchive}<details class="living-preferences"><summary>Story presentation settings</summary>
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
