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
    const parts=decorativeOnly ? 3 : 5;
    for(let i=0;i<parts;i++){
      const x=-8.5+i*4.2+(composition%3-1)*.65;
      const z=-8.9-(i%2)*2.25;
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
