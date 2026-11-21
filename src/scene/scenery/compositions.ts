export type ScenicWorld = "aero"|"eco"|"terra"|"metro"|"null";

export const compositions = {
  aero: [
    ["Landing Garden",-6,-6.5,1.1],["Reservoir Viaduct",-4,-8.2,1.45],
    ["Terrace Observatory",-7.6,-6.8,1.2],["Intake Pump Works",-3.8,-8,1.15],
    ["Crown Aqueduct",-5.2,-8.5,1.9],
  ],
  eco: [
    ["Seed Conservatory",-5.4,-6.8,1],["Rootspan Grove",-7,-6.5,1.32],
    ["Twin Glasshouses",-4.3,-7.4,1.28],["Botanical Research Ring",-6.5,-8,1.46],
    ["Heartwood Sanctuary",-4.8,-7.7,1.92],
  ],
  terra: [
    ["Amber Descent",-6.9,-7.2,1.1],["Prism Valley",-5.3,-7,1.44],
    ["Weightstone Vault",-4.9,-8.2,1.28],["Inversion Rings",-6.6,-7.3,1.58],
    ["Core Stabilizer",-4.7,-8.8,1.95],
  ],
  metro: [
    ["First Departure Platform",-5.2,-6.6,1],["Crossing Signals Junction",-6.9,-6.7,1.1],
    ["Clockline Concourse",-4.5,-7.6,1.2],["Exchange Viaduct",-6.3,-7.2,1.35],
    ["Central Station Terminal",-4.4,-8.2,1.8],
  ],
  null: [
    ["Broken Signal Tower",-6.2,-7.5,1.12],["Mirror Reef",-4.2,-7.4,1.33],
    ["Faultglass Junction",-7.2,-7.6,1.24],["Last-Link Observatory",-5,-7.8,1.55],
    ["Fractured Current",-5.7,-8.3,1.91],
  ],
} as const satisfies Record<ScenicWorld,readonly (readonly [string,number,number,number])[]>;
