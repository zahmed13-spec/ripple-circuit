import * as T from "three";
import type { Pose } from "./boards";
import type { Cast } from "./cast";

type Asset = {dispose():void};
export type Own = <T extends Asset>(item:T)=>T;
export function fill(own:Own,color:string) {return own(new T.MeshBasicMaterial({color}));}
export function cel(own:Own,ramp:T.DataTexture,color:string) {
  return own(new T.MeshToonMaterial({color,gradientMap:ramp}));
}

export class LumaRig {
  readonly object=new T.Group();
  private face=new T.Group();
  private eyes:T.Mesh[]=[];
  private pupils:T.Mesh[]=[];
  private glints:T.Mesh[]=[];
  private brows:T.Mesh[]=[];
  private lids:T.Mesh[]=[];
  private ears:T.Mesh[]=[];
  private mouth:T.Mesh;
  private tongue:T.Mesh;
  private rings:T.Group;
  private gaze=new T.Vector3();
  private projected=new T.Vector3();
  private shell:T.MeshBasicMaterial;

  constructor(own:Own,ramp:T.DataTexture,cast?:Cast) {
    const orb=own(new T.SphereGeometry(1,28,20));
    const ink=fill(own,"#163456");
    const glint=fill(own,"#f4ffff");
    const teal=cel(own,ramp,"#84f3e4");
    const lidShade=fill(own,"#7ccac7");
    const pink=fill(own,"#ffc1c4");
    this.shell=own(new T.MeshBasicMaterial({color:"#c9fff6",transparent:true,opacity:.23,depthWrite:false}));
    const outline=own(new T.MeshBasicMaterial({color:"#235778",side:T.BackSide}));
    const add=(mat:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,parent=this.face)=>{
      const m=new T.Mesh(orb,mat);
      m.position.set(x,y,z);
      m.scale.set(sx,sy,sz);
      parent.add(m);
      return m;
    };
    this.object.add(this.face);
    add(outline,0,0,0,.628,.565,.548);
    if(cast){
      cast.luma.material=teal;
      cast.crest.traverse(node=>{if(node instanceof T.Mesh)node.material=fill(own,"#f8e99a");});
      this.face.add(cast.luma,cast.crest);
    } else add(teal,0,0,0,.60,.54,.522);
    const gloss=add(this.shell,0,0,0,.613,.55,.535);
    gloss.renderOrder=1;
    add(glint,-.19,.33,.377,.16,.044,.027).rotation.z=.36;
    add(glint,-.318,.27,.377,.048,.024,.02).rotation.z=.44;
    for(const side of [-1,1]){
      this.ears.push(add(teal,side*.57,.18,-.01,.14,.31,.15));
      add(pink,side*.32,-.095,.437,.084,.036,.023);
      this.eyes.push(add(glint,side*.187,.045,.492,.116,.174,.052));
      this.pupils.push(add(ink,side*.187,.047,.541,.068,.109,.029));
      this.glints.push(add(glint,side*.187-.025,.093,.567,.024,.021,.011));
      this.brows.push(add(ink,side*.19,.287,.456,.105,.015,.016));
      const lid=add(lidShade,side*.187,.045,.547,.117,.12,.026);
      lid.visible=false;
      this.lids.push(lid);
    }
    if(cast){
      this.mouth=cast.mouth;
      this.mouth.material=ink;
      this.face.add(this.mouth);
    } else this.mouth=add(ink,0,-.177,.501,.078,.032,.031);
    this.tongue=add(pink,0,-.195,.529,.039,.014,.01);
    this.rings=new T.Group();
    this.object.add(this.rings);
    const ring=own(new T.TorusGeometry(.73,.022,8,50));
    const guide=new T.Mesh(ring,fill(own,"#fff5b4"));
    this.rings.position.y=.48;
    guide.rotation.set(1.44,.12,.04);
    this.rings.add(guide);
    add(glint,.71,.1,.1,.058,.058,.058,this.rings);
    add(glint,-.61,-.2,.09,.032,.032,.032,this.rings);
  }

