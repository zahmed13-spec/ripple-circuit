import {writeFileSync} from 'node:fs';
import {campaign} from '../src/game/levels';
import {replay} from '../src/game/engine';
const rows=campaign.map(l=>{
 let successes=0,total=0;
 for(let i=0;i<l.solution.length;i++)for(const [dx,dy] of [[-4,0],[4,0],[0,-4],[0,4],[-4,-4],[4,4],[-4,4],[4,-4]]){
 const inputs=structuredClone(l.solution);inputs[i].x+=dx;inputs[i].y+=dy;total++;if(replay(l,inputs).status==='won')successes++;
 }
 let timing=0;for(const d of [-12,-6,6,12]){const inputs=l.solution.map((p,i)=>({...p,tick:i?p.tick+d:0}));if(replay(l,inputs).status==='won')timing++;}
 // Coarse screen for trivial one-pulse alternatives; not a proof of minimum.
 let single=0;for(let x=30;x<720;x+=30)for(let y=30;y<720;y+=30)if(replay(l,[{tick:0,x,y}],1200).status==='won')single++;
 return {id:l.id,title:l.title,par:l.parPulses,ticks:replay(l,l.solution).tick,offset4WorldUnits:`${successes}/${total}`,timingOffsets:`${timing}/4`,coarseOnePulseWins:single};
});
console.table(rows);writeFileSync('level-audit.json',JSON.stringify(rows,null,2)+'\n');
