import * as T from "three";
import type { Arena3D, Quality } from "../arena";
import { compositions, type ScenicWorld } from "./compositions";
import { ScenicTrain } from "./train";

const colors = {
  aero:["#d8fff3","#71c779","#48d8f1","#f9ffec"],
  eco:["#e7f5c2","#478947","#96ed7b","#e9ff91"],
  terra:["#e9b57d","#87524f","#ff9d46","#fff2af"],
  metro:["#f3fff8","#6e87a9","#24dacb","#ffaff1"],
  null:["#a388c4","#352743","#e666be","#92f9eb"],
} as const;

type Motion = (time:number, reaction:number)=>void;
export class Panorama {
  readonly root=new T.Group();
  private readonly detail=new T.Group();
  private readonly accents=new T.Group();
  private readonly movers:Motion[]=[];
  private readonly signal:T.MeshStandardMaterial;
  private readonly ripple:T.Mesh<T.TorusGeometry,T.MeshBasicMaterial>;
  private readonly transit?:ScenicTrain;
  private readonly route:T.CatmullRomCurve3;
  private readonly packet:T.Mesh;
  private readonly particles:T.InstancedMesh;
  private readonly matrix=new T.Matrix4();
  private readonly liveColor:T.Color;
  private readonly dormantColor:T.Color;
  private stage=0;
  private phase=0;
  private age=4;
  private elapsed=0;

