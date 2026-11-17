import type { Drill } from "./types";
import { attention } from "./attention";
import { bpe } from "./bpe";
import { adamw } from "./adamw";
import { trainingLoop } from "./training-loop";
import { kvCache } from "./kv-cache";
import { lora } from "./lora";
import { ppo } from "./ppo";

/** Every drill, in the order the Drills page lists them. */
export const DRILLS: Drill[] = [attention, bpe, adamw, trainingLoop, kvCache, lora, ppo];

export const DRILL_BY_ID = new Map(DRILLS.map((d) => [d.id, d]));
