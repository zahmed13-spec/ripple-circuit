import catalog from './catalog.json' with { type: 'json' };
import catalog2 from './catalog-v2.json' with { type: 'json' };
import type { Level } from './engine';
export const levels = catalog as Level[]; // Immutable legacy c1 catalog.
export const campaign = catalog2 as Level[];
// Frozen, curated mixed-mechanic pool. 15 entries, not an unlimited generator.
export const dailyPool = [...campaign.slice(3), ...[4,7,12,16,20,23].map(id=>levels[id-1])];
export function daily2(date=new Date()) {
 const day=date.toISOString().slice(0,10),n=Math.floor(Date.parse(day+'T00:00:00Z')/86400000);
 return {code:`d2-${day}`,level:{...dailyPool[((n*7+3)%15+15)%15],version:2,timeLimit:45},reset:(n+1)*86400000};
}
export function campaignCode(l:Level){return `c${l.version}-${l.id}`;}

/** UTC catalog selection, frozen algorithm and catalog version. No locale-dependent dates. */
export function daily(date = new Date()): { code: string; level: Level; reset: number } {
 const day = date.toISOString().slice(0,10), n = Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000);
 return {code:`d1-${day}`,level:levels[3 + ((n * 17 + 11) % 22 + 22) % 22],reset:(n+1)*86400000};
}
export function resolve(code: string): Level | null {
 if(/^[cs]2-([1-9]|1[0-2])$/.test(code)){const l=campaign[Number(code.slice(3))-1];return code.startsWith('s')?{...l,timeLimit:45}:l;}
 if(/^d2-\d{4}-\d{2}-\d{2}$/.test(code)){const day=code.slice(3),date=new Date(day+'T00:00:00Z');if(!Number.isNaN(+date)&&date.toISOString().slice(0,10)===day)return daily2(date).level;}

 if (/^c1-([1-9]|1[0-9]|2[0-5])$/.test(code)) return levels[Number(code.slice(3))-1];
 if (/^d1-\d{4}-\d{2}-\d{2}$/.test(code)) { const day=code.slice(3), date=new Date(day+'T00:00:00Z'); if(!Number.isNaN(+date)&&date.toISOString().slice(0,10)===day)return daily(date).level; }
 return null;
}
