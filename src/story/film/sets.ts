import type { WorldTheme } from "../themes";
import * as T from "three";
import type { Effect, Vec3 } from "./boards";
import { cel, fill, type Own } from "./rigs";
import { clamp, ease } from "./timeline";

const v=(p:Vec3)=>new T.Vector3(...p);
type Road={path:T.CatmullRomCurve3; mesh:T.Mesh; lights:T.Mesh[]; color:T.Color; threshold:number};
export class FilmSet {
  private ramps:Road[]=[];
  private swirls:T.Mesh[]=[];
  private clouds:T.Group[]=[];
  private turbine?:T.Group;
  private crystal?:T.Group;
  private shutters:T.Mesh[]=[];
  private glass?:T.Mesh;
  private screen?:T.Mesh;
  private warning?:{ mesh:T.Mesh; texture:T.CanvasTexture; drawing:CanvasRenderingContext2D; text:string };
  private fracture=new T.Group();
  private growth?:T.Mesh;
  private wave?:T.Mesh;
  private spill?:T.Mesh;
  private surface:T.ShaderMaterial;
  private sky:T.ShaderMaterial;
  private themedSky=0;
  private readonly pale=new T.Color("#dff8f1");
  private readonly dark=new T.Color("#3d476e");
  private readonly shade=new T.Color();
  private readonly hazy=new T.Color("#cbf7eb");
  private readonly violet=new T.Color("#756c92");
  constructor(private scene:T.Scene,private own:Own,private ramp:T.DataTexture,private eco:boolean,private seal?:T.Object3D, theme?:WorldTheme, low=false) {
    if(theme){this.themedSky=1;this.hazy.set(theme.fog);this.violet.set(theme.sky);this.pale.set(theme.restored);this.dark.set(theme.dormant);}
    const scenery=new T.Group();
    scene.add(scenery,this.fracture);
    this.sky=own(new T.ShaderMaterial({
      side:T.BackSide,depthWrite:false,
      uniforms:{energy:{value:1},warm:{value:eco?.38:0},storm:{value:0},skyTint:{value:new T.Color(theme?.sky??"#ffffff")},tinted:{value:theme?1:0}},
      vertexShader:`varying vec3 direction;
        void main(){ direction=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`
        varying vec3 direction; uniform float energy, warm, storm, tinted; uniform vec3 skyTint;
        void main(){
          vec3 d=normalize(direction);
          float h=smoothstep(-.16,.58,d.y);
          vec3 zenith=mix(vec3(.13,.33,.57),vec3(.06,.57,.83),energy);
          zenith=mix(zenith,vec3(.20,.66,.51),warm);
          vec3 horizon=mix(vec3(.48,.50,.67),vec3(.73,.95,.92),energy);
          vec3 sky=mix(horizon,zenith,h);
          sky=mix(sky,skyTint * (.55+h*.24+energy*.22),tinted*.65);
          vec3 sun=normalize(vec3(-.54,.43,-.76));
          float halo=pow(max(0.,dot(d,sun)),13.);
          float disk=smoothstep(.997,.999,dot(d,sun));
          sky=mix(sky,vec3(1.,.94,.75),(.4*halo+.75*disk)*energy);
          sky=mix(sky,vec3(.29,.22,.47),storm*.25);
          gl_FragColor=vec4(sky,1.);
          #include <colorspace_fragment>
        }`,
    }));
    scene.add(new T.Mesh(own(new T.SphereGeometry(64,36,24)),this.sky));
    this.surface=own(new T.ShaderMaterial({
      defines:low?{LOW_DETAIL:1}:{},
      uniforms:{clock:{value:0},energy:{value:1},plant:{value:eco?1:0}},
      vertexShader:`
        varying vec2 p;
        void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`
        varying vec2 p; uniform float clock, energy, plant;
        void main(){
          float broad=sin(p.x*.24+p.y*.28+sin(p.x*.14)-clock*.36);
          #ifdef LOW_DETAIL
            float foam=smoothstep(.93,1.,sin(p.y*1.9-clock*1.35));
            float mesh=.55;
          #else
            float foam=smoothstep(.91,.99,sin(p.y*1.9 + sin(p.x*.45+clock*.3)*.7 -clock*1.35));
            float mesh=smoothstep(.94,1.,sin(p.x*2.1 + p.y*.22 + clock*.57));
          #endif
          vec3 low=vec3(.06,.30,.48), high=vec3(.09,.63,.71);
          low=mix(low,vec3(.11,.33,.24),plant);
          high=mix(high,vec3(.32,.64,.31),plant);
          vec3 base=mix(low,high,(.5+broad*.25)*energy+.1);
          base=mix(base,vec3(.78,.98,.94),foam*(.035+energy*.21)*(mesh*.64+.36));
          gl_FragColor=vec4(mix(base,vec3(.52,.77,.82),smoothstep(23.,45.,length(p))),1.);
          #include <colorspace_fragment>
        }`,
    }));
    const seabed=new T.Mesh(own(new T.CircleGeometry(52,64)),this.surface);
    seabed.rotation.x=-Math.PI/2;
    seabed.position.y=-3.65;
    scene.add(seabed);

    const sphere=own(new T.SphereGeometry(1,low?12:18,low?8:12));
    const cloudInk=fill(own,"#e3fcff");
    const mistInk=own(new T.MeshBasicMaterial({color:"#bee1f4",transparent:true,opacity:.69,depthWrite:false}));
    for(let i=0;i<(low?5:9);i++){
      const cloud=new T.Group();
      cloud.position.set((i%5-2)*9,2.4+(i%3)*2.6,-15-Math.floor(i/5)*10);
      cloud.userData.origin=cloud.position.x;
      for(let j=0;j<(low?2:4);j++){
        const puff=new T.Mesh(sphere,j===0?mistInk:cloudInk);
        puff.position.set((j-1.5)*1.2,(j%2)*.32,0);
        puff.scale.set(1.85+j*.12,.32+(j%3)*.19,.84);
        cloud.add(puff);
      }
      this.clouds.push(cloud);
      scenery.add(cloud);
    }

    const palette={
      chalk:cel(own,ramp,"#e3fff5"),edge:cel(own,ramp,"#278aa3"),stone:cel(own,ramp,"#28768a"),
      dark:cel(own,ramp,"#20435d"),gold:cel(own,ramp,"#ffe4a3"),green:cel(own,ramp,eco?"#a2dd70":"#89d8ab"),
      gem:cel(own,ramp,"#45e5cf"),
    };
    const box=own(new T.BoxGeometry(1,1,1));
    const cylinder=own(new T.CylinderGeometry(1,.78,1,12));
    const rock=own(new T.DodecahedronGeometry(1,0));
    const torus=own(new T.TorusGeometry(1,.06,low?5:7,low?26:42));
    const jewel=own(new T.OctahedronGeometry(1));
    const glass=own(new T.MeshToonMaterial({color:eco?"#c7fff1":"#9deeee",gradientMap:ramp,transparent:true,opacity:.43,depthWrite:false,side:T.DoubleSide}));
    const neon=fill(own,"#affff1");
    const part=(geometry:T.BufferGeometry,material:T.Material,pos:Vec3,scale:Vec3,parent:T.Object3D=scenery)=>{
      const mesh=new T.Mesh(geometry,material);
      mesh.position.set(...pos);
      mesh.scale.set(...scale);
      parent.add(mesh);
      return mesh;
    };
    const island=(x:number,y:number,z:number,r:number)=>{
      part(rock,palette.stone,[x,y-.78,z],[r*.97,1.27,r*.87]).rotation.y=.4;
      part(cylinder,palette.edge,[x,y-.16,z],[r,.33,r]);
      part(cylinder,palette.chalk,[x,y+.025,z],[r*.97,.13,r*.97]);
      part(torus,neon,[x,y+.10,z],[r*.86,r*.86,.46]).rotation.x=-Math.PI/2;
    };
    const deck=(x:number,y:number,z:number,w:number,d:number)=>{
      part(box,palette.stone,[x,y-.4,z],[w*.93,.53,d*.90]);
      part(box,palette.edge,[x,y-.20,z],[w+.03,.19,d+.03]);
      part(box,palette.chalk,[x,y-.069,z],[w,.13,d]);
      // Painted seams and low rails leave the actors' silhouettes clear.
      for(const side of [-1,1]){
        part(box,palette.edge,[x,y+.06,z+side*(d/2-.16)],[w*.92,.06,.10]);
        part(box,palette.gold,[x+side*(w/2-.30),y+.085,z-d/2+.18],[.18,.12,.18]);
      }
    };
    for(let i=0;i<(low?5:7);i++){
      const x=(i-3)*5.3; const z=-18-(i%3)*3;
      island(x,-.8+(i%3)*.6,z,1.9+(i%2)*.45);
      part(box,palette.chalk,[x,.1+(i%3)*.6,z],[.3,1.28,.35]);
      part(jewel,palette.gem,[x,1+(i%3)*.6,z],[.30,.55,.29]);
    }

    if(theme?.id==="terra"){
      for(let i=0;i<5;i++){
        const x=-4.5+i*1.4;
        const crystal=part(jewel,cel(own,ramp,i%2?theme.restored:"#a36c54"),[x,.91+i%3*.47,-8.3],[.54,1.38+i%3*.41,.65]);
        crystal.rotation.z=(i-2)*.17;
      }
    } else if(theme?.id==="metro"){
      for(let i=0;i<5;i++){
        const x=-4+i*2.1;
        part(box,palette.chalk,[x,1.2,-8.25],[.93,2.8+i%2*1.2,.95]);
        part(torus,neon,[x,1.98,-7.71],[.56,.56,.72]);
      }
      part(box,palette.edge,[.2,.4,-7.82],[9.8,.34,.81]);
    } else if(theme?.id==="null"){
      for(let i=0;i<5;i++){
        const x=(i-2)*2.1;
        const darkGlass=cel(own,ramp,i%2?"#49335e":"#ad6794");
        part(jewel,darkGlass,[x,1.12+i%3*.49,-7.7],[.62,1.12,.56]).rotation.z=(i-2)*.32;
      }
    }
    if(eco){
      deck(-2.5,0,1.15,5.8,3);
      island(2.5,.2,-3.75,3.1);
      island(-4,.33,-4.4,2.15);
      island(5.2,.46,-1.1,1.8);
      for(const [x,y,z] of [[-4,.33,-4.4],[5.2,.46,-1.1]]){
        part(cylinder,palette.chalk,[x,y+.16,z],[1.45,.33,1.45]);
        part(sphere,glass,[x,y+.38,z],[1.43,1.39,1.43]);
        for(let k=0;k<4;k++){
          const arch=part(torus,palette.gold,[x,y+.4,z],[1.39,1.34,1.32]);
          arch.rotation.y=k*Math.PI/4;
        }
        for(let j=-1;j<=1;j++){
          part(sphere,palette.green,[x+j*.66,y+.62,z],[.48,.50,.48]);
          part(box,palette.dark,[x+j*.43,y+.09,z+1.44],[.39,.05,.55]).rotation.x=-.30;
        }
      }
      const trunk=part(cylinder,palette.stone,[2.5,1.64,-3.75],[.40,2.85,.37]);
      trunk.rotation.z=-.08;
      const foliage=[palette.green,cel(own,ramp,"#64bc86"),cel(own,ramp,"#cfe88c")];
      for(let i=0;i<12;i++){
        const theta=i*2.39;
        part(sphere,foliage[i%3],[2.48+Math.cos(theta)*(1.2+i*.022),3+i*.077,-3.75+Math.sin(theta)*1.2],[1.0,.5,.91]);
      }
      part(jewel,palette.gem,[2.5,3.84,-3.75],[.35,.59,.35]);
      for(let j=0;j<5;j++)part(rock,palette.green,[-1.52+j*.34,.20,-.7-j*.17],[.21,.10,.32]).rotation.z=.30;
      this.growth=part(torus,palette.green,[-.9,.65,-.95],[.75,.7,.8]);
      const vineTip=part(sphere,palette.green,[0,0,0],[.16,.29,.18]);
      this.growth.add(vineTip);
      vineTip.position.set(.82,.57,0);
    } else {
      deck(0,0,.60,10.6,3.8);
      deck(-.9,-.51,-2.1,5.7,1.6);
      island(-5.4,.15,-4.8,2.03);
      island(-5,.12,-2.9,1.18);
      island(-1,.28,-6.3,2.16);
      island(4.9,.16,-4.0,1.66);
      island(8.1,.45,-7.15,1.30);
      island(-8.7,-.38,-8,1.38);
      // Working reservoir: transparent glass around a separate animated water level.
      part(cylinder,palette.edge,[-5.4,.6,-4.8],[1.22,.83,1.22]);
      this.glass=part(cylinder,glass,[-5.4,1.06,-4.8],[1.17,.97,1.17]);
      part(torus,palette.gold,[-5.4,1.52,-4.8],[1.18,1.18,.55]).rotation.x=-Math.PI/2;
      part(cylinder,glass,[-5.4,.94,-4.8],[1.1,.55,1.1]);
      this.spill=part(box,glass,[-4.77,-.80,-3.74],[.83,3,.093]);
      for(let i=0;i<6;i++){
        const stripe=part(box,neon,[-5.1+i*.13,.28,-3.66],[.023,1.25,.025],this.spill);
        stripe.position.set(-.44+i*.175,.30,0);
        stripe.scale.set(.035,.24,.06);
        this.swirls.push(stripe);
      }
      // Three mechanism positions relate to the playable circuit's intake, relay and Crown.
      part(torus,palette.gold,[1.2,.04,.75],[.66,.66,.48]).rotation.x=-Math.PI/2;
      part(cylinder,palette.dark,[-5,.44,-2.9],[.39,.58,.39]);
      part(jewel,palette.gem,[-5,.98,-2.9],[.36,.62,.36]);
      this.turbine=new T.Group();
      this.turbine.position.set(4.9,1.48,-4);
      scenery.add(this.turbine);
      part(torus,palette.edge,[0,0,0],[1.03,1.03,.65],this.turbine);
      for(let i=0;i<6;i++){
        const blade=part(box,palette.chalk,[0,0,0],[.125,1.88,.095],this.turbine);
        blade.rotation.z=i*Math.PI/6;
      }
      part(cylinder,palette.gold,[4.9,.58,-4],[.48,.77,.48]);
      this.crystal=new T.Group();
      this.crystal.position.set(-1,1.8,-6.3);
      scenery.add(this.crystal);
      part(jewel,palette.gem,[0,0,0],[.79,1.22,.79],this.crystal);
      part(jewel,glass,[0,0,0],[.93,1.41,.93],this.crystal);
      part(torus,palette.gold,[-1,1.85,-6.3],[1.5,1.5,.53]).rotation.z=.14;
      for(const x of [-2.42,.42]){
        this.shutters.push(part(box,palette.edge,[x,1.06,-6.29],[.22,1.72,.31]));
        part(box,palette.gold,[x,.38,-6.29],[.43,.25,.46]);
      }
      part(jewel,palette.green,[8.1,1.05,-7.15],[.58,.72,.58]);
      part(box,palette.dark,[4.2,.52,.23],[1.43,1.02,.68]);
      part(box,palette.edge,[4.2,1.33,.23],[2.45,1.54,.38]).rotation.x=-.08;
      this.screen=part(box,fill(own,"#223952"),[4.2,1.36,.44],[2.19,1.25,.03]);
      const warningCanvas=document.createElement("canvas");
      warningCanvas.width=512;
      warningCanvas.height=256;
      const drawing=warningCanvas.getContext("2d");
      if(drawing){
        const texture=own(new T.CanvasTexture(warningCanvas));
        texture.colorSpace=T.SRGBColorSpace;
        const material=own(new T.MeshBasicMaterial({map:texture, toneMapped:false}));
        const mesh=part(own(new T.PlaneGeometry()),material,[4.2,1.36,.46],[2.12,1.12,1]);
        mesh.visible=false;
        this.warning={mesh,texture,drawing,text:""};
      }
      this.wave=part(torus,own(new T.MeshBasicMaterial({color:"#d7ffd0",transparent:true,opacity:0,depthWrite:false})),[-1,.32,-6.3],[.5,.5,.14]);
      this.wave.rotation.x=-Math.PI/2;
    }

    const animated=new Set<T.Object3D|undefined>([this.growth,this.screen,this.warning?.mesh,...this.shutters]);
    this.instanceBackdrop(scenery,animated);

    const lightGeometry=own(new T.IcosahedronGeometry(.106,0));
    const lightColor=fill(own,"#f8ffe3");
    const routes:readonly [readonly Vec3[],number,string][] = eco ? [
      [[[-3,.1,.65],[-1.55,.02,-.4],[-.35,.44,-1.5],[2.5,.48,-3.1]],.31,"#a3ff83"],
    ] : [
      [[[-5, .45,-2.8],[-3.45,.18,-1.93],[-1.74,.07,-.85],[1.2,.06,.72]],.18,"#90ffea"],
      [[[-5.3,.32,-4.79],[-4.15,-.15,-3.05],[-3.0,-.20,-2.9],[-1.54,-.22,-2.1]],.42,"#82ddff"],
      [[[-.9,-.16,-2.14],[2.29,.00,-2.26],[4.9,.38,-3.99]],.55,"#d6ffe0"],
      [[[4.9,.38,-3.99],[2.5,.53,-4.94],[.8,.34,-5.6],[-1,.33,-6.29]],.71,"#baf4ff"],
      [[[-1,.36,-6.3],[1.8,.65,-6.8],[4.8,.54,-6.18],[8.1,.63,-7.15]],.87,"#b4ff87"],
    ];
    for(const [points,threshold,color] of routes){
      const path=new T.CatmullRomCurve3(points.map(v));
      const pipe=new T.Mesh(own(new T.TubeGeometry(path,27,.064,6,false)),fill(own,"#1f4d68"));
      scenery.add(pipe);
      const lights=Array.from({length:4},()=>{
        const mot=new T.Mesh(lightGeometry,lightColor);
        scenery.add(mot);
        return mot;
      });
      this.ramps.push({path,mesh:pipe,lights,color:new T.Color(color),threshold});
    }

    // An incomplete sigil. Its shards stay separate during every appearance.
    const nullGlass=cel(own,ramp,"#332754");
    const nullEdge=fill(own,"#a65aaf");
    if(this.seal){
      this.seal.traverse((node)=>{
        if(node instanceof T.Mesh)node.material=node.name.endsWith("0")||node.name.endsWith("3")?nullEdge:nullGlass;
      });
      this.fracture.add(this.seal);
    }
    else for(let i=0;i<7;i++){
      const shard=part(jewel,i%3===0?nullEdge:nullGlass,[0,0,0],[.13,.65,.08],this.fracture);
      shard.userData.theta=i*Math.PI*2/8;
    }
  }

