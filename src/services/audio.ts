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

/** Short original motif using the same voice budget as the game effects. */
export function motif(notes: readonly number[], enabled: boolean) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    void ctx.resume().catch(() => {});
    const audio = ctx;
    const start = audio.currentTime;
    notes.slice(0, Math.max(0, 6 - voices)).forEach((note, i) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = start + i * .16;
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
      gain.gain.setValueAtTime(.001, at);
      gain.gain.linearRampToValueAtTime(.028, at + .07);
      gain.gain.exponentialRampToValueAtTime(.001, at + .7);
      voices++;
      oscillator.onended = () => { voices--; oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(at);
      oscillator.stop(at + .72);
    });
  } catch { /* The story is fully readable with audio unavailable. */ }
}
