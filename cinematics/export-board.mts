import {writeFileSync} from "node:fs";
import {films} from "../src/story/film/boards.ts";

writeFileSync(process.argv[2] ?? "cinematics/boards.json",JSON.stringify(films,null,2)+"\n");
