import { archiveEntries } from "../src/story/narrative";
import {beforeAll, describe, expect, test} from "vitest";
import {currentActive,inCurrent,ready,replay3,Simulation,summary,validate} from "../src/native/physics";
import {nativeLevels} from "../src/native/levels";
import {storyLevels} from "../src/story/levels";
import {available,completed,loadStory,persistStory,recordStory,restored,EXPANSION_STORY_KEY,STORY_KEY,restorationStage,markViewed,presentation} from "../src/story/save";

beforeAll(() => ready);
describe("Aero Haven physics",()=>{
  test.each(storyLevels)("$title wins with its authored inputs and replays exactly", level=>{
    expect(validate(level)).toEqual([]);
    const first = replay3(level,level.solution), second = replay3(level,level.solution);
    try {
      expect(first.status).toBe("won");
      expect(first.used).toBe(level.solution.length);
      expect(first.activated).toEqual(level.requiredSwitches ?? []);
      expect(summary(first)).toEqual(summary(second));
    } finally { first.dispose(); second.dispose(); }
  });
  test("water independently carries the marble beyond the reach of a weak shot",()=>{
    const level = storyLevels[1];
    const on = replay3(level,level.solution);
    const off = replay3({...level,currents:[]},level.solution);
    try {
      expect(on.status).toBe("won");
      expect(off.status).not.toBe("won");
      expect(off.orbs[0].x).toBeLessThan(level.goals[0].x-1);
      const flow = level.currents![0];
      expect(inCurrent(flow,{x:flow.x,y:.28,z:flow.z},.28)).toBe(true);
      expect(inCurrent(flow,{x:flow.x,y:1.53,z:flow.z},.28)).toBe(false);
    } finally { on.dispose(); off.dispose(); }
  });
  test("a plate powers the current and opens its physical gate; retry clears both",()=>{
    const level=storyLevels[3], flow=level.currents![0];
    const sim=new Simulation(level);
    try {
      expect(currentActive(flow,sim.activated)).toBe(false);
      expect(sim.gates.get("stream-lock")!.isEnabled()).toBe(true);
      const p=level.solution[0];
      sim.pulse(p,p.surface);
      while(sim.tick<95)sim.step();
      expect(currentActive(flow,sim.activated)).toBe(true);
      expect(sim.gates.get("stream-lock")!.isEnabled()).toBe(false);
    } finally { sim.dispose(); }
    const retry=new Simulation(level);
    try {
      expect(currentActive(flow,retry.activated)).toBe(false);
      expect(retry.gates.get("stream-lock")!.isEnabled()).toBe(true);
    } finally { retry.dispose(); }
  });
  test("a missed terrace can fall and v3 configurations reject story mechanics",()=>{
    const level=storyLevels[0];
    const miss={x:-1,y:0,z:0,surface:"arrival-island",tick:0};
    const sim=replay3(level,[miss]);
    try { expect(sim.status).toBe("lost"); expect(sim.reason).toMatch(/fell/); }
    finally { sim.dispose(); }
    expect(validate({...nativeLevels[0],currents:storyLevels[1].currents})).toContain("story mechanics");
  });
});

test("story results unlock sequentially, keep better scores, and preserve classic storage",()=>{
  const entries=new Map([["ripple-circuit-v1",'{"version":1,"wins":12}']]);
  const storage={getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>entries.set(key,value)};
  const save=loadStory(storage);
  const score={pulses:1,ticks:49,stars:3};
  expect(available(save,"aero-1")).toBe(true);
  expect(recordStory(save,"aero-5",score)).toBe(false);
  for(const level of storyLevels) expect(recordStory(save,level.storyId,score)).toBe(true);
  expect(recordStory(save,"aero-1",{...score,ticks:50})).toBe(false);
  expect(persistStory(save,storage)).toBe(true);
  expect(completed(loadStory(storage))).toBe(5);
  expect(restored(loadStory(storage))).toBe(true);
  expect(entries.get("ripple-circuit-v1")).toBe('{"version":1,"wins":12}');
  entries.delete(EXPANSION_STORY_KEY);
  entries.set(STORY_KEY,JSON.stringify({version:1,best:{"aero-1":score,"aero-5":score}}));
  expect(completed(loadStory(storage))).toBe(1);
  entries.set(STORY_KEY,"invalid");
  expect(completed(loadStory(storage))).toBe(0);
});

test("4.5 reads 4.0 saves and derives each discovery exactly once",()=>{
  const entries=new Map<string,string>();
  const storage={
    getItem:(key:string)=>entries.get(key)??null,
    setItem:(key:string,value:string)=>entries.set(key,value),
  };
  entries.set(STORY_KEY,JSON.stringify({version:1,best:{"aero-1":{pulses:1,ticks:49,stars:3}},viewed:["first-spark"]}));
  const old=loadStory(storage);
  expect(restorationStage(old)).toBe(1);
  expect(old.viewed).toEqual(["first-spark"]);
  expect(markViewed(old,"first-spark")).toBe(false);
  expect(archiveEntries(1).map(entry=>entry.clue)).toEqual(["The Last Spark"]);
  for(let i=1;i<storyLevels.length;i++){
    const level=storyLevels[i];
    const sim=replay3(level,level.solution);
    expect(sim.tick).toBe([49,162,169,193,341][i]);
    expect(recordStory(old,level.storyId,{pulses:sim.used,ticks:sim.tick,stars:3})).toBe(true);
    expect(archiveEntries(restorationStage(old))).toHaveLength(i+1);
    sim.dispose();
  }
  expect(markViewed(old,"unrecognized")).toBe(false);
  expect(markViewed(old,"water-returns")).toBe(true);
  expect(markViewed(old,"water-returns")).toBe(false);
  presentation(old).music=false;
  persistStory(old,storage);
  expect(loadStory(storage)).toEqual(old);
});
