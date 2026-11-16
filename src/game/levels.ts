import catalog from './catalog.json' with { type: 'json' };
import type { Level } from './engine';
export const levels = catalog as Level[];
/** UTC catalog selection, frozen algorithm and catalog version. No locale-dependent dates. */
export function daily(date = new Date()): { code: string; level: Level; reset: number } {
 const day = date.toISOString().slice(0,10), n = Math.floor(Date.parse(day + 'T00:00:00Z') / 86400000);
 return {code:`d1-${day}`,level:levels[3 + ((n * 17 + 11) % 22 + 22) % 22],reset:(n+1)*86400000};
}
export function resolve(code: string): Level | null {
 if (/^c1-([1-9]|1[0-9]|2[0-5])$/.test(code)) return levels[Number(code.slice(3))-1];
 if (/^d1-\d{4}-\d{2}-\d{2}$/.test(code)) { const day=code.slice(3), date=new Date(day+'T00:00:00Z'); if(!Number.isNaN(+date)&&date.toISOString().slice(0,10)===day)return daily(date).level; }
 return null;
}