  apply(pose:Pose,camera:T.Camera,look:T.Vector3|undefined,phoneme:string,time:number,reduced:boolean) {
    this.object.position.set(pose[0],pose[1],pose[2]);
    this.object.quaternion.copy(camera.quaternion);
    this.face.rotation.z=pose[3];
    this.face.scale.set(1/Math.sqrt(pose[4]),pose[4],1);
    const emotion=pose[5];
    const eye=emotion==="afraid"?1.2:emotion==="resolve"?.63:emotion==="downcast"?.52:emotion==="relief"?.78:1;
    const blink=!reduced && ((Math.floor(time*15)%67===49)||(Math.floor(time*15)%67===50));
    if(look) {
      this.gaze.copy(look).project(camera).sub(this.projected.copy(this.object.position).project(camera));
    } else this.gaze.set(0,0,0);
    const x=T.MathUtils.clamp(this.gaze.x*.17,-.04,.04);
    const y=T.MathUtils.clamp(this.gaze.y*.11,-.032,.026);
    for(let i=0;i<2;i++){
      const side=i===0?-1:1;
      this.eyes[i].scale.y=.174*eye;
      this.pupils[i].scale.y=.109*eye*(emotion==="afraid"?.78:1);
      this.pupils[i].position.set(side*.187+x,.045+y,.541);
      this.glints[i].position.set(side*.187+x-.025,.087+y,.567);
      this.eyes[i].visible=this.pupils[i].visible=this.glints[i].visible=!blink;
      this.lids[i].visible=blink;
      this.lids[i].scale.y=.018;
      this.brows[i].position.y=emotion==="afraid"?.32:emotion==="resolve"?.217:.286;
      this.brows[i].rotation.z=side*(emotion==="resolve"?.29:emotion==="afraid"?-.32:emotion==="downcast"?-.19:0);
      this.ears[i].rotation.z=side*(.44+pose[3]+(reduced?0:Math.sin(time*3)*.12));
    }
    const shape=phoneme==="a"?[.090,.067]:phoneme==="e"?[.115,.035]:phoneme==="o"?[.056,.065]:
      emotion==="bright"||emotion==="relief"?[.10,.032]:[.062,.013];
    if(this.mouth.morphTargetInfluences&&this.mouth.morphTargetDictionary){
      const cue=phoneme==="–"?"Rest":phoneme.toUpperCase();
      for(const [name,index] of Object.entries(this.mouth.morphTargetDictionary))
        this.mouth.morphTargetInfluences[index]=Number(name===cue);
    }else this.mouth.scale.set(shape[0],shape[1],.031);
    this.tongue.visible=shape[1]>.025;
    this.tongue.scale.y=shape[1]*.34;
    this.tongue.position.y=-.177-shape[1]*.42;
    this.rings.rotation.y=reduced?.18:time*.62;
    this.shell.opacity=emotion==="downcast"?.11:emotion==="afraid"?.17:.28;
  }
}

export class RippleRig {
  readonly object=new T.Group();
  private core:T.Mesh;
  private pulse:T.Mesh;
  private bands:T.Group;
  private brightness:T.MeshBasicMaterial;

  constructor(own:Own,ramp:T.DataTexture,cast?:Cast) {
    const shell=new T.Mesh(own(new T.SphereGeometry(.37,24,16)),own(new T.MeshBasicMaterial({color:"#36dcd2",transparent:true,opacity:.43,depthWrite:false})));
    this.object.add(shell);
    this.brightness=fill(own,"#efffd7");
    this.core=new T.Mesh(own(new T.IcosahedronGeometry(.23,1)),this.brightness);
    this.object.add(this.core);
    const star=cast?.ripple??new T.Mesh(own(new T.OctahedronGeometry(.23)),cel(own,ramp,"#53dff6"));
    if(cast)star.material=cel(own,ramp,"#53dff6");
    else star.scale.set(1.14,1.43,.74);
    this.core.add(star);
    this.bands=new T.Group();
    this.object.add(this.bands);
    const band=own(new T.TorusGeometry(.39,.017,5,32));
    const ink=fill(own,"#b9fff4");
    for(let i=0;i<2;i++){
      const m=new T.Mesh(band,ink);
      m.rotation.set(1.12,i*1.33,.5);
      this.bands.add(m);
    }
    const pulseInk=own(new T.MeshBasicMaterial({color:"#adfff1",transparent:true,opacity:0,depthWrite:false}));
    this.pulse=new T.Mesh(own(new T.TorusGeometry(.53,.026,5,48)),pulseInk);
    this.pulse.rotation.x=-Math.PI/2;
    this.object.add(this.pulse);
  }
  apply(pose:Pose|undefined,time:number,energy:number,reduced:boolean) {
    this.object.visible=!!pose;
    if(!pose)return;
    this.object.position.set(pose[0],pose[1],pose[2]);
    this.core.scale.setScalar(pose[4]);
    this.core.rotation.set(.35,reduced?.4:time*.8,pose[3]);
    this.bands.rotation.set(.14,reduced?.2:-time*.45,.22);
    const charge=T.MathUtils.clamp(.4+energy*.4+Math.max(0,pose[4]-1),0,1);
    this.brightness.color.setRGB(.25+charge*.65,.55+charge*.45,.69+charge*.25);
    const wave=(time*.8)%1;
    this.pulse.visible=!reduced&&pose[4]>1.03;
    this.pulse.scale.setScalar(.8+wave*2.7);
    (this.pulse.material as T.MeshBasicMaterial).opacity=(1-wave)*.66;
  }
}
