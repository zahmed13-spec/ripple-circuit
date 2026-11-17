/** Goals and geometry are authored first. This tool computes inputs to fixed waypoints;
 * it never moves a goal to a simulated finishing position. Review LEVEL-DESIGN.md. */
import {writeFileSync} from 'node:fs';
import {createState,pulse,step,replay,validateLevel,type Level,type Orb} from '../src/game/engine';
const orb=(id:number,x:number,y:number):Orb=>({id,x,y,vx:0,vy:0,radius:16,mass:1,color:['#44c5de','#ffc56d','#b6a0ff'][id],state:'active',collision:0});
const goal=(orbId:number,x:number,y:number,radius=28)=>({orbId,x,y,radius});
const make=(id:number,title:string,skill:string,decision:string,orbs:Orb[],goals:Level['goals'],extra:Partial<Level>={}):Level=>({id,version:2,title,skill,decision,hint:decision,difficulty:id<=3?'Learn':id<=7?'Flow':'Connect',orbs,goals,obstacles:[],bumpers:[],hazards:[],pulseLimit:3,timeLimit:0,parPulses:1,solution:[],...extra});
const levels:Level[]=[
 make(1,'The First Ripple','Direction','Tap behind the orb to push it home.',[orb(0,210,360)],[goal(0,530,360,32)]),
 make(2,'Distance Matters','Strength','A softer ripple: aim farther behind the orb. The arrow shows force.',[orb(0,210,360)],[goal(0,365,360,25)],{obstacles:[{x:425,y:210,w:25,h:300}],pulseLimit:2}),
 make(3,'Around the Corner','Redirection','Go above the wall, then send the orb right. Two different directions.',[orb(0,200,520)],[goal(0,540,190,55)],{obstacles:[{x:320,y:280,w:35,h:400}],pulseLimit:3}),
 make(4,'Timing Changes Everything','Interception','Send the orb right. Turn it upward after it clears the shelf, before the bumper.',[orb(0,150,500)],[goal(0,500,180,55)],{obstacles:[{x:60,y:340,w:300,h:35}],bumpers:[{x:630,y:500,radius:30}],pulseLimit:2}),
 make(5,'Two With One','Shared force','Aim between and behind both orbs. Watch both force arrows.',[orb(0,280,325),orb(1,280,395)],[goal(0,505,130,34),goal(1,505,590,34)],{pulseLimit:2}),
 make(6,'The Narrow Passage','Alignment','A straight line through the channel. Aim behind the center of the orb.',[orb(0,150,360)],[goal(0,500,360,50)],{obstacles:[{x:300,y:80,w:100,h:225},{x:300,y:415,w:100,h:225}],pulseLimit:2}),
 make(7,'The Bank Shot','Rebound','Send the orb right and up. Use the top edge to bank around the wall.',[orb(0,220,180)],[goal(0,460,180,50)],{obstacles:[{x:335,y:150,w:30,h:480}],pulseLimit:2}),
 make(8,'Pressure Point','Activation','Roll across the diamond switch. Its connected gate stays open.',[orb(0,160,360)],[goal(0,500,360,50)],{switches:[{id:'a',x:300,y:360,radius:24}],gates:[{id:'a',switchId:'a',x:400,y:80,w:22,h:560}],pulseLimit:2}),
 make(9,'Open the Gate','Route planning','Visit the switch above you, cross the opening, then turn toward home.',[orb(0,200,520)],[goal(0,540,500,50)],{switches:[{id:'a',x:200,y:180,radius:25}],gates:[{id:'a',switchId:'a',x:350,y:20,w:24,h:680}],pulseLimit:4}),
 make(10,'Split Decision','Action order','The upper orb opens both lanes. Which orb should move first?',[orb(0,160,200),orb(1,160,520)],[goal(0,500,200,50),goal(1,500,520,50)],{switches:[{id:'a',x:290,y:200,radius:24}],gates:[{id:'a',switchId:'a',x:350,y:20,w:24,h:680}],obstacles:[{x:80,y:340,w:580,h:30}],pulseLimit:3}),
 make(11,'Precision Cascade','Momentum transfer','One orb can push another. The second opens the gate; the first settles nearby.',[orb(0,160,360),orb(1,270,360)],[goal(0,275,360,32),goal(1,500,360,60)],{switches:[{id:'a',x:335,y:360,radius:23}],gates:[{id:'a',switchId:'a',x:405,y:180,w:22,h:360}],pulseLimit:3}),
 make(12,'The Living Circuit','Linked planning','Two switches, three homes. Read each connection before choosing your order.',[orb(0,140,180),orb(1,180,540),orb(2,420,540)],[goal(0,570,180),goal(1,180,220),goal(2,620,540)],{switches:[{id:'a',x:280,y:180,radius:24},{id:'b',x:180,y:400,radius:24}],gates:[{id:'a',switchId:'a',x:350,y:40,w:24,h:280},{id:'b',switchId:'b',x:500,y:380,w:24,h:290}],obstacles:[{x:280,y:380,w:25,h:280}],pulseLimit:4})
];
type Action={tick:number;orb:number;x:number;y:number;factor?:number}|{tick:number;px:number;py:number};
const plans:Action[][]=[
 [{tick:0,px:165,py:360}],
 [{tick:0,orb:0,x:365,y:360}],
 [{tick:0,orb:0,x:200,y:190,factor:1},{tick:360,orb:0,x:540,y:190}],
 [{tick:0,orb:0,x:510,y:500,factor:1},{tick:120,orb:0,x:500,y:180}],
 [{tick:0,px:240,py:360}],
 [{tick:0,orb:0,x:500,y:360}],
 [{tick:0,orb:0,x:490,y:-178,factor:1.4}],
 [{tick:0,orb:0,x:500,y:360}],
 [{tick:0,orb:0,x:200,y:180,factor:1},{tick:360,orb:0,x:540,y:180,factor:1},{tick:720,orb:0,x:540,y:500}],
 [{tick:0,orb:0,x:500,y:200},{tick:90,orb:1,x:500,y:520}],
 [{tick:0,px:135,py:360}],
 [{tick:0,orb:0,x:570,y:180},{tick:100,orb:1,x:180,y:220},{tick:200,orb:2,x:620,y:540}]
];
for(const [i,l] of levels.entries()){
 if(l.id===11){let best=-1;for(let x=65;x<=140;x+=2){let score=0;for(const dx of [-4,0,4])for(const dy of [-4,0,4])if(replay(l,[{tick:0,x:x+dx,y:360+dy}],900).status==='won')score++;if(score>best&&replay(l,[{tick:0,x,y:360}],900).status==='won'){plans[i]=[{tick:0,px:x,py:360}];best=score;}}}
 if(l.id===7){let best=-1;for(let x=185;x<=220;x+=2)for(let y=195;y<=235;y+=2){const input={tick:0,x,y};if(replay(l,[input],900).status!=='won')continue;let score=0;for(const dx of [-4,0,4])for(const dy of [-4,0,4])if(replay(l,[{...input,x:x+dx,y:y+dy}],900).status==='won')score++;if(score>best){plans[i]=[{tick:0,px:x,py:y}];best=score;}}}

 const s=createState(l);let next=0;
 for(let t=0;t<3000&&s.status==='playing';t++){
  const a=plans[i][next];if(a&&a.tick===s.tick){next++;let x:number,y:number;
   if('px'in a){x=a.px;y=a.py;}else{const o=s.orbs[a.orb];const vx=(a.x-o.x)*1.25*(a.factor??1.12)-o.vx,vy=(a.y-o.y)*1.25*(a.factor??1.12)-o.vy;const mag=Math.hypot(vx,vy);const d=180*(1-Math.sqrt(mag/850));x=o.x-vx/mag*d;y=o.y-vy/mag*d;}
   if(!pulse(l,s,x,y))throw Error('invalid pulse '+l.id);
  } step(l,s);
 }
 l.solution=s.inputs;l.parPulses=s.used;
 console.log(l.id,s.status,s.tick,s.orbs.map(o=>[Math.round(o.x),Math.round(o.y),o.state]),s.inputs);
 if(validateLevel(l).length)throw Error(validateLevel(l).join(','));
 if(replay(l,l.solution).status!=='won')throw Error('Unsolved '+l.id);
}
writeFileSync('src/game/catalog-v2.json',JSON.stringify(levels,null,2)+'\n');
