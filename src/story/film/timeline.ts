import type { Pose, Shot, Track } from "./boards";

export const clamp = (n:number) => Math.max(0,Math.min(1,n));
export const mix = (a:number,b:number,t:number) => a+(b-a)*t;
export const ease = (n:number) => n*n*(3-2*n);

export function sample<T>(track:Track<T>, time:number, interpolate:(a:T,b:T,t:number)=>T):T {
  const next=track.findIndex(key=>key[0]>time);
  if(next<0)return track[track.length-1][1];
  if(next===0)return track[0][1];
  const a=track[next-1],b=track[next];
  return a[2]?a[1]:interpolate(a[1],b[1],ease(clamp((time-a[0])/(b[0]-a[0]))));
}

function blendPose(a:Pose,b:Pose,k:number):Pose {
  return [mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k),
    mix(a[3],b[3],k),mix(a[4],b[4],k),k<.45?a[5]:b[5]];
}
export function poseAt(shot:Shot,time:number,reduced=false) {
  const motion=reduced?.5:time/shot.seconds;
  return {
    luma:sample(shot.luma,motion,blendPose),
    ripple:shot.ripple&&sample(shot.ripple,motion,blendPose),
    power:sample(shot.power,reduced?1:time/shot.seconds,mix),
  };
}
export function mouthAt(shot:Shot,time:number) {
  const cue=shot.line;
  if (!cue?.mouths || time<cue.in || time>=cue.out) return "–";
  const beat=(time-cue.in)/(cue.out-cue.in);
  return cue.mouths[Math.floor(beat*cue.mouths.length)] ?? "–";
}
