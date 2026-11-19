import * as T from "three";
import type { Arena3D } from "../scene/arena";
import type { Vec3 } from "./film/boards";

type Shape = "box" | "island" | "pipe" | "dome" | "orb" | "ring" | "gem";
type Paint = "porcelain" | "jade" | "foliage" | "steel" | "glass" | "water" | "power";
type Detail = 0 | 1 | 2;
const up = new T.Vector3(0, 1, 0);
const identity = new T.Quaternion();
const horizontalRing = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), Math.PI / 2);

/** Scenery lives outside the board and is never registered as an aim surface. */
export class AeroScenery {
  private readonly geometry: Record<Shape, T.BufferGeometry>;
  private readonly materials: Record<Paint, T.MeshBasicMaterial | T.MeshLambertMaterial>;
  private readonly batches = new Map<string, {shape: Shape; paint: Paint; detail: Detail; matrices: T.Matrix4[]}>();
  private readonly layers = [new T.Group(), new T.Group(), new T.Group()];
  private readonly wheels: T.Group[] = [];
  private readonly falls: {x: number; top: number; z: number; height: number; width: number}[] = [];
  private foam?: T.InstancedMesh;
  private stillFoamDensity = 0;
  private readonly dropTransform = new T.Matrix4();
  private readonly lit = new T.Color("#84ffe0");
  private readonly quiet = new T.Color("#518699");
  private energy = 0;

  constructor(arena: Arena3D, root: T.Group, private readonly level: number) {
    this.geometry = {
      box: arena.own(new T.BoxGeometry()),
      island: arena.own(new T.CylinderGeometry(1, .56, 1, 12)),
      pipe: arena.own(new T.CylinderGeometry(1, 1, 1, 10)),
      dome: arena.own(new T.SphereGeometry(1, 18, 9, 0, 2 * Math.PI, 0, Math.PI / 2)),
      orb: arena.own(new T.SphereGeometry(1, 10, 7)),
      ring: arena.own(new T.TorusGeometry(1, .09, 6, 20)),
      gem: arena.own(new T.OctahedronGeometry()),
    };
    this.materials = {
      porcelain: arena.own(new T.MeshLambertMaterial({color: "#e3fffb"})),
      jade: arena.own(new T.MeshLambertMaterial({color: "#6eaeaa"})),
      foliage: arena.own(new T.MeshLambertMaterial({color: "#8bda7f"})),
      steel: arena.own(new T.MeshLambertMaterial({color: "#55899d"})),
      glass: arena.own(new T.MeshBasicMaterial({color: "#90e9fa", transparent: true, opacity: .29, depthWrite: false})),
      water: arena.own(new T.MeshBasicMaterial({color: "#44d9ed", transparent: true, opacity: .68, depthWrite: false})),
      power: arena.own(new T.MeshBasicMaterial({color: this.quiet})),
    };
    root.add(...this.layers);
    switch (level) {
      case 1: this.garden(); break;
      case 2: this.reservoir(); break;
      case 3: this.terraces(); break;
      case 4: this.intake(); break;
      case 5: this.crown(); break;
    }
    for (const {shape, paint, matrices, detail} of this.batches.values()) {
      const mesh = arena.own(new T.InstancedMesh(this.geometry[shape], this.materials[paint], matrices.length));
      matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.computeBoundingSphere();
      this.layers[detail].add(mesh);
    }
    this.batches.clear();

    if (this.falls.length) {
      const foam = arena.own(new T.MeshBasicMaterial({color: "#dbffff", transparent: true, opacity: .78, depthWrite: false}));
      const mesh = arena.own(new T.InstancedMesh(this.geometry.box, foam, this.falls.length * 6));
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      this.foam = mesh;
      this.layers[1].add(mesh);
      this.animate(0, false, "medium");
    }
  }

  private part(shape: Shape, paint: Paint, at: Vec3, size: Vec3, detail: Detail = 0, orientation = identity) {
    const matrix = new T.Matrix4().compose(new T.Vector3(...at), orientation, new T.Vector3(...size));
    const key = `${detail}:${shape}:${paint}`;
    let batch = this.batches.get(key);
    if (!batch) {
      batch = {shape, paint, detail, matrices: []};
      this.batches.set(key, batch);
    }
    batch.matrices.push(matrix);
  }

