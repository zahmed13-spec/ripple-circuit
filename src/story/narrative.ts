import { levelContent } from "../content";

export const milestones = levelContent.milestones;

export type Mood = "idle" | "curious" | "surprised" | "focused" | "concerned" | "remembering" | "reassuring" | "celebrating";
const moods = ["surprised","celebrating","concerned","remembering","celebrating"] as const;
const icons = ["beacon","water","terminal","relay","canopy"];
export const circuits = levelContent.levels.map((level,i)=>({...level,mood:moods[i],icon:icons[i]}));

export const archiveEntries = (stage:number) => circuits.slice(0,Math.max(0,Math.min(stage,circuits.length)));
