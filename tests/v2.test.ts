import {beforeAll,describe,it,expect} from 'vitest';
import {createState,pulse,step,replay,validateLevel} from '../src/game/engine';
import * as legacy from '../src/game/engine-v1';
import {levels,campaign,daily,daily2,dailyPool,resolve} from '../src/game/levels';
import {decodeRun,encodeRun} from '../src/services/challenge';
import {load,persist,record,fresh} from '../src/services/storage';
import {AimControl} from '../src/services/aim';
beforeAll(()=>{globalThis.matchMedia=(()=>({matches:false})) as unknown as typeof matchMedia;});
describe('version compatibility',()=>{
 it.each(levels)('legacy $id is bit-identical to preserved simulation',l=>{const a=replay(l,l.solution),b=legacy.replay(l,l.solution);const {activated,opened,...rest}=a;expect(rest).toEqual(b);expect(decodeRun('c1-'+l.id,encodeRun('c1-'+l.id,l.solution))?.ticks).toBe(b.tick);});
 it('keeps legacy daily while separating new rules and records',()=>{const day=new Date('2026-11-16T00:00Z');expect(resolve(daily(day).code)).toEqual(daily(day).level);expect(daily2(day).code).toBe('d2-2026-11-16');expect(resolve('s2-1')?.timeLimit).toBe(45);expect(resolve('c2-1')?.timeLimit).toBe(0);expect(resolve('d2-2026-02-30')).toBeNull();expect(decodeRun('c2-1',encodeRun('s2-1',campaign[0].solution))).toBeNull();});
 it('migrates old saves additively and roundtrips new Flow, Sprint and Daily records',()=>{const old={version:1,unlocked:19,wins:10,best:{'c1-1':{pulses:1,ticks:69,stars:3}},settings:{sound:false}};const s=load({getItem:()=>JSON.stringify(old)});expect(s.unlocked).toBe(19);expect(s.unlocked2).toBe(1);expect(s.best).toEqual(old.best);record(s,'c2-9',{pulses:4,ticks:3000,stars:2},9);record(s,'s2-1',{pulses:1,ticks:68,stars:3});record(s,'d2-2026-11-16',{pulses:4,ticks:800,stars:3});let raw='';persist(s,{setItem:(_,v)=>raw=v});expect(load({getItem:()=>raw})).toEqual(s);expect(s.unlocked).toBe(19);expect(s.unlocked2).toBe(10);});
});
describe('authored campaign',()=>{
 it.each(campaign)('$id $title has a valid deterministic solution',l=>{expect(validateLevel(l)).toEqual([]);expect(replay(l,l.solution).status).toBe('won');expect(replay(l,l.solution)).toEqual(replay(l,l.solution));expect(decodeRun('c2-'+l.id,encodeRun('c2-'+l.id,l.solution))).not.toBeNull();expect(replay({...l,timeLimit:45},l.solution).status).toBe('won');});
 it('has 12 distinct starting geometries and objectives',()=>{expect(campaign).toHaveLength(12);expect(new Set(campaign.map(l=>l.skill)).size).toBe(12);expect(new Set(campaign.map(l=>JSON.stringify([l.orbs,l.obstacles,l.switches]))).size).toBe(12);});
 it('Flow survives 45 seconds, Sprint times out',()=>{for(const code of ['c2-1','s2-1']){const l=resolve(code)!,s=createState(l);pulse(l,s,700,700);for(let i=0;i<2800;i++)step(l,s);expect(s.status).toBe(code==='c2-1'?'playing':'lost');}});
 it('new daily pool has 15 replay-verified entries and a stable UTC boundary',()=>{expect(dailyPool).toHaveLength(15);for(let d=1;d<=31;d++){const date=new Date(Date.UTC(2026,10,d)),a=daily2(date);expect(replay(a.level,a.level.solution).status).toBe('won');expect(resolve(a.code)).toEqual(a.level);expect(daily2(new Date(a.reset-1)).code).toBe(a.code);expect(daily2(new Date(a.reset)).code).not.toBe(a.code);}});
 it('rejects nonfinite bounds, missing links and duplicate IDs',()=>{const l=structuredClone(campaign[7]);l.gates![0].switchId='missing';l.orbs[0].mass=0;l.goals[0].x=NaN;l.switches!.push({...l.switches![0]});expect(validateLevel(l)).toEqual(expect.arrayContaining(['orb bounds','goal bounds','missing switch','mechanism ids']));});
});
describe('latching gates',()=>{
 it('blocks while closed, passes when open and resets without mutating the level',()=>{const l=structuredClone(campaign[7]),before=JSON.stringify(l);const closed=createState(l);closed.started=true;closed.orbs[0].x=370;closed.orbs[0].vx=900;for(let i=0;i<12;i++)step(l,closed);expect(closed.orbs[0].x).toBeLessThan(400);const open=createState(l);open.started=true;open.orbs[0].x=300;step(l,open);expect(open.activated).toEqual(['a']);expect(open.opened).toEqual(['a']);open.orbs[0].x=370;open.orbs[0].vx=900;for(let i=0;i<12;i++)step(l,open);expect(open.orbs[0].x).toBeGreaterThan(422);expect(JSON.stringify(l)).toBe(before);expect(createState(l).opened).toEqual([]);});
 it('activates once in stable order and the cascade transfers momentum',()=>{const l=campaign[10],s=replay(l,l.solution);expect(s.used).toBe(1);expect(s.activated).toEqual(['a']);expect(s.opened).toEqual(['a']);expect(s.orbs.every(o=>o.state==='docked')).toBe(true);});
});
describe('input accounting',()=>{
 it('quick taps send once, precision release sends once, other pointers cannot interfere',()=>{const a=new AimControl(),p={x:100,y:200};expect(a.down(1,true,p,false)).toEqual(p);expect(a.up(1,p)).toBeNull();expect(a.down(1,true,p,true)).toBeNull();expect(a.down(2,false,p,true)).toBeNull();expect(a.up(2,p)).toBeNull();expect(a.up(1,p)).toEqual(p);expect(a.up(1,p)).toBeNull();});
 it('outside release, interruption and explicit cancel emit nothing',()=>{const a=new AimControl(),p={x:100,y:200};a.down(1,true,p,true);expect(a.up(1,{x:-1,y:20})).toBeNull();a.down(1,true,p,true);a.cancel();expect(a.up(1,p)).toBeNull();});
});
