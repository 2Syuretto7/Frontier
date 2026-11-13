"use client";

import { useState } from "react";

type G = { n: number; pos: [number, number][]; edges: [number, number][]; good: number[]; bad: number[] };

function star(): G {
  const pos: [number, number][] = [[165, 95]];
  for (let k = 0; k < 8; k++) pos.push([165 + 70 * Math.cos((k * Math.PI) / 4), 95 + 70 * Math.sin((k * Math.PI) / 4)]);
  const edges = Array.from({ length: 8 }, (_, k) => [0, k + 1] as [number, number]);
  return { n: 9, pos, edges, good: [1, 2, 3, 4, 5, 6, 7, 8, 0], bad: [0, 1, 2, 3, 4, 5, 6, 7, 8] };
}

function grid(): G {
  const id = (r: number, c: number) => r * 4 + c;
  const pos: [number, number][] = [];
  const edges: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    pos.push([90 + c * 50, 20 + r * 50]);
    if (c < 3) edges.push([id(r, c), id(r, c + 1)]);
    if (r < 3) edges.push([id(r, c), id(r + 1, c)]);
  }
  const good = [0, 1, 2, 3].flatMap((c) => [0, 1, 2, 3].map((r) => id(r, c)));
  return { n: 16, pos, edges, good, bad: [5, 6, 9, 10, 1, 2, 4, 7, 8, 11, 13, 14, 0, 3, 12, 15] };
}

const GRAPHS = { star: star(), grid: grid() };

function simulate(g: G, order: number[], steps: number) {
  const nb = Array.from({ length: g.n }, () => new Set<number>());
  g.edges.forEach(([a, b]) => { nb[a].add(b); nb[b].add(a); });
  const fill: [number, number][] = [];
  const sizes: number[] = [];
  const gone = new Set<number>();
  for (let s = 0; s < steps; s++) {
    const v = order[s];
    const sc = [...nb[v]];
    sizes.push(sc.length + 1);
    for (const a of sc) for (const b of sc) if (a < b && !nb[a].has(b)) { nb[a].add(b); nb[b].add(a); fill.push([a, b]); }
    for (const a of sc) nb[a].delete(v);
    gone.add(v);
  }
  return { fill, sizes, gone, next: steps < order.length ? order[steps] : -1 };
}

/** Variable elimination on a star and on a grid: the order decides how large the intermediate factors become. */
export function EliminationOrderViz() {
  const [which, setWhich] = useState<"star" | "grid">("star");
  const [ord, setOrd] = useState<"good" | "bad">("good");
  const [step, setStep] = useState(0);
  const g = GRAPHS[which];
  const order = g[ord];
  const st = Math.min(step, g.n);
  const { fill, sizes, gone, next } = simulate(g, order, st);
  const worst = Math.max(0, ...simulate(g, order, g.n).sizes);
  const W = 330, H = 190;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {(["star", "grid"] as const).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={which === k} onClick={() => { setWhich(k); setStep(0); }}>{k}</button>
        ))}
        {(["good", "bad"] as const).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={ord === k} onClick={() => { setOrd(k); setStep(0); }}>{k} order</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          eliminated {st}
          <input type="range" min={0} max={g.n} value={st} onChange={(e) => setStep(Number(e.target.value))} aria-label="number of variables eliminated" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Graph during variable elimination with fill-in edges">
        {g.edges.map(([a, b]) => (
          <line key={`e${a}-${b}`} x1={g.pos[a][0]} y1={g.pos[a][1]} x2={g.pos[b][0]} y2={g.pos[b][1]} stroke="var(--border)" strokeWidth={1.4} opacity={gone.has(a) || gone.has(b) ? 0.3 : 1} />
        ))}
        {fill.map(([a, b]) => (
          <line key={`f${a}-${b}`} x1={g.pos[a][0]} y1={g.pos[a][1]} x2={g.pos[b][0]} y2={g.pos[b][1]} stroke="var(--danger)" strokeDasharray="3 3" opacity={gone.has(a) || gone.has(b) ? 0.25 : 0.9} />
        ))}
        {g.pos.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={8} fill={gone.has(i) ? "none" : i === next ? "var(--danger)" : "var(--accent)"} stroke={gone.has(i) ? "var(--border)" : "none"} opacity={gone.has(i) ? 0.6 : 0.85} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        factor sizes so far: {sizes.length ? sizes.map((s) => `2^${s}`).join(", ") : "none"}; largest over the whole order: 2^{worst} = {2 ** worst}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Eliminating a variable multiplies every factor that mentions it, which creates one factor over the variable and all
        its current neighbours, then sums the variable out. The neighbours become linked (dashed red fill-in edges). The
        next variable to go is shown in red. On the star, removing the leaves first never makes a factor over more than two
        variables, while removing the hub first makes one over all eight leaves. On the 4-by-4 grid, going column by column
        keeps factors to five variables; starting in the centre reaches nine.
      </figcaption>
    </figure>
  );
}
