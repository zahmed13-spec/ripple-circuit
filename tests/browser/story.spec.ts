import {test,expect, type Page} from "./fixtures";
import {worldPoint} from "./points";
import {aftermath,films} from "../../src/story/film/boards";
import {storyLevels} from "../../src/story/levels";

test("story map handles invalid and locked routes and an opening can be skipped",async({page})=>{
  await page.goto("/?c=st4-aero-5#story-play");
  await expect(page.getByRole("heading",{name:"Aero Haven"})).toBeVisible();
  await expect(page.getByText("Complete the previous circuit to unlock this one.")).toBeVisible();
  await page.goto("/?c=st4-fake#story-play");
  await expect(page.getByText("Unknown story circuit. Choose a level from Aero Haven.")).toBeVisible();
  await page.getByRole("link",{name:"World map"}).press("Enter");
  await expect(page.getByRole("heading",{name:"The Fractured Ripple"})).toBeVisible();
  await expect(page.getByText("Future region · Locked")).toHaveCount(4);
  await page.getByRole("link",{name:"Enter Aero Haven"}).press("Enter");
  await page.getByRole("link",{name:"Begin story"}).press("Enter");
  await expect(page.locator("#film-line").filter({hasText:/Before the silence, every island/})).toBeVisible();
  await page.getByRole("button",{name:"Next shot",exact:true}).press("Enter");
  await expect(page.locator("#film-line").filter({hasText:/aqueduct went quiet/})).toBeVisible();
  await page.getByRole("button",{name:"Skip scene"}).press("Enter");
  await expect(page).toHaveURL(/st4-aero-1#story-play$/);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("ripple-circuit-story-v1")!).viewed)).toEqual(["first-spark"]);
});

test("five live story wins unlock Eco, persist restoration, and preserve legacy scores",async({page:desktop,browser,browserName},info)=>{
  test.setTimeout(process.env.CI ? 240000 : 120000);
  const context=browserName==="webkit"?await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}):undefined;
  const page:Page=context?await context.newPage():desktop;
  try {
  test.skip(!await page.evaluate(()=>!!document.createElement("canvas").getContext("webgl2")),"WebGL2 unavailable");
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem("ripple-graphics","low");
    if(!localStorage.getItem("ripple-circuit-v1"))localStorage.setItem("ripple-circuit-v1",JSON.stringify({version:1,unlocked:3,best:{"c1-1":{pulses:1,ticks:69,stars:3}},settings:{reduced:true,sound:false}}));
  });
  await page.goto("/?c=st4-aero-1#story-play");
  const canvas=page.locator("#native-arena");
  const shaderErrors:string[]=[];
  page.on("pageerror",error=>shaderErrors.push(error.message));
  page.on("console",message=>{
    if(message.type()==="error"&&/shader|compile/i.test(message.text()))shaderErrors.push(message.text());
  });
  for(const level of storyLevels){
    await expect(page.getByRole("heading",{name:level.title,level:1})).toBeVisible();
    await expect(canvas).toHaveAttribute("data-renderer","three");
    await expect(canvas).toHaveAttribute("data-quality","low");
    await expect(canvas).toHaveAttribute("data-stage",String(level.id-1));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if(level.id===2){
      await page.locator("#native-reference").press("Enter");
      await expect(page.locator("#native-result")).toContainText("REFERENCE REPLAY",{timeout:30000});
      expect(await page.locator("#native-next").count()).toBe(0);
      await page.locator("#native-again").press("Enter");
    }
    for(const input of level.solution){
      const block=level.blocks.find(b=>b.id===input.surface)!;
      await page.locator("#surface").selectOption(block.id);
      await expect(canvas).toHaveAttribute("data-surface",block.id);
      if(input.tick) {
        const switchId = level.id===4 || input.tick===115 ? "intake" : "relay";
        await expect(page.locator("#story-mechanisms")).toContainText(new RegExp(switchId+": powered","i"),{timeout:30000});
      }
      const point=await worldPoint(page,input.x,input.y,input.z,"#native-arena");
      if(context)await page.touchscreen.tap(point.x,point.y);
      else await canvas.click({position:point.local});
    }
    await expect(page.locator("#native-result")).toContainText("CIRCUIT COMPLETE",{timeout:30000});
    await expect(canvas).toHaveAttribute("data-stage",String(level.id));
    if(level.id===3) {
      await expect(page.getByText("STABILITY DIRECTIVE: FLOW INTERRUPTED.",{exact:true})).toBeVisible();
      await expect(canvas).toHaveAttribute("data-luma","concerned");
    }
    if(level.id===5) {
      await expect(canvas).toHaveAttribute("data-restored","true");
      await page.screenshot({path:info.outputPath("aero-restored.jpg"),fullPage:true});
    }
    await page.locator("#native-next").press("Enter");
    await expect(page.getByRole("heading",{name:films[aftermath[level.id-1]].title,exact:true})).toBeVisible();
    if(level.id<5) {
      await page.locator("#story-scene-skip").press("Enter");
      if(level.id===4){
        await expect(page.getByRole("heading",{name:"Guardian of the Aqueduct",exact:true})).toBeVisible();
        await page.locator("#story-scene-skip").press("Enter");
      }
    }
  }
  const shot=page.locator(".film-frame canvas");
  await expect(shot).toHaveAttribute("data-restored","false");
  await page.getByRole("button",{name:"Next shot",exact:true}).press("Enter");
  await expect(shot).toHaveAttribute("data-restored","true");
  await page.getByRole("button",{name:"Skip scene"}).press("Enter");
  await expect(page.getByText("Chapter 2 preview · In development")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading",{name:"Beyond the Canopy"})).toBeVisible();
  await expect(page.locator(".film-frame canvas")).toHaveAttribute("data-renderer","three");
  await page.goto("/#story-archive");
  await expect(page.locator(".archive-cards article")).toHaveCount(5);
  await expect(page.getByRole("heading",{name:"Stability Directive"})).toBeVisible();
  await page.getByRole("link",{name:"Replay opening film"}).press("Enter");
  await expect(page.getByRole("heading",{name:"The Last Spark"})).toBeVisible();
  await page.getByRole("button",{name:"Skip scene"}).focus();
  await page.keyboard.press("Enter");
  await expect(canvas).toHaveAttribute("data-stage","5");
  await page.goto("/?c=st4-aero-3#story-play");
  await expect(canvas).toHaveAttribute("data-restored","true");
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("ripple-circuit-v1")!).best["c1-1"].ticks )).toBe(69);
  expect(shaderErrors).toEqual([]);
  } finally { await context?.close(); }
});

