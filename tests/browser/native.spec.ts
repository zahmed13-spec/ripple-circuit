import { test, expect } from "@playwright/test";
import { worldPoint, tapWorld } from "./points";
import {
  ready,
  Simulation,
  summary,
  replay3,
  ENGINE,
} from "../../src/native/physics";
import { nativeLevels } from "../../src/native/levels";
test.beforeAll(() => ready);
for (const mobile of [false, true])
  test(`native campaign exact replays, checkpoints and scenes ${mobile ? "phone" : "desktop"}`, async ({
    page,
  }, info) => {
    test.setTimeout(240000);
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && /shader|GL_INVALID|compile/i.test(m.text()))
        errors.push(m.text());
    });
    for (const l of nativeLevels) {
      await page.goto(`/?c=c3-${l.id}#spatial`);
      await expect(page.locator("#native-arena")).toHaveAttribute(
        "data-renderer",
        "three",
      );
      await page.screenshot({
        path: info.outputPath(`native-${l.id}-start.jpg`),
        fullPage: true, quality:80,
      });
      await page.locator("#native-reference").click();
      await expect(page.locator("#native-result")).toContainText(
        "REFERENCE REPLAY",
        { timeout: 40000 },
      );
      const expected = replay3(l, l.solution),
        checkpoint = new Simulation(l);
      checkpoint.pulse(l.solution[0], l.solution[0].surface);
      for (let i = 0; i < 30; i++) checkpoint.step();
      expect(
        JSON.parse(
          (await page.locator("#native-arena").getAttribute("data-outcome"))!,
        ),
      ).toEqual(summary(expected));
      expect(
        JSON.parse(
          (await page
            .locator("#native-arena")
            .getAttribute("data-checkpoint"))!,
        ),
      ).toEqual(summary(checkpoint));
      expected.dispose();
      checkpoint.dispose();
      await page.screenshot({
        path: info.outputPath(`native-${l.id}-win.jpg`),
        fullPage: true, quality:80,
      });
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("ripple-circuit-v1") || "{}")
              .wins || 0,
        ),
      ).toBe(0);
    }
    expect(errors).toEqual([]);
  });
for (const preset of ["isometric", "classic", "top"])
  test(`native raycast win and persistence in ${preset} view`, async ({
    page,
  }) => {
    await page.goto("/?c=c3-2#spatial");
    await page.getByLabel("Camera view").selectOption(preset);
    await page.waitForTimeout(700);
    const p = nativeLevels[1].solution[0],
      point = await worldPoint(page, p.x, p.y, p.z, "#native-arena");
    await page.locator("#native-arena").click({ position: point.local });
    await expect(page.locator("#native-pulses")).toHaveText("2 / 3");
    await expect(page.locator("#native-result")).toContainText(
      "CIRCUIT COMPLETE",
      { timeout: 15000 },
    );
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ripple-circuit-v1")!).best["c3-2"]
            .pulses,
      ),
    ).toBe(1);
    await page.locator("#native-run").click();
    await expect(page.locator("#native-result")).toContainText(
      "REFERENCE REPLAY",
      { timeout: 15000 },
    );
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("ripple-circuit-v1")!).wins,
      ),
    ).toBe(1);
  });
