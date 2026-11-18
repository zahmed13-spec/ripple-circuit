import { themes } from "./themes";

const aeroIds = ["aero-1", "aero-2", "aero-3", "aero-4", "aero-5"] as const;
export type StoryId = typeof aeroIds[number];
export type StoryChapter = {
  id: string;
  title: string;
  subtitle: string;
  theme: keyof typeof themes;
  objective: string;
  levelIds: readonly StoryId[];
  requires?: string;
  opening?: string;
  closing?: string;
  mechanic: string;
};
export const chapters: readonly StoryChapter[] = [
  {id:"aero",title:"Aero Haven",subtitle:"The aqueduct has gone quiet.",theme:"aero",objective:"Reconnect the water network and light the central crystal.",levelIds:aeroIds,opening:"first-spark",closing:"water-returns",mechanic:"Directional water currents"},
  {id:"eco",title:"Eco Canopy",subtitle:"A botanical network waits for power.",theme:"eco",objective:"Wake the forest and reconnect its living architecture.",levelIds:[],requires:"aero",mechanic:"Living bridges"},
  {id:"terra",title:"Terra Core",subtitle:"The deep stabilizers are off balance.",theme:"terra",objective:"Restore the gravitational stabilizer.",levelIds:[],requires:"eco",mechanic:"Gravity control"},
  {id:"metro",title:"Metro Pulse",subtitle:"The transit grid has lost its rhythm.",theme:"metro",objective:"Bring the transit circuits back into sync.",levelIds:[],requires:"terra",mechanic:"Timed machinery"},
  {id:"null",title:"The Null Zone",subtitle:"Something is still listening in the dark.",theme:"null",objective:"Discover NULL's origin and reconnect the Current.",levelIds:[],requires:"metro",mechanic:"Corrupted circuits"},
];
export const aero = chapters[0];
export const isStoryId = (value: string): value is StoryId => aeroIds.some(id => id === value);
export const storyLink = (id: StoryId) => `?c=st4-${id}#story-play`;
