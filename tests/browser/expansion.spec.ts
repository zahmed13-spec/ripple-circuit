import {test,expect} from "./fixtures";

test("existing Aero save opens Eco and a real first win unlocks the next circuit",async({page})=>{
  test.skip(!await page.evaluate(()=>!!document.createElement("canvas").getContext("webgl2")),"WebGL2 unavailable");
  await page.addInitScript(()=>{
    if(!localStorage.getItem("ripple-circuit-story-v1"))localStorage.setItem("ripple-circuit-story-v1",JSON.stringify({
      version:1,
      best:Object.fromEntries(Array.from({length:5},(_,i)=>[`aero-${i+1}`,{pulses:1,ticks:100,stars:3}])),
      viewed:["first-spark","canopy-signal"],
      presentation:{music:false,skipScenes:false},
    }));
    localStorage.setItem("ripple-graphics","low");
  });
  await page.goto("/#story");
  await expect(page.locator(".story-world[data-open=true]")).toHaveCount(2);
  await page.getByRole("link",{name:"Continue · Eco Canopy"}).click();
  await expect(page.locator(".story-levels [aria-disabled=true]")).toHaveCount(4);
  await page.getByRole("link",{name:"Begin chapter"}).click();
  await expect(page.locator(".film-frame canvas[data-cast=blender]")).toBeVisible();
  await page.getByRole("button",{name:"Skip scene"}).click();
  await expect(page).toHaveURL(/st6-eco-1#story-play/);
  const canvas=page.locator("#native-arena[data-renderer=three]");
  await expect(canvas).toHaveAttribute("data-stage","0");
  await canvas.press("Enter");
  await expect(page.locator("#native-result")).toContainText("CIRCUIT COMPLETE");
  await expect(canvas).toHaveAttribute("data-stage","1");
  await page.getByRole("button",{name:"Watch A Seed Answers"}).click();
  await expect(page.getByRole("heading",{name:"A Seed Answers"})).toBeVisible();
  await page.getByRole("button",{name:"Skip scene"}).click();
  await expect(page).toHaveURL(/st6-eco-2#story-play/);
  const best=await page.evaluate(()=>JSON.parse(localStorage.getItem("ripple-circuit-story-v2")!).best);
  expect(Object.keys(best)).toHaveLength(6);
  expect(best["aero-5"].ticks).toBe(100);
});

test("landscape is noninteractive and remains usable with reduced motion at phone width",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  const scenery=page.locator(".landscape");
  await expect(scenery).toHaveCSS("pointer-events","none");
  await expect(page.locator(".sky-bubble").first()).toBeHidden();
  await expect(page.locator(".sky-cloud").first()).toHaveCSS("animation-name","none");
  await page.getByRole("link",{name:"Story Mode"}).click();
  await expect(page.getByRole("heading",{name:"The Fractured Ripple"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
