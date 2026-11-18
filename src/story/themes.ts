export type WorldTheme = {
  id: string;
  sky: string;
  fog: string;
  sunlight: string;
  surface: string;
  platform: string;
  accent: string;
  dormant: string;
  restored: string;
  prop: "bubble" | "leaf" | "crystal" | "tile" | "shard";
  notes: readonly number[];
};

export const themes = {
  aero: {id:"aero", sky:"#bdeafa", fog:"#a5dbe6", sunlight:"#fff3cf", surface:"#61cfd8", platform:"#c9f3ec", accent:"#087d93", dormant:"#417c96", restored:"#43ffdb", prop:"bubble", notes:[60,64,67,72]},
  eco: {id:"eco", sky:"#dff4b6", fog:"#bfdea9", sunlight:"#fff2b0", surface:"#93bd76", platform:"#e0ebbf", accent:"#357547", dormant:"#638361", restored:"#9bfa69", prop:"leaf", notes:[55,62,69,74]},
  terra: {id:"terra", sky:"#f1d3a4", fog:"#daa974", sunlight:"#ffd394", surface:"#b57858", platform:"#f1d7a9", accent:"#95512b", dormant:"#966752", restored:"#ffe18a", prop:"crystal", notes:[48,55,60,64]},
  metro: {id:"metro", sky:"#d8edff", fog:"#bfd8fa", sunlight:"#fff4eb", surface:"#809fdb", platform:"#f0f7ff", accent:"#374dc2", dormant:"#626b9b", restored:"#fd9868", prop:"tile", notes:[57,60,64,69]},
  null: {id:"null", sky:"#282346", fog:"#312245", sunlight:"#d9a7ff", surface:"#241732", platform:"#67577a", accent:"#b94175", dormant:"#54264e", restored:"#e8b5ff", prop:"shard", notes:[45,51,57,60]},
} as const satisfies Record<string, WorldTheme>;
