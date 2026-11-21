import {expect,test} from "vitest";
import {compositions} from "../src/scene/scenery/compositions";
import {trainPeriod,trainProgress} from "../src/scene/scenery/train";

test("each chapter has five separately named and positioned compositions",()=>{
  const all=Object.values(compositions).flat();
  expect(all).toHaveLength(25);
  expect(new Set(all.map(row=>row[0])).size).toBe(25);
  expect(new Set(all.map(row=>row.slice(1).join(","))).size).toBe(25);
});

test("the train stops for boarding and eases back to the same seam",()=>{
  expect(trainProgress(0)).toBe(0);
  expect(trainProgress(2.9)).toBe(0);
  expect(trainProgress(3.01)).toBeLessThan(.00001);
  expect(trainProgress(13)).toBeCloseTo(.5);
  expect(trainProgress(trainPeriod-.01)).toBeGreaterThan(.99999);
  expect(trainProgress(trainPeriod)).toBe(0);
  expect(trainProgress(trainPeriod+13)).toBe(trainProgress(13));
});
