import { chapterHash, chapters } from "../story/chapters";
import { html, characterContent } from "../content";
import { Vector3 } from "three";
import { Arena3D } from "../scene/arena";
import { cameraControls } from "../scene/controls";
import {
  ready,
  Simulation,
  replay3,
  validInputs,
  ENGINE,
  STORY_ENGINE, EXPANSION_ENGINE,
  surfaceY,
  summary,
  type Input,
  type Vec,
} from "./physics";
import { nativeLevels, resolve3, daily3 } from "./levels";
import { record, type Save, persist } from "../services/storage";
import { sound } from "../services/audio";
import { StoryFeedback, type StoryPlay } from "../story/play-feedback";

export async function mountNative(
  main: HTMLElement,
  code: string,
  save: Save,
  storage: Storage | undefined,
  notify: (s: string) => void,
  story?: StoryPlay,
) {
  const l = story?.level ?? resolve3(code);
  if (!l) {
    main.innerHTML =
      '<section class="page"><h1>Unknown spatial circuit</h1><a href="#depth">Choose a 3D circuit</a></section>';
    return { dispose() {}, pause() {} };
  }
  main.innerHTML =
    '<section class="page"><h1>Opening the aquatic world…</h1><p>Loading the local 3D physics engine.</p></section>';
  const opening = main.firstElementChild;
  await ready;
  if (!main.isConnected || main.firstElementChild !== opening)
    return { dispose() {}, pause() {} };
  let sim = new Simulation(l),
    scene: Arena3D,
    playback = false,
    handled = false,
    aim: { point: Vec; surface: string } | null = null,
    pointer: number | null = null,
    acc = 0,
    last = 0,
    raf = 0,
    dead = false,
    referenceInputs = l.solution;
  const daily = code.startsWith("d");
  main.className = story ? "native-game story-game" : "native-game";
  main.innerHTML = `<section class="native-layout"><aside class="intro"><div class="eyebrow">${daily ? "TODAY’S SPATIAL CIRCUIT" : html(l.chapter)}</div><h1>${html(l.title)}</h1><p>${html(l.hint)}</p>${story ? `<div class="story-guide"><span class="luma-face" aria-hidden="true"></span><div><strong>${html(characterContent.Luma.name)}</strong><p aria-live="polite"></p></div></div><p class="story-restore-status" id="story-restore-status"></p><a href="#${chapterHash(story.theme.id as Parameters<typeof chapterHash>[0])}" class="textlink">← ${html(l.chapter)} chapter</a><p id="story-mechanisms" class="small"></p>${l.version===4&&l.id===5?'<a class="textlink" href="#story-survey">Survey the aqueduct</a>':""}` : '<p class="small">Real gravity · 3D shockwaves · Local records</p><a href="#depth" class="textlink">Explore the floating islands →</a><p><a href="#daily">Classic Daily</a> · <a href="#daily3">3D Daily</a></p>'}<p id="native-countdown"></p></aside><section class="play-section"><div class="arena-top"><div><span class="eyebrow">${story ? `${chapters.findIndex(chapter=>chapter.theme===story.theme.id)+1}-${l.id} · THE FRACTURED RIPPLE` : `${code} · PHYSICS 3`}</span><h2>${html(l.title)}</h2></div><span class="difficulty">${html(l.chapter)}</span></div><div class="hud"><div><span>PULSES LEFT</span><strong id="native-pulses"></strong></div><div><span>HOME</span><strong id="native-goals"></strong></div><div><span>TIME</span><strong id="native-time"></strong></div><div class="tools"><button id="native-pause" aria-label="Pause">Ⅱ</button><button id="native-retry" aria-label="Retry">↻</button></div></div><div class="arena-wrap"><canvas id="native-arena" tabindex="0" role="application" aria-label="3D circuit. Arrows aim on the selected surface, Enter pulses, Escape cancels or pauses, R retries."></canvas><div id="native-result" class="result" hidden aria-live="polite"></div></div><div id="native-controls"></div><div class="surface-control"><label>Aim surface <select id="surface"><option value="auto">Visible surface</option>${l.blocks
    .filter((b) => !b.kind)
    .map(
      (b) =>
        `<option value="${b.id}">${b.id.replaceAll("-", " ")} · height ${surfaceY(b, b.x, b.z).toFixed(1)}</option>`,
    )
    .join(
      "",
    )}</select></label><span id="surface-readout">Point at a platform</span></div><div class="practice-bar"><button id="native-precision">${save.settings.precision ? "Precision aim" : "Quick tap"}</button><button id="native-cancel">Cancel aim</button><button id="native-reference">Watch solution</button><button id="native-share">Share circuit</button></div><p class="small" id="native-instruction">${html(l.hint)}</p><p class="small" id="native-best"></p></section></section>`;
  const $ = <E extends HTMLElement = HTMLElement>(id: string) =>
    main.querySelector<E>("#" + id)!;
  const canvas = $<HTMLCanvasElement>("native-arena"),
    result = $("native-result"),
    select = $<HTMLSelectElement>("surface");
  try {
    scene = new Arena3D(canvas, {
      ...l,native:true,
      story:story && {theme:story.theme,currents:[...l.currents??[],...(l.gravityZones??[]).map(zone=>({...zone,kind:"gravity" as const}))],stage:story.stage(),level:story.level.id},
    });
  } catch {
    sim.dispose();
    main.innerHTML =
      '<section class="page"><h1>3D graphics unavailable</h1><p>Spatial circuits need WebGL2. The classic campaigns still work with the Canvas fallback.</p><a class="primary" href="#play">Play classic circuits</a></section>';
    return { dispose() {}, pause() {} };
  }
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const feedback = story ? new StoryFeedback(story,scene,main,()=>save.settings.sound) : undefined;
  const cancel = () => {
    pointer = null;
    aim = null;
    scene.aim(null);
  };
  cameraControls(scene, $("native-controls"), cancel);
  function hud() {
    $("native-pulses").textContent =
      `${l!.pulseLimit - sim.used} / ${l!.pulseLimit}`;
    $("native-goals").textContent =
      sim.orbs.filter((o) => o.state === "docked").length +
      " / " +
      sim.orbs.length;
    $("native-time").textContent = (sim.tick / 60).toFixed(1) + "s";
    if (story && l!.switches.length) {
      $("story-mechanisms").textContent = l!.switches.map(s =>
        s.id[0].toUpperCase()+s.id.slice(1)+(sim.activated.includes(s.id)?": powered":": waiting")
      ).join(" · ");
    }
    if(story && l!.version===6){
      const timing=l!.blocks.filter(block=>block.cycle).map(block=>{
        const {period,open,offset}=block.cycle!;
        if(block.switchId&&!sim.activated.includes(block.switchId))return `${block.id} · waiting for receiver`;
        const phase=(sim.tick+offset)%period;
        return `${block.id} · ${phase<open?"open":"closed"} · ${((phase<open?open-phase:period-phase)/60).toFixed(1)}s`;
      });
      for(const block of l!.blocks){
        if(block.lift)timing.push(`Transfer lift · ${Math.abs((sim.liftHeights.get(block.id)??0)-block.y)<.06?"level":"moving"}`);
      }
      if(timing.length){
        const switches=l!.switches.map(plate=>`${plate.id}: ${sim.activated.includes(plate.id)?"powered":"off"}`);
        $("story-mechanisms").textContent=[...switches,...timing].join(" · ");
      }
    }
    const b = story ? story.best() : save.best[code];
    $("native-best").textContent = b
      ? `Personal best · ${b.pulses} pulses · ${(b.ticks / 60).toFixed(2)}s`
      : "Set your first local record.";
    if (daily) {
      const secs = Math.floor((daily3().reset - Date.now()) / 1000);
      $("native-countdown").textContent =
        `UTC reset in ${Math.floor(secs / 3600)}h ${Math.floor(secs / 60) % 60}m · 12-puzzle rotation`;
    }
  }
  let previousOrbs: Simulation["orbs"] = [];
  function reset() {
    cancel();
    scene.clearEffects();
    sim.dispose();
    sim = new Simulation(l!);
    previousOrbs = [];
    playback = false;
    handled = false;
    acc = 0;
    last = 0;
    result.hidden = true;
    delete canvas.dataset.outcome;
    delete canvas.dataset.checkpoint;
    $("native-pause").textContent = "Ⅱ";
    $("native-instruction").textContent = l!.hint;
    scene.update(sim.orbs, sim.opened, sim.activated, sim.liftHeights);
    feedback?.reset();
    hud();
  }
  function pause() {
    cancel();
    if (sim.status !== "playing") return;
    sim.paused = !sim.paused;
    acc = 0;
    $("native-pause").textContent = sim.paused ? "▶" : "Ⅱ";
    result.hidden = !sim.paused;
    if (sim.paused) {
      result.innerHTML =
        '<div class="result-card"><h2>Paused</h2><button id="native-resume" class="primary">Resume circuit</button></div>';
      $("native-resume").onclick = pause;
    }
  }
  scene.onLost = () => {
    if (!sim.paused) pause();
    notify("Graphics paused. Waiting for the graphics context to recover.");
  };
  scene.onRestored = () => notify("Graphics recovered. Resume when ready.");
  function fire() {
    if (!aim || playback || scene.lost) return;
    if (sim.pulse(aim.point, aim.surface)) {
      scene.pulse(new Vector3(aim.point.x, aim.point.y, aim.point.z), true);
      feedback?.pulse(new Vector3(aim.point.x,aim.point.y,aim.point.z));
      sound("pulse", save.settings.sound);
      hud();
    }
  }
  function point(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    ) {
      cancel();
      return;
    }
    const hit = scene.pick(e.clientX, e.clientY, select.value);
    aim = hit
      ? {
          point: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
          surface: hit.object.userData.id,
        }
      : null;
    scene.aim(
      aim ? new Vector3(aim.point.x, aim.point.y, aim.point.z) : null,
      3,
      true,
    );
    $("surface-readout").textContent = aim
      ? `${aim.surface.replaceAll("-", " ")} · elevation ${aim.point.y.toFixed(2)}`
      : "No platform selected";
  }
  canvas.onpointerdown = (e) => {
    if (
      !e.isPrimary ||
      e.button !== 0 ||
      pointer !== null ||
      sim.paused ||
      playback
    )
      return;
    e.preventDefault();
    point(e);
    if (save.settings.precision) {
      pointer = e.pointerId;
      canvas.setPointerCapture(pointer);
    } else fire();
  };
  canvas.onpointermove = (e) => {
    if (
      pointer === e.pointerId ||
      (pointer === null && e.pointerType !== "touch")
    )
      point(e);
  };
  canvas.onpointerup = (e) => {
    if (pointer !== e.pointerId) return;
    point(e);
    if (pointer !== null) fire();
    cancel();
  };
  canvas.onpointercancel = cancel;
  canvas.onlostpointercapture = cancel;
  canvas.onpointerleave = () => {
    if (pointer === null) cancel();
  };
  canvas.onkeydown = (e) => {
    if (
      ![
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        " ",
      ].includes(e.key)
    )
      return;
    e.preventDefault();
    if (!aim) {
      const first = l!.solution[0];
      aim = {
        point: { x: first.x, y: first.y, z: first.z },
        surface: first.surface,
      };
    }
    const p = aim.point,
      b = l!.blocks.find((b) => b.id === aim!.surface)!;
    if (e.key === "ArrowUp") p.z -= 0.1;
    if (e.key === "ArrowDown") p.z += 0.1;
    if (e.key === "ArrowLeft") p.x -= 0.1;
    if (e.key === "ArrowRight") p.x += 0.1;
    p.y = surfaceY(b, p.x, p.z);
    scene.aim(new Vector3(p.x, p.y, p.z), 3, true);
    $("surface-readout").textContent =
      `${aim.surface.replaceAll("-", " ")} · elevation ${p.y.toFixed(2)}`;
    if (e.key === "Enter" || e.key === " ") fire();
  };
  select.onchange = () => {
    cancel();
    scene.highlightSurface(select.value);
    if (select.value !== "auto") {
      const b = l!.blocks.find((b) => b.id === select.value)!;
      aim = {
        surface: b.id,
        point: { x: b.x, y: surfaceY(b, b.x, b.z), z: b.z },
      };
      scene.aim(new Vector3(aim.point.x, aim.point.y, aim.point.z), 3, true);
      $("surface-readout").textContent = `${b.id.replaceAll("-", " ")} · elevation ${aim.point.y.toFixed(2)}`;
    } else $("surface-readout").textContent = "Point at a platform";
  };
  $("native-retry").onclick = reset;
  $("native-pause").onclick = pause;
  $("native-cancel").onclick = cancel;
  $("native-precision").onclick = () => {
    cancel();
    save.settings.precision = !save.settings.precision;
    persist(save, storage);
    $("native-precision").textContent = save.settings.precision
      ? "Precision aim"
      : "Quick tap";
  };
  $("native-reference").onclick = () => {
    reset();
    playback = true;
    referenceInputs = l!.solution;
    $("native-instruction").textContent =
      "Reference replay · No records are saved. Retry to take control.";
  };
  const url = (inputs?: Input[]) => {
    const u = new URL(location.href);
    u.hash = story ? "story-play" : "spatial";
    u.search = "";
    u.searchParams.set("c", code);
    if (inputs)
      u.searchParams.set(
        "r",
        btoa(JSON.stringify({ v: l!.version, e: l!.version===6 ? EXPANSION_ENGINE : story ? STORY_ENGINE : ENGINE, c: code, p: inputs })),
      );
    return u.href;
  };
  function share() {
    const box = document.createElement("dialog");
    box.innerHTML =
      '<h2>Pass the ripple on</h2><p>Local result. No public ranking.</p><label><input type="checkbox" id="native-include"> Include replay (reveals solution)</label><input aria-label="Challenge link" readonly><button class="primary">Copy link</button><button class="secondary">Close</button>';
    document.body.append(box);
    const field = box.querySelector<HTMLInputElement>("input[readonly]")!,
      check = box.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    field.value = url();
    check.disabled = sim.status !== "won" || playback;
    check.onchange = () =>
      (field.value = url(check.checked ? sim.inputs : undefined));
    const buttons = box.querySelectorAll("button");
    buttons[0].onclick = () => {
      void navigator.clipboard
        .writeText(field.value)
        .then(() => notify("Copied."))
        .catch(() => {
          field.select();
          notify("Select and copy the link.");
        });
    };
    buttons[1].onclick = () => box.close();
    box.onclose = () => box.remove();
    if (sim.started && !sim.paused && sim.status === "playing") pause();
    box.showModal();
  }
  $("native-share").onclick = share;
  const payload = new URLSearchParams(location.search).get("r");
  if (payload) {
    try {
      if (payload.length > 4096) throw Error();
      const r = JSON.parse(atob(payload));
      if (r.v !== l.version || r.e !== (l.version===6 ? EXPANSION_ENGINE : story ? STORY_ENGINE : ENGINE) || r.c !== code || !validInputs(l, r.p))
        throw Error();
      const verify = replay3(l, r.p);
      const valid = verify.status === "won",
        ticks = verify.tick,
        used = verify.used;
      verify.dispose();
      if (!valid) throw Error();
      $("native-instruction").textContent =
        `Verified friend result: ${used} pulses · ${(ticks / 60).toFixed(2)}s. Find your own solution.`;
    } catch {
      notify(
        "Unsupported or invalid spatial replay. The circuit is still playable.",
      );
    }
  }
  function finish() {
    handled = true;
    canvas.dataset.outcome = JSON.stringify(summary(sim));
    let verified = false,
      newBest = false;
    if (sim.status === "won" && !playback) {
      const check = replay3(l!, sim.inputs);
      verified = check.status === "won" && check.tick === sim.tick;
      check.dispose();
      if (verified) {
        const score = {
          pulses:sim.used,ticks:sim.tick,
          stars:sim.used <= l!.solution.length ? 3 : sim.used === l!.solution.length+1 ? 2 : 1,
        };
        if (story) {
          const previousStage=story.stage();
          newBest=story.record(score);
          feedback?.finish(true,story.stage()>previousStage);
          const receiver = l!.goals.at(-1);
          if(receiver)scene.story?.celebrate(new Vector3(receiver.x,receiver.y,receiver.z));
        } else {
          newBest = record(save,code,score,code.startsWith("c3") ? l!.id : undefined);
          if (!persist(save, storage))
            notify("Storage unavailable. This record stays in the session.");
        }
      } else notify("Replay did not verify. No record saved.");
    }
    if(!playback&&sim.status==="lost")feedback?.finish(false,false);
    sound(sim.status === "won" ? "win" : "lost", save.settings.sound);
    result.hidden = false;
    result.innerHTML = `<div class="result-card"><div class="eyebrow">${playback ? "REFERENCE REPLAY" : sim.status === "won" ? "CIRCUIT COMPLETE" : "TRY ANOTHER ANGLE"}</div><h2>${sim.status === "won" ? "Beautifully connected." : "A little less force?"}</h2><p>${sim.status === "won" ? `${sim.used} pulses · ${(sim.tick / 60).toFixed(2)}s` : sim.reason}</p>${verified ? "<p>" + "★".repeat(sim.used <= l!.solution.length ? 3 : sim.used === l!.solution.length + 1 ? 2 : 1) + (newBest ? " · New personal best" : "") + "</p>" : ""}<button id="native-again" class="primary">Retry circuit</button>${sim.status === "won" && (!story || story.canContinue()) ? `<button id="native-next" class="secondary">${html(story?.nextLabel() ?? "Next circuit →")}</button>` : ""}${verified ? '<button id="native-image">Download result image</button><button id="native-run">Watch your replay</button>' : ""}</div>`;
    $("native-again").onclick = reset;
    if ($("native-next"))
      $("native-next").onclick = () => {
        location.href = story ? story.next() : `?c=c3-${(l!.id % nativeLevels.length) + 1}#spatial`;
      };
    if (verified) {
      $("native-image").onclick = () => {
        const out = document.createElement("canvas");
        out.width = 1200;
        out.height = 630;
        const ctx = out.getContext("2d")!;
        ctx.fillStyle = "#d5f6f5";
        ctx.fillRect(0, 0, 1200, 630);
        ctx.drawImage(scene.screenshot(), 600, 25, 580, 580);
        ctx.fillStyle = "#16435a";
        ctx.font = "bold 38px system-ui";
        ctx.fillText(story ? "THE FRACTURED RIPPLE" : "RIPPLE CIRCUIT 3D", 40, 100);
        ctx.font = "28px system-ui";
        ctx.fillText(l!.title, 40, 185);
        ctx.fillText(
          `${sim.used} pulses · ${(sim.tick / 60).toFixed(2)}s`,
          40,
          255,
        );
        ctx.font = "20px system-ui";
        ctx.fillText(code, 40, 330);
        ctx.fillText("Locally replay-verified", 40, 375);
        ctx.fillText(location.host, 40, 550);
        const a = document.createElement("a");
        a.download = `ripple-${code}.png`;
        a.href = out.toDataURL();
        a.click();
      };
      $("native-run").onclick = () => {
        const inputs = structuredClone(sim.inputs);
        reset();
        playback = true;
        referenceInputs = inputs;
        $("native-instruction").textContent =
          "Your replay · No extra wins are saved.";
      };
    }
    hud();
  }
  function frame(time: number) {
    if (dead) return;
    const dt = last ? Math.min((time - last) / 1000, 0.1) : 0;
    last = time;
    feedback?.setActive(!document.hidden&&!sim.paused&&!scene.lost&&!document.querySelector("dialog[open]"));
    if (!document.hidden && !scene.lost) {
      if (!sim.paused && !document.querySelector("dialog[open]")) {
        acc += dt;
        let n = 0;
        while (acc >= 1 / 60 && n++ < 6) {
          if (playback)
            for (const p of referenceInputs.filter(
              (p) => p.tick === sim.tick,
            )) {
              if (sim.pulse(p, p.surface))
                scene.pulse(new Vector3(p.x, p.y, p.z), true);
            }
          if(sim.started && sim.status==="playing")previousOrbs=sim.orbs.map(orb=>({...orb}));
          sim.step();
          if(!playback&&sim.started)feedback?.observe(sim);
          if (sim.tick === 30)
            canvas.dataset.checkpoint = JSON.stringify(summary(sim));
          for (const event of sim.events) sound(event, save.settings.sound);
          acc -= 1 / 60;
        }
        if (n >= 6) acc = 0;
      }
      const fraction=Math.min(1,acc*60);
      const position=sim.started&&!sim.paused&&sim.status==="playing" ? sim.orbs.map((orb,i)=>{
        const before=previousOrbs[i];
        if(!before || orb.state!=="active" || before.state!=="active")return orb;
        return {...orb,x:before.x+(orb.x-before.x)*fraction,y:before.y+(orb.y-before.y)*fraction,z:before.z+(orb.z-before.z)*fraction};
      }) : sim.orbs;
      scene.update(position, sim.opened, sim.activated, sim.liftHeights);
      scene.draw(
        dt,
        save.settings.reduced || (story!==undefined && (reducedMotion.matches || sim.paused)),
        !sim.started || sim.paused || sim.status !== "playing",
      );
      hud();
      if (sim.status !== "playing" && !handled) finish();
    }
    raf = requestAnimationFrame(frame);
  }
  const resize = () => {
    cancel();
    scene.resize();
  };
  const key = (e: KeyboardEvent) => {
    if (
      document.querySelector("dialog[open]") ||
      /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)
    )
      return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (aim) cancel();
      else pause();
    }
    if (e.key.toLowerCase() === "r") reset();
  };
  const hidden = () => {
    last = 0;
    acc = 0;
    if (document.hidden && sim.started && !sim.paused) pause();
  };
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", key);
  document.addEventListener("visibilitychange", hidden);
  hud();
  raf = requestAnimationFrame(frame);
  return {
    pause() {
      if (sim.started && !sim.paused) pause();
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", hidden);
      feedback?.dispose();
      sim.dispose();
      scene.dispose();
    },
  };
}
export function nativeMap(main: HTMLElement, save: Save) {
  main.className = "";
  main.innerHTML = `<section class="page island-map"><div class="eyebrow">SPATIAL CAMPAIGN / 12 CIRCUITS</div><h1>A world with depth.</h1><p>Roll, fall, cross, connect. Each island introduces a real physical idea.</p><p><a href="#levels">Classic campaign</a> · <a href="#legacy">Original circuits</a> · <a href="#daily3">Today’s 3D circuit</a></p><div class="level-grid">${nativeLevels.map((l) => `${[1, 4, 7, 10].includes(l.id) ? `<div class="chapter-heading">${html(l.chapter)}</div>` : ""}<a class="level ${l.id === save.unlocked3 ? "current" : ""}" href="?c=c3-${l.id}#spatial"><span class="level-num">${l.id}</span><span>${html(l.title)}<small>${save.best["c3-" + l.id] ? "Connected · " + "★".repeat(save.best["c3-" + l.id].stars) : l.id > save.unlocked3 ? "Explore ahead" : l.skill}</small></span></a>`).join("")}</div><p>All islands are open to explore. Your next suggested circuit is highlighted.</p></section>`;
}