test("touch can win a cached story level at the narrow phone viewport",async({browser,browserName},info)=>{
  test.skip(browserName==="firefox","Firefox does not emulate touch contexts");
  const context=await browser.newContext({viewport:{width:320,height:700},hasTouch:true,isMobile:true});
  try {
    const page=await context.newPage();
    test.skip(!await page.evaluate(()=>!!document.createElement("canvas").getContext("webgl2")),"WebGL2 unavailable");
    await page.addInitScript(()=>{try{localStorage.setItem("ripple-graphics","low")}catch{}});
    await page.goto("http://127.0.0.1:5173/?c=st4-aero-1#story-play");
    await page.locator("#native-arena[data-renderer=three]").waitFor();
    await page.evaluate(async()=>{
      await navigator.serviceWorker.ready;
      if(!navigator.serviceWorker.controller)await new Promise<void>(resolve=>navigator.serviceWorker.addEventListener("controllerchange",()=>resolve(),{once:true}));
    });
    await context.setOffline(true);
    await page.reload();
    await page.locator("#native-arena[data-renderer=three]").waitFor();
    const p=storyLevels[0].solution[0];
    const point=await worldPoint(page,p.x,p.y,p.z,"#native-arena");
    await page.touchscreen.tap(point.x,point.y);
    await expect(page.locator("#native-result")).toContainText("CIRCUIT COMPLETE",{timeout:15000});
    await page.screenshot({path:info.outputPath("aero-offline-phone.jpg"),fullPage:true});
  } finally { await context.close(); }
});

test("film time drives Blender cast motion, can pause and resume, and never unlocks a puzzle",async({page})=>{
  test.skip(!await page.evaluate(()=>!!document.createElement("canvas").getContext("webgl2")),"WebGL2 unavailable");
  await page.setViewportSize({width:320,height:700});
  await page.addInitScript(()=>{
    localStorage.setItem("ripple-graphics","low");
    if(!localStorage.getItem("ripple-circuit-story-v1"))localStorage.setItem("ripple-circuit-story-v1",JSON.stringify({
      version:1,best:{},viewed:[],presentation:{music:false},
    }));
  });
  await page.goto("/#story-intro");
  const cast=page.locator(".film-frame canvas[data-cast=blender]");
  await cast.waitFor();
  const before=await cast.getAttribute("data-pose");
  await expect.poll(()=>cast.getAttribute("data-pose")).not.toBe(before);
  await page.getByRole("button",{name:"Pause",exact:true}).press("Enter");
  const stopped=await cast.getAttribute("data-pose");
  await page.waitForTimeout(200);
  await expect(cast).toHaveAttribute("data-pose",stopped!);
  await page.getByRole("button",{name:"Next shot"}).press("Enter");
  await expect(page.locator("#shot-label")).toHaveText("The fracture");
  await expect(cast).toHaveAttribute("data-energy","1.00");
  await page.getByRole("slider",{name:"Scene time"}).evaluate((slider:HTMLInputElement)=>{
    slider.value="21";
    slider.dispatchEvent(new Event("input",{bubbles:true}));
  });
  await expect(cast).not.toHaveAttribute("data-energy","1.00");
  await page.getByText("Read transcript",{exact:true}).press("Enter");
  await expect(page.locator("details[open]")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole("button",{name:"Skip scene"}).press("Enter");
  await expect(page).toHaveURL(/st4-aero-1#story-play$/);
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem("ripple-circuit-story-v1")!));
  expect(progress.best).toEqual({});
  expect(progress.viewed).toEqual(["first-spark"]);
});
