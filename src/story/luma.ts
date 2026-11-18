import * as T from "three";
import type { Arena3D } from "../scene/arena";
import type { Mood } from "./narrative";

const expressions = {
  idle:        {float:.10, rate:1.7, lift:0,    tilt:0,   eyes:1,    glow:.40},
  curious:     {float:.12, rate:2.1, lift:.10,  tilt:.20, eyes:1.15, glow:.66},
  surprised:   {float:.15, rate:2.8, lift:.26,  tilt:.10, eyes:1.45, glow:.95},
  focused:     {float:.055,rate:2.0, lift:.05,  tilt:.11, eyes:.62,  glow:.65},
  concerned:   {float:.05, rate:1.1, lift:-.10, tilt:-.14,eyes:.75,  glow:.22},
  remembering: {float:.025,rate:1.3, lift:.03,  tilt:0,   eyes:.88,  glow:.42},
  reassuring:  {float:.075,rate:1.8, lift:.07,  tilt:-.14,eyes:1,    glow:.74},
  celebrating: {float:.21, rate:3.6, lift:.36, tilt:.25, eyes:.82,  glow:1.2},
} satisfies Record<Mood,{float:number;rate:number;lift:number;tilt:number;eyes:number;glow:number}>;

export class Luma {
  readonly group = new T.Group();
  private anchor = new T.Vector3(-6.3,1.2,-3.5);
  private target = this.anchor.clone();
  private facing = new T.Vector2();
  private body = new T.Group();
  private eyes:T.Mesh[]=[];
  private glints:T.Mesh[]=[];
  private orbit:T.Mesh[]=[];
  private core:T.Mesh;
  private mood:Mood="idle";
  private elapsed=0;
  private until=0;
  private gaze?: T.Vector3;
  private projection=new T.Vector3();

  constructor(private arena:Arena3D, parent:T.Group) {
    parent.add(this.group);
    this.group.add(this.body);
    this.group.position.copy(this.anchor);
    const sphere = arena.mesh(new T.SphereGeometry(.38,20,14),"#c7fff3");
    sphere.castShadow = false;
    const shell = sphere.material as T.MeshPhysicalMaterial;
    shell.transparent = true;
    shell.opacity = .52;
    sphere.renderOrder = 1;
    this.body.add(sphere);
    this.core = arena.mesh(new T.SphereGeometry(.27,16,12),"#8de6d8");
    this.core.castShadow = false;
    this.body.add(this.core);
    const band = arena.mesh(new T.TorusGeometry(.42,.025,5,32),"#f5fff0");
    band.rotation.set(1.1,.24,.15);
    band.castShadow = false;
    this.body.add(band);
    const eyeGeometry = arena.own(new T.SphereGeometry(1,10,8));
    const eyeInk = arena.own(new T.MeshBasicMaterial({color:"#12394b"}));
    const glintInk = arena.own(new T.MeshBasicMaterial({color:"#fbffff"}));
    for (const sign of [-1,1]) {
      const eye = new T.Mesh(eyeGeometry,eyeInk);
      eye.position.set(sign*.11,.056,.367);
      eye.scale.set(.036,.052,.018);
      this.body.add(eye);
      this.eyes.push(eye);
      const glint=new T.Mesh(eyeGeometry,glintInk);
      glint.position.copy(eye.position).add(new T.Vector3(.008,.014,.018));
      glint.scale.setScalar(.011);
      this.body.add(glint);
      this.glints.push(glint);
    }
    const mote = arena.own(new T.SphereGeometry(.035,6,5));
    const moteInk = arena.own(new T.MeshBasicMaterial({color:"#d2fff2"}));
    for (let i=0;i<4;i++) {
      const light = new T.Mesh(mote,moteInk);
      light.visible=false;
      this.body.add(light);
      this.orbit.push(light);
    }
  }

  react(mood:Mood, target?:T.Vector3, hold=2.4) {
    this.mood=mood;
    this.gaze=target;
    this.until=this.elapsed+hold;
    this.arena.canvas.dataset.luma=mood;
    this.arena.dirty=true;
  }
  place(position?:readonly [number,number,number]) {
    this.target.copy(position ? this.projection.fromArray(position) : this.anchor);
  }
  animate(dt:number,reduced:boolean,stage:number) {
    this.elapsed+=dt;
    if(this.elapsed>=this.until && this.mood!=="idle") this.react("idle",this.gaze,Infinity);
    const state=expressions[this.mood];
    const time=this.elapsed;
    this.group.position.lerp(this.target,reduced?1:1-Math.exp(-dt*5));
    this.group.quaternion.copy(this.arena.camera.quaternion);
    const gesture=reduced?0:Math.sin(time*state.rate);
    this.body.position.y=state.lift+gesture*state.float;
    this.body.position.x=this.mood==="celebrating"&&!reduced?Math.cos(time*3.6)*.17:0;
    this.body.rotation.z=reduced?0:state.tilt*Math.cos(time*1.8);
    if(this.gaze) {
      const delta=this.projection.copy(this.gaze).project(this.arena.camera)
        .sub(this.group.position.clone().project(this.arena.camera));
      this.facing.set(T.MathUtils.clamp(delta.x,-.02,.02),T.MathUtils.clamp(delta.y,-.012,.012));
    } else this.facing.set(0,0);
    const blink=!reduced && time%4.8>4.67;
    this.eyes.forEach((eye,i)=>{
      eye.position.x=(i===0?-.11:.11)+this.facing.x;
      eye.position.y=.056+this.facing.y;
      eye.scale.y=.052*(blink?.14:state.eyes);
      this.glints[i].position.set(eye.position.x+.008,eye.position.y+.014,.389);
      this.glints[i].visible=!blink;
    });
    const material=this.core.material as T.MeshPhysicalMaterial;
    material.emissive.set("#30d7bd");
    material.emissiveIntensity=state.glow+stage*.045+gesture*.10;
    for(let i=0;i<this.orbit.length;i++){
      const mote=this.orbit[i], angle=time*5+i*Math.PI/2;
      mote.visible=this.mood==="celebrating"&&!reduced&&this.arena.quality!=="low";
      mote.position.set(Math.cos(angle)*.63,Math.sin(angle)*.5,-.07);
    }
  }
}
