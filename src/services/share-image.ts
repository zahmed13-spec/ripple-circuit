import type {Level,State} from '../game/engine';
import {render} from '../game/render';
export function resultImage(level:Level,state:State,code:string,host:string){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const c=canvas.getContext('2d')!;
 const sky=c.createLinearGradient(0,0,1200,630);sky.addColorStop(0,'#f5feff');sky.addColorStop(.55,'#bcecf7');sky.addColorStop(1,'#84dec9');c.fillStyle=sky;c.fillRect(0,0,1200,630);
 c.strokeStyle='#ffffff90';c.lineWidth=4;for(let i=0;i<5;i++){c.beginPath();c.arc(1060,610,150+i*80,0,Math.PI*2);c.stroke();}
 c.fillStyle='#ffffffbb';c.beginPath();c.roundRect(40,40,1120,550,32);c.fill();
 c.fillStyle='#135c83';c.font='bold 28px sans-serif';c.fillText('◎ RIPPLE CIRCUIT',75,100);c.font='20px sans-serif';c.fillText('ONE SMALL ACTION. EVERYTHING CONNECTED.',75,144);
 c.font='bold 54px sans-serif';c.fillText(state.used+' PULSE'+(state.used===1?'':'S'),75,260);c.font='26px sans-serif';c.fillText('Circuit complete · '+(state.tick/60).toFixed(2)+'s',75,312);
 c.font='bold 24px sans-serif';c.fillText(level.title,75,390);c.font='20px sans-serif';c.fillText(code,75,430);c.fillText('Find your own solution →',75,500);c.font='16px sans-serif';c.fillText(host,75,548);
 const mini=document.createElement('canvas');mini.width=mini.height=720;render(mini.getContext('2d')!,level,{...state,orbs:structuredClone(level.orbs),status:'playing',activated:[],opened:[]},{aim:null,hint:null,fx:[],trails:new Map(),reduced:true,contrast:false,preview:false},0);c.drawImage(mini,710,175,390,390);
 return canvas;
}
