import * as T from "three";
import type { Arena3D } from "../scene/arena";
import type { WorldTheme } from "./themes";

export const landmarkPositions = [
  [-6.9,.7,-5.4],[-4.2,.2,-7.1],[6.4,.3,-3.5],[.1,.3,-7.2],[3.1,.28,-6.5],
] as const;
type Shape = "deck" | "tube" | "cube" | "ring" | "lens" | "gem" | "globe";
type Light = {mesh:T.Mesh; stage:number};
type Link = {start:T.Vector3; end:T.Vector3; carrier:T.Mesh; stage:number};
const vector = (p:readonly [number,number,number]) => new T.Vector3(...p);

export class Landmarks {
  private geometry = new Map<Shape,T.BufferGeometry>();
  private glow:Light[]=[];
  private routes:Link[]=[];
  private quietParts:T.Mesh[]=[];
  private crystal?:T.Mesh;
  private turbine?:T.Group;
  private spill?:T.Mesh;
  private fracture?:T.Mesh;
  private wave?:T.Mesh;
  private waveAge=10;
  private displayStage=0;
  private signal="";
  private energyInk:T.MeshBasicMaterial;
  private ink = new Map<string,T.MeshPhysicalMaterial>();
  private sunStart:T.Vector3;
  private phase=0;

