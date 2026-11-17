export type RecordScore = { pulses: number; ticks: number; stars: number };
export type Settings = { sound: boolean; reduced: boolean; contrast: boolean; preview: boolean; precision: boolean };
export type Save = { version: 1; best: Record<string, RecordScore>; unlocked: number; unlocked2: number; unlocked3:number; wins: number; settings: Settings };
export const fresh = (): Save => ({version:1,best:{},unlocked:1,unlocked2:1,unlocked3:1,wins:0,settings:{sound:true,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,contrast:false,preview:true,precision:false}});
export const better = (a: RecordScore, b?: RecordScore) => !b || a.pulses < b.pulses || (a.pulses === b.pulses && a.ticks < b.ticks);
export function load(storage: Pick<Storage,'getItem'> | undefined): Save {
 const s=fresh();try { const raw=JSON.parse(storage?.getItem('ripple-circuit-v1') || 'null');if(raw?.version!==1)return s;
 if(Number.isInteger(raw.unlocked))s.unlocked=Math.max(1,Math.min(25,raw.unlocked));
 if(Number.isInteger(raw.unlocked2))s.unlocked2=Math.max(1,Math.min(12,raw.unlocked2));
 if(Number.isInteger(raw.unlocked3))s.unlocked3=Math.max(1,Math.min(12,raw.unlocked3));
 if(Number.isInteger(raw.wins)&&raw.wins>=0)s.wins=raw.wins;
 for(const [key,v] of Object.entries(raw.best||{})){const r=v as RecordScore;if(/^(c1-(?:[1-9]|1[0-9]|2[0-5])|[cs]2-(?:[1-9]|1[0-2])|c3-(?:[1-9]|1[0-2])|d[123]-\d{4}-\d{2}-\d{2})$/.test(key)&&Number.isInteger(r.pulses)&&r.pulses>0&&r.pulses<=(key.startsWith('c1')||key.startsWith('d1')?3:8)&&Number.isInteger(r.ticks)&&r.ticks>0&&r.ticks<=(key.startsWith('c2')?216000:/^[cd]3-/.test(key)?7200:2700)&&r.stars>=1&&r.stars<=3)s.best[key]=r;}
 for(const key of Object.keys(s.settings) as (keyof Settings)[])if(typeof raw.settings?.[key]==='boolean')s.settings[key]=raw.settings[key];
 }catch{}return s;
}
export function persist(s: Save, storage: Pick<Storage,'setItem'> | undefined): boolean {try{storage?.setItem('ripple-circuit-v1',JSON.stringify(s));return !!storage;}catch{return false;}}
export function record(s: Save, code: string, score: RecordScore, campaignId?: number) {
 const isBest=better(score,s.best[code]);if(isBest)s.best[code]=score;
 s.wins++;if(campaignId&&code.startsWith('c3-'))s.unlocked3=Math.max(s.unlocked3,Math.min(12,campaignId+1));if(campaignId&&code.startsWith('c2-'))s.unlocked2=Math.max(s.unlocked2,Math.min(12,campaignId+1));
 if(campaignId&&code.startsWith('c1-'))s.unlocked=Math.max(s.unlocked,Math.min(25,campaignId+1));return isBest;
}
