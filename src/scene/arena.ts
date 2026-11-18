import { StoryEnvironment, type Environment } from "../story/environment";
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { gameToWorld, worldToGame, screenToWorld } from "./coordinates";
import type { Level, State } from "../game/engine";
import type { View } from "../game/render";
export type Quality = "auto" | "low" | "medium" | "high";
export type Block = {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rotation?: { x: number; y: number; z: number; w: number };
  kind?: string;
  switchId?: string;
};
export type SceneOrb = {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  state: string;
  rotation?: { x: number; y: number; z: number; w: number };
};
export type SceneData = {
  blocks: Block[];
  orbs: SceneOrb[];
  goals: {
    id: number;
    x: number;
    y: number;
    z: number;
    radius: number;
    color: string;
  }[];
  switches: { id: string; x: number; y: number; z: number; radius: number }[];
  native: boolean;
  story?: Environment;
};
export class Arena3D {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  environment:T.CubeTexture|null=null;
  story?: StoryEnvironment;
  private selection?: T.LineSegments;
  camera = new T.OrthographicCamera(-9, 9, 9, -9, 0.1, 100);
  root = new T.Group();
  orbs = new Map<number, T.Mesh>();
  labels = new Map<number, T.Sprite>();
  gates = new Map<string, T.Mesh>();
  plates = new Map<string, T.Mesh>();
  targets = new Map<number, T.Mesh>();
  surfaces: T.Mesh[] = [];
  blockers:T.Mesh[]=[];
  resources = new Set<{ dispose: () => void }>();
  sun = new T.DirectionalLight("#fff0cc", 2);
  preview: T.Mesh;
  marker: T.Mesh;
  waves: { mesh: T.Mesh; age: number; spatial: boolean }[] = [];
  lost = false;
  disposed = false;
  quality: Quality = "auto";
  preset = "isometric";
  zoom = 1;
  frames = 0;
  slow = 0;
  autoSettled = false;
  lastDraw = 0;
  native = false;
  targetCamera: T.Vector3 | null = null;
  aimPoint: T.Vector3 | null = null;
  aimRadius = 3;
  spatialAim = false;
  arrows = new Map<number, T.ArrowHelper>();
  dirty = true;
  onLost = () => {};
  onRestored = () => {};
  private loss = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.onLost();
  };
  private restore = () => {
    this.lost = false;
    this.onRestored();
  };
  constructor(
    public canvas: HTMLCanvasElement,
    data: SceneData,
  ) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "low-power",
    });
    this.renderer.setClearColor("#bdebfa");
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    const faces = Array.from({ length: 6 }, () => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const gradient = g.createLinearGradient(0, 0, 0, 64);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.45, "#c5f6ff");
      gradient.addColorStop(1, "#578f9c");
      g.fillStyle = gradient;
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#ffffff";
      g.fillRect(8, 8, 18, 6);
      return c;
    });
    const env = this.own(new T.CubeTexture(faces));
    env.needsUpdate = true;
    this.environment=env;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.4;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene.fog = new T.Fog("#bdebfa", 28, 60);
    this.scene.add(this.root, new T.HemisphereLight("#efffff", "#68a0a4", 1.2));
    this.sun.position.set(-6, 16, 8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -9,
      right: 9,
      top: 9,
      bottom: -9,
    });
    this.sun.shadow.bias = -0.001;
    this.scene.add(this.sun);
    const ocean = this.mesh(
      new T.CylinderGeometry(25, 25, 0.12, 64),
      "#55c9d7",
    );
    ocean.position.y = -3.5;
    this.scene.add(ocean);
    for (let i = 0; i < 7; i++) {
      const cloud = this.mesh(new T.SphereGeometry(1, 12, 8), "#f4fdff");
      cloud.scale.set(2.2, 0.35, 1);
      cloud.position.set((i - 3) * 7, -0.8, -13 - Math.abs(i - 3));
      this.scene.add(cloud);
    }
    this.preview = this.mesh(
      data.native
        ? new T.SphereGeometry(1, 24, 12)
        : new T.TorusGeometry(1, 0.006, 4, 64),
      "#087d98",
    );
    const pm = this.preview.material as T.MeshPhysicalMaterial;
    pm.wireframe = data.native;
    if (!data.native) this.preview.rotation.x = -Math.PI / 2;
    pm.transparent = true;
    pm.opacity = 0.18;
    pm.depthWrite = false;
    this.scene.add(this.preview);
    this.preview.visible = false;
    this.marker = this.mesh(new T.TorusGeometry(0.18, 0.035, 8, 32), "#073f61");
    this.marker.rotation.x = -Math.PI / 2;
    this.scene.add(this.marker);
    this.marker.visible = false;
    this.setData(data);
    if (data.story) this.story = new StoryEnvironment(this,data.story);
    this.setQuality("auto");
    this.setCamera("isometric");
    canvas.addEventListener("webglcontextlost", this.loss);
    canvas.addEventListener("webglcontextrestored", this.restore);
    canvas.dataset.renderer = "three";
  }
  own<A extends { dispose: () => void }>(a: A): A {
    this.resources.add(a);
    return a;
  }
  mesh(geometry: T.BufferGeometry, color: string) {
    const mesh = new T.Mesh(
      this.own(geometry),
      this.own(
        new T.MeshPhysicalMaterial({
          color,
          roughness: 0.28,
          metalness: 0.08,
          clearcoat: this.quality==='low'?0:0.65,
        }),
      ),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  label(text: string) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f4fdff";
    g.beginPath();
    g.arc(32, 32, 27, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#16435a";
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "#16435a";
    g.font = "bold 36px system-ui";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 32, 33);
    const tex = this.own(new T.CanvasTexture(c));
    const s = new T.Sprite(
      this.own(new T.SpriteMaterial({ map: tex, depthTest: false })),
    );
    s.scale.set(0.53, 0.53, 1);
    s.renderOrder = 10;
    return s;
  }
  setData(data: SceneData) {
    this.native = data.native;
    for (const b of data.blocks) {
      const m = this.mesh(
        !b.kind
          ? new RoundedBoxGeometry(b.w, b.h, b.d, 2, Math.min(0.08, b.h / 4))
          : new T.BoxGeometry(b.w, b.h, b.d),
        b.kind === "gate"
          ? "#8f9bd5"
          : b.kind === "wall"
            ? "#a8dbe5"
            : data.story?.theme.platform ?? "#caf1ec",
      );
      m.position.set(b.x, b.y, b.z);
      if (b.rotation) m.quaternion.copy(b.rotation);
      this.root.add(m);
      this.blockers.push(m);
      if (!b.kind) {
        const rim = this.mesh(
          new T.BoxGeometry(b.w + 0.02, 0.035, b.d + 0.02),
          "#55d0e8",
        );
        rim.position.y = b.h / 2 - 0.035;
        m.add(rim);
        const face = this.mesh(
          new T.BoxGeometry(
            Math.max(0.1, b.w - 0.08),
            0.04,
            Math.max(0.1, b.d - 0.08),
          ),
          b.rotation ? "#83cebf" : "#bce4de",
        );
        face.position.y = b.h / 2 + (data.story ? -0.016 : -0.02);
        m.add(face);
      }
      if (b.kind === "gate") this.gates.set(b.id, m);
      else if (b.kind !== "wall") {
        m.userData.id = b.id;
        this.surfaces.push(m);
      }
      const edges = new T.LineSegments(
        this.own(new T.EdgesGeometry(m.geometry)),
        this.own(
          new T.LineBasicMaterial({
            color: b.kind === "gate" ? "#6258a2" : "#69adbc",
          }),
        ),
      );
      m.add(edges);
    }
    for (const o of data.orbs) {
      const m = this.mesh(new T.SphereGeometry(o.radius, 24, 16), o.color);
      const shell=m.material as T.MeshPhysicalMaterial;
      shell.transparent=true; shell.opacity=.66; shell.depthWrite=false; shell.roughness=.14;
      const core=this.mesh(new T.SphereGeometry(o.radius*.72,16,12),o.color);
      m.add(core);
      const band = this.mesh(
        new T.TorusGeometry(o.radius * 0.96, 0.018, 6, 32),
        "#f4fdff",
      );
      m.add(band);
      this.root.add(m);
      this.orbs.set(o.id, m);
      const arrow = new T.ArrowHelper(
        new T.Vector3(1, 0, 0),
        new T.Vector3(),
        1,
        0x16435a,
        0.16,
        0.1,
      );
      this.own(arrow.line.geometry);
      this.own(arrow.cone.geometry);
      this.own(arrow.line.material as T.Material);
      this.own(arrow.cone.material as T.Material);
      arrow.visible = false;
      this.root.add(arrow);
      this.arrows.set(o.id, arrow);
      const label = this.label(String(o.id + 1));
      this.root.add(label);
      this.labels.set(o.id, label);
    }
    for (const g of data.goals) {
      const ring = this.mesh(
        new T.TorusGeometry(g.radius, 0.065, 8, 40),
        g.color,
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(g.x, g.y + 0.035, g.z);
      const well = this.mesh(
        new T.CylinderGeometry(g.radius * 0.9, g.radius * 0.9, 0.035, 32),
        "#8ee8cf",
      );
      well.position.set(g.x, g.y + 0.005, g.z);
      this.root.add(well);
      this.root.add(ring);
      this.targets.set(g.id, ring);
      const label = this.label(String(g.id + 1));
      label.position.set(g.x, g.y + 0.16, g.z);
      this.root.add(label);
    }
    for (const sw of data.switches) {
      const m = this.mesh(
        new T.CylinderGeometry(sw.radius, sw.radius, 0.09, 24),
        "#a29ed6",
      );
      m.position.set(sw.x, sw.y + 0.045, sw.z);
      this.root.add(m);
      this.plates.set(sw.id, m);
      const label = this.label("◇");
      label.position.set(sw.x, sw.y + 0.18, sw.z);
      this.root.add(label);
      for (const b of data.blocks.filter((b) => b.switchId === sw.id)) {
        const line = new T.Line(
          this.own(
            new T.BufferGeometry().setFromPoints([
              new T.Vector3(sw.x, sw.y + 0.02, sw.z),
              new T.Vector3(b.x, b.y + b.h / 2 + 0.02, b.z),
            ]),
          ),
          this.own(
            new T.LineDashedMaterial({
              color: "#647ca5",
              dashSize: 0.12,
              gapSize: 0.08,
            }),
          ),
        );
        line.computeLineDistances();
        this.root.add(line);
      }
    }
    this.update(data.orbs, [], []);
  }
  setQuality(q: Quality) {
    this.quality = q;
    const effective = q === "auto" ? "medium" : q;
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio || 1,
        effective === "high" ? 2 : effective === "low" ? 1 : 1.5,
      ),
    );
    this.renderer.shadowMap.enabled = effective !== "low";
    this.scene.environment=effective==='low'?null:this.environment;
    for(const resource of this.resources)if(resource instanceof T.MeshPhysicalMaterial){resource.userData.baseRoughness??=resource.roughness;resource.userData.baseClearcoat??=resource.clearcoat;resource.clearcoat=effective==='low'?0:resource.userData.baseClearcoat;resource.roughness=effective==='low'?.65:resource.userData.baseRoughness;resource.needsUpdate=true;}
    this.sun.shadow.mapSize.set(
      effective === "high" ? 1024 : 512,
      effective === "high" ? 1024 : 512,
    );
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.resize();
    this.canvas.dataset.quality = effective;
  }
  setCamera(p: string, animate = false) {
    this.preset = p;
    const v =
      p === "top"
        ? new T.Vector3(0, 22, 0.001)
        : p === "classic"
          ? new T.Vector3(0, 20, 12)
          : new T.Vector3(11, 17, 13);
    if (animate) {
      this.targetCamera = v;
      this.dirty = true;
      return;
    }
    this.targetCamera = null;
    this.camera.position.copy(v);
    this.camera.lookAt(0, this.native ? 0.65 : 0, 0);
    this.camera.updateMatrixWorld();
    this.resize();
  }
  resize() {
    this.dirty = true;
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    this.renderer.setSize(r.width, r.height, false);
    const aspect = r.width / r.height,
      span = 9.3 / this.zoom;
    this.camera.left = -span * Math.max(1, aspect);
    this.camera.right = -this.camera.left;
    this.camera.top = span / Math.min(1, aspect);
    this.camera.bottom = -this.camera.top;
    this.camera.updateProjectionMatrix();
    this.canvas.dataset.projection = JSON.stringify(
      new T.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse,
      ).elements,
    );
  }
  point(x: number, y: number, height = 0) {
    return screenToWorld(
      x,
      y,
      this.canvas.getBoundingClientRect(),
      this.camera,
      height,
    );
  }
  pick(x: number, y: number, surface = "auto") {
    const r = this.canvas.getBoundingClientRect(),
      ray = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2(
        ((x - r.left) / r.width) * 2 - 1,
        1 - ((y - r.top) / r.height) * 2,
      ),
      this.camera,
    );
    return (
      ray
        .intersectObjects(
          this.surfaces.filter(
            (m) => surface === "auto" || m.userData.id === surface,
          ),
          false,
        )
        .find((h) => h.face && h.face.normal.y > 0.5) || null
    );
  }
  highlightSurface(id: string) {
    if (this.selection) {
      this.selection.removeFromParent();
      for (const resource of [this.selection.geometry, this.selection.material as T.Material]) {
        resource.dispose();
        this.resources.delete(resource);
      }
      this.selection = undefined;
    }
    const surface = this.surfaces.find(mesh => mesh.userData.id === id);
    if (surface) {
      this.selection = new T.LineSegments(
        this.own(new T.EdgesGeometry(surface.geometry, 45)),
        this.own(new T.LineBasicMaterial({color:"#006779", depthTest:false, transparent:true, opacity:.85})),
      );
      this.selection.renderOrder = 4;
      surface.add(this.selection);
    }
    this.dirty = true;
    this.canvas.dataset.surface = surface ? id : "";
  }
  update(orbs: SceneOrb[], opened: string[], activated: string[]) {
    this.story?.update(activated);
    for (const o of orbs) {
      const m = this.orbs.get(o.id)!;
      const dx = o.x - m.position.x,
        dz = o.z - m.position.z;
      if (!o.rotation && Math.hypot(dx, dz) > 0)
        m.rotateOnWorldAxis(
          new T.Vector3(dz, 0, -dx).normalize(),
          Math.hypot(dx, dz) / o.radius,
        );
      m.position.set(o.x, o.y, o.z);
      m.visible = o.state !== "destroyed";
      if (o.rotation) m.quaternion.copy(o.rotation);
      const label = this.labels.get(o.id)!;
      label.position.set(o.x, o.y + o.radius + 0.16, o.z);
      label.visible = m.visible;
      const arrow = this.arrows.get(o.id)!;
      const delta = this.aimPoint
        ? m.position.clone().sub(this.aimPoint)
        : null;
      if (delta && !this.spatialAim) delta.y = 0;
      const dist = delta?.length() ?? Infinity;
      arrow.visible = !!delta && o.state === "active" && dist < this.aimRadius;
      if (arrow.visible) {
        arrow.position.copy(m.position);
        arrow.setDirection(
          delta!.length() ? delta!.normalize() : new T.Vector3(1, 0, 0),
        );
        arrow.setLength(
          0.3 + 1.2 * (1 - dist / this.aimRadius) ** 2,
          0.16,
          0.1,
        );
      }
      (m.material as T.MeshPhysicalMaterial).emissive.set(
        arrow.visible ? "#16435a" : "#000000",
      );
      const target = this.targets.get(o.id);
      if (target)
        (target.material as T.MeshPhysicalMaterial).emissive.set(
          o.state === "docked" ? "#168757" : "#000000",
        );
    }
    for (const [id, m] of this.gates) m.visible = !opened.includes(id);
    for (const [id, m] of this.plates)
      (m.material as T.MeshPhysicalMaterial).color.set(
        activated.includes(id) ? "#70ce76" : "#a29ed6",
      );
  }
  aim(p: T.Vector3 | null, radius = 3, spatial = false) {
    this.dirty = true;
    this.aimPoint = p;
    this.aimRadius = radius;
    this.spatialAim = spatial;
    this.preview.visible = !!p;
    this.marker.visible = !!p;
    if (!p) return;
    this.preview.position.copy(p);
    this.preview.scale.setScalar(radius);
    this.marker.position.copy(p);
    this.marker.position.y += 0.04;
  }
  pulse(p: T.Vector3, spatial = false) {
    if (this.waves.length >= 8) {
      const old = this.waves.shift()!;
      this.scene.remove(old.mesh);
      this.release(old.mesh);
    }
    const m = this.mesh(
      spatial
        ? new T.SphereGeometry(1, 20, 12)
        : new T.TorusGeometry(1, 0.015, 6, 48),
      "#56dcca",
    );
    const mat = m.material as T.MeshPhysicalMaterial;
    mat.transparent = true;
    mat.opacity = 0.65;
    mat.wireframe = spatial;
    mat.depthWrite = false;
    if (!spatial) m.rotation.x = -Math.PI / 2;
    m.position.copy(p);
    m.position.y += 0.04;
    this.scene.add(m);
    this.waves.push({ mesh: m, age: 0, spatial });
  }
  release(m: T.Mesh) {
    m.geometry.dispose();
    this.resources.delete(m.geometry);
    const mat = m.material as T.Material;
    mat.dispose();
    this.resources.delete(mat);
  }
  draw(dt: number, reduced = false, idle = false) {
    if (this.lost || this.disposed) return;
    const now = performance.now();
    if (
      idle &&
      !this.dirty &&
      !this.waves.length &&
      !this.targetCamera &&
      now - this.lastDraw < 150
    )
      return;
    this.lastDraw = now;
    this.dirty = false;
    if (this.targetCamera) {
      this.camera.position.lerp(
        this.targetCamera,
        reduced ? 1 : 1 - Math.exp(-dt * 14),
      );
      if (this.camera.position.distanceTo(this.targetCamera) < 0.01) {
        this.camera.position.copy(this.targetCamera);
        this.targetCamera = null;
      }
      this.camera.lookAt(0, this.native ? 0.65 : 0, 0);
      this.camera.updateMatrixWorld();
      this.canvas.dataset.projection = JSON.stringify(
        new T.Matrix4().multiplyMatrices(
          this.camera.projectionMatrix,
          this.camera.matrixWorldInverse,
        ).elements,
      );
    }
    for (const w of this.waves) {
      w.age += dt;
      w.mesh.scale.setScalar(reduced ? 0.7 : Math.max(0.01, (w.age / 0.6) * 3));
      (w.mesh.material as T.Material).opacity =
        Math.max(0, 1 - w.age / 0.6) * 0.6;
    }
    for (const w of this.waves.filter((w) => w.age >= 0.6)) {
      this.scene.remove(w.mesh);
      this.release(w.mesh);
    }
    this.waves = this.waves.filter((w) => w.age < 0.6);
    // Fade only structures lying in front of a marble or receiving ring.
    // The physical collider and surface picker remain unchanged.
    this.scene.updateMatrixWorld(true);
    const obstructing=new Set<T.Mesh>();
    const ray=new T.Raycaster();
    const points=[...this.orbs.values(),...this.targets.values()].filter(m=>m.visible).map(m=>m.position);
    for(const point of points){
      const projected=point.clone().project(this.camera);
      ray.setFromCamera(new T.Vector2(projected.x,projected.y),this.camera);
      const distance=ray.ray.origin.distanceTo(point);
      for(const hit of ray.intersectObjects(this.blockers.filter(m=>m.visible),false))if(hit.distance<distance-.12)obstructing.add(hit.object as T.Mesh);
    }
    for(const block of this.blockers)block.traverse(object=>{if(object instanceof T.Mesh){const material=object.material as T.Material;const faded=obstructing.has(block);if(material.transparent!==faded){material.transparent=faded;material.needsUpdate=true;}material.opacity=faded?.22:1;material.depthWrite=!faded;}});
    this.canvas.dataset.occluded=String(obstructing.size);
    this.story?.animate(dt,reduced);
    this.renderer.render(this.scene, this.camera);
    if (this.quality === "auto" && !this.autoSettled && dt > 0) {
      this.frames++;
      if (dt > 0.03) this.slow++;
      if (this.frames === 120) {
        this.autoSettled = true;
        if (this.slow > 30) this.setQuality("low");
      }
    }
    this.canvas.dataset.resources = JSON.stringify(this.renderer.info.memory);
  }
  clearEffects(){for(const wave of this.waves){this.scene.remove(wave.mesh);this.release(wave.mesh);}this.waves=[];this.aim(null);this.dirty=true;}
  screenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener("webglcontextlost", this.loss);
    this.canvas.removeEventListener("webglcontextrestored", this.restore);
    for (const r of this.resources) r.dispose();
    this.resources.clear();
    this.sun.shadow.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
