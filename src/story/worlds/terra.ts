import { circuit } from "./circuit";

export const terraLevels = [
  circuit("terra",1,"Beneath the World","Start with a gentle pulse. The amber gravity field pulls the marble toward the home ring.","The stone is still moving, beneath all that silence.",[{z:0,tick:0,start:-3.5,end:4.5,aim:-5,gravity:5}]),
  circuit("terra",2,"Crystal Path","Dock the upper marble to turn on the crystal pull. Use a gentle pulse on the lower deck.","The crystals can guide movement without locking it in place.",[{z:-1.7,tick:0,plate:"crystal relay",height:.8},{z:1.7,tick:105,end:4.2,gravity:7,gate:"crystal relay"}]),
  circuit("terra",3,"The Weight of Stone","The lower gravity field pushes back. Use a closer pulse there after docking the upper marble.","A little resistance can keep a bridge steady.",[{z:-1.55,tick:0,gravity:4,end:4.1},{z:1.55,tick:95,gravity:-1.7,aim:-3.75,end:2.3}]),
  circuit("terra",4,"The Inverted Chamber","Use the low receiver to open the raised gravity gate. The raised deck has its own aiming surface.","Stability is a balance, not an order to stop.",[{z:2,tick:0,plate:"inversion crystal",end:2.4},{z:-2,tick:100,gravity:8,verticalGravity:5.2,gate:"inversion crystal",height:1.65,end:4.3}]),
  circuit("terra",5,"Heart of Terra","Restore the upper stabilizer, then lower and central. Read the arrows for each field’s direction.","The chamber settles without falling silent.",[{z:-3,tick:0,plate:"upper stabilizer",gravity:-1.2,aim:-3.75,end:2.5,height:1.4},{z:3,tick:110,plate:"lower stabilizer",gravity:7,gate:"upper stabilizer",end:4.3},{z:0,tick:235,gate:"lower stabilizer",gravity:5,plate:"core stabilizer",end:4.1,height:.7}]),
];
