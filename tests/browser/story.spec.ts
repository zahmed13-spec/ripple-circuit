import {test,expect} from "./fixtures";
import {worldPoint} from "./points";
import {storyLevels} from "../../src/story/levels";

test("story map handles invalid and locked routes and an opening can be skipped",async({page})=>{
  await page.goto("/?c=st4-aero-5#story-play");
  await expect(page.getByRole("heading",{name:"Aero Haven"})).toBeVisible();
  await expect(page.getByText("Complete the previous circuit to unlock this one.")).toBeVisible();
  await page.goto("/?c=st4-fake#story-play");
  await expect(page.getByText("Unknown story circuit. Choose a level from Aero Haven.")).toBeVisible();
  await page.getByRole("link",{name:"World map"}).click();
  await expect(page.getByRole("heading",{name:"The Fractured Ripple"})).toBeVisible();
  await expect(page.getByText("Future region · Locked")).toHaveCount(4);
  await page.getByRole("link",{name:"Enter Aero Haven"}).click();
  await page.getByRole("link",{name:"Begin story"}).click();
  await expect(page.getByText(/Everything used to flow/)).toBeVisible();
  await page.getByRole("button",{name:"Continue",exact:true}).click();
  await expect(page.getByText(/aqueduct went quiet/)).toBeVisible();
  await page.getByRole("button",{name:"Skip scene"}).click();
  await expect(page).toHaveURL(/st4-aero-1#story-play$/);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("ripple-circuit-story-v1")!).viewed)).toEqual(["first-spark"]);
});

test("five live story wins unlock Eco, persist restoration, and preserve legacy scores",async({page},info)=>{
  test.setTimeout(process.env.CI ? 240000 : 120000);
  test.skip(!await page.evaluate(()=>!!document.createElement("canvas").getContext("webgl2")),"WebGL2 unavailable");
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem("ripple-graphics","low");
    if(!localStorage.getItem("ripple-circuit-v1"))localStorage.setItem("ripple-circuit-v1",JSON.stringify({version:1,unlocked:3,best:{"c1-1":{pulses:1,ticks:69,stars:3}},settings:{reduced:true,sound:false}}));
  });
  await page.goto("/?c=st4-aero-1#story-play");
  const canvas=page.locator("#native-arena");
  for(const level of storyLevels){
    await expect(page.getByRole("heading",{name:level.title,level:1})).toBeVisible();
    await expect(canvas).toHaveAttribute("data-renderer","three");
    await expect(canvas).toHaveAttribute("data-quality","low");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if(level.id===2){
      await page.locator("#native-reference").click();
      await expect(page.locator("#native-result")).toContainText("REFERENCE REPLAY",{timeout:30000});
      expect(await page.locator("#native-next").count()).toBe(0);
      await page.locator("#native-again").click();
    }
    for(const input of level.solution){
      const block=level.blocks.find(b=>b.id===input.surface)!;
      await page.locator("#surface").selectOption(block.id);
      await expect(canvas).toHaveAttribute("data-surface",block.id);
      const point=await worldPoint(page,input.x,input.y,input.z,"#native-arena");
      if(input.tick) {
        const switchId = level.id===4 || input.tick===115 ? "intake" : "relay";
        await expect(page.locator("#story-mechanisms")).toContainText(new RegExp(switchId+": powered","i"),{timeout:30000});
      }
      await canvas.click({position:point.local});
    }
    await expect(page.locator("#native-result")).toContainText("CIRCUIT COMPLETE",{timeout:30000});
    if(level.id===5) {
      await expect(canvas).toHaveAttribute("data-restored","true");
      await page.screenshot({path:info.outputPath("aero-restored.jpg"),fullPage:true});
    }
    await page.locator("#native-next").click();
  }
  const shot=page.locator(".story-shot canvas");
  await expect(shot).toHaveAttribute("data-restored","false");
  await page.getByRole("button",{name:"Continue",exact:true}).click();
  await expect(shot).toHaveAttribute("data-restored","true");
  await page.getByRole("button",{name:"Skip scene"}).click();
  await expect(page.getByText("Chapter 2 preview · In development")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading",{name:"Eco Canopy"})).toBeVisible();
  await page.goto("/?c=st4-aero-3#story-play");
  await expect(canvas).toHaveAttribute("data-restored","true");
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("ripple-circuit-v1")!).best["c1-1"].ticks)).toBe(69);
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
