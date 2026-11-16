import { resolve } from '../game/levels';
import { PHYSICS, replay, validReplay, type Pulse } from '../game/engine';
export function encodeRun(code: string, inputs: Pulse[]) {return btoa(JSON.stringify({v:PHYSICS.version,c:code,p:inputs}));}
export function decodeRun(code: string, data: string | null) {
 if(!data||data.length>4096)return null;
 try {const r=JSON.parse(atob(data));const l=resolve(code);if(!l||r.v!==PHYSICS.version||r.c!==code||!validReplay(l,r.p))return null;
 const s=replay(l,r.p);return s.status==='won'?{pulses:s.used,ticks:s.tick,inputs:r.p as Pulse[]}:null;
 }catch{return null;}
}
export function challengeURL(code: string, inputs?: Pulse[], origin = location.origin + location.pathname) {
 const u=new URL(origin);u.hash='play';u.search='';u.searchParams.set('c',code);if(inputs)u.searchParams.set('r',encodeRun(code,inputs));return u.href;
}
