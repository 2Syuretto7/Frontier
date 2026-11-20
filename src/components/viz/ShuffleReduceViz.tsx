"use client";

import { useState } from "react";

const LANES = 16;
const INIT = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];

/**
 * Simulates a warp reduction over 16 lanes. In "down" mode each step adds the value from the lane `offset` above (a lane with no
 * such partner receives its own value, as __shfl_down_sync does, and so doubles it), with offsets 8, 4, 2, 1. In "xor" mode each
 * lane adds the value of lane i ^ mask. Returns the values after each step and, for each step, the set of original lanes summed into each lane's value.
 */
export function shuffleSteps(mode: "down" | "xor") {
  let vals = [...INIT];
  let sets = INIT.map((_, i) => [i]);
  const out = [{ vals, sets, offset: 0 }];
  for (let off = LANES / 2; off >= 1; off >>= 1) {
    const partner = (i: number) => (mode === "xor" ? i ^ off : i + off < LANES ? i + off : i);
    const nv = vals.map((v, i) => v + vals[partner(i)]);
    const ns = sets.map((s, i) => [...s, ...sets[partner(i)]]);
    vals = nv;
    sets = ns;
    out.push({ vals, sets, offset: off });
  }
  return out;
}

export function ShuffleReduceViz() {
  const [m, setM] = useState(0);
  const [k, setK] = useState(0);
  const steps = shuffleSteps(m === 0 ? "down" : "xor");
  const st = steps[k];
  const total = INIT.reduce((a, b) => a + b, 0);
  const W = 340, H = 92, CW = 20, X0 = 10;
  const exact = (i: number) => new Set(st.sets[i]).size === st.sets[i].length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Shuffle pattern">
          {["shuffle down", "butterfly (xor)"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{n}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Step of the reduction">
          {steps.map((s, i) => <button key={i} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{i === 0 ? "start" : `offset ${s.offset}`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Values held by each lane of a warp during a shuffle reduction">
        {st.vals.map((v, i) => {
          const x = X0 + i * CW;
          const full = st.sets[i].length === LANES && exact(i);
          const clean = exact(i);
          return (
            <g key={i}>
              <rect x={x} y={20} width={CW - 2} height={34} style={{ fill: full ? "var(--accent)" : clean ? "var(--bg-subtle)" : "none", stroke: clean ? "var(--text-muted)" : "var(--text-faint)" }} strokeDasharray={clean ? undefined : "2 2"} />
              <text x={x + (CW - 2) / 2} y={41} textAnchor="middle" className="viz-label" style={{ fill: full ? "var(--bg)" : undefined }}>{v}</text>
              <text x={x + (CW - 2) / 2} y={14} textAnchor="middle" className="viz-label">{i}</text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 8} textAnchor="middle" className="viz-label">dashed: some lane counted more than once</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        lane 0 holds the sum of {new Set(st.sets[0]).size} lane{new Set(st.sets[0]).size === 1 ? "" : "s"} ({st.vals[0]}); lanes holding the full total {total}: {st.vals.filter((_, i) => st.sets[i].length === LANES && exact(i)).length}
      </div>
      <figcaption className="viz-caption">
        Sixteen lanes of a warp sum their values with register shuffles, no shared memory. With shuffle down, lane 0 ends with the total
        and the other lanes hold partial or double-counted sums that are simply ignored. With the butterfly pattern every lane ends with
        the total, which saves a broadcast when all lanes need it.
      </figcaption>
    </figure>
  );
}
