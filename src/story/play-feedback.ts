import { Vector3 } from "three";
import type { Arena3D } from "../scene/arena";
import { currentActive, inCurrent, type Simulation } from "../native/physics";
import type { StoryLevel } from "./levels";
import type { StoryResult } from "./save";
import type { WorldTheme } from "./themes";
import { motif } from "../services/audio";
import { circuits, milestones } from "./narrative";
import { Soundscape } from "./soundscape";

export type StoryPlay = {
  level:StoryLevel;
  theme:WorldTheme;
  stage():number;
  record(result:StoryResult):boolean;
  best():StoryResult|undefined;
  next():string;
  canContinue():boolean;
  nextLabel():string;
  music():boolean;
  largeText():boolean;
};

export class StoryFeedback {
  private soundtrack: Soundscape;
  private line: HTMLElement;
  private status: HTMLElement;
  private inRun=false;
  private activated=0;
  private docks=new Set<number>();
  private enteredCurrent=false;
  private directive:HTMLElement;

  constructor(private story:StoryPlay,private arena:Arena3D,main:HTMLElement,private effects:()=>boolean) {
    this.soundtrack=new Soundscape(story.music);
    this.line=main.querySelector(".story-guide p")!;
    this.status=main.querySelector("#story-restore-status")!;
    this.directive=document.createElement("output");
    this.directive.className="living-directive";
    this.directive.hidden=true;
    this.line.parentElement!.append(this.directive);
    main.classList.toggle("living-large-text",story.largeText());
    this.reset();
  }
  reset() {
    this.activated=0;
    this.docks.clear();
    this.enteredCurrent=false;
    this.directive.hidden=true;
    this.inRun=false;
    this.arena.story?.setStage(this.story.stage());
    this.arena.story?.setPhase(0);
    this.arena.story?.react("curious",undefined,Infinity);
    this.line.textContent=circuits[this.story.level.id-1].before;
    this.status.textContent=milestones[this.story.stage()].name;
    this.soundtrack.set(this.story.stage());
  }
  pulse(point:Vector3) {
    if(this.inRun)return;
    this.inRun=true;
    this.soundtrack.start();
    this.arena.story?.react(this.story.level.id===1?"surprised":"focused",point);
  }
  observe(sim:Simulation) {
    if(sim.activated.length>this.activated){
      this.activated=sim.activated.length;
      const id=sim.activated.at(-1)!;
      const plate=this.story.level.switches.find(s=>s.id===id)!;
      this.arena.story?.setPhase(this.activated);
      this.arena.story?.react("focused",new Vector3(plate.x,plate.y,plate.z),1.5);
      this.soundtrack.set(this.story.stage(),this.activated);
      const lines:Record<string,string>={
        intake:"The intake answered. Look for the arrows on the channel it powers.",
        relay:"The relay caught the signal. The crown gate is open.",
        crown:"The crown is drawing power. Bring the last marble home.",
      };
      this.line.textContent=lines[id]??"The channel is powered.";
    }
    if (!this.enteredCurrent && this.story.level.id===2) {
      const current=sim.level.currents?.find(c=>currentActive(c,sim.activated)&&sim.orbs.some(o=>o.state==="active"&&inCurrent(c,o,o.radius)));
      if(current){
        this.enteredCurrent=true;
        this.arena.story?.react("surprised",new Vector3(current.x,current.y,current.z),1.3);
        this.line.textContent="Look at it go. The water is carrying the marble now.";
      }
    }
    if(sim.events.includes("dock")){
      const newDocks=sim.orbs.filter(o=>o.state==="docked"&&!this.docks.has(o.id));
      for(const orb of newDocks)this.docks.add(orb.id);
      const docked=newDocks.at(-1);
      if(docked){
        const target=new Vector3(docked.x,docked.y,docked.z);
        this.arena.story?.react("celebrating",target,1.15);
      }
    }
  }
  finish(won:boolean,firstClear:boolean) {
    if(!won){
      this.arena.story?.react("concerned",undefined,3);
      this.line.textContent="Take a breath. The Current will still be here when we try again.";
      return;
    }
    this.arena.story?.setStage(this.story.stage(),firstClear&&this.story.stage()===5?"echo":"");
    this.status.textContent=milestones[this.story.stage()].name;
    this.soundtrack.set(this.story.stage(),this.activated);
    const beat=circuits[this.story.level.id-1];
    this.arena.story?.react(firstClear?beat.mood:"celebrating",undefined,3);
    if(firstClear){
      this.line.textContent=beat.after;
      if(this.story.level.id===3){
        this.directive.textContent=beat.fragment;
        this.directive.hidden=false;
      }
      motif(this.story.theme.notes.slice(0,this.story.stage()===5?4:2),this.effects());
    }
  }
  setActive(active:boolean) { this.soundtrack.setActive(active); }
  dispose() { this.soundtrack.dispose(); }
}