  private pipe(a: Vec3, b: Vec3, radius: number, paint: Paint, detail: Detail = 0) {
    const start = new T.Vector3(...a);
    const end = new T.Vector3(...b);
    const direction = end.clone().sub(start);
    const orientation = new T.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
    this.part("pipe", paint, start.lerp(end, .5).toArray(), [radius, direction.length(), radius], detail, orientation);
  }

  private island(x: number, y: number, z: number, radius: number, paint: Paint = "foliage", detail: Detail = 0) {
    this.part("island", "jade", [x, y - .64, z], [radius, 1.23, radius], detail);
    this.part("pipe", paint, [x, y, z], [radius * .96, .16, radius * .96], detail);
  }

  private spill(x: number, top: number, z: number, height: number, width: number) {
    this.part("box", "water", [x, top - height / 2, z], [width, height, .17]);
    this.falls.push({x, top, z, height, width});
  }

  private arch(x: number, y: number, z: number, radius: number, detail: Detail = 0) {
    this.part("ring", "porcelain", [x, y, z], [radius, radius, radius], detail);
    this.part("ring", "power", [x, y, z + .05], [radius * .87, radius * .87, .35], detail);
  }

  private garden() {
    this.island(-6.9, -.48, -1.8, 1.55);
    this.island(-3.6, -.4, -5.8, 1.56);
    this.island(1.25, -.95, -6.7, 1.94);
    this.part("dome", "glass", [-3.6, -.28, -5.8], [1.24, 1.43, 1.24]);
    this.part("dome", "glass", [1.25, -.8, -6.7], [1.62, 1.08, 1.62], 1);
    this.pipe([-3.65, -.39, -5.8], [1.25, -.9, -6.7], .23, "porcelain");
    this.pipe([-3.65, -.18, -5.8], [1.25, -.69, -6.7], .052, "power", 1);
    this.spill(1.8, -.84, -5.3, 1.8, .65);
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.4;
      const x = -6.9 + Math.cos(angle) * (i % 3) * .51;
      const z = -1.8 + Math.sin(angle) * (i % 4) * .37;
      this.part("gem", "foliage", [x, -.17, z], [.18, .34 + (i % 3) * .1, .18], 1);
      this.part("orb", i % 2 ? "glass" : "power", [x, .09 + (i % 5) * .19, z], [.085, .085, .085], 2);
    }
    this.arch(3.9, -.05, -8.85, .92, 1);
    this.island(-4.8, -2.0, 5.3, 1.34, "foliage", 1);
    this.part("dome", "glass", [-4.8, -1.9, 5.3], [1.03, 1.08, 1.03], 1);
    this.island(-7.35,-1.47,2.6,1.24,"foliage",1);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      const x=-7.35+Math.cos(angle)*.78,z=2.6+Math.sin(angle)*.7;
      this.part("gem","foliage",[x,-1.24,z],[.12,.32,.12],1);
      this.part("orb","power",[x,-1.01,z],[.09,.07,.09],1);
    }
    this.spill(-7.13,-1.41,3.44,1.7,.41);
  }

  private reservoir() {
    for (const [x, radius, y] of [[-3.8, 1.48, .42], [.3, 1.91, .5], [4.6, 1.3, -.12]]) {
      this.island(x, y - 1.1, -5.4, radius + .30, "porcelain");
      this.part("pipe", "glass", [x, y, -5.4], [radius, 1.85, radius]);
      this.part("pipe", "water", [x, y - .4, -5.4], [radius * .93, 1, radius * .93]);
      this.part("ring", "porcelain", [x, y + .93, -5.4], [radius, radius, .61], 0, horizontalRing);
      this.part("dome", "glass", [x, y + .98, -5.4], [radius, .67, radius], 1);
      this.spill(x, y + .07, -5.36 + radius, 2.6 + y, radius * .62);
    }
    this.pipe([-3.8, -.37, -5.55], [4.6, -.37, -5.55], .26, "steel");
    this.pipe([-3.8, .29, -6.14], [4.6, .29, -6.14], .08, "power", 1);
    this.island(-6.2, -1.55, -7.1, 1.4, "foliage", 1);
    this.part("box", "porcelain", [-5, -1.08, -6.14], [3, .12, .48], 1);
    this.island(-4.4, -2, 4.7, 1.5, "porcelain", 1);
    this.part("pipe", "water", [-4.4, -1.85, 4.7], [1.25, .24, 1.25], 1);
    this.part("ring", "porcelain", [-4.4, -1.71, 4.7], [1.26, 1.26, .46], 1, horizontalRing);
    this.pipe([-4.38,-1.78,4.7],[1.44,-2.08,4.36],.21,"glass",1);
    this.pipe([-4.38,-1.82,4.72],[1.44,-2.12,4.38],.09,"water",1);
    this.island(1.44,-2.12,4.36,.97,"porcelain",1);
    for(const x of [-2.5,-.6])this.part("ring","porcelain",[x,-1.88,4.56],[.26,.26,.36],2);
  }

  private terraces() {
    for (const [x, y, z, radius] of [[-5, 1, -4.75, 1.5], [-1.25, -.02, -5.2, 1.6], [2.65, -1.25, -5.35, 1.66]]) {
      this.island(x, y, z, radius, "porcelain");
      this.part("pipe", "glass", [x, (y - 3) / 2, z], [.27, y + 3, .27]);
      this.part("box", "steel", [x, y + .13, z], [radius * 1.1, .18, radius * .8], 1);
      this.spill(x + .45, y, z + radius * .82, 2.6 + y, .45);
      for (let i = 0; i < 4; i++) {
        this.part("gem", "foliage", [x - .84 + i * .23, y + .25, z + .72], [.14, .34 + .07 * i, .13], 1);
      }
    }
    this.pipe([-5, 1.06, -4.75], [-1.25, .11, -5.2], .18, "steel");
    this.pipe([-1.25, .11, -5.2], [2.65, -1.16, -5.35], .22, "power");
    this.pipe([-5.3, 1.4, -5.8], [3, -.4, -6.3], .13, "porcelain", 1);
    this.part("box", "glass", [5.3, .55, -5.35], [.95, 1.54, .21]);
    this.part("gem", "power", [5.3, 1.03, -5.18], [.19, .25, .09], 1);
    this.island(-5.1, -1.71, 4.2, 1.3, "foliage", 1);
    this.pipe([-5.1, -1.67, 4.2], [-.6, -2.54, 5.2], .21, "steel", 1);
    this.island(-.6, -2.54, 5.2, .93, "porcelain", 1);
    for(const [x,y] of [[-6.8,1.4],[-3.6,.6],[-.4,-.35]]){
      this.part("pipe","glass",[x,y-1.2,-7.2],[.34,2.4,.34],1);
      this.pipe([x-.85,y+.11,-7.2],[x+.85,y+.11,-7.2],.21,"porcelain",1);
      for(let i=0;i<4;i++)this.part("gem","foliage",[x+i*.19-.28,y-.5-i*.15,-6.92],[.12,.40,.09],2);
    }
  }

  private wheel(x: number, y: number, z: number, radius: number) {
    this.arch(x, y, z, radius);
    const rotor = new T.Group();
    rotor.position.set(x, y, z + .1);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * .4;
      const blade = new T.Mesh(this.geometry.box, this.materials.steel);
      blade.rotation.z = angle;
      blade.position.set(-Math.sin(angle) * radius * .46, Math.cos(angle) * radius * .46, 0);
      blade.scale.set(.15, radius * .84, .11);
      rotor.add(blade);
    }
    this.layers[1].add(rotor);
    this.wheels.push(rotor);
    this.part("orb", "power", [x, y, z + .22], [.25, .25, .22]);
  }

  private intake() {
    for (const x of [-4.6, -1.1, 2.4]) {
      this.island(x, -.61, -5.1, 1.28, "porcelain");
      this.wheel(x, .54, -4.85, .91);
      this.pipe([x, .54, -5.1], [x, .54, -6.55], .29, "steel");
      this.pipe([x, .55, -6.55], [x, -.84, -6.55], .22, "steel");
      this.spill(x + .43, -.45, -4.25, 1.7, .51);
    }
    this.pipe([-5.7, -.84, -6.55], [4.7, -.84, -6.55], .24, "steel");
    this.pipe([-5.7, -.48, -6.55], [4.7, -.48, -6.55], .075, "power");
    this.island(5.2, -.7, -5.1, 1.58, "porcelain");
    this.part("dome", "glass", [5.2, -.55, -5.1], [1.29, 1.34, 1.29]);
    this.part("box", "power", [5.2, -.19, -4.6], [.69, .22, .12], 2);
    this.island(-3.3, -1.9, 5.75, 1.25, "porcelain", 1);
    this.pipe([-4.1, -1.66, 5.75], [-.3, -1.66, 5.75], .2, "steel", 1);
    this.pipe([-4.1, -1.46, 5.75], [-.3, -1.46, 5.75], .06, "power", 1);
    this.island(-6.95,-1.05,-7.1,1.35,"porcelain",1);
    this.part("box","steel",[-6.95,.09,-7.1],[1.1,2.25,.97],1);
    this.part("dome","glass",[-6.95,1.23,-7.1],[.82,.61,.69],1);
    this.pipe([-6.95,-.6,-7.1],[-4.52,-.6,-6.56],.23,"steel",1);
    for(const y of [-.51,.02,.55])this.part("box","power",[-6.95,y,-6.58],[.59,.1,.08],2);
  }

  private crown() {
    this.island(-.8, -.65, -7.45, 2.13, "porcelain");
    this.part("gem", "power", [-.8, 1.62, -7.45], [.79, 1.55, .79]);
    this.part("gem", "glass", [-.8, 1.62, -7.45], [1.03, 1.78, 1.03], 1);
    for (const x of [-5.35, 3.8]) {
      this.island(x, -.95, -7, 1.96, "foliage");
      this.part("pipe", "porcelain", [x, .4, -7], [.54, 2.65, .54]);
      this.part("dome", "glass", [x, 1.75, -7], [.77, .63, .77]);
      this.arch(x, .72, -6.45, 1.04, 1);
      this.pipe([x, .36, -6.85], [-.8, .36, -7.45], .16, "power");
      this.part("box", "water", [x * .47 - .35, -.37, -7.17], [Math.abs(x + .8), .13, 1.2]);
      this.spill(x, -.22, -5.87, 2.8, 1.01);
    }
    this.spill(-.8, -.58, -5.67, 2.42, 1.52);
    this.island(5, -1.4, -10.7, 2.24, "foliage", 1);
    this.island(-7.4, -1.8, -10.1, 2.55, "foliage", 1);
    this.arch(-.8, .66, -8.71, 2, 2);
    for(const x of [-4.3,2.75]){
      this.part("pipe","glass",[x,1.1,-9.1],[.57,3.45,.57],1);
      this.part("gem","power",[x,2.95,-9.1],[.33,.51,.33],1);
      this.spill(x,.21,-8.54,3.1,.79);
      this.pipe([x,.64,-8.7],[-.8,1.01,-7.71],.095,"power",2);
    }
    this.pipe([-6.9, -2.22, 6.2], [3.6, -2.22, 6.2], .16, "porcelain", 1);
    this.part("box", "water", [-1.65, -2.14, 6.2], [10.5, .11, .77], 1);
    for (const x of [-5.9, 2.55]) {
      this.island(x, -2.38, 6.2, 1.08, "jade", 1);
      this.part("gem", "power", [x, -1.93, 6.2], [.18, .37, .18], 1);
    }
  }

  setPower(stage: number, switches: number) {
    const livePower = Math.min(1, switches / (this.level === 5 ? 3 : 1));
    this.energy = stage === 5 ? 1 : .62 * stage / 5 + .38 * livePower;
    this.materials.power.color.copy(this.quiet).lerp(this.lit, this.energy);
    this.materials.water.opacity = .42 + .23 * this.energy;
  }

  animate(time: number, reduced: boolean, quality: string) {
    const low = quality === "low";
    this.layers[1].visible = !low;
    this.layers[2].visible = quality === "high";
    if (low) return;
    this.wheels.forEach((wheel, i) => {
      wheel.rotation.z = reduced ? 0 : time * this.energy * .65 + i * .2;
    });
    const foam = this.foam;
    if (!foam) return;
    const count = quality === "high" ? 6 : 3;
    if (reduced && this.stillFoamDensity === count) return;
    this.stillFoamDensity = reduced ? count : 0;
    this.falls.forEach(({x, top, z, height, width}, fall) => {
      for (let i = 0; i < count; i++) {
        const phase = (i * .173 + fall * .249 + (reduced ? 0 : time * (.3 + this.energy * .35))) % 1;
        this.dropTransform.makeScale(.035 + width * .025, .32, .015);
        this.dropTransform.setPosition(x + (i / (count - 1) - .5) * width * .78, top - height * phase, z + .10);
        foam.setMatrixAt(fall * count + i, this.dropTransform);
      }
    });
    foam.count = this.falls.length * count;
    foam.instanceMatrix.needsUpdate = true;
  }
}
