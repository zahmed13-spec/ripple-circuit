import { circuit, timing } from "./circuit";

export const metroLevels = [
  circuit("metro",1,"First Departure","The barrier cycles after your first pulse. Depart during its open window.","The first line begins moving again.",[{z:0,tick:0,timed:timing(),end:2.9}]),
  circuit("metro",2,"Crossing Signals","Send the upper marble first. The lower barrier follows a different phase.","Two routes can share a rhythm without moving together.",[{z:-1.6,tick:0,timed:timing(20)},{z:1.6,tick:115,timed:timing(115),end:2.7}]),
  circuit("metro",3,"Perfect Timing","Power the route from the receiver lane. Send the second marble as its scheduled barrier opens.","A city can change course and still arrive together.",[{z:2,tick:0,plate:"departure signal",end:2.5},{z:-2,tick:138,gate:"departure signal",timed:timing(95),end:2.8}]),
  circuit("metro",4,"The Exchange","Dock on the raised feeder. Watch the lower barrier. Send the final marble across the central lift while it is level.","Luma remembers how the city used to make room for every traveler.",[{z:-3,tick:0,plate:"exchange",height:1.15,end:2.6},{z:3,tick:110,gate:"exchange",timed:timing(120),end:3},{z:0,tick:240,lift:{period:240,hold:150,distance:1.1,offset:0},end:2.8}]),
  circuit("metro",5,"Central Station","Connect the three departure lanes in order. Each receiver schedules the next route.","The city is moving together again.",[{z:-3,tick:0,plate:"line one",timed:timing()},{z:0,tick:105,plate:"line two",gate:"line one",timed:timing(125),height:.55},{z:3,tick:220,plate:"line three",gate:"line two",timed:timing(30),end:3.2}]),
];
