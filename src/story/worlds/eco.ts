import { circuit } from "./circuit";

export const ecoLevels = [
  circuit("eco",1,"Seeds of Light","Send a pulse behind the seed. Pass over the botanical receiver on the way to the ring.","Something in the forest answers back.",[{z:0,tick:0,plate:"seed receiver",end:2.8}]),
  circuit("eco",2,"A Bridge of Roots","Dock the seed on the upper path first. The receiver grows a bridge across the lower gap.","The roots were waiting for permission.",[{z:-1.55,tick:0,plate:"root receiver"},{z:1.55,tick:105,bridge:"root receiver",end:2.8}]),
  circuit("eco",3,"The Greenhouse Divide","Energize the lower receiver. Select the raised deck and cross the bridge inside the greenhouse.","Someone separated the two greenhouses deliberately.",[{z:1.65,tick:0,plate:"greenhouse feed"},{z:-1.65,tick:110,bridge:"greenhouse feed",height:1.3,end:2.8}]),
  circuit("eco",4,"The Living Network","Follow the receivers from the first lane to the third. Each bridge feeds the next.","Growth was classified as a fault.",[{z:-3,tick:0,plate:"west roots"},{z:0,tick:110,bridge:"west roots",plate:"east roots",end:2.9},{z:3,tick:225,bridge:"east roots",end:2.8}]),
  circuit("eco",5,"The Sleeping Tree","Connect the uphill feeder, then the two root bridges. Every receiver brings the tree closer to waking.","The tree does not need permission to be alive.",[{z:3,tick:0,plate:"sun root",height:.75},{z:0,tick:100,bridge:"sun root",plate:"rain root"},{z:-3,tick:210,bridge:"rain root",plate:"crown root",height:1.25}]),
];
