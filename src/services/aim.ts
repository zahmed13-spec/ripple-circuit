import type {Point} from '../game/engine';
/** One active pointer; cancellation never emits an input. Quick taps remain immediate. */
export class AimControl {
 pointer:number|null=null; position:Point|null=null;
 down(id:number,primary:boolean,point:Point,precision:boolean):Point|null {
  if(!primary||this.pointer!==null)return null;
  if(!precision)return point;
  this.pointer=id;this.position=point;return null;
 }
 move(id:number,p:Point){if(id===this.pointer)this.position=p;}
 up(id:number,p:Point):Point|null{if(id!==this.pointer)return null;this.cancel();return p.x>=0&&p.y>=0&&p.x<=720&&p.y<=720?p:null;}
 cancel(){this.pointer=null;this.position=null;}
}
