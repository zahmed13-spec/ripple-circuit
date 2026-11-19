import { beforeAll, describe, expect, test } from "vitest";
import { LIMIT, ready, replay3, Simulation, summary, validate } from "../src/native/physics";
import { campaignIds, isStoryId, storyLink } from "../src/story/chapters";
import { expansionLevels } from "../src/story/expansion-levels";
import { films } from "../src/story/film/boards";
import { expansionFilms } from "../src/story/film/expansion";
import { poseAt } from "../src/story/film/timeline";
import { available, campaignCompleted, loadStory, markViewed, recordStory, storyStage } from "../src/story/save";

const levels=Object.values(expansionLevels).flat();
const score={pulses:1,ticks:100,stars:3};
beforeAll(()=>ready);

describe("Fractured World",()=>{
  test.each(levels)("$title has a deterministic win and loses on a misdirected pulse",level=>{
    expect(validate(level)).toEqual([]);
    const first=replay3(level,level.solution);
    const second=replay3(level,level.solution);
    const mistake=new Simulation(level);
    try {
      expect(first.status).toBe("won");
      expect(summary(first)).toEqual(summary(second));
      expect(first.activated).toEqual(level.requiredSwitches);
      const initial=level.solution[0];
      expect(mistake.pulse({...initial,x:level.orbs[0].x+1},initial.surface)).toBe(true);
      while(mistake.status==="playing" && mistake.tick<LIMIT)mistake.step();
      expect(mistake.status).toBe("lost");
    } finally {
      first.dispose();
      second.dispose();
      mistake.dispose();
    }
  });

  test("the legacy save unlocks Eco and verified wins connect all five chapters",()=>{
    const best=Object.fromEntries(campaignIds.slice(0,5).map(id=>[id,score]));
    const save=loadStory({getItem:()=>JSON.stringify({version:1,best,viewed:["first-spark","canopy-signal"]})});
    expect(save.viewed).toEqual(["first-spark","canopy-signal"]);
    expect(available(save,"eco-1")).toBe(true);
    expect(available(save,"terra-1")).toBe(false);
    expect(markViewed(save,"story-null-5")).toBe(true);
    expect(available(save,"null-5")).toBe(false);
    expect(campaignIds).toHaveLength(25);
    expect(new Set(campaignIds).size).toBe(25);
    for(const level of levels){
      expect(available(save,level.storyId)).toBe(true);
      expect(storyLink(level.storyId)).toContain("st6-");
      const result=replay3(level,level.solution);
      expect(result.status).toBe("won");
      expect(recordStory(save,level.storyId,{...score,pulses:result.used,ticks:result.tick})).toBe(true);
      result.dispose();
    }
    const migrated=loadStory({getItem:()=>JSON.stringify(save)});
    expect(campaignCompleted(migrated)).toBe(25);
    expect(storyStage(migrated,"null-5")).toBe(5);
    expect(migrated.best["aero-5"]).toEqual(score);
  });

  test("living bridge colliders follow a receiver and reset",()=>{
    const level=expansionLevels.eco[1];
    const sim=new Simulation(level);
    const reset=new Simulation(level);
    try {
      const roots=sim.bridges.get("lane-2-roots")!;
      expect(roots.isEnabled()).toBe(false);
      sim.pulse(level.solution[0],"lane-1");
      while(sim.tick<100)sim.step();
      expect(roots.isEnabled()).toBe(true);
      expect(reset.bridges.get("lane-2-roots")!.isEnabled()).toBe(false);
    } finally {sim.dispose();reset.dispose();}
  });

  test("opposed deterministic gravity affects an otherwise identical pulse",()=>{
    const level=expansionLevels.terra[0];
    const base=new Simulation(level);
    const opposed=new Simulation({...level,gravityZones:level.gravityZones!.map(zone=>({...zone,force:{...zone.force,x:-zone.force.x}}))});
    try {
      for(const sim of [base,opposed]){
        sim.pulse(level.solution[0],"lane-1");
        while(sim.tick<75 && sim.status==="playing")sim.step();
      }
      expect(base.orbs[0].x).toBeGreaterThan(opposed.orbs[0].x+1);
    } finally {base.dispose();opposed.dispose();}
  });

  test("timed gate collision follows fixed ticks and repeats after reset",()=>{
    const level=expansionLevels.metro[0];
    const sim=new Simulation(level);
    try {
      const gate=sim.gates.get("lane-1-gate")!;
      expect(gate.isEnabled()).toBe(false);
      sim.pulse({x:-5.6,y:0,z:0},"lane-1");
      while(sim.tick<151 && sim.status==="playing")sim.step();
      expect(sim.tick).toBe(151);
      expect(gate.isEnabled()).toBe(true);
      while(sim.tick<211 && sim.status==="playing")sim.step();
      expect(sim.tick).toBe(211);
      expect(gate.isEnabled()).toBe(false);
    } finally {sim.dispose();}
  });

  test("24 animated sequences target legal stages, limits, and destinations",()=>{
    expect(Object.values(expansionFilms)).toHaveLength(24);
    for(const [route,film] of Object.entries(expansionFilms)){
      const runtime=film.shots.reduce((time,shot)=>time+shot.seconds,0);
      expect(runtime).toBe(route.endsWith("opening")?31:route==="story-null-5"?40:18);
      expect(film.stage).toBeGreaterThanOrEqual(5);
      expect(film.next==="story"||isStoryId(film.next)||Object.hasOwn(films,film.next)).toBe(true);
      const shot=film.shots[0];
      expect(poseAt(shot,1).luma).not.toEqual(poseAt(shot,1+1/120).luma);
    }
    expect(expansionFilms["story-null-5"].stage).toBe(25);
  });
});
