import { characterContent, worldContent } from "../../content";
import { expansionWorlds, type ExpansionWorld } from "../chapters";
import type { Film, Pose, Shot, Vec3 } from "./boards";
import { scripts } from "./expansion-dialogue";

export type ExpansionFilmRoute = `story-${ExpansionWorld}-${"opening"|1|2|3|4|5}`;
export const expansionRoute = (world:ExpansionWorld, number:number) =>
  `story-${world}-${number||"opening"}` as ExpansionFilmRoute;
const effects: Record<ExpansionWorld, [Shot["effect"],Shot["effect"]]> = {
  eco:["growth","flow"],terra:["relay","restore"],metro:["survey","relay"],null:["fracture","signal"],
};

function authoredFilm(world:ExpansionWorld, chapter:number, chapterPosition:number): Film {
  const [title, ...lines] = scripts[world][chapterPosition];
  const opening = chapterPosition === 0;
  const restored = chapterPosition === 5;
  const ending = restored && world === "null";
  const route = expansionRoute(world,chapterPosition);
  const window = opening ? [11,10,10] : ending ? [11,11,12] : [5,6,7];
  const color = effects[world];
  const base:Vec3 = world==="eco" ? [-1,.9,-1] : world==="terra" ? [-.7,1.7,-5.2] :
    world==="metro" ? [3.4,1.5,-3.4] : [2.9,1.75,.15];
  const focus:Vec3 = [base[0]+[0,-.48,.3,-.17,.47,0][chapterPosition],base[1]+(restored?.28:0),base[2]+[0,.26,-.54,.38,-.46,0][chapterPosition]];
  const pose=(x:number,y:number,z:number,emotion:Pose[5],roll=0):Pose=>[x,y,z,roll,1,emotion];
  const [x,y,z] = focus;
  const shots:Shot[] = [{
    id:route+"-arrival",label:opening?"Arrival":"The circuit answers",seconds:window[0],
    lens:[[focus,[4.7,3.8,9.4],40],[focus,[3.2,2.2,7.1],36]],
    luma:[[0,pose(x-1.6,y+.48,z+1.65,"curious")],[.55,pose(x-1.13,y+.7,z+1.45,"bright",-.16)],[1,pose(x-.9,y+.66,z+1.36,"relief")]],
    ripple:[[0,pose(x+.2,y-.35,z+1.18,"neutral")],[1,pose(x+.55,y+.1,z+.78,"bright",.2)]],
    power:[[0,opening?.22:.33],[.53,.62],[1,.75]],effect:color[0],
    cue:[.5,[55,62,67]],
  },{
    id:route+"-response",label:world==="null"?"An echo from NULL":"Luma listens",seconds:window[1],
    lens:[[[x-1.15,y+.66,z+1.43],[.72,.42,5.1],36],[[x-1.48,y+.7,z+1.52],[.95,.62,5.2],35]],
    luma:[[0,pose(x-.94,y+.64,z+1.43,"curious")],[.34,pose(x-1.33,y+.55,z+1.5,world==="null"?"afraid":"downcast",-.22)],[1,pose(x-1.45,y+.77,z+1.48,"resolve",.1)]],
    ripple:[[0,pose(x+.22,y-.08,z+1.18,"neutral")],[1,pose(x-.3,y+.12,z+1.1,"bright",-.14)]],
    power:[[0,.63],[.44,.42],[1,.74]],effect:color[1],
  },{
    id:route+"-resolve",label:ending?"The world moves again":restored?"Restoration":"The next connection",seconds:window[2],
    lens:[[focus,[3.7,2.7,7.6],39],[[x+.3,y+.3,z-1.25],[6.6,4.8,12.3],43]],
    luma:[[0,pose(x-1.42,y+.77,z+1.48,"resolve")],[.41,pose(x-1.12,y+1,z+1.26,"bright",.24)],[1,pose(x-.65,y+.62,z+.7,"relief")]],
    ripple:[[0,pose(x-.25,y+.12,z+1.1,"neutral")],[.52,pose(x+.8,y+.52,z+.43,"bright",.3)],[1,pose(x+1.1,y+.16,z-.17,"neutral")]],
    power:[[0,.64],[.36,.88],[1,restored?1:.85]],effect:restored?"restore":color[1],
    cue:[1,[60,67,72,76]],
  }];
  shots.forEach((shot,i)=>{shot.line={id:shot.id,speaker:characterContent.Luma.name,text:lines[i],in:.48,out:shot.seconds-.26,mouths:"aeo–ee–oa"};});
  if(ending)shots.push({
    id:route+"-home",label:"Across the restored Current",seconds:6,
    lens:[[[0,1.55,-2],[6.6,4.4,10.7],41],[[0,1,-2.3],[10.3,6.7,13],42]],
    luma:[[0,pose(-2.9,1.55,.6,"relief")],[1,pose(-1.7,1.86,-.65,"bright")]],
    ripple:[[0,pose(-1.6,.73,.7,"neutral")],[1,pose(-.8,1.21,-.43,"bright")]],
    power:[[0,1]],effect:"flow",cue:[.15,[60,64,67,74]],
  });
  const next = ending ? "story" : restored ? expansionRoute(expansionWorlds[chapter+1],0) : `${world}-${chapterPosition+1}`;
  return {id:route,title,chapter:worldContent[world].title,stage:(chapter+1)*5+chapterPosition,next,shots,world};
}

export const expansionFilms = Object.fromEntries(expansionWorlds.flatMap((world,chapter)=>
  scripts[world].map((_,index)=>[expansionRoute(world,index),authoredFilm(world,chapter,index)]),
)) as Record<ExpansionFilmRoute,Film>;
