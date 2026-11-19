import type { Block } from "../scene/arena";
import type { Current, Input } from "../native/physics";
import type { StoryLevel } from "./levels";
import { chapters, type ExpansionWorld, type StoryId } from "./chapters";

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
  current?: boolean;
  timed?: Block["cycle"];
  gate?: string;
  height?: number;
};
const deck = (id: string, x: number, y: number, z: number, w: number, d: number): Block =>
  ({id, x, y: y - .2, z, w, h: .4, d});
const colors = ["#0c9bad", "#d38428", "#8c62cb", "#3aa575", "#d75d7c"];

function circuit(world: ExpansionWorld, id: number, title: string, hint: string, narrative: string, lanes: Lane[]): StoryLevel {
  const blocks: Block[] = [], currents: Current[] = [], gravityZones: Current[] = [], solution: Input[] = [];
  const orbs: StoryLevel["orbs"] = [], goals: StoryLevel["goals"] = [], switches: StoryLevel["switches"] = [];
  lanes.forEach((lane, i) => {
    const {z, tick, bridge, plate, timed, gate, gravity, current} = lane;
    const start = lane.start ?? -3;
    const end = lane.end ?? 3;
    const y = lane.height ?? 0;
    const name = `lane-${i+1}`;
    if (bridge) {
      blocks.push(deck(name, -3.85, y, z, 3.7, 1.6),
        {...deck(name+"-roots", 0, y, z, 4, 1.58), kind:"bridge", switchId:bridge},
        deck(name+"-exit", 3.7, y, z, 3.4, 1.6));
    } else {
      blocks.push(deck(name, 0, y, z, 11.4, 1.65));
    }
    if (gate || timed) blocks.push({id:name+"-gate",x:0,y:y+.62,z,w:.27,h:1.24,d:1.62,kind:"gate",switchId:gate,cycle:timed});
    if (plate) switches.push({id:plate,x:lane.plateX ?? 1.25,y,z,radius:.48});
    if (gravity !== undefined) gravityZones.push({id:name+"-gravity",x:.35,y,z,w:6.5,d:1.54,
      force:{x:gravity,y:0,z:0},switchId:gate});
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
const timing = (offset=0, period=210, open=150) => ({offset,period,open});

export const expansionLevels = {
  eco: [
    circuit("eco",1,"Seeds of Light","Send a pulse behind the seed. Pass over the botanical receiver on the way to the ring.","Something in the forest answers back.",[{z:0,tick:0,plate:"seed receiver",end:2.8}]),
    circuit("eco",2,"A Bridge of Roots","Dock the seed on the upper path first. The receiver grows a bridge across the lower gap.","The roots were waiting for permission.",[{z:-1.55,tick:0,plate:"root receiver"},{z:1.55,tick:105,bridge:"root receiver",end:2.8}]),
    circuit("eco",3,"The Greenhouse Divide","Energize the lower receiver. Select the raised deck and cross the bridge inside the greenhouse.","Someone separated the two greenhouses deliberately.",[{z:1.65,tick:0,plate:"greenhouse feed"},{z:-1.65,tick:110,bridge:"greenhouse feed",height:1.3,end:2.8}]),
    circuit("eco",4,"The Living Network","Follow the receivers from the first lane to the third. Each bridge feeds the next.","Growth was classified as a fault.",[{z:-3,tick:0,plate:"west roots"},{z:0,tick:110,bridge:"west roots",plate:"east roots",end:2.9},{z:3,tick:225,bridge:"east roots",end:2.8}]),
    circuit("eco",5,"The Sleeping Tree","Connect the uphill feeder, then the two root bridges. Every receiver brings the tree closer to waking.","The tree does not need permission to be alive.",[{z:3,tick:0,plate:"sun root",height:.75},{z:0,tick:100,bridge:"sun root",plate:"rain root"},{z:-3,tick:210,bridge:"rain root",plate:"crown root",height:1.25}]),
  ],
  terra: [
    circuit("terra",1,"Beneath the World","Start with a gentle pulse. The amber gravity field pulls the marble toward the home ring.","The stone is still moving, beneath all that silence.",[{z:0,tick:0,start:-3.5,end:4.5,aim:-5,gravity:5}]),
    circuit("terra",2,"Crystal Path","Dock the upper marble to turn on the crystal pull. Use a gentle pulse on the lower deck.","The crystals can guide movement without locking it in place.",[{z:-1.7,tick:0,plate:"crystal relay",height:.8},{z:1.7,tick:105,end:4.2,gravity:7,gate:"crystal relay"}]),
    circuit("terra",3,"The Weight of Stone","The lower gravity field pushes back. Use a closer pulse there after docking the upper marble.","A little resistance can keep a bridge steady.",[{z:-1.55,tick:0,gravity:4,end:4.1},{z:1.55,tick:95,gravity:-1.7,aim:-3.75,end:2.3}]),
    circuit("terra",4,"The Inverted Chamber","Use the low receiver to open the raised gravity gate. The raised deck has its own aiming surface.","Stability is a balance, not an order to stop.",[{z:2,tick:0,plate:"inversion crystal",end:2.4},{z:-2,tick:100,gravity:8,gate:"inversion crystal",height:1.65,end:4.3}]),
    circuit("terra",5,"Heart of Terra","Restore the upper stabilizer, then lower and central. Read the arrows for each field’s direction.","The chamber settles without falling silent.",[{z:-3,tick:0,plate:"upper stabilizer",gravity:-1.2,aim:-3.75,end:2.5,height:1.4},{z:3,tick:110,plate:"lower stabilizer",gravity:7,gate:"upper stabilizer",end:4.3},{z:0,tick:235,gate:"lower stabilizer",gravity:5,plate:"core stabilizer",end:4.1,height:.7}]),
  ],
  metro: [
    circuit("metro",1,"First Departure","The barrier cycles after your first pulse. Depart during its open window.","The first line begins moving again.",[{z:0,tick:0,timed:timing(),end:2.9}]),
    circuit("metro",2,"Crossing Signals","Send the upper marble first. The lower barrier follows a different phase.","Two routes can share a rhythm without moving together.",[{z:-1.6,tick:0,timed:timing(20)},{z:1.6,tick:115,timed:timing(115),end:2.7}]),
    circuit("metro",3,"Perfect Timing","Power the route from the receiver lane. Send the second marble as its scheduled barrier opens.","A city can change course and still arrive together.",[{z:2,tick:0,plate:"departure signal",end:2.5},{z:-2,tick:138,gate:"departure signal",timed:timing(95),end:2.8}]),
    circuit("metro",4,"The Exchange","Dock on the raised feeder. Watch the offset cycles on the lower and middle routes.","Luma remembers how the city used to make room for every traveler.",[{z:-3,tick:0,plate:"exchange",height:1.15,end:2.6},{z:3,tick:110,gate:"exchange",timed:timing(120),end:3},{z:0,tick:240,timed:timing(20,240,156),end:2.8}]),
    circuit("metro",5,"Central Station","Connect the three departure lanes in order. Each receiver schedules the next route.","The city is moving together again.",[{z:-3,tick:0,plate:"line one",timed:timing()},{z:0,tick:105,plate:"line two",gate:"line one",timed:timing(125),height:.55},{z:3,tick:220,plate:"line three",gate:"line two",timed:timing(30),end:3.2}]),
  ],
  null: [
    circuit("null",1,"The First Glitch","Dock the repair key first. The second lane’s dormant current turns on when its gate opens.","Its own safeguards are tearing the network apart.",[{z:-1.7,tick:0,plate:"repair key"},{z:1.7,tick:100,gate:"repair key",current:true,end:4.55,aim:-4.75}]),
    circuit("null",2,"Broken Reflection","The elevated lane pushes against the marble. The lower one accelerates it forward. Follow the arrow direction.","The reflection belongs to the old world, before NULL stopped the flow.",[{z:1.75,tick:0,gravity:-1.45,height:1.1,aim:-3.74,end:2.35},{z:-1.75,tick:100,gravity:6,end:4.35}]),
    circuit("null",3,"System Failure","Restore the current on the low deck and cross the bridge grown by its receiver.","The forest sends a reply through the broken channel.",[{z:1.7,tick:0,current:true,plate:"repair the roots",end:4.5,aim:-4.65},{z:-1.7,tick:120,bridge:"repair the roots",height:1.15,end:2.9}]),
    circuit("null",4,"The Last Connection","Use gravity to charge the roots. Their bridge carries the key to a timed gate.","The system is starting to listen.",[{z:-3,tick:0,gravity:6,plate:"charged root",end:4.4},{z:0,tick:110,bridge:"charged root",plate:"timing key",height:1,end:2.9},{z:3,tick:220,timed:timing(35),gate:"timing key",end:2.8}]),
    circuit("null",5,"The Fractured Core","Restore water, bridge, gravity and transit in order. The last receiver reconnects the Current.","No single part of the world can keep the rest safe by freezing it.",[{z:-4.7,tick:0,current:true,plate:"water",aim:-4.6,end:4.5},{z:-2.35,tick:110,bridge:"water",plate:"roots",height:1.1,end:2.9},{z:0,tick:225,gravity:7,gate:"roots",plate:"gravity",end:4.25},{z:2.35,tick:340,timed:timing(95),gate:"gravity",plate:"transit",height:.65,end:2.9},{z:4.7,tick:460,aimZ:.25,gate:"transit",plate:"the Current",end:3.2}]),
  ],
};