  private instanceBackdrop(group:T.Group, animated:ReadonlySet<T.Object3D|undefined>) {
    const batches=new Map<string,T.Mesh[]>();
    for(const object of group.children){
      if(!(object instanceof T.Mesh) || object.children.length || animated.has(object) ||
        Array.isArray(object.material) || object.material.transparent)continue;
      const key=object.geometry.id+":"+object.material.id;
      const batch=batches.get(key);
      if(batch)batch.push(object);
      else batches.set(key,[object]);
    }
    for(const batch of batches.values()){
      const [first]=batch;
      if(batch.length<2)continue;
      const meshes=this.own(new T.InstancedMesh(first.geometry,first.material,batch.length));
      batch.forEach((mesh,index)=>{
        mesh.updateMatrix();
        meshes.setMatrixAt(index,mesh.matrix);
      });
      meshes.computeBoundingSphere();
      group.remove(...batch);
      group.add(meshes);
    }
  }

  showRestoredWorld(active:boolean) {
    this.sky.uniforms.tinted.value=active?0:this.themedSky;
  }

  showWarning(text:string) {
    const warning=this.warning;
    if(!warning)return;
    warning.mesh.visible=Boolean(text);
    if(!text || text===warning.text)return;
    warning.text=text;
    const {drawing,texture}=warning;
    drawing.fillStyle="#0c263b";
    drawing.fillRect(0,0,512,256);
    drawing.strokeStyle="#ffbc82";
    drawing.lineWidth=3;
    drawing.strokeRect(16,16,480,224);
    drawing.fillStyle="#ffbc82";
    drawing.fillRect(35,36,78,8);
    drawing.font="600 25px monospace";
    const words=text.toUpperCase().split(/\s+/);
    let line="";
    let y=88;
    for(const word of words){
      const next=line ? line+" "+word : word;
      if(line && drawing.measureText(next).width>430){
        drawing.fillText(line,35,y,430);
        line=word;
        y+=33;
        if(y>213)break;
      } else line=next;
    }
    if(y<=213)drawing.fillText(line,35,y,430);
    texture.needsUpdate=true;
  }