test("native precision cancellation, keyboard, pause, sharing and image", async ({
  page,
  context,
}) => {
  await page.goto("/?c=c3-1#spatial");
  await page.locator("#native-precision").click();
  const p = await worldPoint(page, -4, 0, 0, "#native-arena");
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(page.locator("#native-pulses")).toHaveText("3 / 3");
  await page.locator("#native-arena").focus();
  await page.keyboard.press("Enter");
  await page.locator("#native-pause").click();
  const time = await page.locator("#native-time").innerText();
  await page.waitForTimeout(150);
  expect(await page.locator("#native-time").innerText()).toBe(time);
  await page.locator("#native-resume").click();
  await expect(page.locator("#native-result")).toContainText(
    "CIRCUIT COMPLETE",
    { timeout: 15000 },
  );
  const download = page.waitForEvent("download");
  await page.locator("#native-image").click();
  expect((await download).suggestedFilename()).toBe("ripple-c3-1.png");
  await page.locator("#native-share").click();
  const field = page.getByLabel("Challenge link");
  expect(await field.inputValue()).not.toContain("&r=");
  await page.locator("#native-include").check();
  const friend = await context.newPage();
  await friend.goto(await field.inputValue());
  await expect(friend.locator("#native-instruction")).toContainText(
    "Verified friend result",
  );
  await friend.close();
});
test("classic Canvas fallback remains playable, native requirement is explicit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return (get as any).call(this, type, ...args);
    } as any;
  });
  await page.goto("/?c=c1-1#play");
  await expect(page.locator("#arena")).toHaveAttribute(
    "data-renderer",
    "canvas",
  );
  await tapWorld(page, 165, 360);
  await expect(page.locator("#result")).toContainText("CIRCUIT COMPLETE");
  await page.goto("/?c=c3-1#spatial");
  await expect(
    page.getByRole("heading", { name: "3D graphics unavailable" }),
  ).toBeVisible();
});
test("graphics loss preserves classic simulation, restoration and retry recover", async ({
  page,
}) => {
  await page.goto("/?c=c2-1#play");
  await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>("#arena")!;
    const ext = c.getContext("webgl2")!.getExtension("WEBGL_lose_context")!;
    (window as any).lossExtension = ext;
    ext.loseContext();
  });
  await expect(
    page.getByRole("heading", { name: "Paused", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#pulses")).toHaveText("●●●");
  await page.waitForTimeout(200);
  await page.evaluate(() => (window as any).lossExtension.restoreContext());
  await expect(page.locator("#toast")).toContainText("recovered");
  await page.locator("#pause-retry").click();
  await tapWorld(page, 165, 360);
  await expect(page.locator("#result")).toContainText("CIRCUIT COMPLETE",{timeout:20000});
});
test("native daily, historical saves and offline replay survive reload", async ({
  page,
  context,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "ripple-circuit-v1",
      JSON.stringify({
        version: 1,
        unlocked: 8,
        unlocked2: 4,
        wins: 2,
        best: {
          "c1-1": { pulses: 1, ticks: 68, stars: 3 },
          "c2-1": { pulses: 1, ticks: 68, stars: 3 },
        },
        settings: { sound: false },
      }),
    ),
  );
  await page.goto("/#daily3");
  await expect(page.locator(".arena-top .eyebrow")).toContainText("d3-");
  await expect(page.locator("#native-countdown")).toContainText(
    "12-puzzle rotation",
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#native-arena")).toHaveAttribute(
    "data-renderer",
    "three",
  );
  await context.setOffline(false);
  await page.goto("/?c=c3-1#spatial");
  await page.locator("#native-arena").press("Enter");
  await expect(page.locator("#native-result")).toContainText(
    "CIRCUIT COMPLETE",
  );
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ripple-circuit-v1")!),
  );
  expect(s.best["c1-1"]).toBeTruthy();
  expect(s.best["c2-1"]).toBeTruthy();
  expect(s.best["c3-1"]).toBeTruthy();
  expect(s.unlocked).toBe(8);
  expect(s.unlocked2).toBe(4);
});
for (const [width, height] of [
  [320, 568],
  [768, 1024],
  [1920, 1080],
])
  test(`native fits ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/?c=c3-11#spatial");
    await expect(page.locator("#native-arena")).toHaveAttribute(
      "data-renderer",
      "three",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Camera view").selectOption("top");
    await page.locator("#surface").selectOption("upper");
    await expect(page.locator("#surface")).toHaveValue("upper");
  });
test("native touch precision sends once, cancel and orientation preserve pulses", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName === "firefox",
    "Firefox does not support emulated touch contexts",
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/?c=c3-1#spatial");
  await page.locator("#native-precision").click();
  const p = await worldPoint(page, -4, 0, 0, "#native-arena");
  await page
    .locator("#native-arena")
    .dispatchEvent("pointerdown", {
      pointerId: 11,
      isPrimary: true,
      pointerType: "touch",
      button: 0,
      clientX: p.x,
      clientY: p.y,
    });
  await page
    .locator("#native-arena")
    .dispatchEvent("pointercancel", { pointerId: 11, pointerType: "touch" });
  await expect(page.locator("#native-pulses")).toHaveText("3 / 3");
  await page.touchscreen.tap(p.x, p.y);
  await expect(page.locator("#native-pulses")).toHaveText("2 / 3");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("#native-pulses")).toHaveText("2 / 3");
  await expect(page.locator("#native-result")).toContainText(
    "CIRCUIT COMPLETE",
    { timeout: 15000 },
  );
  await context.close();
});
test('overlapping ramp fades to reveal lower destination without changing surface selection',async({page})=>{await page.goto('/?c=c3-12#spatial');await expect(page.locator('#native-arena')).toHaveAttribute('data-renderer','three');await expect.poll(async()=>Number(await page.locator('#native-arena').getAttribute('data-occluded'))).toBeGreaterThan(0);await page.locator('#surface').selectOption('incline');await expect(page.locator('#surface')).toHaveValue('incline');await page.getByLabel('Camera view').selectOption('top');await expect.poll(async()=>Number(await page.locator('#native-arena').getAttribute('data-occluded'))).toBeGreaterThan(0);});
