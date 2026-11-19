import { filmContent, shotContent, dialogueContent, characterContent, worldContent } from "../../content";

export type Vec3 = readonly [number, number, number];
type Key<V> = readonly [time: number, value: V, hold?: true];
export type Track<V> = readonly Key<V>[];
type Emotion = "bright" | "curious" | "afraid" | "downcast" | "resolve" | "relief" | "neutral";
export type Pose = readonly [x: number, y: number, z: number, roll: number, stretch: number, emotion: Emotion];
type Lens = readonly [focus: Vec3, offset: Vec3, fov: number];
export type Effect = "flow" | "fracture" | "silence" | "spark" | "beacon" | "reservoir" |
  "terminal" | "memory" | "relay" | "survey" | "restore" | "signal" | "growth";
export type Shot = {
  id: string;
  label: string;
  seconds: number;
  lens: readonly [Lens, Lens?];
  luma: Track<Pose>;
  ripple?: Track<Pose>;
  power: Track<number>;
  effect: Effect;
  line?: {id:string; speaker:string; text:string; in:number; out:number; mouths?:string};
  cue?: readonly [at:number, notes:readonly number[]];
};
export type Film = {
  id:string;
  title:string;
  chapter:string;
  stage:number;
  next:string;
  shots:readonly Shot[];
};
const aero=worldContent.aero.title;
const P=(x:number,y:number,z:number,roll:number,stretch:number,emotion:Emotion):Pose=>[x,y,z,roll,stretch,emotion];
const V=(focus:Vec3,offset:Vec3,fov=35):Lens=>[focus,offset,fov];
const dialogueLine=(id:string,mouths?:string)=>({mouths,...dialogueContent[id]});
const still=(p:Pose):Track<Pose>=>[[0,p]];
const fixed=(n:number):Track<number>=>[[0,n]];
const H=(x:number,y:number,z:number):Pose=>P(x,y,z,0,1,"neutral");
const stage=(id:string,seconds:number,lens:Shot["lens"],effect:Effect,power:Track<number>,luma:Track<Pose>,
  ripple?:Track<Pose>,line?:ReturnType<typeof dialogueLine>,cue?:Shot["cue"]):Shot=>({id,label:shotContent[id].label,seconds,lens,effect,power,luma,ripple,
  line:line?{...line,speaker:characterContent[line.speaker]?.name ?? line.speaker,in:line.start,out:seconds-.28}:undefined,cue});
const vista=V([0,1,-2],[10,7,13],42);
const landing=V([-.5,.95,.35],[4,2.7,8],34);
const crown=V([-1,2,-6.1],[3,2.5,8],31);
const beacon=V([-5,1,-2.9],[1.4,2.4,7],35);
const reservoir=V([-5,.85,-4.8],[3,2,8],38);
const relay=V([4.9,1.5,-4],[2.4,2,7],34);
const terminal=V([4.15,1.35,.25],[1.5,1.55,5.8],35);
const close=V([-1.2,1.6,1.1],[.75,.75,4.4],33);
const preview=V([0,1.7,-1.6],[8,5.7,12],39);