  constructor(private arena:Arena3D, private world:ScenicWorld, level:number) {
    const [label,x,z,size]=compositions[world][level-1];
    const [light,dark,highlight,spark]=colors[world];
    this.liveColor=new T.Color(highlight);
    this.dormantColor=new T.Color(dark);
    this.root.name="scenic-panorama";
    const far=new T.Group(), backdrop=new T.Group(), frame=new T.Group();
    this.root.add(far,backdrop,frame,this.detail,this.accents);
    arena.scene.add(this.root);
    arena.canvas.dataset.scenery=label;
    arena.canvas.dataset.sceneryWorld=world;
    const material=(color:string, roughness=.64, metalness=0)=>arena.own(new T.MeshStandardMaterial({color,roughness,metalness}));
    const stone=material(dark), cap=material(light,.38), trim=material(highlight,.31,.19);
    this.signal=material(highlight,.23);
    this.signal.emissive.set(highlight);
    const glass=arena.own(new T.MeshStandardMaterial({color:highlight,roughness:.21,metalness:.22,opacity:.34,transparent:true,depthWrite:false}));
    const glow=arena.own(new T.MeshBasicMaterial({color:spark}));
    const cloudInk=arena.own(new T.MeshLambertMaterial({color:"#eaffff"}));
    const ball=arena.own(new T.SphereGeometry(1,14,9));
    const rock=arena.own(new T.DodecahedronGeometry(1,0));
    const facet=arena.own(new T.CylinderGeometry(.17,.81,2,6));
    const cube=arena.own(new T.BoxGeometry());
    const ring=arena.own(new T.TorusGeometry(1,.052,5,28));
    const dome=arena.own(new T.SphereGeometry(1,18,10,0,2*Math.PI,0,Math.PI/2));
    const rod=arena.own(new T.CylinderGeometry(1,1,1,9));
    const grassScale=new T.Vector3();
    const xy=(a:number,b:number,c:number)=>new T.Vector3(a,b,c);
    function mesh(parent:T.Object3D,geometry:T.BufferGeometry,ink:T.Material,p:readonly [number,number,number],s:readonly [number,number,number]){
      const part=new T.Mesh(geometry,ink);
      part.position.set(...p);
      part.scale.set(...s);
      parent.add(part);
      return part;
    }
    function strut(parent:T.Object3D,a:T.Vector3,b:T.Vector3,r:number,ink:T.Material){
      const midpoint=a.clone().lerp(b,.5);
      const part=mesh(parent,rod,ink,midpoint.toArray(),[r,a.distanceTo(b),r]);
      part.quaternion.setFromUnitVectors(xy(0,1,0),b.clone().sub(a).normalize());
    }
    function island(parent:T.Object3D,a:number,b:number,c:number,w:number){
      const shelf=mesh(parent,rock,stone,[a,b-.76,c],[w,1.36,w*.64]);
      shelf.rotation.y=(a+b)*.14;
      mesh(parent,ball,cap,[a,b,c],[w*.96,.24,w*.59]);
    }

    // The outer horizon sits below or behind all puzzle surfaces.
    for(let i=0;i<5;i++){
      const a=-20+i*9.3, b=-2.15+(i%3)*.46, c=-16-(i%2)*6;
      if(world==="terra"||world==="null"){
        const cliff=mesh(far,rock,stone,[a,b-1,c],[4.1+(i%2),5.4+(i%3),3.2]);
        cliff.rotation.z=(i-2)*.19;
      } else island(far,a,b,c,3.5+i%3*.8);
    }
    const offset=(a:number,b:number,c:number)=>xy(x+a*size,b,z+c*size);
    const landmark=new T.Group();
    landmark.position.set(x,-.52,z);
    landmark.scale.setScalar(size);
    backdrop.add(landmark);

    if(world==="aero"){
      for(let cloud=0;cloud<6;cloud++){
        const group=new T.Group();
        far.add(group);
        const puff=arena.own(new T.InstancedMesh(ball,cloudInk,7));
        for(let i=0;i<7;i++){
          const scale=1+(i%3)*.22;
          this.matrix.makeScale(scale*1.45,.42+Math.sin((i+1)*.8)*.21,scale*.78)
            .setPosition((i-3)*.64,Math.sin(i*.76)*.36,Math.cos(i*.9)*.32);
          puff.setMatrixAt(i,this.matrix);
        }
        puff.computeBoundingSphere();
        group.add(puff);
        this.movers.push(t=>group.position.set(-16+cloud*6.05+Math.sin(t*(.11+cloud*.024)+cloud*.38)*2.5,
          -.25+(cloud%3)*.43+Math.sin(t*.19+cloud)*.16,cloud<2?-.6-cloud*3.1:-10-(cloud%2)*3.8));
      }
      island(landmark,0,-.25,0,2.46);
      if(level<=2){
        mesh(landmark,dome,glass,[0,.1,0],[1.75,1.54,1.05]);
        for(const a of [-1.15,0,1.15])mesh(landmark,ring,cap,[a,.48,0],[.58,.72,1]).rotation.y=Math.PI/2;
      } else {
        for(const a of [-1.42,0,1.42]){
          strut(landmark,xy(a,-.42,0),xy(a,1.35+level*.12,0),.13,cap);
          mesh(landmark,ring,this.signal,[a,1.5+level*.12,0],[.51,.64,.7]);
        }
        if(level===5)mesh(landmark,facet,this.signal,[0,1.7,.14],[.62,1.05,.62]);
      }
      strut(landmark,xy(-2,.09,.48),xy(2,.09,.48),.16,glass);
      for(let i=0;i<3;i++)mesh(landmark,cube,glass,[-1.32+i*1.32,-1.26,.75],[.25,2.36,.06]);
      const fallingWater=arena.own(new T.ShaderMaterial({
        transparent:true,depthWrite:false,side:T.DoubleSide,
        uniforms:{flow:{value:0},power:{value:0}},
        vertexShader:`varying vec2 field;
          void main(){field=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec2 field;uniform float flow,power;
          void main(){
            float streak=pow(.5+.5*sin(field.x*38.+sin(field.y*9.+flow)*.5),4.);
            float drops=pow(.5+.5*sin(field.y*19.+flow+field.x*21.),8.);
            float edge=smoothstep(0.,.15,field.x)*smoothstep(0.,.15,1.-field.x);
            gl_FragColor=vec4(mix(vec3(.1,.64,.78),vec3(.81,1.,1.),streak*.6+drops*.36),edge*(.31+power*.21));
            #include <colorspace_fragment>
          }`,
      }));
      const curtain=arena.own(new T.PlaneGeometry());
      mesh(landmark,curtain,fallingWater,[-1.48,-1.38,.85],[.64,2.9,1]);
      if(level>=3)mesh(landmark,curtain,fallingWater,[1.32,-1.7,.6],[1.15,3.5,1]);
      this.movers.push((time,reaction)=>{
        fallingWater.uniforms.flow.value=time*4.5;
        fallingWater.uniforms.power.value=Math.min(1,this.stage*.17+reaction);
      });
    } else if(world==="eco"){
      island(landmark,0,-.22,0,2.54);
      const trees=level===5?[-.85,0,.88]:level===2?[-1.25,.15,1.25]:[-1.35,1.3];
      const leaves=arena.own(new T.IcosahedronGeometry(1,1));
      for(const [i,a] of trees.entries()){
        const h=level===5&&i===1?2.62:1.27+(i%2)*.46;
        strut(landmark,xy(a,0,0),xy(a+.17,h,0),.105,stone);
        const crown=new T.Group();
        crown.position.set(a+.17,h,0);
        landmark.add(crown);
        for(let j=0;j<5;j++){
          const b=(j-2)*.23;
          strut(crown,xy(0,-.12,0),xy(b,.31-(j%2)*.21,.24*Math.sin(j)),.032,stone);
          mesh(crown,leaves,j===2?trim:cap,[b,.16+Math.sin(j)*.29,(j%2)*.23],[.40,.25,.36]);
        }
        this.movers.push((t,reaction)=>{
          crown.rotation.z=Math.sin(t*.95+i*1.4)*.13;
          crown.scale.setScalar(1+reaction*.24);
        });
      }
      for(const a of level===3?[-.84,.84]:[0]){
        mesh(landmark,dome,glass,[a,.08,.57],[.79,1.08,.8]);
        for(const turn of [0,Math.PI/2])mesh(landmark,ring,cap,[a,.53,.57],[.78,.61,.5]).rotation.y=turn;
      }
      const grass=arena.own(new T.InstancedMesh(facet,trim,54));
      this.detail.add(grass);
      grass.frustumCulled=false;
      this.movers.push(t=>{
        for(let i=0;i<54;i++){
          const angle=i*2.4, radius=.28+(i%16)*.091;
          this.matrix.makeRotationZ(Math.sin(t*1.4+radius*4+i*.27)*.32);
          this.matrix.scale(grassScale.set(.022,.11+(i%4)*.024,.019))
            .setPosition(x+Math.cos(angle)*radius*size,-.4,z+Math.sin(angle)*radius*size*.7);
          grass.setMatrixAt(i,this.matrix);
        }
        grass.instanceMatrix.needsUpdate=true;
      });
    } else if(world==="terra"){
      for(let i=0;i<8;i++){
        const a=(i-3.5)*.53, b=.65+(i%4)*.41;
        const stoneFloat=mesh(landmark,rock,stone,[a,.2,i%2*.6],[.59,.66,.53]);
        const crystal=mesh(landmark,facet,i%2?this.signal:glass,[a,b,-.25],[.23,b*.67,.30]);
        crystal.userData.moving=stoneFloat.userData.moving=true;
        this.movers.push((t,reaction)=>{
          crystal.rotation.set(.17, t*(.17+i*.012),Math.sin(t*.38+i)*.18);
          stoneFloat.position.y=.18+Math.sin(t*.54+i)*.19*(1-reaction);
        });
      }
      if(level>=3){
        const stabilizer=mesh(landmark,ring,cap,[0,1.23,.44],[1.37,1.16,.8]);
        stabilizer.userData.moving=true;
        this.movers.push(t=>stabilizer.rotation.y=Math.sin(t*.52)*.3);
        for(const a of [-1.46,1.46])strut(landmark,xy(a,-.58,.21),xy(a*.94,1.76,.2),.16,stone);
      }
    } else if(world==="metro"){
      this.transit=new ScenicTrain(arena,backdrop,x,z,level);
      for(let i=0;i<6;i++){
        const a=-10+i*3.1, h=1.45+(i%3)*.67;
        mesh(far,cube,i%2?cap:stone,[a,h-1.1,z-7.2],[1.19,h*2,.82]);
        mesh(far,cube,this.signal,[a,h-.3,z-6.75],[.86,.12,.07]);
      }
      const sculpture=mesh(landmark,ring,trim,[.2,.51,.83],[.58,.41,.65]);
      sculpture.userData.moving=true;
      this.movers.push(t=>sculpture.rotation.y=t*.36);
    } else {
      island(landmark,0,-.65,0,2.18);
      for(let i=0;i<13;i++){
        const angle=i*2.4, radius=.45+(i%5)*.3;
        const a=Math.cos(angle)*radius, b=.42+(i%7)*.23, c=Math.sin(angle)*.73;
        const shard=mesh(landmark,i%3?facet:rock,i%3?glass:trim,[a,b,c],[.25,.48+(i%4)*.21,.29]);
        shard.userData.moving=true;
        this.movers.push((t,reaction)=>{
          shard.position.y=b+Math.sin(t*.71+i)*.28*(1-reaction);
          shard.rotation.set(.07*Math.sin(t+i),t*.13+i*.51,Math.sin(t*.49+i)*.51*(1-reaction));
        });
      }
      for(const a of [-.8,.5])mesh(landmark,ring,this.signal,[a,.99,.7],[.56,.72,1]).rotation.z=a*.48;
    }

    // Accent silhouettes distinguish locations that share a biome and materials.
    const monuments=[
      {width:.92,height:1.1,count:2,lean:.22},
      {width:1.14,height:.78,count:3,lean:-.15},
      {width:.74,height:1.54,count:2,lean:.36},
      {width:.78,height:.94,count:4,lean:.13},
      {width:1.22,height:1.71,count:3,lean:0},
    ][level-1];
    for(let i=0;i<monuments.count;i++){
      const spread=(i-(monuments.count-1)/2)*.91;
      if(world==="terra")mesh(landmark,facet,trim,[spread,.8,-.71],[.19,monuments.height*.53,.22]).rotation.z=monuments.lean*(i%2?1:-1);
      else if(world==="null")mesh(landmark,ring,this.signal,[spread,.48+i*.17,-.53],[monuments.width,.53,.57]).rotation.y=i*.43+monuments.lean;
      else if(world==="eco")strut(landmark,xy(spread,-.14,-.68),xy(spread+monuments.lean,monuments.height,-.76),.048,trim);
      else if(world==="metro")mesh(far,cube,trim,[x+spread*2,1.74,-15.8],[monuments.width,.08,1.15]).rotation.z=monuments.lean*.7;
      else mesh(landmark,dome,glass,[spread,.1,-.55],[.38,monuments.height*.48,.41]);
    }

    for(const group of [far,landmark]){
      const batches=new Map<string,T.Mesh[]>();
      for(const node of group.children){
        if(!(node instanceof T.Mesh)||node.userData.moving||node.children.length||Array.isArray(node.material)||node.material.transparent)continue;
        const key=node.geometry.id+":"+node.material.id;
        const batch=batches.get(key)??[];
        batch.push(node);
        batches.set(key,batch);
      }
      for(const batch of batches.values()){
        if(batch.length<2)continue;
        const [first]=batch;
        const instances=arena.own(new T.InstancedMesh(first.geometry,first.material,batch.length));
        batch.forEach((item,index)=>{
          item.updateMatrix();
          instances.setMatrixAt(index,item.matrix);
        });
        instances.computeBoundingSphere();
        group.remove(...batch);
        group.add(instances);
      }
    }
    for(const a of [-7.0,6.9]){
      island(frame,a,-2.92,5.6,1.24);
      mesh(frame,facet,this.signal,[a,-2.48,5.6],[.19,.32,.19]);
    }
    const nearX=-4.4+(level-3)*.53, nearZ=7.7;
    island(frame,nearX,-2.75,nearZ,1.47);
    if(world==="terra"||world==="null"){
      for(let i=0;i<3;i++)mesh(frame,facet,i%2?glass:trim,[nearX+i*.38-.37,-2.31+i*.06,nearZ],[.19,.52+i*.12,.25]).rotation.z=.28-i*.24;
    } else {
      mesh(frame,ring,cap,[nearX,-2.14,nearZ],[.53,.59,.52]);
      mesh(frame,dome,glass,[nearX,-2.71,nearZ],[.49,.83,.52]);
    }
    this.route=new T.CatmullRomCurve3([offset(-2,-.34,.78),offset(-.8,.0,.83),offset(.75,.18,.81),offset(2,.6,.38)]);
    mesh(backdrop,arena.own(new T.TubeGeometry(this.route,26,.055,5)),this.signal,[0,0,0],[1,1,1]);
    this.packet=mesh(backdrop,ball,glow,[x,0,z],[.17,.17,.17]);
    const motes=arena.own(new T.MeshBasicMaterial({color:spark,transparent:true,opacity:world==="aero"?.48:.64,depthWrite:false}));
    this.particles=arena.own(new T.InstancedMesh(world==="aero"?ring:ball,motes,24));
    this.particles.frustumCulled=false;
    this.accents.add(this.particles);
    const rippleInk=arena.own(new T.MeshBasicMaterial({color:spark,transparent:true,opacity:0,depthWrite:false}));
    this.ripple=new T.Mesh(arena.own(new T.TorusGeometry(1,.038,5,40)),rippleInk);
    this.ripple.rotation.x=-Math.PI/2;
    this.ripple.visible=false;
    this.root.add(this.ripple);
    this.update(0,true,"auto");
  }

