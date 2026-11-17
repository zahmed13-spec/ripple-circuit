// Reproducible local measurements; not a physical phone or network benchmark.
import {projectClassic} from './projection.mjs';
import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1366,height:768}});
await page.goto('http://127.0.0.1:5173/?c=c2-12#play');
const navigation=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {responseEndMs:n.responseEnd,domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd};});
const sample=()=>page.evaluate(()=>new Promise(resolve=>{const intervals=[];let last=performance.now();function frame(t){intervals.push(t-last);last=t;if(intervals.length<180)requestAnimationFrame(frame);else{intervals.shift();intervals.sort((a,b)=>a-b);resolve({medianMs:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)],maxMs:Math.max(...intervals)});}}requestAnimationFrame(frame);}));
const idle=await sample();
const point=await projectClassic(page,111.5,180);const start=performance.now();await page.locator('#arena').click({position:point});await page.locator('#pulses').filter({hasText:'●●●○'}).waitFor();const inputRoundTripMs=performance.now()-start;
const active=await sample();
const heap=()=>page.evaluate(()=>performance.memory?.usedJSHeapSize??null);const before=await heap();const timings=[];for(let i=0;i<100;i++){const t=performance.now();await page.locator('#retry').click();timings.push(performance.now()-t);}const after=await heap();timings.sort((a,b)=>a-b);
const result={environment:{browser:await browser.version(),viewport:'1366x768',host:'macOS local loopback; no throttling',samples:180,restarts:100},navigation,idle,active,inputRoundTripMs,retryRoundTripMedianMs:timings[50],heapBefore:before,heapAfter:after,limitations:'Automation round trips include Playwright overhead. Heap is nonstandard approximate and not a leak proof. No physical mobile, low-end or real-network measurement.'};
writeFileSync('performance-classic-3d.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));await browser.close();
