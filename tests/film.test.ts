import {describe,expect,test} from "vitest";
import {aftermath, films, sceneIds} from "../src/story/film/boards";
import {mouthAt,poseAt, sample} from "../src/story/film/timeline";
import {validateContent} from "../scripts/check-content";
import {loadStory,markViewed} from "../src/story/save";

describe("animated shot boards",()=>{
  test("all eight films have unique IDs, valid cues, and more than one shot",()=>{
    expect(sceneIds).toHaveLength(8);
    expect(new Set(sceneIds).size).toBe(8);
    for(const film of Object.values(films)){
      expect(film.shots.length).toBeGreaterThan(2);
      expect(film.shots.some(s=>s.luma.length>1)).toBe(true);
      for(const shot of film.shots){
        expect(shot.seconds).toBeGreaterThan(0);
        for(const track of [shot.luma,shot.ripple??shot.luma,shot.power]){
          expect(track[0][0]).toBe(0);
          expect(track.every(([time],i)=>time>=0&&time<=1&&(!i||time>track[i-1][0]))).toBe(true);
        }
        if(shot.line){
          expect(shot.line.in).toBeLessThan(shot.line.out);
          expect(shot.line.out).toBeLessThanOrEqual(shot.seconds);
          expect(mouthAt(shot,0)).toBe("–");
        }
        if(shot.cue)expect(shot.cue[0]).toBeLessThan(shot.seconds);
      }
    }
    expect(aftermath.map(route=>films[route].stage)).toEqual([1,2,3,4,5]);
  });
  test("published film runtimes include all shots and transitions",()=>{
    const ranges = [[30,40],[15,18],[15,18],[18,20],[18,20],[20,25],[18,20],[18,25]];
    Object.values(films).forEach((film, index)=>{
      const runtime = film.shots.reduce((seconds, shot)=>seconds+shot.seconds,0);
      expect(runtime).toBeGreaterThanOrEqual(ranges[index][0]);
      expect(runtime).toBeLessThanOrEqual(ranges[index][1]);
    });
    for(const route of aftermath){
      expect(films[route].shots.reduce((seconds, shot)=>seconds+shot.seconds,0)).toBeLessThanOrEqual(20);
    }
  });
  test("published CMS content resolves to the authored shots",()=>{
    expect(validateContent()).toEqual({scenes:8,lines:32});
  });
  test("a fracture dims the set and Luma changes position on a held camera",()=>{
    const fracture=films["story-intro"].shots[1];
    expect(poseAt(fracture,0).power).toBe(1);
    expect(poseAt(fracture,fracture.seconds).power).toBe(0);
    const survey=films["story-survey"].shots[1];
    expect(survey.lens).toHaveLength(1);
    expect(poseAt(survey,0).luma).not.toEqual(poseAt(survey,5).luma);
    expect(poseAt(survey,0,true).luma).toEqual(poseAt(survey,5,true).luma);
    expect(sample([[0,0,true],[1,1]],.8,(_a,b)=>b)).toBe(0);
  });
  test("old view history survives and marking a film viewed does not unlock gameplay",()=>{
    const old=loadStory({getItem:()=>JSON.stringify({version:1,best:{},viewed:["first-spark","water-returns","crown-survey","canopy-signal"]})});
    expect(old.viewed).toEqual(expect.arrayContaining(["first-spark","water-returns","crown-survey","canopy-signal"]));
    expect(markViewed(old,"first-beacon")).toBe(true);
    expect(markViewed(old,"first-beacon")).toBe(false);
    expect(old.best).toEqual({});
  });
});
