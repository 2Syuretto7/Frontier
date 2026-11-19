import type { GymCase } from "./types";
import { leakySplit } from "./cases/leaky-split";
import { targetLeak } from "./cases/target-leak";
import { warmup } from "./cases/warmup";
import { cosine } from "./cases/cosine";
import { causalMask } from "./cases/causal-mask";
import { padding } from "./cases/padding";
import { halfPrecision } from "./cases/half-precision";
import { byteImages } from "./cases/byte-images";
import { accumulationScale, accumulationReset } from "./cases/accumulation";

/** Every case, in the order the gym lists them: roughly the order their lessons come in Learn. */
export const CASES: GymCase[] = [
  leakySplit, targetLeak, warmup, cosine, byteImages, halfPrecision, causalMask, padding, accumulationScale, accumulationReset,
];

export const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));

/** The hidden tests as they are run: each one prefixed by the case's shared reference code. */
export function caseTests(c: Pick<GymCase, "tests" | "prelude">): { name: string; code: string }[] {
  const prelude = c.prelude ? `${c.prelude}\n` : "";
  return c.tests.map((t) => ({ name: t.name, code: prelude + t.code }));
}
