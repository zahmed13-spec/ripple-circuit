import * as T from "three";
import type { Arena3D, Quality } from "./arena";

type World = "aero" | "eco" | "terra" | "metro" | "null";
type Shape = "island" | "box" | "tower" | "glass" | "gem" | "ring" | "leaf";
type Piece = { shape:Shape; color:string; at:[number,number,number]; size:[number,number,number]; tilt?:number; stage?:number };
const palette = {
  aero:["#779f9e","#a6e785","#dcffff","#65edff"],
  eco:["#496e55","#a6d77b","#d3eefa","#dfff8c"],
  terra:["#9a6347","#e4ad72","#ffe6a5","#ffda75"],
  metro:["#6d92b5","#dbe8f6","#a4f0ff","#e2a9ff"],
  null:["#38274d","#73508b","#b28ee2","#f788bc"],
} as const;

/** Scenic meshes are owned by the arena, outside its gameplay and picking roots. */
export class Biome {
  private detail = new T.Group();
  private group = new T.Group();
  private markers: T.InstancedMesh[] = [];
  private idle = new T.Vector3();
  constructor(arena:Arena3D, world:World, composition:number, decorativeOnly=false) {
    const [rock, surface, glass, signal]=palette[world];
    const geometry:Record<Shape,T.BufferGeometry>={
      island:arena.own(new T.CylinderGeometry(1,.51,1,9)),
      box:arena.own(new T.BoxGeometry()),
      tower:arena.own(new T.CylinderGeometry(.73,1,1,8)),
      glass:arena.own(new T.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2)),
      gem:arena.own(new T.OctahedronGeometry()),
      ring:arena.own(new T.TorusGeometry(1,.065,5,18)),
      leaf:arena.own(new T.IcosahedronGeometry(1,1)),
    };
    const pieces:Piece[]=[];
    const plant=(x:number,y:number,z:number,scale:number)=>{
      pieces.push({shape:"tower",color:rock,at:[x,y+.58*scale,z],size:[.11*scale,1.2*scale,.11*scale]});
      pieces.push({shape:"leaf",color:surface,at:[x,y+1.5*scale,z],size:[.65*scale,.81*scale,.65*scale],tilt:.14});
    };
    const anchor={
      aero:[[-8.5,-8.9],[-4.2,-10],[.4,-9.4],[4.5,-11.3],[8.8,-9.1]],
      eco:[[-9.6,-6.8],[-5.3,-11.6],[1.7,-10.2],[5.2,-12.4],[8.5,-7.5]],
      terra:[[-10.5,-6.5],[-7,-11],[.9,-10.4],[6.8,-9.5],[9.3,-5.5]],
      metro:[[-9.4,-8.4],[-5.7,-12.1],[.1,-10.8],[3.8,-10],[8.5,-8.7]],
      null:[[-10.5,-6.8],[-6.7,-12],[.3,-11.4],[6.9,-11.2],[10.3,-6.9]],
    }[world];
    const parts=decorativeOnly ? 3 : anchor.length;
    for(let i=0;i<parts;i++){
      const x=anchor[i][0]+(composition%3-1)*.65;
      const z=anchor[i][1];
      const y=-.74-(i%3)*.53;
      const r=(decorativeOnly?1.42:1.6)+i%3*.29;
      pieces.push({shape:"island",color:rock,at:[x,y-.57,z],size:[r,1.2,r*.92]});
      pieces.push({shape:"island",color:surface,at:[x,y+.02,z],size:[r*.97,.1,r*.87]});
      if(world==="eco" || world==="aero"){
        for(let j=0;j<3;j++)plant(x+(j-1)*.63,y,z+.18+(j%2)*.42,.58+(i+j)%3*.21);
        if(i%2===0)pieces.push({shape:"glass",color:glass,at:[x,y+.12,z],size:[1.12,.9,1.03]});
      }
      if(world==="terra"){
        for(let j=0;j<4;j++)pieces.push({shape:"gem",color:j===1?glass:signal,at:[x+(j-1.5)*.42,y+.67+(j%2)*.35,z+.18*(j%2)],size:[.31,.95+(j%3)*.27,.35],tilt:(j-2)*.26});
        pieces.push({shape:"box",color:"#d2aa82",at:[x,y-1.45,z+.85],size:[.38,1.7,.08]});
      }
      if(world==="metro"){
        for(let j=0;j<3;j++)pieces.push({shape:j===1?"tower":"box",color:j===1?glass:surface,at:[x+(j-1)*.72,y+1.2-(j%2)*.23,z],size:[.51,2.5-(j%2)*.48,.72]});
        pieces.push({shape:"ring",color:signal,at:[x,y+.9,z+.58],size:[.72,.72,.45]});
        if(i>0)pieces.push({shape:"box",color:glass,at:[x-2.1,y+.36,z+1],size:[4.4,.12,.34],stage:i});
      }
      if(world==="null"){
        for(let j=0;j<3;j++)pieces.push({shape:"gem",color:j%2?surface:glass,at:[x+(j-1)*.85,y+1.5+j*.19,z],size:[.42,.9+j*.3,.5],tilt:(j-1)*.46});
        pieces.push({shape:"ring",color:signal,at:[x,y+1.37,z+.64],size:[.74,.65,.62],tilt:.45});
      }
      pieces.push({shape:"gem",color:signal,at:[x,y+.78,z+1.06],size:[.18,.31,.18],stage:i+1});
    }
    if(!decorativeOnly && world!=="aero"){
      const [x,y,z]=[-2.9,-.52,-7.5];
      pieces.push({shape:"island",color:rock,at:[x,y-.62,z],size:[2.25,1.23,1.55]});
      pieces.push({shape:"island",color:surface,at:[x,y,z],size:[2.12,.18,1.48]});
      if(world==="eco"){
        pieces.push({shape:"tower",color:rock,at:[x,y+1.3,z],size:[.3,2.6,.33]});
        for(let i=0;i<8;i++){
          const angle=i*Math.PI/4;
          pieces.push({shape:"leaf",color:i%3?surface:signal,at:[x+Math.cos(angle)*1.12,y+2.53+i%3*.23,z+Math.sin(angle)*.61],size:[.76,.55,.62]});
        }
        pieces.push({shape:"glass",color:glass,at:[x+1.32,y+.14,z+.31],size:[.77,.63,.76]});
      } else if(world==="terra"){
        pieces.push({shape:"ring",color:rock,at:[x,y+1.51,z],size:[1.88,1.41,1.3]});
        pieces.push({shape:"gem",color:glass,at:[x,y+1.37,z+.09],size:[.54,1.19,.55],tilt:.25,stage:5});
        for(const direction of [-1,1])pieces.push({shape:"tower",color:surface,at:[x+direction*1.53,y+.82,z],size:[.28,1.66,.45],tilt:direction*.18});
      } else if(world==="metro"){
        pieces.push({shape:"box",color:glass,at:[x,y+1.39,z],size:[3.1,1.42,.93]});
        pieces.push({shape:"box",color:surface,at:[x,y+2.15,z],size:[3.54,.19,1.24]});
        for(let i=0;i<5;i++)pieces.push({shape:"box",color:signal,at:[x+(i-2)*.49,y+1.69,z+.48],size:[.34,.15,.08],stage:i+1});
      } else {
        pieces.push({shape:"ring",color:signal,at:[x,y+1.57,z+.15],size:[1.39,1.3,.61],tilt:-.34,stage:5});
        pieces.push({shape:"gem",color:glass,at:[x+.27,y+1.56,z],size:[.82,1.48,.67],tilt:.42});
        pieces.push({shape:"gem",color:surface,at:[x-.88,y+1.37,z+.05],size:[.36,.85,.42],tilt:-.45});
      }
      const foreground=world==="null"?[-7.4,8.2]:[-5.3,6.5];
      foreground.forEach((x,i)=>{
        const z=7.55+i*.26, y=-2.65;
        pieces.push({shape:"island",color:rock,at:[x,y-.23,z],size:[1.17,.52,.88]});
        pieces.push({shape:"gem",color:signal,at:[x,y+.42,z],size:[.23,.57,.26],tilt:.32,stage:i+1});
      });
    }
    const batches = new Map<string,Piece[]>();
    for(const piece of pieces){
      const key=[piece.shape,piece.color,piece.stage??0].join(":");
      const batch=batches.get(key);
      if(batch)batch.push(piece);
      else batches.set(key,[piece]);
    }
    const matrix = new T.Matrix4(), rotation = new T.Quaternion(), axis = new T.Vector3(0,0,1);
    for(const entries of batches.values()){
      const first=entries[0];
      const translucent=first.shape==="glass";
      const material=arena.own(new T.MeshLambertMaterial({color:first.color,transparent:translucent,opacity:translucent?.57:1,depthWrite:!translucent}));
      const mesh=arena.own(new T.InstancedMesh(geometry[first.shape],material,entries.length));
      entries.forEach((entry,i)=>{
        rotation.setFromAxisAngle(axis,entry.tilt??0);
        matrix.compose(new T.Vector3(...entry.at),rotation,new T.Vector3(...entry.size));
        mesh.setMatrixAt(i,matrix);
      });
      mesh.computeBoundingSphere();
      if(first.stage){
        mesh.userData.stage=first.stage;
        this.markers.push(mesh);
      }
      (translucent || first.shape==="leaf" ? this.detail : this.group).add(mesh);
    }
    arena.scene.add(this.group,this.detail);
    this.power(decorativeOnly ? 5 : 0,0);
  }
  power(stage:number, phase:number){
    for(const marker of this.markers){
      const material=marker.material as T.MeshLambertMaterial;
      material.emissive.copy(material.color);
      material.emissiveIntensity=stage>=marker.userData.stage ? .85 : phase>=marker.userData.stage ? .48 : 0;
    }
  }
  animate(time:number, reduced:boolean, quality:Quality){
    this.detail.visible=quality!=="low";
    this.idle.set(0,reduced?0:Math.sin(time*.35)*.08,0);
    this.detail.position.copy(this.idle);
  }
}