export const films = {
 "story-intro":{
  id:"first-spark",title:filmContent["story-intro"].title,chapter:aero,stage:0,next:"aero-1",
  shots:[
   stage("intro-1",8,[vista,V([-.8,1.2,-3.8],[7.5,5.4,12],40)],"flow",fixed(1),
    [[0,P(-5,2.4,2,-.18,1,"bright")],[.31,P(-3,1.8,1.3,.18,1.1,"bright")],[.62,P(-.8,2,-.5,.1,1,"bright")],[1,P(1,1.6,-1,0,.96,"curious")]],
    undefined,dialogueLine("intro-1", "oae–eea–ooe–aeo"),[.3,[60,64,67,74]]),
   stage("intro-2",6,[crown,V([-1.1,1.9,-6.5],[2.2,1.6,6.3],31)],"fracture",[[0,1],[.26,.93],[.34,.35],[.58,.08],[1,0]],
    [[0,P(-2.6,2.1,-4,.2,1,"curious")],[.23,P(-2.1,1.98,-4,.3,.83,"curious"),true],[.38,P(-2.9,2.4,-3.5,-.38,1.2,"afraid")],[1,P(-1.4,1.4,-5.3,-.1,.88,"downcast")]],
    undefined,dialogueLine("intro-2", "ae–o–ao"),[1.6,[48,54,57]]),
   stage("intro-3",5,[close,V([-1.22,1.25,1.02],[.35,.45,3.8],32)],"silence",fixed(0),
    [[0,P(-1.2,1.6,1.1,0,1,"downcast")],[.55,P(-1.15,1.25,1.05,-.17,.82,"downcast")],[1,P(-1.12,1.32,1.02,.13,.85,"curious")]],
    undefined,dialogueLine("intro-3", "eea–oa–ea")),
   stage("intro-4",8,[landing,V([-.8,1.2,1.05],[1.1,1.2,5.7],32)],"spark",[[0,0],[.23,.01],[.43,.15],[1,.16]],
    [[0,P(-2.75,1.38,1.15,-.18,.9,"curious")],[.31,P(-2.13,1.25,1.2,.15,.94,"curious")],[.44,P(-2.28,1.52,1.3,-.22,1.2,"afraid")],[1,P(-1.73,1.61,1.28,.11,1,"bright")]],
    [[0,H(.4,.42,1.3)],[.29,P(.35,.44,1.3,0,.72,"downcast"),true],[.52,P(.25,1.05,1.3,.25,1.16,"bright")],[1,H(.35,.83,1.24)]],
    dialogueLine("intro-4", "o–ee–oa–aeeo"),[1.8,[72,76,79]]),
   stage("intro-5",8,[V([.3,1.0,.3],[.9,1.8,7],36),landing],"spark",fixed(.13),
    [[0,P(-1.7,1.55,1.04,.12,1,"bright")],[.5,P(-2.13,1.42,.25,-.21,.91,"resolve")],[1,P(-2.55,1.6,-.05,0,1,"bright")]],
    [[0,H(-.3,.84,1.36)],[.46,P(.75,1.09,.85,.18,1.13,"bright")],[1,H(1.15,.61,.67)]],
    dialogueLine("intro-5", "eea–ao–ee–ao"),[5.7,[60,67,72]]),
  ],
 },
 "story-beacon":{
  id:"first-beacon",title:filmContent["story-beacon"].title,chapter:aero,stage:1,next:"aero-2",
  shots:[
   stage("beacon-1",4,[landing,V([.8,1.1,.8],[1.4,1.35,5.5],32)],"beacon",[[0,.05],[.16,.1],[.31,.38],[1,.45]],
    [[0,P(-1.1,1.37,.8,0,.84,"curious")],[.16,P(-.9,1.43,.75,.07,.87,"curious"),true],[.32,P(-1.22,2.06,1.06,-.31,1.27,"afraid")],[.61,P(-.86,1.74,.77,.19,1.03,"bright")],[1,P(-.77,1.65,.69,.15,1,"bright")]],
    [[0,H(.85,.53,.8)],[.52,P(.86,1.05,.74,.13,1.22,"bright")],[1,H(.93,.77,.66)]],dialogueLine("beacon-1", "ee–o"),[0.8,[67,72,76]]),
   stage("beacon-2",5,[V([-2.7,1.25,-1.5],[3,2.6,7],39),beacon],"beacon",fixed(.44),
    [[0,P(-1.3,1.7,.4,.18,1,"bright")],[.46,P(-3.5,2.1,-1.7,-.3,1.13,"bright")],[1,P(-4.7,1.5,-2.4,.16,1,"curious")]],
    [[0,H(-.1,.7,.5)],[.57,P(-2.7,1,-1.1,.2,1.1,"bright")],[1,H(-3.85,.82,-2)]],
    dialogueLine("beacon-2", "oo–aeo–ee")),
   stage("beacon-3",7,[V([-3.4,1.15,-2.45],[3.6,2.4,7.8],37),reservoir],"flow",fixed(.46),
    [[0,P(-5.15,1.55,-2.4,.14,.97,"bright")],[.55,P(-4.67,2,-3,-.18,1.12,"bright")],[1,P(-4.85,1.8,-3.8,.08,1,"resolve")]],
    still(H(-4,.95,-2.6)),dialogueLine("beacon-3", "oo–ea–oa"),[.35,[64,67,72]]),
  ],
 },
 "story-reservoir":{
  id:"reservoir-awakens",title:filmContent["story-reservoir"].title,chapter:aero,stage:2,next:"aero-3",
  shots:[
   stage("reservoir-1",5,[reservoir,V([-4.7,1,-4.1],[2,2,6.5],34)],"reservoir",[[0,.28],[.57,.57],[1,.7]],
    [[0,P(-3.8,1.7,-2.9,-.21,1,"curious")],[.43,P(-3.92,1.38,-3.1,.2,.91,"curious")],[1,P(-4.2,1.65,-3.25,.09,1,"relief")]],
    still(H(-2.6,.79,-2.7)),dialogueLine("reservoir-1", "ae–eea"),[0.7,[55,60,67]]),
   stage("reservoir-2",5,[V([-5.2,.65,-4.3],[1.2,2.6,7],37),V([-4.6,-.4,-3.8],[1.2,2.8,7.1],36)],"reservoir",[[0,.68],[.38,.81],[1,.88]],
    [[0,P(-4.09,1.46,-3,.12,.95,"relief")],[.51,P(-3.6,1.82,-3.4,-.19,1.06,"bright")],[1,P(-3.65,1.29,-3.4,.12,.88,"relief")]],
    [[0,H(-2.67,1,-2.77)],[.6,P(-4.05,.42,-2.05,-.24,1,"curious")],[1,H(-4.71,.19,-2.1)]],
    dialogueLine("reservoir-2", "oaee–aa–eeoa")),
   stage("reservoir-3",6,[V([-3.2,-.18,-2.3],[2.5,2.7,5.7],37),V([-3.25,-.85,-3],[2,2.2,5.7],34)],"flow",fixed(.71),
    [[0,P(-2.55,1.21,-1.5,.24,.95,"curious")],[.45,P(-3.21,.52,-1.81,.38,1.13,"curious")],[1,P(-3.5,.16,-2.08,0,1,"resolve")]],
    [[0,H(-3.8,.43,-1.6)],[1,H(-4.01,-.2,-2.68)]],
    dialogueLine("reservoir-3", "ea–oe–aa–ee"),[2,[62,67,74]]),
  ],
 },
 "story-directive":{
  id:"stability-directive",title:filmContent["story-directive"].title,chapter:aero,stage:3,next:"aero-4",
  shots:[
   stage("directive-1",4,[terminal,V([4.1,1.65,.13],[.8,1.05,5.1],32)],"terminal",[[0,.46],[1,.6]],
    [[0,P(2.5,1.32,.81,-.14,.97,"curious")],[.57,P(3.02,1.67,.7,.26,1,"curious")],[1,P(3.13,1.69,.69,.17,.92,"resolve")]],
    still(H(1.9,.83,.7)),dialogueLine("directive-1", "ae–oo–ee"),[1.35,[58,64]]),
   stage("directive-2",5,[V([4.3,1.81,.49],[.4,.8,4.5],33)],"terminal",[[0,.6],[.12,.79],[.24,.46],[1,.68]],
    [[0,P(3.15,1.63,.79,.22,1,"curious")],[.45,P(3,1.82,.9,-.24,1.17,"afraid")],[1,P(2.91,1.52,.97,-.06,.87,"downcast")]],
    still(H(2.3,.84,1)),dialogueLine("directive-2"),[0.55,[46,53,59]]),
   stage("directive-3",5,[V([2.55,1.45,1.23],[.4,.55,4.65],36),V([2.55,1.36,1.23],[.6,.48,4.15],33)],"fracture",[[0,.65],[.8,.22],[1,.3]],
    [[0,P(2.8,1.59,1.2,.15,1,"curious")],[.27,P(2.64,1.52,1.2,-.07,.94,"downcast")],[.61,P(2.45,1.53,1.54,-.31,1.09,"afraid")],[1,P(2.35,1.4,1.45,-.17,.89,"afraid")]],
    [[0,H(1.44,.94,1.34)],[1,H(1.69,.91,1.44)]],
    dialogueLine("directive-3", "eaee–oe–aa")),
   stage("directive-4",5,[V([3.85,1.55,.35],[.68,1.0,5.6],35),V([3.72,1.52,.51],[.55,.7,4.8],33)],"fracture",[[0,.25],[.48,.4],[1,.11]],
    [[0,P(3.08,1.47,1.14,-.16,.88,"afraid")],[.39,P(2.7,1.28,1.4,-.32,.86,"downcast")],[1,P(2.79,1.61,1.54,.13,1,"resolve")]],
    still(H(2,.82,1.2)),dialogueLine("directive-4", "oo–eea–eeo"),[2.25,[41,48,54]]),
  ],
 },
 "story-memory":{
  id:"lumas-memory",title:filmContent["story-memory"].title,chapter:aero,stage:4,next:"story-survey",
  shots:[
   stage("memory-1",5,[relay,V([4.25,1.65,-3],[1.6,1.25,6],34)],"relay",[[0,.45],[.22,.76],[.53,.8],[1,.8]],
    [[0,P(3.3,1.58,-2.99,.12,1,"bright")],[.45,P(3.66,1.9,-2.81,.19,1.1,"curious")],[.72,P(3.67,1.92,-2.79,0,1,"downcast"),true],[1,P(3.67,1.91,-2.79,0,1,"downcast")]],
    still(H(2.63,.86,-2.25)),dialogueLine("memory-1", "ae–oo"),[0.7,[60,67,71,76]]),
   stage("memory-2",4,[vista,V([2,1.6,-3.5],[6,4.5,10],37)],"memory",fixed(1),
    [[0,P(-4,1.3,-2.5,.24,.95,"bright")],[.45,P(.1,2.25,-4.4,-.19,1.15,"bright")],[1,P(4.6,1.5,-4.1,.16,1,"bright")]],
    [[0,H(-5,.85,-1.9)],[.64,H(-1.2,1.7,-4)],[1,H(3,1.1,-3.3)]],
    dialogueLine("memory-2", "eea–oe–ea"),[1,[60,67,71,76]]),
   stage("memory-3",4,[V([3.5,1.55,-2.45],[.9,.65,4.6],32)],"relay",fixed(.8),
    [[0,P(3.62,1.9,-2.37,0,1,"downcast")],[.35,P(3.65,1.56,-2.36,-.24,.82,"downcast")],[.78,P(3.63,1.62,-2.34,.18,.91,"curious")],[1,P(3.6,1.67,-2.32,.05,1,"resolve")]],
    [[0,H(2.64,.78,-2.36)],[.44,P(2.71,1.23,-2.3,.1,1.2,"bright")],[1,H(2.73,.84,-2.32)]],
    dialogueLine("memory-3", "oa–ee–aa")),
   stage("memory-4",6,[V([2,1.7,-3.85],[4.6,3,8.6],39),crown],"signal",fixed(.83),
    [[0,P(3.55,1.6,-2.3,.03,1,"curious")],[.37,P(3.18,1.9,-2.7,-.25,1.1,"resolve")],[1,P(.33,2.2,-4.9,.14,1,"resolve")]],
    [[0,H(2.6,1,-2.65)],[1,H(.86,1.1,-4.7)]],dialogueLine("memory-4", "ae–aa"),[2.3,[55,62,67]]),
  ],
 },
 "story-survey":{
  id:"crown-survey",title:filmContent["story-survey"].title,chapter:aero,stage:4,next:"aero-5",
  shots:[
   stage("survey-1",5,[V([-.3,1,-2.7],[8.5,6.5,12],42)],"survey",fixed(.25),
    [[0,P(-3.6,1.6,.8,.07,.93,"resolve")],[1,P(-2.32,1.87,-1.16,.09,1,"curious")]],still(H(-2,.65,1.2)),dialogueLine("survey-1", "ee–aa–oe")),
   stage("survey-2",5,[V([-2,1,-1.3],[2,2.8,6.5],35)],"survey",[[0,.23],[.55,.45],[1,.55]],
    [[0,P(-3.16,1.38,-.82,-.14,.94,"resolve")],[.42,P(-2.78,1.85,-1.35,.25,1.12,"curious")],[1,P(-2.7,1.6,-1.52,.13,1,"bright")]],
    still(H(-1.4,.71,-.4)),dialogueLine("survey-2", "eea–oa–ee")),
   stage("survey-3",5,[relay,V([3.9,1.33,-4.5],[2.1,2.3,6],33)],"relay",[[0,.37],[1,.72]],
    [[0,P(2.94,1.3,-3.2,.12,1,"resolve")],[.6,P(3.52,2.03,-3.64,-.25,1.13,"curious")],[1,P(3.05,1.61,-3.96,-.1,1,"resolve")]],
    [[0,H(1.82,.88,-2.95)],[1,H(2.57,1.25,-3.37)]],dialogueLine("survey-3", "eeae–ee–oo"),[1.6,[57,64,69]]),
   stage("survey-4",4,[crown],"fracture",[[0,.76],[.4,.61],[.49,.33],[1,.36]],
    [[0,P(-2.23,1.87,-5.25,.14,.98,"resolve")],[.43,P(-2.42,2.02,-5.13,-.21,1.18,"afraid")],[1,P(-2.51,1.68,-5.2,-.15,.91,"resolve")]],
    still(H(-.29,1.23,-4.99)),dialogueLine("survey-4", "aaee–aa–ee")),
   stage("survey-5",4,[close,landing],"spark",fixed(.46),
    [[0,P(-1.29,1.42,1.1,-.16,.9,"afraid")],[.47,P(-1.3,1.82,1.15,.21,1.12,"resolve")],[1,P(-1.58,1.73,1.05,0,1,"relief")]],
    [[0,H(.05,.71,.91)],[.45,P(-.04,1.18,.92,-.2,1.2,"resolve")],[1,H(.08,.94,.83)]],
    dialogueLine("survey-5", "eea–oe"),[2.45,[60,65,67,72]]),
  ],
 },
 "story-restored":{
  id:"water-returns",title:filmContent["story-restored"].title,chapter:aero,stage:5,next:"story-eco",
  shots:[
   stage("restored-1",3,[landing,crown],"restore",[[0,.52],[.45,.68],[1,.9]],
    [[0,P(-1.3,1.8,.55,.21,.9,"curious")],[.52,P(-1.56,1.58,-2.4,-.19,1.1,"resolve")],[1,P(-1.39,2,-4.75,.16,1,"afraid")]],
    [[0,H(1,.6,.65)],[.55,P(.2,1.14,-1.7,.25,1.27,"bright")],[1,H(.27,1.46,-4.51)]],
    dialogueLine("restored-1", "eea––eea––oo"),[0.85,[52,55,60,64]]),
   stage("restored-2",5,[crown,V([-.6,2.92,-6.3],[3.8,2.7,8.8],34)],"restore",[[0,.69],[.19,.91],[.45,1],[1,1]],
    [[0,P(-2.34,1.9,-4.74,-.15,.92,"curious")],[.23,P(-2.7,2.48,-4.39,-.33,1.14,"afraid")],[.5,P(-2.49,2.64,-4.58,.16,1.18,"bright")],[1,P(-2.2,2.22,-4.78,.16,1.02,"relief")]],
    [[0,H(.2,1.22,-4.55)],[.55,P(.35,1.93,-4.39,.14,1.26,"bright")],[1,H(.57,1.63,-4.4)]],
    dialogueLine("restored-2", "ee–eea–oa"),[1.75,[60,64,67,72,76]]),
   stage("restored-3",4,[close,V([-.71,1.3,1.13],[.6,.82,4.23],36)],"flow",fixed(1),
    [[0,P(-1.4,1.52,1.14,-.13,.9,"downcast")],[.43,P(-1.1,1.42,1.05,.16,.93,"relief")],[1,P(-1.02,1.61,1.08,.12,1.06,"relief")]],
    [[0,H(.4,.94,1.12)],[.67,P(.15,1.05,1.08,-.1,1.13,"bright")],[1,H(.13,.96,1.06)]],
    dialogueLine("restored-3", "ao–ooa–aa–ee"),[1.8,[64,67,72]]),
   stage("restored-4",3,[V([5,1.7,-6],[4,3.1,9.6],38),V([7.6,2.1,-7.4],[3.9,2.4,8.2],36)],"signal",fixed(1),
    [[0,P(3.94,1.58,-3.66,.1,1,"relief")],[.38,P(4.31,2.08,-4.28,.25,1.21,"afraid")],[1,P(4.57,1.7,-4.7,.12,.95,"curious")]],
    still(H(3.02,1.05,-4.19)),dialogueLine("restored-4"),[0.55,[55,61,68]]),
   stage("restored-5",4,[V([3.15,1.65,-1.92],[2.6,2.16,7.15],37),V([3.75,1.6,-2.35],[3.8,2.42,8],38)],"signal",fixed(1),
    [[0,P(2.6,1.62,-1.08,-.13,.91,"afraid")],[.34,P(2.6,1.38,-1.03,.2,.91,"curious")],[1,P(4.86,1.89,-2.75,-.14,1,"resolve")]],
    [[0,H(1.67,.79,-.56)],[1,H(3.77,1.12,-2.25)]],
    dialogueLine("restored-5", "aa–eo–ee–oe"),[2.5,[60,64,69,76]]),
  ],
 },
 "story-eco":{
  id:"canopy-signal",title:filmContent["story-eco"].title,chapter:"Chapter 2 preview · In development",stage:5,next:"story-aero",
  shots:[
   stage("eco-1",6,[preview,V([.8,1.6,-1.6],[5.4,3.4,10],39)],"growth",fixed(.62),
    [[0,P(-3.12,1.68,.84,.11,.95,"curious")],[.61,P(-2.46,2.23,.45,-.04,1.1,"bright")],[1,P(-2.62,1.87,.05,.21,1,"curious")]],
    [[0,H(-2,.79,.88)],[1,H(-1.52,1.18,.95)]],dialogueLine("eco-1", "oo–eea–ee"),[.4,[55,62,69,74]]),
   stage("eco-2",6,[V([-.45,.68,-.6],[3.1,2.0,6.4],35),V([-.2,.93,-.95],[2.1,1.8,5.75],33)],"growth",[[0,.48],[.32,.89],[.44,.22],[.6,.34],[1,.29]],
    [[0,P(-2.13,1.45,-.02,.27,1,"curious")],[.38,P(-1.96,1.31,-.14,.35,.91,"curious")],[.57,P(-2.48,1.87,.17,-.32,1.16,"afraid")],[1,P(-2.42,1.64,.25,-.16,.91,"downcast")]],
    [[0,H(-.9,.64,.6)],[.42,H(-.59,.94,.4)],[1,H(-.66,.67,.51)]],
    dialogueLine("eco-2", "eea–oo"),[2.4,[48,54]]),
   stage("eco-3",6,[V([2.5,1.7,-2.5],[2.4,1.8,7.8],34),V([2.5,2.82,-3.4],[3.2,2.1,7.65],33)],"fracture",fixed(.27),
    [[0,P(1.13,1.69,-.6,.11,1,"afraid")],[.46,P(.76,1.32,-.54,-.18,.86,"downcast")],[1,P(.94,1.57,-.75,.17,1,"resolve")]],
    still(H(.14,.82,-.3)),dialogueLine("eco-3", "oo–ee"),[3.6,[43,50,55]]),
   stage("eco-4",3,[preview],"silence",fixed(.3),
    still(P(-2.7,1.8,.3,0,1,"resolve")),still(H(-1.72,.97,.63))),
  ],
 },
} as const satisfies Record<string,Film>;

export type FilmRoute = keyof typeof films;
export const isFilmRoute=(route:string):route is FilmRoute=>Object.hasOwn(films,route);
export const sceneIds=Object.values(films).map(film=>film.id);
export const aftermath=["story-beacon","story-reservoir","story-directive","story-memory","story-restored"] as const;
