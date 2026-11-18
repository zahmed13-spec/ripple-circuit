import { surfaceY, type Current, type Input, type NativeLevel } from "../native/physics";
import type { Block } from "../scene/arena";
import { aero, type StoryId } from "./chapters";

export type StoryLevel = NativeLevel & {
  version: 4;
  storyId: StoryId;
  narrative: string;
  mechanics: readonly string[];
};

const deck = (id:string,x:number,y:number,z:number,w:number,d:number): Block =>
  ({id,x,y:y-.2,z,w,h:.4,d});
const gate = (id:string,x:number,z:number,switchId:string): Block =>
  ({id,x,y:.5,z,w:.24,h:1,d:2,kind:"gate",switchId});
const colors = ["#10a4ba","#c98021","#8760c8"];
const orb = (id:number,x:number,y:number,z:number) =>
  ({id,x,y:y+.28,z,radius:.28,color:colors[id],state:"active"});
const goal = (id:number,x:number,y:number,z:number,radius=.67) =>
  ({id,x,y,z,color:colors[id],radius});
const pulse = (surface:string,x:number,y:number,z:number,tick=0): Input =>
  ({surface,x,y,z,tick});
const plate = (id:string,x:number,z:number) => ({id,x,y:0,z,radius:.45});
const flow = (id:string,x:number,z:number,w:number, switchId?:string): Current =>
  ({id,x,y:0,z,w,d:1.35,force:{x:6,y:0,z:0},switchId});
function level(
  id:number,title:string,hint:string,narrative:string,mechanics:string[],
  config: Pick<NativeLevel,"blocks"|"orbs"|"goals"|"solution"> &
    Partial<Pick<NativeLevel,"switches"|"currents"|"requiredSwitches">>,
): StoryLevel {
  return {id,storyId:aero.levelIds[id-1],version:4,chapter:"Aero Haven",title,
    skill:mechanics[0],hint,narrative,mechanics,pulseLimit:id===5?6:4,switches:[],...config};
}
const upper = deck("upper-terrace",-3,1.25,0,4,2.5);
const ramp = {...deck("waterfall-ramp",-.45,.58,0,2.7,2.45),
  rotation:{x:0,y:0,z:-.235,w:0.971995370359345}}, lower = deck("lower-aqueduct",3.55,0,0,5.4,3.2);
export const storyLevels = [
  level(1,"A New Ripple","Tap behind the marble to roll it into the matching ring.",
    "Luma: That spark answers you. Send it toward the ring and see what wakes up.",["Shockwave direction"],{
      blocks:[deck("arrival-island",0,0,0,10,6)],orbs:[orb(0,-2,0,0)],
      goals:[goal(0,2.1,0,0)],solution:[pulse("arrival-island",-3,0,0)],
    }),
  level(2,"The Flowing Path","Start the marble toward the bright arrows. The moving water carries it the rest of the way.",
    "Luma: The water still remembers where to go.",["Continuous current"],{
      blocks:[deck("stream-bed",0,0,0,12,3.8)],orbs:[orb(0,-3.6,0,0)],
      goals:[goal(0,4.6,0,0)],currents:[flow("stream",1,0,6.5)],
      solution:[pulse("stream-bed",-5.35,0,0)],
    }),
  level(3,"Beneath the Surface","Aim on the upper terrace. The ramp drops to a lower current that carries the marble home.",
    "Luma: The channel runs under this terrace. Follow the water down.",["Elevation","Current"],{
      blocks:[upper,ramp,lower],orbs:[orb(0,-3.3,1.25,0)],
      goals:[goal(0,5.1,0,0)],currents:[flow("lower-flow",3.35,0,4.55)],
      solution:[pulse("upper-terrace",-4.7,surfaceY(upper,-4.7,0),0)],
    }),
  level(4,"Reconnect the Stream","Send marble 1 across the pressure plate. Once the lower channel lights up, send marble 2 through it.",
    "Luma: A disconnected route can still carry power. Check that plate.",["Latched pressure plate","Dormant current","Gate"],{
      blocks:[deck("switch-walk",0,0,-1.65,10.8,2.3),deck("stream-walk",0,0,1.65,11.5,2.3),gate("stream-lock",.55,1.65,"intake")],
      orbs:[orb(0,-2.7,0,-1.65),orb(1,-3.1,0,1.65)],
      goals:[goal(0,2.3,0,-1.65),goal(1,4.5,0,1.65)],
      switches:[plate("intake",.3,-1.65)],currents:[flow("wake-stream",1,1.65,6,"intake")],requiredSwitches:["intake"],
      solution:[pulse("switch-walk",-3.65,0,-1.65),pulse("stream-walk",-4.4,0,1.65,95)],
    }),
  level(5,"Guardian of the Aqueduct","Reconnect the intake, relay, and crown. Each plate powers the next channel. Dock all three marbles.",
    "Luma: The aqueduct is its own guardian. Give each part of the network a path to the next.",["Three-stage intake, relay and crown","Linked gates","Current"],{
      blocks:[
        deck("intake-terrace",0,0,-3.3,11.5,2.5),
        deck("relay-terrace",0,0,0,11.5,2.5),
        deck("crown-terrace",0,0,3.3,11.5,2.5),
        gate("relay-lock",.6,0,"intake"),gate("crown-lock",.6,3.3,"relay"),
      ],
      orbs:[orb(0,-3,0,-3.3),orb(1,-3,0,0),orb(2,-3,0,3.3)],
      goals:[goal(0,4.5,0,-3.3),goal(1,4.5,0,0),goal(2,4.5,0,3.3)],
      switches:[plate("intake",2.5,-3.3),plate("relay",2.5,0),plate("crown",2.5,3.3)],
      currents:[flow("intake-flow",1,-3.3,6.1),flow("relay-flow",1,0,6.1,"intake"),flow("crown-flow",1,3.3,6.1,"relay")],
      requiredSwitches:["intake","relay","crown"],
      solution:[pulse("intake-terrace",-4.5,0,-3.3),pulse("relay-terrace",-4.5,0,0,115),pulse("crown-terrace",-4.5,0,3.3,230)],
    }),
] satisfies StoryLevel[];
