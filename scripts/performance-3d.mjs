import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto("http://127.0.0.1:5173/?c=c3-12#spatial");
await page.locator('#native-arena[data-renderer="three"]').waitFor();
const sample = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        function frame(t) {
          times.push(t - last);
          last = t;
          if (times.length < 180) requestAnimationFrame(frame);
          else {
            times.shift();
            times.sort((a, b) => a - b);
            resolve({
              medianMs: times[89],
              p95Ms: times[170],
              maxMs: times.at(-1),
            });
          }
        }
        requestAnimationFrame(frame);
      }),
  );
const loaded = await page.evaluate(() => {
  const n = performance.getEntriesByType("navigation")[0];
  return {
    loadMs: n.loadEventEnd,
    readyObservedMs: performance.now(),
    heap: performance.memory?.usedJSHeapSize,
  };
});
await page.locator("#native-reference").click();
const active = await sample();
await page.locator("#native-retry").click();
const idle = await sample();
const before = await page
  .locator("#native-arena")
  .getAttribute("data-resources");
const retry = [];
for (let i = 0; i < 100; i++) {
  const t = performance.now();
  await page.locator("#native-retry").click();
  retry.push(performance.now() - t);
}
const after = await page
  .locator("#native-arena")
  .getAttribute("data-resources");
const loads = [];
for (let i = 0; i < 20; i++) {
  await page.getByRole("link", { name: "3D", exact: true }).click();
  await page.locator('a[href="?c=c3-12#spatial"]').click();
  await page.locator('#native-arena[data-renderer="three"]').waitFor();
  await page.waitForTimeout(80);
  loads.push(
    JSON.parse(
      (await page.locator("#native-arena").getAttribute("data-resources")) ||
        "{}",
    ),
  );
}
retry.sort((a, b) => a - b);
const result = {
  environment: {
    browser: await browser.version(),
    viewport: "1366x900",
    platform: process.platform,
      architecture:process.arch,
    network: "local loopback, no throttling",
    samples: 180,
    retries: 100,
    levelChanges: 20,
  },
  loaded,
  active,
  idle,
  retryRoundTripMedianMs: retry[50],
  rendererResourcesBefore: JSON.parse(before),
  rendererResourcesAfter: JSON.parse(after),
  levelResources: loads,
  heapAfter: await page.evaluate(() => performance.memory?.usedJSHeapSize),
  limitations:
    "Headless desktop measurement. Not a physical-phone, GPU-driver allocation or mobile network benchmark. Retry timing includes browser automation. Coarse JS heap and per-renderer counters cannot establish absence of every leak.",
};
writeFileSync("performance-3d.json", JSON.stringify(result, null, 2));
console.log(result);
await browser.close();
