import { Biome } from "../scene/biome";
import * as T from "three";
import type { Current } from "../native/physics";
import type { Arena3D } from "../scene/arena";
import type { WorldTheme } from "./themes";
import { AeroScenery } from "./aero-scenery";
import { Landmarks } from "./landmarks";
import { Luma } from "./luma";
import type { Mood } from "./narrative";

export type Environment = {
  theme: WorldTheme;
  currents?: readonly Current[];
  stage?: number;
  level?: number;
};
type Stream = { spec: Current; material: T.MeshBasicMaterial; arrows: T.Group };

export class StoryEnvironment {
  private streams: Stream[] = [];
  private luma: Luma;
  private scenery?: AeroScenery;
  private phase = 0;
  private landmarks?: Landmarks;
  private biome?: Biome;
  private time = 0;
  private stage = -1;
  private signal = "";
  private lastActive = "";
  private ocean: T.ShaderMaterial;
  private clouds: T.Object3D[];

  constructor(private arena: Arena3D, private spec: Environment) {
    const { theme } = spec;
    const { scene } = arena;
    this.clouds=scene.children.filter(object=>typeof object.userData.cloudX==="number");
    const decor = new T.Group();
    scene.add(decor);
    arena.renderer.setClearColor(theme.sky);
    scene.fog = new T.Fog(theme.fog, 25, 58);
    arena.sun.color.set(theme.sunlight);
    this.ocean = arena.own(new T.ShaderMaterial({
      uniforms:{
        tint:{value:new T.Color(theme.surface)},sky:{value:new T.Color(theme.sky)},time:{value:0},energy:{value:0},detail:{value:1},
      },
      vertexShader:`
        varying vec2 sea;
        void main() {
          sea=position.xy;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader:`
        varying vec2 sea;
        uniform vec3 tint, sky;
        uniform float time, energy, detail;
        void main() {
          float wave=sin(sea.y * 1.45 + sin(sea.x * .37) - time * .8);
          float gleam=smoothstep(.89,1.,wave);
          float tide=.5+.5*sin(sea.x*.18 + sea.y*.16 -time*.25);
          vec3 seaColor=mix(tint*.47,tint*1.3,tide);
          seaColor=mix(seaColor,vec3(.65,.94,.92),gleam*(.035+energy*.075));
          seaColor+=detail*.055*smoothstep(.91,1.,sin(sea.x*.65+sea.y*.7+time*.5));
          gl_FragColor=vec4(mix(seaColor,sky,smoothstep(17.,26.,length(sea))),1.);
          #include <colorspace_fragment>
        }`,
    }));
    const water=new T.Mesh(arena.own(new T.CircleGeometry(26,48)),this.ocean);
    water.rotation.x=-Math.PI/2;
    water.position.y=-3.36;
    decor.add(water);
    if(theme.id==="aero")this.landmarks=new Landmarks(arena,decor,theme);
    this.biome=new Biome(arena,theme.id as ConstructorParameters<typeof Biome>[1],spec.level??1);
    if (theme.id === "aero" && spec.level) {
      this.scenery = new AeroScenery(arena, decor, spec.level);
    }
    this.luma=new Luma(arena,decor);
    this.luma.react("idle",undefined,Infinity);

    for (const current of spec.currents ?? []) {
      const material = arena.own(new T.MeshBasicMaterial({
        color:theme.dormant, transparent:true, opacity:.3, depthWrite:false,
      }));
      const bed = new T.Mesh(arena.own(new T.PlaneGeometry(current.w,current.d)),material);
      bed.rotation.x = -Math.PI/2;
      bed.position.set(current.x,current.y+.034,current.z);
      decor.add(bed);
      const arrows = new T.Group();
      arrows.position.copy(bed.position);
      arrows.position.y += .023;
      arrows.rotation.y = -Math.atan2(current.force.z,current.force.x);
      const geometry = arena.own(new T.BufferGeometry());
      geometry.setAttribute("position",new T.Float32BufferAttribute([
        -.22,0,-.17,.05,0,0,-.22,0,.17,.02,0,.17,.32,0,0,.02,0,-.17,
      ],3));
      geometry.setIndex([0,1,5,1,4,5,1,3,4,1,2,3]);
      const ink = arena.own(new T.MeshBasicMaterial({color:"#e5ffff",side:T.DoubleSide}));
      for (let x = -current.w/2+.47; x < current.w/2-.3; x += .74) {
        const arrow = new T.Mesh(geometry,ink);
        arrow.position.x = x;
        arrow.userData.startX = x;
        arrows.add(arrow);
      }
      decor.add(arrows);
      this.streams.push({spec:current,material,arrows});
    }
    this.update([]);
    this.setStage(spec.stage ?? 0);
  }

  update(activated: readonly string[]) {
    const active = [];
    for (const {spec,material,arrows} of this.streams) {
      const on = !spec.switchId || activated.includes(spec.switchId);
      material.color.set(on ? "#20cdd7" : this.spec.theme.dormant);
      material.opacity = on ? .66 : .27;
      arrows.visible = on;
      if (on) active.push(spec.id);
    }
    const signature=active.join(",");
    if (signature!==this.lastActive || this.arena.canvas.dataset.currents===undefined) {
      this.lastActive=signature;
      this.arena.canvas.dataset.currents=signature;
      this.arena.dirty=true;
    }
  }

  setStage(stage:number, signal="") {
    if(stage===this.stage&&signal===this.signal)return;
    this.stage=stage;
    this.signal=signal;
    this.landmarks?.set(stage,signal);
    this.scenery?.setPower(stage,this.phase);
    this.biome?.power(stage,this.phase);
    this.arena.canvas.dataset.stage=String(stage);
    this.arena.canvas.dataset.restored=String(stage===5);
    this.arena.canvas.dataset.signal=signal;
    this.arena.dirty=true;
  }

  setPhase(phase:number) {
    this.phase = phase;
    this.landmarks?.setPhase(phase);
    this.scenery?.setPower(this.stage,phase);
    this.biome?.power(this.stage,phase);
    this.arena.dirty = true;
  }

  react(mood:Mood,target?:T.Vector3,hold?:number) {
    this.luma.react(mood,target,hold);
  }

  placeLuma(position?:readonly [number,number,number]) { this.luma.place(position); }

  animate(dt:number,reduced:boolean) {
    if(!reduced)this.time+=dt;
    const low=this.arena.quality==="low";
    this.ocean.uniforms.time.value=reduced?0:this.time;
    this.ocean.uniforms.energy.value=this.stage/5;
    this.ocean.uniforms.detail.value=low?0:1;
    this.landmarks?.animate(dt,this.time,reduced,low);
    this.scenery?.animate(this.time,reduced,this.arena.quality);
    this.biome?.animate(this.time,reduced,this.arena.quality);
    this.clouds.forEach((cloud,index)=>{
      cloud.position.x=cloud.userData.cloudX+(reduced||low?0:Math.sin(this.time*.09+index)*.64);
    });
    this.luma.animate(dt,reduced,this.stage);
    for (const {arrows,spec} of this.streams) {
      for (const arrow of arrows.children) {
        const start = arrow.userData.startX as number;
        arrow.position.x = reduced ? start : ((start + spec.w/2 + this.time*.8) % spec.w)-spec.w/2;
        arrow.visible = Math.abs(arrow.position.x) < spec.w/2-.32;
      }
    }
  }
}