export function classicData(l: Level): SceneData {
  return {
    native: false,
    blocks: [
      { id: "board", x: 0, y: -0.25, z: 0, w: 12, h: 0.5, d: 12 },
      ...l.obstacles.map((b, i) => ({
        id: "wall" + i,
        x: (b.x + b.w / 2 - 360) / 60,
        y: 0.25,
        z: (b.y + b.h / 2 - 360) / 60,
        w: b.w / 60,
        h: 0.5,
        d: b.h / 60,
        kind: "wall",
      })),
      ...(l.gates || []).map((b) => ({
        id: b.id,
        switchId: b.switchId,
        x: (b.x + b.w / 2 - 360) / 60,
        y: 0.4,
        z: (b.y + b.h / 2 - 360) / 60,
        w: b.w / 60,
        h: 0.8,
        d: b.h / 60,
        kind: "gate",
      })),
    ],
    orbs: classicOrbs(l.orbs),
    goals: l.goals.map((g) => ({
      id: g.orbId,
      x: (g.x - 360) / 60,
      y: 0,
      z: (g.y - 360) / 60,
      radius: g.radius / 60,
      color: l.orbs.find((o) => o.id === g.orbId)!.color,
    })),
    switches: (l.switches || []).map((s) => ({
      ...s,
      x: (s.x - 360) / 60,
      y: 0,
      z: (s.y - 360) / 60,
      radius: s.radius / 60,
    })),
  };
}
export function classicOrbs(orbs: State["orbs"]): SceneOrb[] {
  return orbs.map((o) => ({
    ...o,
    x: (o.x - 360) / 60,
    z: (o.y - 360) / 60,
    y: o.radius / 60,
    radius: o.radius / 60,
  }));
}
export function addClassicObjects(a: Arena3D, l: Level) {
  for (const b of l.bumpers) {
    const m = a.mesh(
      new T.CylinderGeometry(b.radius / 60, b.radius / 60, 0.45, 24),
      "#9c9dde",
    );
    m.position.copy(gameToWorld(b.x, b.y, 0.225));
    a.root.add(m);
  }
  for (const h of l.hazards) {
    const m = a.mesh(new T.ConeGeometry(h.radius / 60, 0.5, 8), "#ac3756");
    m.position.copy(gameToWorld(h.x, h.y, 0.25));
    a.root.add(m);
  }
}
export function classicFrame(
  a: Arena3D,
  l: Level,
  s: State,
  v: View,
  dt: number,
) {
  a.update(classicOrbs(s.orbs), s.opened, s.activated);
  const p = v.aim && v.preview ? v.aim : v.hint;
  const aim = p ? gameToWorld(p.x, p.y, 0.02) : null;
  if (
    !aim !== !a.aimPoint ||
    (aim && a.aimPoint && aim.distanceTo(a.aimPoint) > 0.0001)
  )
    a.aim(aim, p === v.hint ? 0.3 : 3);
  for (const f of v.fx) {
    if (f.age === 0 && f.kind === "pulse") a.pulse(gameToWorld(f.x, f.y));
    f.age += dt;
  }
  v.fx = v.fx.filter((f) => f.age < 0.6);
  a.draw(dt, v.reduced, !s.started || s.paused || s.status !== "playing");
}
export const classicPoint = (a: Arena3D, x: number, y: number) => {
  const p = a.point(x, y);
  return p ? worldToGame(p) : { x: -1, y: -1 };
};
