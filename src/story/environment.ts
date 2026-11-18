import * as T from "three";
import type { Current } from "../native/physics";
import type { Arena3D } from "../scene/arena";
import type { WorldTheme } from "./themes";

export type Environment = {
  theme: WorldTheme;
  currents?: readonly Current[];
  restored?: boolean;
};
type Stream = { spec: Current; material: T.MeshBasicMaterial; arrows: T.Group };

export class StoryEnvironment {
  private crystal: T.Mesh;
  private islands: T.Mesh[] = [];
  private conduits: T.Mesh[] = [];
  private streams: Stream[] = [];
  private luma: T.Group;
  private time = 0;
  private restored = false;

  constructor(private arena: Arena3D, private spec: Environment) {
    const { theme } = spec;
    const { scene } = arena;
    const decor = new T.Group();
    scene.add(decor);
    arena.renderer.setClearColor(theme.sky);
    scene.fog = new T.Fog(theme.fog, 27, 58);
    arena.sun.color.set(theme.sunlight);

    const make = (geometry: T.BufferGeometry, color: string, x: number, y: number, z: number) => {
      const mesh = arena.mesh(geometry, color);
      mesh.position.set(x,y,z);
      mesh.castShadow = false;
      decor.add(mesh);
      return mesh;
    };
    make(new T.CylinderGeometry(24,24,.1,48),theme.surface,0,-3.38,0);
    for (const [x, y, z, size] of [[-8,.7,-5,1.9],[5,1.6,-8,1.8],[8,-.25,-2,1.35],[-7,-.7,5,1.1]]) {
      make(new T.CylinderGeometry(size,size*.35,1.1,8),theme.platform,x,y-.65,z);
      const rim = make(new T.TorusGeometry(size*.85,.065,6,32),theme.dormant,x,y+.035,z);
      rim.rotation.x = -Math.PI/2;
      this.islands.push(rim);
      make(new T.CylinderGeometry(size*.8,size*.95,.12,12),theme.accent,x,y-.015,z);
      const shape = theme.prop === "bubble" ? new T.SphereGeometry(.44,16,10)
        : theme.prop === "tile" ? new T.BoxGeometry(.55,.9,.55) : new T.OctahedronGeometry(.55);
      const prop = make(shape,theme.platform,x,y+.45,z);
      if (theme.prop === "bubble") {
        const material = prop.material as T.MeshPhysicalMaterial;
        material.transparent = true;
        material.opacity = .58;
      }
    }
    this.crystal = make(new T.OctahedronGeometry(.92),theme.dormant,0,2.2,-7.4);
    make(new T.CylinderGeometry(1.15,1.55,.62,8),theme.platform,0,.85,-7.4);
    for (const [endX,endZ] of [[-8,-5],[5,-8],[8,-2]]) {
      const start = new T.Vector3(0,-.6,-7.4);
      const end = new T.Vector3(endX,-.6,endZ);
      const mid = start.clone().lerp(end,.5);
      const conduit = make(new T.CylinderGeometry(.065,.065,start.distanceTo(end),6),
        theme.dormant,mid.x,mid.y,mid.z);
      conduit.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());
      this.conduits.push(conduit);
    }
    this.luma = new T.Group();
    decor.add(this.luma);
    const luma = make(new T.SphereGeometry(.28,16,12),"#d8ffff",0,0,0);
    (luma.material as T.MeshPhysicalMaterial).emissive.set("#3fbdc4");
    this.luma.add(luma);
    for (const x of [-.075,.075]) {
      const eye = make(new T.SphereGeometry(.025,8,6),"#194962",x,.025,.26);
      this.luma.add(eye);
    }
    this.luma.position.set(-5.9,1.45,-3.6);

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
    this.restore(!!spec.restored);
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
    this.arena.canvas.dataset.currents = active.join(",");
  }

  restore(on: boolean) {
    this.restored = on;
    const {theme} = this.spec;
    for (const object of [this.crystal,...this.islands,...this.conduits]) {
      const material = object.material as T.MeshPhysicalMaterial;
      material.color.set(on ? theme.restored : theme.dormant);
      material.emissive.set(on ? theme.accent : "#000000");
      material.emissiveIntensity = on ? .85 : 0;
    }
    this.arena.canvas.dataset.restored = String(on);
    this.arena.dirty = true;
  }

  animate(dt:number,reduced:boolean) {
    if (!reduced) this.time += dt;
    this.luma.position.y = 1.45 + (reduced ? 0 : Math.sin(this.time * 2) * .19);
    this.luma.quaternion.copy(this.arena.camera.quaternion);
    this.crystal.rotation.y = this.time * (this.restored ? .95 : .45);
    for (const {arrows,spec} of this.streams) {
      for (const arrow of arrows.children) {
        const start = arrow.userData.startX as number;
        arrow.position.x = reduced ? start : ((start + spec.w/2 + this.time*.8) % spec.w)-spec.w/2;
        arrow.visible = Math.abs(arrow.position.x) < spec.w/2-.32;
      }
    }
  }
}
