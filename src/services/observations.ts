/** Local, bounded session observations. No network and no identifying data. */
const events:{event:string;code:string;at:number;detail?:number}[]=[];
const started=performance.now();
export function observe(event:string,code:string,detail?:number){events.push({event,code,at:Math.round(performance.now()-started),detail});if(events.length>2000)events.shift();}
export function exportObservations(){const blob=new Blob([JSON.stringify({version:1,events},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ripple-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
