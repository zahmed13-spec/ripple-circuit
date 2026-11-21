import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Arena3D } from "../arena";

export const trainPeriod = 23;
const smooth = (n:number) => n*n*(3-2*n);
/** The station is the loop seam. Both ends of the travel interval have zero speed. */
export function trainProgress(seconds:number) {
  const phase = ((seconds % trainPeriod) + trainPeriod) % trainPeriod;
  return phase <= 3 ? 0 : smooth((phase-3)/(trainPeriod-3));
}

export class ScenicTrain {
  private path:T.CatmullRomCurve3;
  private cars:T.Group[]=[];
  private position=new T.Vector3();
  private tangent=new T.Vector3();
  private signal:T.MeshBasicMaterial;
  private doors:T.Mesh[]=[];

  constructor(arena:Arena3D, parent:T.Group, x:number, z:number, terminal:number) {
    const point=(a:number,y:number,b:number)=>new T.Vector3(a+x,y,b+z);
    this.path=new T.CatmullRomCurve3([
      point(0,1.75,0),point(5,1.75,-.15),point(8,1.65,-3.8),point(5,1.5,-8),
      point(-4,1.45,-8.6),point(-9,1.55,-5.4),point(-6,1.75,0),
    ],true,"centripetal");
    this.path.arcLengthDivisions=300;
    const steel=arena.own(new T.MeshStandardMaterial({color:0x476b89,roughness:.47,metalness:.45}));
    const white=arena.own(new T.MeshStandardMaterial({color:0xf5fff8,roughness:.28}));
    const mint=arena.own(new T.MeshStandardMaterial({color:0x30d6c7,roughness:.24,metalness:.22}));
    const glazing=arena.own(new T.MeshStandardMaterial({color:0x244d70,roughness:.17,metalness:.36}));
    const lamp=arena.own(new T.MeshBasicMaterial({color:0xfff4ca}));
    this.signal=arena.own(new T.MeshBasicMaterial({color:0x60ffae}));
    const box=arena.own(new T.BoxGeometry());
    const sphere=arena.own(new T.SphereGeometry(1,16,10));
    const shell=arena.own(new RoundedBoxGeometry(1,.87,2.15,3,.19));
    const add=(root:T.Group, geometry:T.BufferGeometry, mat:T.Material, p:T.Vector3, sx=1,sy=1,sz=1)=>{
      const mesh=new T.Mesh(geometry,mat);
      mesh.position.copy(p);
      mesh.scale.set(sx,sy,sz);
      root.add(mesh);
      return mesh;
    };
    // Parallel guide rails are sampled from the same spline as the rolling stock.
    for(const side of [-1,1]){
      const railPoints=this.path.getSpacedPoints(96).slice(0,-1).map((p,i)=>{
        const t=this.path.getTangentAt(i/96);
        return p.add(new T.Vector3(-t.z*side*.34,-.16,t.x*side*.34));
      });
      const rail=new T.CatmullRomCurve3(railPoints,true);
      add(parent,arena.own(new T.TubeGeometry(rail,128,.088,5,true)),side===1?steel:mint,new T.Vector3());
    }
    const supports=arena.own(new T.InstancedMesh(box,steel,16));
    const matrix=new T.Matrix4();
    for(let i=0;i<16;i++){
      const p=this.path.getPointAt(i/16);
      matrix.makeScale(.28,p.y+3.2,.33).setPosition(p.x,(p.y-3.2)/2,p.z);
      supports.setMatrixAt(i,matrix);
    }
    supports.computeBoundingSphere();
    parent.add(supports);
    const width=3.8+terminal*.45;
    add(parent,box,white,point(-.9,1.48,-1.21),width,.23,1.33);
    add(parent,box,mint,point(-.9,2.81,-1.27),width,.14,1.4);
    for(const end of [-1,1])add(parent,box,white,point(-.9+end*(width*.43),2.14,-1.62),.12,1.28,.12);
    add(parent,box,this.signal,point(-.9,2.66,-.56),width*.7,.072,.06);
    for(let i=0;i<(terminal>=4?3:2);i++){
      const car=new T.Group();
      add(car,shell,white,new T.Vector3(0,.49,0));
      add(car,box,mint,new T.Vector3(0,.27,0),1.016,.13,1.74);
      if(i===0){
        add(car,sphere,white,new T.Vector3(0,.48,.82),.50,.42,.68);
        add(car,sphere,glazing,new T.Vector3(0,.61,1.18),.42,.19,.31);
        for(const side of [-1,1])add(car,sphere,lamp,new T.Vector3(side*.27,.35,1.42),.09,.055,.065);
      }
      for(const side of [-1,1]){
        add(car,box,glazing,new T.Vector3(side*.507,.59,-.1),.03,.24,1.46);
        const door=add(car,box,mint,new T.Vector3(side*.526,.39,-.33),.027,.52,.27);
        this.doors.push(door);
      }
      this.cars.push(car);
      parent.add(car);
    }
    this.update(0,false);
  }

  update(time:number,reduced:boolean,reaction=0) {
    const progress=reduced ? 0 : trainProgress(time);
    const stopped=progress===0;
    const length=this.path.getLength();
    for(const [index,car] of this.cars.entries()){
      const distance=(progress-index*2.34/length+1)%1;
      this.path.getPointAt(distance,this.position);
      this.path.getTangentAt(distance,this.tangent);
      car.position.copy(this.position);
      car.rotation.y=Math.atan2(this.tangent.x,this.tangent.z);
    }
    this.signal.color.setHex(stopped||reaction>.25?0x60ffae:0xffcc75);
    for(const door of this.doors)door.position.z=stopped?-.49:-.33;
    return {progress,stopped};
  }
}