  apply(effect:Effect,energy:number,time:number,progress:number,reduced:boolean) {
    const disruption=effect==="fracture"?ease(clamp((progress-.19)*3.2)):effect==="silence"?.75:0;
    const t=reduced?0:time;
    this.sky.uniforms.energy.value=energy;
    this.sky.uniforms.storm.value=disruption;
    this.surface.uniforms.clock.value=t*(.27+.73*energy);
    this.surface.uniforms.energy.value=energy;
    const fog=this.scene.fog as T.Fog;
    fog.color.copy(this.hazy).lerp(this.violet,disruption*.60+(1-energy)*.22);
    for(const cloud of this.clouds)cloud.position.x=cloud.userData.origin+Math.sin(t*.055+cloud.position.z)*.63;

    for(const [i,road] of this.ramps.entries()){
      const lit=clamp((energy-road.threshold+.12)*4.4);
      (road.mesh.material as T.MeshBasicMaterial).color.copy(this.dark).lerp(road.color,lit);
      for(const [j,light] of road.lights.entries()){
        light.visible=lit>.20;
        const offset=effect==="fracture"?1-((t*.19+j/4+i*.18)%1):(t*(.12+energy*.14)+j/4+i*.14)%1;
        road.path.getPoint(offset,light.position);
        light.scale.setScalar((.42+lit*.78)*(effect==="signal"&&i===this.ramps.length-1?1.8:1));
      }
    }
    if(this.spill){
      this.spill.visible=energy>.32||effect==="reservoir";
      this.spill.scale.x=.34+energy*.64;
      this.spill.scale.y=1.2+energy*2;
      for(const [i,stripe] of this.swirls.entries())stripe.position.y=.4-((t*(.26+energy*.41)+i*.21)%1);
    }
    if(this.turbine)this.turbine.rotation.z=t*energy*(effect==="relay"?2.6:1.66);
    if(this.crystal){
      const rise=effect==="restore"?ease(clamp(progress*1.3))*.92:energy*.24;
      this.crystal.position.y=1.54+rise;
      this.crystal.rotation.y=t*(energy*.62+.10);
      const material=this.crystal.children[0] as T.Mesh<T.BufferGeometry,T.MeshToonMaterial>;
      material.material.color.copy(this.shade.copy(this.dark).lerp(this.pale,energy));
      for(const [i,post] of this.shutters.entries())post.rotation.z=(i?-1:1)*rise*.62;
    }
    if(this.wave){
      const sweep=effect==="restore"?Math.max(0,(progress-.31)*1.5):1;
      this.wave.visible=!reduced&&sweep>0&&sweep<1;
      this.wave.scale.setScalar(.52+sweep*8.5);
      (this.wave.material as T.MeshBasicMaterial).opacity=(1-sweep)*.59;
    }
    if(this.growth){
      const extend=effect==="growth"?clamp(energy*1.2):.20;
      this.growth.scale.set(.42+extend*.7,.18+extend*.75,.44);
      this.growth.rotation.z=.35+extend*.46;
      this.growth.position.y=.31+extend*.33;
    }
    if(this.glass)(this.glass.material as T.MeshToonMaterial).opacity=.36+.15*energy;
    if(this.screen){
      const ink=this.screen.material as T.MeshBasicMaterial;
      const scan=effect==="terminal"?(.52+.48*Math.sin(t*10)**2):.15;
      ink.color.setRGB(.08+scan*.35,.16+scan*.65,.24+scan*.62);
    }
    this.fracture.visible=effect==="fracture"&&progress>.22;
    this.fracture.position.set(this.eco?3.0:effect==="fracture"&&energy<.2?-1:4.25,this.eco?2.9:2.1,this.eco?-2.6:energy<.2?-5.85:.68);
    if(!this.seal)for(const object of this.fracture.children){
      const angle=object.userData.theta+t*.31;
      object.position.set(Math.cos(angle)*(.61-disruption*.20),Math.sin(angle)*.60,0);
      object.rotation.z=angle+Math.PI/2;
      object.rotation.y=disruption*.37*Math.sin(t*4+angle);
    }
  }
}
