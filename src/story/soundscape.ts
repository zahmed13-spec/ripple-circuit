import { sharedAudioContext } from "../services/audio";

const chordNotes = [
  [48,55],[48,55,62],[48,55,64],[48,54,62],[48,55,64,69],[48,55,64,72],
] as const;

export class Soundscape {
  private audio?:AudioContext;
  private master?:GainNode;
  private flow?:AudioBufferSourceNode;
  private water?:GainNode;
  private filter?:BiquadFilterNode;
  private voices:{tone:OscillatorNode;gain:GainNode}[]=[];
  private stage=0;
  private phase=0;
  private active=false;
  private disposed=false;

  constructor(private music:()=>boolean) {}
  start() {
    if (this.disposed || !this.music()) return;
    if (!this.audio) {
      try { this.create(); }
      catch { this.dispose(); return; }
    }
    void this.audio!.resume().catch(()=>{});
    this.active=true;
    this.tune();
  }
  private create() {
    const context=this.audio=sharedAudioContext();
    const master=this.master=context.createGain();
    master.gain.value=0;
    master.connect(context.destination);
    this.water=context.createGain();
    const noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
    const samples=noise.getChannelData(0);
    let seeded=8127;
    for(let i=0;i<samples.length;i++){
      seeded=(Math.imul(seeded,1664525)+1013904223)>>>0;
      const edge=Math.min(1,i/128,(samples.length-1-i)/128);
      samples[i]=(seeded/2147483648-1)*edge;
    }
    const flow=this.flow=context.createBufferSource();
    flow.buffer=noise;
    flow.loop=true;
    this.filter=context.createBiquadFilter();
    this.filter.type="lowpass";
    flow.connect(this.filter).connect(this.water).connect(master);
    flow.start();
    for(let i=0;i<4;i++){
      const tone=context.createOscillator(),gain=context.createGain();
      tone.type=i===3?"triangle":"sine";
      tone.connect(gain).connect(master);
      gain.gain.value=0;
      tone.start();
      this.voices.push({tone,gain});
    }
  }
  set(stage:number,phase=0) {
    if (stage===this.stage&&phase===this.phase) return;
    this.stage=stage;
    this.phase=phase;
    this.tune();
  }
  setActive(active:boolean) {
    if(this.active===active)return;
    this.active=active;
    this.tune();
  }
  private tune() {
    if(!this.audio || this.disposed) return;
    const at=this.audio.currentTime;
    this.master!.gain.setTargetAtTime(this.active&&this.music()&&!document.hidden ? .48 : 0,at,.18);
    this.water!.gain.setTargetAtTime(.025+this.stage*.009,at,.3);
    this.filter!.frequency.setTargetAtTime(240+this.stage*105,at,.35);
    const notes=chordNotes[this.stage];
    this.voices.forEach(({tone,gain},i)=>{
      const note=notes[i];
      if(note!==undefined)tone.frequency.setTargetAtTime(440*2**((note-69)/12),at,.25);
      gain.gain.setTargetAtTime(note===undefined?0:.009+this.phase*.0008,at,.4);
    });
  }
  dispose() {
    if(this.disposed)return;
    this.disposed=true;
    if(!this.audio)return;
    this.flow?.stop();
    this.flow?.disconnect();
    this.filter?.disconnect();
    this.water?.disconnect();
    for(const {tone,gain} of this.voices){
      tone.stop();
      tone.disconnect();
      gain.disconnect();
    }
    this.master?.disconnect();
    this.voices=[];
  }
}
