/** Offline inverse-design tool. Output is frozen JSON; no runtime random levels. */
import { writeFileSync } from 'node:fs';
import { createState, pulse, step, replay, type Level, type Orb } from '../src/game/engine';
const colors = ['#67f0cf','#ffbf69','#b6a0ff'];
const orb = (id:number,x:number,y:number):Orb=>({id,x,y,vx:0,vy:0,radius:16,mass:1,color:colors[id],state:'active',collision:0});
const names = ['First Pulse','Redirect','Multiple Orbs','Long Distance','Diagonal Thinking','Cross Current','Narrow Passage','Second Wind','Corner Turn','Thread the Needle','Twin Lanes','Return to Sender','Bank Shot','Northbound','Double Back','Butterfly','Parallel Lines','Three Wishes','Crossroads','Bumper Theory','Pinball','The Divide','Chain Reaction','Convergence','Final Circuit'];
const levels:Level[]=[];
for(let i=0;i<25;i++) {
 const l:Level={id:i+1,version:1,title:names[i],difficulty:i<3?'Tutorial':i<8?'Flow':i<16?'Momentum':'Circuit',orbs:[orb(0,210,360)],goals:[],obstacles:[],bumpers:[],hazards:[],pulseLimit:3,timeLimit:45,parPulses:1,solution:[]};
 let actions:{tick:number;orb:number;dx:number;dy:number}[]=[{tick:0,orb:0,dx:-45,dy:0}];
 if(i===1){ l.orbs=[orb(0,210,470)];l.obstacles=[{x:350,y:270,w:45,h:190}];actions=[{tick:0,orb:0,dx:0,dy:50},{tick:75,orb:0,dx:-45,dy:0}];l.pulseLimit=2; }
 if(i===2){l.orbs=[orb(0,300,300),orb(1,300,420)];actions=[{tick:0,orb:0,dx:-65,dy:60}];}
 if(i>=3&&i<=6){ const n=i-3;l.orbs=[orb(0,160+n*24,230+n*65)];actions=[{tick:0,orb:0,dx:-35-n*8,dy:(n%2?35:-30)}]; if(i===6)l.obstacles=[{x:340,y:110,w:30,h:250}];}
 if(i>=7&&i<=10){ const n=i-7;l.orbs=[orb(0,180,520)];l.obstacles=[{x:330,y:300,w:45,h:240}];actions=[{tick:0,orb:0,dx:0,dy:50+n*5},{tick:75+n*5,orb:0,dx:-40,dy:0}];}
 if(i>=11&&i<=14){const n=i-11;l.orbs=[orb(0,540,190+n*95)];actions=[{tick:0,orb:0,dx:-25,dy:n%2?20:0}];l.pulseLimit=2;}
 if(i>=15&&i<=18){const n=i-15;l.orbs=[orb(0,240,230),orb(1,240,490)];if(n>=2)l.orbs.push(orb(2,470,360));actions=[{tick:0,orb:0,dx:-45,dy:0},{tick:25,orb:1,dx:-50,dy:0}];if(n>=2)actions.push({tick:50,orb:2,dx:0,dy:45}); if(n%2)l.obstacles=[{x:350,y:320,w:55,h:80}];}
 if(i>=19&&i<=21){const n=i-19;l.orbs=[orb(0,200,300+n*50)];l.bumpers=[{x:390,y:335+n*25,radius:38}];l.obstacles=[{x:120,y:540,w:400,h:28}];actions=[{tick:0,orb:0,dx:-35,dy:0},{tick:80,orb:0,dx:0,dy:50}];}
 if(i>=22){const n=i-22;l.orbs=[orb(0,220,320),orb(1,280,360),orb(2,340,400)];l.bumpers=[{x:480,y:300,radius:35}];l.obstacles=[{x:350,y:520,w:240,h:25}];actions=[{tick:0,orb:0,dx:-35,dy:-15},{tick:70,orb:1,dx:0,dy:50},{tick:140,orb:2,dx:-45,dy:25+n*10}];}
 const s=createState(l);
 for(let tick=0;tick<360;tick++){
  for(const a of actions.filter(a=>a.tick===tick)){const o=s.orbs[a.orb];pulse(l,s,o.x+a.dx,o.y+a.dy);}
  step(l,s);
 }
 l.solution=s.inputs;l.parPulses=s.used;
 l.goals=s.orbs.map(o=>({orbId:o.id,x:Math.max(36,Math.min(684,Math.round(o.x))),y:Math.max(36,Math.min(684,Math.round(o.y))),radius:27}));
 if(i===0){l.goals=[{orbId:0,x:530,y:360,radius:30}];l.pulseLimit=3;l.hint='Tap the glowing hint behind the orb. Push it into target 1.';}
 if(i===1)l.hint='Go above the wall, then tap below-left of the moving orb to redirect it.';
 if(i===2)l.hint='Tap between and behind both orbs. One ripple can move them both.';
 // Validated rotations keep the mechanics while varying the route and orientation.
 const turns = i>=7&&i<=10?i-7:i===16?2:i===18?1:0;
 const rotate=(p:{x:number;y:number})=>{for(let t=0;t<turns;t++){const x=p.x;p.x=720-p.y;p.y=x;}};
 for(const o of l.orbs)rotate(o);for(const g of l.goals)rotate(g);for(const p of l.solution)rotate(p);for(const b of l.bumpers)rotate(b);
 for(const r of l.obstacles){for(let t=0;t<turns;t++){const x=r.x,w=r.w;r.x=720-r.y-r.h;r.y=x;r.w=r.h;r.h=w;}}
 const result=replay(l,l.solution);
 if(result.status!=='won')throw Error(`Unsolvable ${i+1}: ${JSON.stringify(result.orbs)}`);
 levels.push(l);
}
writeFileSync('src/game/catalog.json',JSON.stringify(levels,null,2)+'\n');
console.log(`Frozen and replay-validated ${levels.length} curated layouts.`);
