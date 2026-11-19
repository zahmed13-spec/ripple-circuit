import type { Block } from "../../scene/arena";
import type { Current, Input } from "../../native/physics";
import type { StoryLevel } from "../levels";
import { chapters, type ExpansionWorld, type StoryId } from "../chapters";

type Lane = {
  z: number;
  start?: number;
  end?: number;
  aim?: number;
  aimZ?: number;
  tick: number;
  plate?: string;
  plateX?: number;
  bridge?: string;
  gravity?: number;
  verticalGravity?:number;
  lift?:Block["lift"];
  current?: boolean;
  timed?: Block["cycle"];
  gate?: string;
  height?: number;
};
const deck = (id: string, x: number, y: number, z: number, w: number, d: number): Block =>
  ({id, x, y: y - .2, z, w, h: .4, d});
const colors = ["#0c9bad", "#d38428", "#8c62cb", "#3aa575", "#d75d7c"];

export function circuit(world: ExpansionWorld, id: number, title: string, hint: string, narrative: string, lanes: Lane[]): StoryLevel {
  const blocks: Block[] = [], currents: Current[] = [], gravityZones: Current[] = [], solution: Input[] = [];
  const orbs: StoryLevel["orbs"] = [], goals: StoryLevel["goals"] = [], switches: StoryLevel["switches"] = [];
  lanes.forEach((lane, i) => {
    const {z, tick, bridge, plate, timed, gate, gravity, current} = lane;
    const start = lane.start ?? -3;
    const end = lane.end ?? 3;
    const y = lane.height ?? 0;
    const name = `lane-${i+1}`;
    if (lane.lift) {
      blocks.push(deck(name,-3.85,y,z,3.7,1.62),{...deck(name+"-lift",0,y,z,4,1.6),kind:"lift",lift:lane.lift},deck(name+"-exit",3.7,y,z,3.4,1.62));
    } else if (bridge) {
      blocks.push(deck(name, -3.85, y, z, 3.7, 1.6),
        {...deck(name+"-roots", 0, y, z, 4, 1.58), kind:"bridge", switchId:bridge},
        deck(name+"-exit", 3.7, y, z, 3.4, 1.6));
    } else {
      blocks.push(deck(name, 0, y, z, 11.4, 1.65));
    }
    if (gate || timed) blocks.push({id:name+"-gate",x:0,y:y+.62,z,w:.27,h:1.24,d:1.62,kind:"gate",switchId:gate,cycle:timed});
    if (plate) switches.push({id:plate,x:lane.plateX ?? 1.25,y,z,radius:.48});
    if (gravity !== undefined) gravityZones.push({id:name+"-gravity",x:.35,y,z,w:6.5,d:1.54,
      force:{x:gravity,y:lane.verticalGravity??0,z:0},switchId:gate});
    if (current) currents.push({id:name+"-energy",x:.5,y,z,w:6.15,d:1.55,force:{x:6,y:0,z:0},switchId:gate});
    orbs.push({id:i,x:start,y:y+.28,z,radius:.28,color:colors[i],state:"active"});
    goals.push({id:i,x:end,y,z,radius:.65,color:colors[i]});
    const aim = lane.aim ?? start - (gravity ? 1.4 : 1);
    solution.push({surface:name,x:aim,y,z:z+(lane.aimZ??0),tick});
  });
  const chapter = chapters.find(entry=>entry.id===world)!;
  return {storyId:`${world}-${id}` as StoryId,id,version:6,title,chapter:chapter.title,hint,skill:chapter.mechanic,narrative,
    mechanics:[chapter.mechanic],blocks,orbs,goals,switches,pulseLimit:Math.min(8,lanes.length+3),
    requiredSwitches:switches.map(plate=>plate.id),currents,gravityZones,solution};
}
export const timing = (offset=0, period=210, open=150) => ({offset,period,open});
