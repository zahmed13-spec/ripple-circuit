import * as T from "three";
import type { Cast } from "./cast";
import type { Shot } from "./boards";
import { clamp,ease,mix,mouthAt,poseAt } from "./timeline";
import { FilmSet } from "./sets";
import { LumaRig,RippleRig } from "./rigs";

export class FilmStage {
  private resources = new Set<{dispose():void}>();
  private renderer:T.WebGLRenderer;
  private world=new T.Scene();
  private camera=new T.PerspectiveCamera(36,16/9,.1,90);
  private luma:LumaRig;
  private ripple:RippleRig;
  private set:FilmSet;
  private key=new T.DirectionalLight("#fff5d1",2.5);
  private focus=new T.Vector3();
  private offset=new T.Vector3();
  private quality:number;
  private clipDuration=0;
  private mixer?:T.AnimationMixer;
  private width=0;
  private height=0;
  private disposed=false;
  lost=false;
  private readonly onLost=(event:Event)=>{event.preventDefault();this.lost=true;};
  private readonly onRestored=()=>{this.lost=false;};

  constructor(readonly canvas:HTMLCanvasElement, eco:boolean, quality:"low"|"medium"|"high",cast?:Cast) {
    this.renderer=new T.WebGLRenderer({canvas,antialias:quality!=="low",alpha:false,powerPreference:"low-power",preserveDrawingBuffer:true});
    this.quality=quality==="high"?1.6:quality==="medium"?1.25:1;
    this.world.fog=new T.Fog("#cfe9ec",16,52);
    this.key.position.set(-5,8,5);
    this.world.add(this.key,new T.HemisphereLight("#e3f9ff","#365777",1.15));
    const gradient=this.own(new T.DataTexture(new Uint8Array([64,117,183,255]),4,1,T.RedFormat));
    gradient.minFilter=gradient.magFilter=T.NearestFilter;
    gradient.generateMipmaps=false;
    gradient.needsUpdate=true;
    if(cast)for(const resource of cast.resources)this.resources.add(resource);
    this.set=new FilmSet(this.world,this.own,gradient,eco,cast?.seal);
    this.luma=new LumaRig(this.own,gradient,cast);
    this.ripple=new RippleRig(this.own,gradient,cast);
    this.world.add(this.luma.object,this.ripple.object);
    if(cast){
      this.mixer=new T.AnimationMixer(this.world);
      for(const clip of cast.clips){
        this.clipDuration=Math.max(this.clipDuration,clip.duration);
        this.mixer.clipAction(clip).setLoop(T.LoopOnce,0).play().clampWhenFinished=true;
      }
      canvas.dataset.cast="blender";
    } else canvas.dataset.cast="procedural";
    canvas.addEventListener("webglcontextlost",this.onLost);
    canvas.addEventListener("webglcontextrestored",this.onRestored);
    canvas.dataset.renderer="three";
  }

  private own=<A extends {dispose():void}>(asset:A):A=>{
    this.resources.add(asset);
    return asset;
  };

  draw(shot:Shot,time:number,reduced:boolean) {
    if(this.disposed||this.lost)return;
    const w=this.canvas.clientWidth,h=this.canvas.clientHeight;
    if(!w||!h)return;
    if(this.width!==w||this.height!==h){
      this.width=w;
      this.height=h;
      this.renderer.setPixelRatio(Math.min(this.quality,devicePixelRatio));
      this.renderer.setSize(w,h,false);
      this.camera.aspect=w/h;
    }
    const phase=clamp(time/shot.seconds);
    const [start,end=start]=shot.lens;
    const t=reduced ? .4 : ease(clamp((time-.12)/(shot.seconds-.68)));
    for(let axis=0;axis<3;axis++){
      this.focus.setComponent(axis,mix(start[0][axis],end[0][axis],t));
      this.offset.setComponent(axis,mix(start[1][axis],end[1][axis],t));
    }
    this.camera.position.copy(this.focus).add(this.offset);
    const portrait=Math.min(1,this.camera.aspect/(16/10));
    this.camera.fov=mix(start[2],end[2],t)+(1-portrait)*19;
    this.camera.lookAt(this.focus);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    const pose=poseAt(shot,time,reduced);
    const energy=pose.power;
    this.key.intensity=1.2+energy*1.3;
    this.key.color.setHex(energy>.8?0xfff1c3:0xe4f7ff);
    if(this.mixer)this.mixer.setTime((reduced?.32:phase*.98)*this.clipDuration);
    this.set.apply(shot.effect,energy,time,phase,reduced);
    const line=shot.line;
    this.set.showWarning(shot.id==="directive-2" && line && (reduced || time>=line.in) ? line.text : "");
    this.ripple.apply(pose.ripple,time,energy,reduced);
    this.luma.apply(pose.luma,this.camera,pose.ripple?this.ripple.object.position:this.focus,
      reduced?"–":mouthAt(shot,time),time,reduced);
    this.renderer.render(this.world,this.camera);
    this.canvas.dataset.luma=pose.luma[5];
    this.canvas.dataset.pose=pose.luma.slice(0,5).map(n=>Number(n).toFixed(3)).join(",");
    this.canvas.dataset.energy=energy.toFixed(2);
    this.canvas.dataset.resources=String(this.resources.size);
  }

  dispose() {
    if(this.disposed)return;
    this.disposed=true;
    this.canvas.removeEventListener("webglcontextlost",this.onLost);
    this.canvas.removeEventListener("webglcontextrestored",this.onRestored);
    this.mixer?.stopAllAction();
    this.mixer?.uncacheRoot(this.world);
    for(const resource of this.resources)resource.dispose();
    this.resources.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
