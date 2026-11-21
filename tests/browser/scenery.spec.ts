import {test,expect} from "./fixtures";
import {campaignIds} from "../../src/story/chapters";

test("the scenic train moves, stops under reduced motion, and stays outside aiming",async({page})=>{
  test.skip(!await page.evaluate(()=>!!document.createElement("canvas").getContext("webgl2")),"WebGL2 unavailable");
  await page.addInitScript(ids=>{
    localStorage.setItem("ripple-graphics","low");
    if(!localStorage.getItem("ripple-circuit-story-v2"))localStorage.setItem("ripple-circuit-story-v2",JSON.stringify({
      version:2,best:Object.fromEntries(ids.map(id=>[id,{pulses:1,ticks:100,stars:3}])),viewed:[],
    }));
  },campaignIds.slice(0,15));
  await page.goto("/?c=st6-metro-1#story-play");
  const canvas=page.locator("#native-arena");
  await expect(canvas).toHaveAttribute("data-scenery","First Departure Platform");
  await expect(canvas).toHaveAttribute("data-train-state","station");
  await expect(canvas).toHaveAttribute("data-train-state","travel",{timeout:13000});
  const first=await canvas.getAttribute("data-train-progress");
  await expect.poll(()=>canvas.getAttribute("data-train-progress")).not.toBe(first);
  await expect(page.locator("#native-time")).toHaveText("0.0s");
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(canvas).toHaveAttribute("data-train-progress","0.0000");
  await canvas.press("Enter");
  await expect(page.locator("#native-result")).toContainText("CIRCUIT COMPLETE");
  await expect(canvas).toHaveAttribute("data-scenery-win","metro");
  await expect(canvas).toHaveAttribute("data-stage","1");
  await page.locator("#native-again").press("Enter");
  await expect(canvas).not.toHaveAttribute("data-scenery-win","metro");
  await page.locator("#native-reference").press("Enter");
  await expect(page.locator("#native-result")).toContainText("REFERENCE REPLAY");
  await expect(canvas).not.toHaveAttribute("data-scenery-win","metro");
  await page.reload();
  await expect(canvas).toHaveAttribute("data-stage","1");
});
