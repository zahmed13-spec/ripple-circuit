import { PHYSICS, type Level, type State, type Point } from './engine';
export type FX = {x:number;y:number;color:string;age:number;kind:string};
export type View = {fx:FX[];aim:Point|null;hint:Point|null;reduced:boolean;preview:boolean;contrast:boolean;trails:Map<number,Point[]>};
const ring=(c:CanvasRenderingContext2D,x:number,y:number,r:number)=>{c.beginPath();c.arc(x,y,Math.max(.1,r),0,Math.PI*2);};
export function render(c:CanvasRenderingContext2D,l:Level,s:State,v:View,dt:number) {
 c.clearRect(0,0,720,720);const water=c.createLinearGradient(0,0,720,720);water.addColorStop(0,'#f2ffff');water.addColorStop(.45,'#d2f3f5');water.addColorStop(1,'#99dce8');c.fillStyle=v.contrast?'#fff':water;c.fillRect(0,0,720,720);
 c.strokeStyle='#84bacb';c.lineWidth=1;
 for(let x=36;x<720;x+=36)for(let y=36;y<720;y+=36){c.fillStyle='#78b8c533';c.fillRect(x,y,1.5,1.5);}
 c.strokeRect(1,1,718,718);
 for(const r of l.obstacles){c.fillStyle='#a1d4df';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#4f91ac';c.lineWidth=2;c.strokeRect(r.x,r.y,r.w,r.h);
 c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.strokeStyle='#eaffff';for(let a=r.x-r.h;a<r.x+r.w;a+=14){c.beginPath();c.moveTo(a,r.y+r.h);c.lineTo(a+r.h,r.y);c.stroke();}c.restore();}
 for(const sw of l.switches||[]){const active=s.activated.includes(sw.id);c.strokeStyle=active?'#168757':'#747da2';c.lineWidth=active?4:2;
  for(const gate of (l.gates||[]).filter(g=>g.switchId===sw.id)){c.setLineDash(active?[]:[5,7]);c.beginPath();c.moveTo(sw.x,sw.y);c.lineTo(gate.x+gate.w/2,gate.y+gate.h/2);c.stroke();c.setLineDash([]);}
  ring(c,sw.x,sw.y,sw.radius);c.fillStyle=active?'#b8f3df':'#f5feff';c.fill();c.stroke();c.fillStyle='#135c83';c.font='bold 20px system-ui';c.textAlign='center';c.fillText(active?'✓':'◇',sw.x,sw.y+7);
 }
 for(const gate of l.gates||[]){const open=s.opened.includes(gate.id);const sw=l.switches!.find(s=>s.id===gate.switchId)!;const fx=v.fx.find(f=>f.kind==='switch'&&f.x===sw.x&&f.y===sw.y);const progress=open?(v.reduced?1:Math.min(1,(fx?.age??1)/.3)):0;
  c.strokeStyle=open?'#168757':'#676b9d';c.lineWidth=2;c.setLineDash(open?[3,6]:[]);c.strokeRect(gate.x,gate.y,gate.w,gate.h);c.setLineDash([]);
  c.fillStyle='#777bb6';c.globalAlpha=1-progress*.8;c.fillRect(gate.x,gate.y,gate.w,gate.h*(1-progress));c.globalAlpha=1;
 }
 if(s.status==='won'&&l.goals.length>1){c.strokeStyle='#168757';c.lineWidth=3;c.beginPath();l.goals.forEach((g,i)=>i?c.lineTo(g.x,g.y):c.moveTo(g.x,g.y));c.stroke();}
 for(const b of l.bumpers){ring(c,b.x,b.y,b.radius);c.fillStyle='#a6d9f3';c.fill();c.strokeStyle='#647bb5';c.lineWidth=3;c.stroke();c.fillStyle='#345985';c.font='24px system-ui';c.textAlign='center';c.fillText('✦',b.x,b.y+8);}
 for(const h of l.hazards){ring(c,h.x,h.y,h.radius);c.fillStyle='#8a3148';c.fill();c.fillStyle='white';c.font='25px system-ui';c.textAlign='center';c.fillText('×',h.x,h.y+8);}
 for(const g of l.goals){const o=s.orbs.find(o=>o.id===g.orbId)!;const docked=o.state==='docked';c.strokeStyle=['#087fa8','#aa650e','#7953b9'][o.id%3];c.lineWidth=docked?4:2;c.setLineDash(docked?[]:[5,6]);ring(c,g.x,g.y,g.radius+9);c.stroke();c.setLineDash([]);c.globalAlpha=docked?.23:.08;c.fillStyle=o.color;ring(c,g.x,g.y,g.radius);c.fill();c.globalAlpha=1;c.fillStyle=['#087fa8','#aa650e','#7953b9'][o.id%3];c.font='bold 17px system-ui';c.textAlign='center';c.fillText(docked?'✓':String(o.id+1),g.x,g.y+6);}
 if(v.aim&&v.preview&&s.status==='playing'&&!s.paused){c.strokeStyle='#277f9b66';c.setLineDash([4,7]);ring(c,v.aim.x,v.aim.y,180);c.stroke();c.setLineDash([]);c.fillStyle='#166e93';ring(c,v.aim.x,v.aim.y,3);c.fill();
 for(const o of s.orbs.filter(o=>o.state==='active')){const dx=o.x-v.aim.x,dy=o.y-v.aim.y,d=Math.hypot(dx,dy);if(d>=PHYSICS.pulseRadius)continue;
 const force=(1-d/PHYSICS.pulseRadius)**2, nx=d?dx/d:1,ny=d?dy/d:0,len=18+force*65,ex=o.x+nx*len,ey=o.y+ny*len;
 c.strokeStyle='#135c83';c.lineWidth=2+force*3;c.globalAlpha=.35+force*.65;ring(c,o.x,o.y,o.radius+6);c.stroke();c.beginPath();c.moveTo(o.x,o.y);c.lineTo(ex,ey);c.lineTo(ex-nx*9-ny*5,ey-ny*9+nx*5);c.moveTo(ex,ey);c.lineTo(ex-nx*9+ny*5,ey-ny*9-nx*5);c.stroke();c.globalAlpha=1;
 }}
 for(const o of s.orbs){let t=v.trails.get(o.id);if(!t){t=[];v.trails.set(o.id,t);}if(!v.reduced&&o.state==='active'&&!s.paused&&s.started){t.push({x:o.x,y:o.y});if(t.length>16)t.shift();}
 if(o.state!=='active'){t.length=0;continue;}
 if(!v.reduced){c.strokeStyle=['#087fa8','#aa650e','#7953b9'][o.id%3];c.lineWidth=8;c.lineCap='round';for(let i=1;i<t.length;i++){c.globalAlpha=i/t.length*.15;c.beginPath();c.moveTo(t[i-1].x,t[i-1].y);c.lineTo(t[i].x,t[i].y);c.stroke();}c.globalAlpha=1;}
 if(!v.reduced){const glow=c.createRadialGradient(o.x,o.y,o.radius,o.x,o.y,o.radius+10);glow.addColorStop(0,o.color+'80');glow.addColorStop(1,o.color+'00');c.fillStyle=glow;ring(c,o.x,o.y,o.radius+10);c.fill();}ring(c,o.x,o.y,o.radius+(o.collision?1:0));const gel=c.createRadialGradient(o.x-6,o.y-8,1,o.x,o.y,o.radius);gel.addColorStop(0,'#fff');gel.addColorStop(.3,o.color);gel.addColorStop(1,['#0782b2','#c37916','#7353ac'][o.id%3]);c.fillStyle=gel;c.fill();c.shadowBlur=0;c.strokeStyle='#ffffffa0';c.lineWidth=1;c.stroke();c.fillStyle='#0c2431';c.font='bold 17px system-ui';c.textAlign='center';c.fillText(String(o.id+1),o.x,o.y+6);c.fillStyle='#ffffffa0';ring(c,o.x-5,o.y-6,3);c.fill();}
 for(const fx of v.fx){fx.age+=dt;const p=fx.age/(fx.kind==='pulse'?.35:.6);if(p>=1)continue;c.globalAlpha=1-p;c.strokeStyle=fx.kind==='pulse'?'#158fb5':fx.color;c.lineWidth=3;ring(c,fx.x,fx.y,fx.kind==='pulse'?(v.reduced?24:p*180):20+p*36);c.stroke();if(fx.kind==='pulse'){c.strokeStyle='#ffffff';c.lineWidth=2;ring(c,fx.x,fx.y,Math.max(1,(v.reduced?24:p*180)-5));c.stroke();}if(fx.kind!=='pulse'&&!v.reduced)for(let i=0;i<10;i++){const a=i*Math.PI/5;c.fillStyle=fx.color;ring(c,fx.x+Math.cos(a)*p*65,fx.y+Math.sin(a)*p*65,2);c.fill();}c.globalAlpha=1;}
 v.fx=v.fx.filter(f=>f.age<(f.kind==='pulse'?.35:.6)).slice(-40);
 if(v.hint){const p=v.reduced?0:(Math.sin(performance.now()/280)+1)*5;c.strokeStyle='#165a7b';c.lineWidth=2;ring(c,v.hint.x,v.hint.y,17+p);c.stroke();c.fillStyle='#165a7b';c.font='14px system-ui';c.textAlign='center';c.fillText('TAP',v.hint.x,v.hint.y+42);}
}
