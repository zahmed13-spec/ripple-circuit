export const milestones = [
  {name:"Dormant", landmark:"Aqueduct offline", detail:"Only residual flow reaches the islands."},
  {name:"First Spark", landmark:"Landing Beacon", detail:"A signal reaches the first island."},
  {name:"Water Returns", landmark:"Glass Reservoir", detail:"Water spills from the reservoir into the Current."},
  {name:"Hidden Connection", landmark:"Observation Terminal", detail:"The terminal traces a concealed branch of the network."},
  {name:"Aqueduct Awakening", landmark:"Relay Turbine", detail:"The turbine turns and the Crown begins to pulse."},
  {name:"Aero Haven Restored", landmark:"Aqueduct Crown", detail:"The Crown sends a live signal to Eco Canopy."},
] as const;

export type Mood = "idle" | "curious" | "surprised" | "focused" | "concerned" | "remembering" | "reassuring" | "celebrating";
type Shot = { position: readonly [number,number,number]; focus: readonly [number,number,number]; zoom: number };
export const shots = {
  vista:{position:[13,12,20],focus:[0,1,-2],zoom:1.3},
  crown:{position:[8,8,10],focus:[3,1.6,-6],zoom:2.2},
  spark:{position:[-2,6,10],focus:[-3.1,1,0],zoom:2.7},
  terrace:{position:[10,16,17],focus:[0,.5,0],zoom:1.4},
  signal:{position:[20,10,9],focus:[9,1.4,-4.4],zoom:2.2},
  canopy:{position:[12,11,16],focus:[0,1.3,-3],zoom:1.45},
  intake:{position:[-1,9,12],focus:[0,0,-3.3],zoom:2},
  relay:{position:[9,12,13],focus:[0,0,0],zoom:1.85},
  finalGate:{position:[10,8,17],focus:[0,0,3.3],zoom:2},
} as const satisfies Record<string,Shot>;

type Beat = {
  label: string;
  text: string;
  mood: Mood;
  shot: keyof typeof shots;
  stage: number;
  signal?: "fracture" | "spark" | "echo" | "warning";
  focusLuma?: boolean;
};

export const sequences = {
  "story-intro":{
    id:"first-spark", title:"The Last Spark", chapter:"Aero Haven", next:"Play A New Ripple",
    beats:[
      {label:"Before the silence",text:"Before the silence, every island carried a little piece of the Current. I used to follow the water home.",mood:"remembering",shot:"vista",stage:5},
      {label:"The fracture",text:"Then the connections started disappearing. The aqueduct went quiet. I waited for the lights to come back.",mood:"concerned",shot:"crown",stage:0,signal:"fracture"},
      {label:"The last spark",text:"Wait… something is still moving. Can you hear me? My name is Luma.",mood:"surprised",shot:"spark",stage:0,signal:"spark",focusLuma:true},
      {label:"The first connection",text:"That receiver has been dark for a long time. Try sending your ripple toward it. I'll stay here with you.",mood:"reassuring",shot:"terrace",stage:0,focusLuma:true},
    ],
  },
  "story-restored":{
    id:"water-returns",title:"The Water Returns",chapter:"Aero Haven",next:"Preview Eco Canopy",
    beats:[
      {label:"The last gate",text:"Intake, relay, crown. All three answered. Listen for the water.",mood:"focused",shot:"crown",stage:4},
      {label:"The Current returns",text:"We brought it back. Look at the crystal. The islands are lighting up all the way to the canopy.",mood:"celebrating",shot:"vista",stage:5},
      {label:"A reply",text:"That pulse came back green. Something across the canopy is answering us.",mood:"surprised",shot:"signal",stage:5,signal:"echo"},
    ],
  },
  "story-survey":{
    id:"crown-survey",title:"Survey the Aqueduct",chapter:"Aero Haven",next:"Play Guardian of the Aqueduct",
    beats:[
      {label:"Intake",text:"This is where the water enters. Roll the first marble across the intake plate to open a path to the relay.",mood:"focused",shot:"intake",stage:4},
      {label:"Relay",text:"The second channel can only flow when the intake wakes. Send the next marble through its plate.",mood:"remembering",shot:"relay",stage:4},
      {label:"Crown",text:"Once the relay answers, the last route opens. We need all three plates and all three receivers.",mood:"reassuring",shot:"finalGate",stage:4},
    ],
  },
  "story-eco":{
    id:"canopy-signal",title:"Eco Canopy",chapter:"Chapter 2 preview · In development",next:"Return to Aero Haven",
    beats:[
      {label:"First contact",text:"The water reached the canopy. Look at the old greenhouses. Something inside is answering.",mood:"curious",shot:"canopy",stage:3,signal:"echo"},
      {label:"Uncontrolled growth detected",text:"I don't think the forest is asleep anymore. I think it's being held still.",mood:"concerned",shot:"crown",stage:3,signal:"warning"},
    ],
  },
} as const satisfies Record<string,{id:string;title:string;chapter:string;next:string;beats:readonly Beat[]}>;
export type SceneRoute = keyof typeof sequences;
export const sceneIds = Object.values(sequences).map(scene => scene.id);

export const circuits = [
  {before:"That little receiver can't hear the Current anymore. Try sending your ripple behind the marble.",after:"It worked. You actually woke it up.",mood:"surprised", clue:"The Last Spark", fragment:"A single receiver re-established a path through the Landing Beacon.",icon:"beacon"},
  {before:"The water remembers its path. It just needs a little help to reach the reservoir.",after:"There it goes. I almost forgot how the reservoir sounded.",mood:"celebrating",clue:"The Dormant Aqueduct",fragment:"The Glass Reservoir still held enough water to feed the islands.",icon:"water"},
  {before:"There’s a mark on the lower channel. I can almost read it from here.",after:"Interrupted? That's strange. Someone told the water to stop.",mood:"concerned",clue:"Stability Directive",fragment:"STABILITY DIRECTIVE: FLOW INTERRUPTED.",icon:"terminal"},
  {before:"These paths depend on each other. We have to wake them in the right order.",after:"I remember this sound. It used to mean everything was connected.",mood:"remembering",clue:"Luma’s Memory",fragment:"The relay chime belonged to the old network. Luma remembers the sound, though its source is still unfamiliar.",icon:"relay"},
  {before:"Intake feeds the relay. The relay feeds the crown. I remember the pattern… and I don't remember why it frightens me.",after:"We brought the water back. Did you see the green light?",mood:"celebrating",clue:"The Eco Signal",fragment:"The Crown received a return pulse from Eco Canopy, then a warning about uncontrolled growth.",icon:"canopy"},
] as const satisfies readonly {before:string;after:string;mood:Mood;clue:string;fragment:string;icon:string}[];

export const archiveEntries = (stage:number) => circuits.slice(0,Math.max(0,Math.min(stage,circuits.length)));
