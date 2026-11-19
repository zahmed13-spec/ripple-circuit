import type { ExpansionWorld } from "../chapters";

type Script = readonly [title: string, opening: string, response: string, resolve: string];
export const scripts: Record<ExpansionWorld, readonly [Script,Script,Script,Script,Script,Script]> = {
  eco: [
    ["The Garden That Waited","Aero Haven's signal reached this greenhouse. The plants are alive.","Every vine stopped at exactly the same length. That wasn't a drought.","Let's send the seed receiver a pulse and see what it remembers."],
    ["A Seed Answers","The receiver is feeding the roots again.","They’re reaching for the other island. Look at that, Ripple.","Power the next receiver and give them somewhere to grow."],
    ["Room for Roots","The bridge didn't need rebuilding. It needed room to finish growing.","Something told the forest that making new paths was dangerous.","Follow those roots up to the greenhouse."],
    ["The Glass Divide","The upper greenhouse can breathe again.","The two chambers were separated by an emergency command. I recognize that seal.","Link the receivers. We can undo the order one path at a time."],
    ["Permission to Grow","Every root network is responding now.","The directive called growth a fault. I think it was afraid of what it couldn't predict.","The roots meet at that tree. Let's connect all three."],
    ["The Canopy Wakes","Look, Ripple. Every bridge chose a different shape.","I thought we had to put everything back exactly as it was. Maybe it just needs room to change.","The roots reach into Terra Core. Something down there is pulling back."],
  ],
  terra: [
    ["The Weight of Silence","The Canopy sent us down here. These crystals used to guide falling water.","Now the stabilizers are holding entire corridors still. Nothing can find its way home.","Start with the amber field. Let it do most of the work."],
    ["Stone in Motion","The first field is moving a little water again.","Even the stone needs somewhere for its weight to go.","That crystal can redirect the next field. Power its relay."],
    ["The Crystal Remembers","The crystal turned the pull toward the landing.","This is what a stabilizer was supposed to do. Adjust when something moves.","Try the opposing field next. It will push back."],
    ["A Measured Resistance","Both fields have settled into a balance.","We didn't defeat the current. We found a way to work with it.","Send power to the raised deck in the inversion chamber."],
    ["A Higher Path","The upper path is holding.","I remember telling someone that stillness wasn't the same as safety.","Connect the three stabilizers. The whole chamber should balance."],
    ["The Heart Settles","The stones aren't shaking. The water is still moving.","I wish the system that issued the directive could see the difference.","Terra's power is reaching Metro Pulse. The city can move again."],
  ],
  metro: [
    ["The Station Without Trains","The transit lines are lit, but every departure was suspended.","I remember these platforms. We built them so no region had to stand alone.","The first barrier is on a cycle. Watch for its opening."],
    ["The First Green Signal","One route is running.","The gate waits and opens again. We don't have to race it.","At the next junction the two routes open on different beats."],
    ["Two Rhythms","Two routes, one connection.","They don't need to move at the same time to help one another.","Power the scheduled barrier and send a marble through its open window."],
    ["Making Room","The exchange is receiving power.","I remember making the schedules together. Every region could ask for a different route.","Connect the raised feeder before trying the timed routes."],
    ["The Departure Board","The junction is feeding Central Station.","The departure board used to show all five regions. The missing line is marked NULL.","Restore the three major routes. We need the line into the core."],
    ["The City Moves","Central Station is sending power to all four lines.","The fifth line was the safety system's service route. I helped design it.","NULL is still listening at the other end. Let's go talk to it."],
  ],
  null: [
    ["The Safety System","These aren't ruins. They're safeguards reflected back on themselves.","I remember now. We asked NULL to prevent failures. We never explained that a world can recover from one.","Restore the first repair conduit. Let it see what movement can do."],
    ["The First Repair","The current made it through the broken channel.","That was a fracture, NULL. It didn't have to become a shutdown.","Check the direction of the next two fields. The reflection has them reversed."],
    ["Through the Reflection","The mirrored fields settled.","NULL must have been watching every failure and counting none of the recoveries.","Try feeding the roots through the old water channel."],
    ["A Thread of Green","The roots grew through the gap.","This is what you protected, NULL. It needs to change to stay alive.","Connect the gravity receiver to the root bridge and the timed gate."],
    ["An Open Circuit","The last connection is holding.","I remember the first garden, Ripple. All five worlds sent something to it.","Give the core a path through each of the four restored systems."],
    ["The Current Returns","The core has seen the whole circuit. It didn't need to stop the water this time.","NULL, listen. The garden is growing, the trains are running, and the stone is still holding.","I remember the first promise we made: if a world loses its way, the others will help it find a path home."],
  ],
};
