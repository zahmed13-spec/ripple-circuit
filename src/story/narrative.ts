export const milestones = [
  {name:"Dormant", landmark:"Aqueduct offline", detail:"Only residual flow reaches the islands."},
  {name:"First Spark", landmark:"Landing Beacon", detail:"A signal reaches the first island."},
  {name:"Water Returns", landmark:"Glass Reservoir", detail:"Water spills from the reservoir into the Current."},
  {name:"Hidden Connection", landmark:"Observation Terminal", detail:"The terminal traces a concealed branch of the network."},
  {name:"Aqueduct Awakening", landmark:"Relay Turbine", detail:"The turbine turns and the Crown begins to pulse."},
  {name:"Aero Haven Restored", landmark:"Aqueduct Crown", detail:"The Crown sends a live signal to Eco Canopy."},
] as const;

export type Mood = "idle" | "curious" | "surprised" | "focused" | "concerned" | "remembering" | "reassuring" | "celebrating";
export const circuits = [
  {before:"That little receiver can't hear the Current anymore. Try sending your ripple behind the marble.",after:"It worked. You actually woke it up.",mood:"surprised", clue:"The Last Spark", fragment:"A single receiver re-established a path through the Landing Beacon.",icon:"beacon"},
  {before:"The water remembers its path. It just needs a little help to reach the reservoir.",after:"There it goes. I almost forgot how the reservoir sounded.",mood:"celebrating",clue:"The Dormant Aqueduct",fragment:"The Glass Reservoir still held enough water to feed the islands.",icon:"water"},
  {before:"There’s a mark on the lower channel. I can almost read it from here.",after:"Interrupted? That's strange. Someone told the water to stop.",mood:"concerned",clue:"Stability Directive",fragment:"STABILITY DIRECTIVE: FLOW INTERRUPTED.",icon:"terminal"},
  {before:"These paths depend on each other. We have to wake them in the right order.",after:"I remember this sound. It used to mean everything was connected.",mood:"remembering",clue:"Luma’s Memory",fragment:"The relay chime belonged to the old network. Luma remembers the sound, though its source is still unfamiliar.",icon:"relay"},
  {before:"Intake feeds the relay. The relay feeds the crown. I remember the pattern… and I don't remember why it frightens me.",after:"We brought the water back. Did you see the green light?",mood:"celebrating",clue:"The Eco Signal",fragment:"The Crown received a return pulse from Eco Canopy, then a warning about uncontrolled growth.",icon:"canopy"},
] as const satisfies readonly {before:string;after:string;mood:Mood;clue:string;fragment:string;icon:string}[];

export const archiveEntries = (stage:number) => circuits.slice(0,Math.max(0,Math.min(stage,circuits.length)));
