import type { CodeTest } from "@/lib/types";
import type { Drill } from "./types";

/** The hidden tests as they are run: each one prefixed by the drill's shared reference code. */
export function drillTests(drill: Drill): CodeTest[] {
  const prelude = drill.prelude ? `${drill.prelude}\n` : "";
  return drill.tests.map((t) => ({ name: t.name, code: prelude + t.code }));
}
