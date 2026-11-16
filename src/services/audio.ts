/** Original synthesized effects, created only following user interaction. */
let ctx: AudioContext | undefined;
export function sound(kind: string, enabled: boolean) {
 if(!enabled)return;
 try {ctx??=new AudioContext();void ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
 const f=kind==='dock'?660:kind==='win'?880:kind==='lost'?130:kind==='hit'?180:320;
 o.type=kind==='pulse'?'sine':'triangle';o.frequency.setValueAtTime(f,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(f*(kind==='dock'?1.5:.5),ctx.currentTime+.15);
 g.gain.setValueAtTime(.045,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);o.start();o.stop(ctx.currentTime+.22);
 }catch{}
}