  power(stage:number,phase:number){this.stage=stage;this.phase=phase;}
  clear(){this.age=4;this.ripple.visible=false;delete this.arena.canvas.dataset.sceneryWin;}
  celebrate(position:T.Vector3){
    this.ripple.position.copy(position);
    this.ripple.position.y+=.06;
    this.age=0;
    this.arena.canvas.dataset.sceneryWin=this.world;
  }
  update(dt:number,reduced:boolean,quality:Quality){
    if(!reduced)this.elapsed+=dt;
    const t=reduced?0:this.elapsed;
    this.age=Math.min(4,this.age+dt);
    const reaction=Math.max(0,1-this.age/2.65);
    const low=quality==="low";
    this.detail.visible=!low;
    this.accents.visible=!low&&!reduced;
    this.signal.color.copy(this.dormantColor).lerp(this.liveColor,Math.min(1,.2+this.stage*.125+this.phase*.06+reaction*.55));
    this.signal.emissiveIntensity=.05+this.stage*.14+reaction*.82;
    if(this.transit){
      const state=this.transit.update(t,reduced,reaction);
      this.arena.canvas.dataset.trainProgress=state.progress.toFixed(4);
      this.arena.canvas.dataset.trainState=state.stopped?"station":"travel";
    }
    for(const motion of this.movers)motion(t,reaction);
    if(this.accents.visible){
      this.particles.count=quality==="high"?24:12;
      for(let i=0;i<this.particles.count;i++){
        const angle=i*2.4+t*.17, fraction=(t*.27+i*.193)%1;
        const radius=.032+(i%4)*.023+(this.world==="aero"?.05:0);
        this.matrix.makeScale(radius,radius,radius).setPosition(
          -5+Math.cos(angle)*3.6, -.32+fraction*(2.15+reaction), -6.3+Math.sin(angle)*1.3,
        );
        this.particles.setMatrixAt(i,this.matrix);
      }
      this.particles.instanceMatrix.needsUpdate=true;
    }
    this.packet.visible=this.stage>0||this.phase>0||reaction>0;
    if(this.packet.visible)this.route.getPoint(reduced?.85:reaction>0?1-reaction:(t*.22)%1,this.packet.position);
    this.ripple.visible=reaction>0&&!reduced;
    if(this.ripple.visible){
      this.ripple.scale.setScalar(.36+(1-reaction)*2.64);
      this.ripple.material.opacity=reaction*.61;
    }
  }
}
