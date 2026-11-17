/** Soft synthesized tones; no downloads, autoplay, music or unbounded voices. */
let ctx:AudioContext|undefined;
let lastHit=-1,voices=0;
export function sound(kind:string,enabled:boolean,strength=.5){
 if(!enabled||voices>=6)return;
 try{ctx??=new AudioContext();const now=ctx.currentTime;if(kind==='hit'&&now-lastHit<.07)return;if(kind==='hit')lastHit=now;
 void ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);voices++;
 const frequencies:Record<string,number>={pulse:240+strength*120,hit:160,dock:520,switch:440,win:780,lost:190};const f=frequencies[kind]||260;
 o.type='sine';o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(f*(['dock','switch','win'].includes(kind)?1.5:.65),now+.18);
 g.gain.setValueAtTime(.001,now);g.gain.linearRampToValueAtTime(kind==='hit'?.022:.035,now+.008);g.gain.exponentialRampToValueAtTime(.001,now+.25);o.start(now);o.stop(now+.27);o.onended=()=>{voices--;o.disconnect();g.disconnect();};
 }catch{}
}
