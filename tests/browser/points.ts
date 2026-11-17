import type { Page } from "@playwright/test";
export async function worldPoint(
  page: Page,
  x: number,
  y: number,
  z?: number,
  selector = "#arena",
) {
  const el = page.locator(selector);
  await el.scrollIntoViewIfNeeded();
  const r = (await el.boundingBox())!,
    matrix = await el.getAttribute("data-projection");
  if (!matrix)
    return {
      x: r.x + (x * r.width) / 720,
      y: r.y + (y * r.height) / 720,
      local: { x: (x * r.width) / 720, y: (y * r.height) / 720 },
    };
  const m = JSON.parse(matrix) as number[],
    p = z === undefined ? [(x - 360) / 60, 0, (y - 360) / 60] : [x, y, z],
    w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  const nx = (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]) / w,
    ny = (m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]) / w,
    local = { x: ((nx + 1) * r.width) / 2, y: ((1 - ny) * r.height) / 2 };
  return { x: r.x + local.x, y: r.y + local.y, local };
}
export async function tapWorld(page: Page, x: number, y: number) {
  const p = await worldPoint(page, x, y);
  await page.locator("#arena").click({ position: p.local });
}