  constructor(private arena:Arena3D,private root:T.Group,private theme:WorldTheme) {
    this.energyInk=arena.own(new T.MeshBasicMaterial({color:"#d7ffeb"}));
    this.sunStart=arena.sun.position.clone();
    if(theme.id==="eco") this.eco();
    else this.aero();
  }
  private shape(kind:Shape) {
    const existing=this.geometry.get(kind);
    if(existing)return existing;
    const geo = {
      deck:()=>new T.CylinderGeometry(1,.59,1,10),
      tube:()=>new T.CylinderGeometry(1,1,1,12),
      cube:()=>new T.BoxGeometry(1,1,1),
      ring:()=>new T.TorusGeometry(1,.08,6,26),
      lens:()=>new T.SphereGeometry(1,18,12,0,2*Math.PI,0,Math.PI/2),
      gem:()=>new T.OctahedronGeometry(1),
      globe:()=>new T.SphereGeometry(1,12,8),
    }[kind]();
    this.geometry.set(kind,this.arena.own(geo));
    return geo;
  }
  private material(color:string,opacity=1,unique=false) {
    const key=color+":"+opacity;
    const cached=this.ink.get(key);
    if(cached&&!unique)return cached;
    const material=this.arena.own(new T.MeshPhysicalMaterial({
      color,roughness:.25,clearcoat:.65,metalness:.12,transparent:opacity<1,opacity,depthWrite:opacity===1,
    }));
    if(!unique)this.ink.set(key,material);
    return material;
  }
  private part(kind:Shape,pos:readonly [number,number,number],scale:readonly [number,number,number],color:string,options:{opacity?:number;power?:number;parent?:T.Group}={}) {
    const mesh=new T.Mesh(this.shape(kind),this.material(color,options.opacity,options.power!==undefined));
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.receiveShadow=false;
    (options.parent??this.root).add(mesh);
    if(options.power!==undefined)this.glow.push({mesh,stage:options.power});
    return mesh;
  }
  private island(x:number,y:number,z:number,r:number,stage:number,color="#d9f9ed") {
    this.part("deck",[x,y-.48,z],[r,.88,r],color);
    const edge=this.part("ring",[x,y,z],[r*.94,r*.94,.58],this.theme.dormant,{power:stage});
    edge.rotation.x=-Math.PI/2;
  }
  private lead(a:readonly [number,number,number],b:readonly [number,number,number],stage:number,concealed=false) {
    const start=vector(a),end=vector(b),mid=start.clone().lerp(end,.5);
    const link=this.part("tube",mid.toArray(),[.058,start.distanceTo(end),.058],this.theme.dormant,{power:stage});
    link.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());
    if(concealed)this.quietParts.push(link);
    const carrier=new T.Mesh(this.shape("globe"),this.energyInk);
    carrier.scale.setScalar(.13);
    this.root.add(carrier);
    this.routes.push({start,end,carrier,stage});
  }
  private aero() {
    const [beacon,reservoir,terminal,relay,crown]=landmarkPositions;
    this.island(...beacon,1.65,1);
    this.part("deck",[-6.9,1.08,-5.4],[.45,.63,.45],"#6f9ea8");
    this.part("gem",[-6.9,1.65,-5.4],[.38,.56,.38],"#8dadb7",{power:1});
    this.island(...reservoir,1.9,2);
    this.part("tube",[-4.2,.61,-7.1],[1.23,.79,1.23],"#2d8997",{opacity:.50});
    this.part("lens",[-4.2,.98,-7.1],[1.34,.92,1.34],"#d3fff1",{opacity:.43});
    this.part("tube",[-4.2,.38,-7.1],[1.08,.37,1.08],"#079bab",{power:2});
    this.spill=this.part("tube",[-4.2,-1.15,-6.05],[.18,3.4,.10],"#84f2fa",{opacity:.53});
    this.island(...terminal,1.3,3);
    const console=this.part("cube",[6.4,1,-3.5],[.86,.65,.27],"#374d69");
    console.rotation.x=-.35;
    const panel=this.part("cube",[6.4,1.035,-3.34],[.63,.36,.055],"#626583",{power:3});
    panel.rotation.x=-.35;
    this.part("cube",[7.05,.54,-3.9],[.65,.14,.45],"#264e68").rotation.z=.42;
    this.island(...relay,1.26,4);
    this.turbine=new T.Group();
    this.turbine.position.set(.1,1,-7.2);
    this.root.add(this.turbine);
    this.part("ring",[0,0,0],[.72,.72,.65],"#376880",{parent:this.turbine,power:4});
    for(let i=0;i<5;i++){
      const blade=this.part("cube",[0,0,0],[.13,.67,.08],"#6daeb3",{parent:this.turbine});
      blade.rotation.z=i*Math.PI/5;
    }
    this.island(...crown,1.62,5,"#d2e9ee");
    const halo=this.part("ring",[3.1,1.18,-6.5],[1.05,1.05,.8],"#547d93",{power:4});
    halo.rotation.set(.4,.2,-.23);
    this.crystal=this.part("gem",[3.1,1.74,-6.5],[.65,1.06,.65],"#52899d",{power:5});
    this.part("deck",[9.3,.3,-4.4],[1.2,.7,1.2],"#80aeb2");
    this.part("gem",[9.3,1,-4.4],[.39,.6,.39],"#569368",{power:5});
    this.lead(beacon,reservoir,1);
    this.lead(reservoir,relay,2);
    this.lead(terminal,relay,3,true);
    this.lead(relay,crown,4);
    this.lead(crown,[9.3,1,-4.4],5);
    this.fracture=this.part("gem",[9.35,1.4,-4.4],[.95,.65,.24],"#382e60",{opacity:.55});
    this.fracture.rotation.z=.65;
    this.wave=this.part("ring",[3.1,-.38,-6.5],[1,1,.3],"#9bffe0",{opacity:.68});
    this.wave.rotation.x=-Math.PI/2;
  }
  private eco() {
    this.island(0,.2,-3,3.3,1,"#b2d78c");
    this.island(-5,.4,-.6,2.35,2,"#d4e9ab");
    this.island(5,.3,-1.2,2.25,3,"#c2df96");
    for(const [x,z] of [[-5,-.6],[5,-1.2]]) {
      this.part("deck",[x,.58,z],[1.7,.3,1.7],"#e2f5b8");
      this.part("lens",[x,.72,z],[1.6,1.7,1.33],"#d4fff1",{opacity:.45});
      for(let i=-1;i<=1;i++)this.part("globe",[x+i*.7,.94,z],[.47,.6,.57],i===0?"#65a14b":"#49824d");
      const solar=this.part("cube",[x,.98,z+1.7],[1.04,.11,.6],"#488a8f");
      solar.rotation.x=.4;
    }
    this.part("tube",[0,1.8,-3],[.32,3.15,.32],"#5d7851");
    for(let i=0;i<7;i++){
      const angle=i*2.4;
      this.part("globe",[Math.cos(angle)*1.5,3.1+i*.16,-3+Math.sin(angle)*1.37],[1.03,.61,.86],i%2?"#7dbb52":"#acd66b");
    }
    this.crystal=this.part("gem",[0,3.8,-3],[.56,.91,.56],"#8bc66c",{power:3});
    this.lead([-4,.39,-.6],[-2.95,.45,-1.3],5);
    this.lead([3,.49,-2.9],[4,.42,-1.7],5);
    for(let i=0;i<4;i++)this.part("deck",[-1.95+i*.44,.49,1.3],[.28,.12,.3],"#527b52").rotation.z=i*.09;
    this.fracture=this.part("gem",[1.8,3.9,-4.3],[.6,.84,.28],"#534976",{opacity:.58});
  }

  setPhase(phase:number) {
    this.phase=phase;
  }
  set(stage:number,signal:string) {
    const was=this.displayStage;
    this.displayStage=stage;
    this.signal=signal;
    if (was<5&&stage===5) this.waveAge=0;
    for (const {mesh,stage:threshold} of this.glow) {
      const active=stage>=threshold;
      const material=mesh.material as T.MeshPhysicalMaterial;
      material.color.set(active ? this.theme.restored : this.theme.dormant);
      material.emissive.set(active ? this.theme.restored : "#000000");
      material.emissiveIntensity=active?.31:0;
    }
    for(const hidden of this.quietParts) hidden.visible=stage>=3;
    if(this.spill)this.spill.visible=stage>=2;
    if(this.fracture)this.fracture.visible=signal==="fracture"||signal==="warning";
    this.arena.sun.color.set(stage===5?"#fff0b7":this.theme.sunlight);
    this.arena.sun.position.copy(this.sunStart);
  }
  animate(dt:number,t:number,reduced:boolean,low:boolean) {
    this.waveAge+=dt;
    const stage=this.displayStage;
    if(this.crystal){
      this.crystal.rotation.y=reduced?.2:.2+t*(stage>=4?.52:.14);
      const material=this.crystal.material as T.MeshPhysicalMaterial;
      material.emissive.set(stage>=4 ? this.theme.restored : "#000000");
      material.emissiveIntensity=stage>=4?(stage===5?.95:.16+this.phase*.19)+(reduced?0:Math.sin(t*2.5)*.11):0;
    }
    if(this.turbine)this.turbine.rotation.z=stage>=4&&!reduced?t*(.6+this.phase*.65):0;
    if(this.spill)this.spill.scale.x=.18+(reduced?0:Math.sin(t*5)*.038);
    this.routes.forEach(({start,end,carrier,stage:threshold},i)=>{
      carrier.visible=stage>=threshold&&(!low||i===0||i===4);
      carrier.position.copy(start).lerp(end,reduced?.68:(t*.28+i*.24)%1);
    });
    if(this.wave){
      this.wave.visible=!low&&!reduced&&stage===5&&this.waveAge<2.5;
      this.wave.scale.set(.6+this.waveAge*3.8,.6+this.waveAge*3.8,.25);
      (this.wave.material as T.MeshPhysicalMaterial).opacity=Math.max(0,.65-this.waveAge*.26);
    }
    if(this.fracture?.visible&&!reduced)this.fracture.rotation.y=t*.65;
    if(this.signal==="echo")this.energyInk.color.set("#b8ff9b");
    else this.energyInk.color.set("#d7ffeb");
  }
}
