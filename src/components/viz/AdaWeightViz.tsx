"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 90, ROUNDS = 40, G = 30;
type Stump = { a: number; j: number; t: number; s: number };
const sp = (x: number[], st: Stump) => (x[st.j] <= st.t ? st.s : -st.s);

/** AdaBoost with decision stumps on a disc-shaped class: point sizes show the current weights, the shading shows the ensemble's decision, and the curves track training error and the exponential loss. */
export function AdaWeightViz() {
  const [T, setT] = useState(5);
  const run = useMemo(() => {
    const r = makeRng(2718);
    const pts = Array.from({ length: N }, () => { const x = [r() * 2 - 1, r() * 2 - 1]; return { x, y: x[0] * x[0] + x[1] * x[1] < 0.45 ? 1 : -1 }; });
    let w = Array(N).fill(1 / N);
    const model: Stump[] = [], weights: number[][] = [w.slice()], errs: number[] = [], losses: number[] = [];
    for (let k = 0; k < ROUNDS; k++) {
      let best = { e: Infinity, j: 0, t: 0, s: 1 };
      for (let j = 0; j < 2; j++) for (const p of pts) for (const s of [1, -1]) {
        const t = p.x[j];
        let e = 0;
        pts.forEach((q, i) => { if ((q.x[j] <= t ? s : -s) !== q.y) e += w[i]; });
        if (e < best.e) best = { e, j, t, s };
      }
      const e = Math.max(best.e, 1e-12), a = 0.5 * Math.log((1 - e) / e);
      const st = { a, j: best.j, t: best.t, s: best.s };
      model.push(st);
      w = w.map((v, i) => v * Math.exp(-a * pts[i].y * sp(pts[i].x, st)));
      const z = w.reduce((s2, v) => s2 + v, 0);
      w = w.map((v) => v / z);
      weights.push(w.slice());
      const scores = pts.map((p) => model.reduce((s2, m) => s2 + m.a * sp(p.x, m), 0));
      errs.push(scores.filter((sc, i) => Math.sign(sc) !== pts[i].y).length / N);
      losses.push(scores.reduce((s2, sc, i) => s2 + Math.exp(-pts[i].y * sc), 0) / N);
    }
    return { pts, model, weights, errs, losses };
  }, []);
  const W = 260, cell = W / G;
  const X = (v: number) => ((v + 1) / 2) * W, Y = (v: number) => ((1 - v) / 2) * W;
  const m = run.model.slice(0, T);
  const wcur = run.weights[T];
  const grid = Array.from({ length: G * G }, (_, idx) => {
    const x = [-1 + ((idx % G) + 0.5) * (2 / G), 1 - (Math.floor(idx / G) + 0.5) * (2 / G)];
    return m.reduce((s, st) => s + st.a * sp(x, st), 0);
  });
  const W2 = 300, H2 = 110;
  const CX = (k: number) => 24 + ((k - 1) / (ROUNDS - 1)) * (W2 - 36);
  const CY = (v: number) => H2 - 14 - (Math.min(v, 1) / 1) * (H2 - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          rounds = {T}
          <input type="range" min={1} max={ROUNDS} value={T} onChange={(e) => setT(Number(e.target.value))} aria-label="number of boosting rounds" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Boosted decision regions and weighted training points">
        {grid.map((v, idx) => <rect key={idx} x={(idx % G) * cell} y={Math.floor(idx / G) * cell} width={cell + 0.3} height={cell + 0.3} fill={v > 0 ? "var(--accent)" : "var(--danger)"} opacity={0.16} />)}
        {run.pts.map((p, i) => <circle key={i} cx={X(p.x[0])} cy={Y(p.x[1])} r={1.5 + Math.sqrt(wcur[i] * N) * 2.2} fill={p.y > 0 ? "var(--accent)" : "var(--danger)"} stroke="var(--text)" strokeWidth={0.4} opacity={0.85} />)}
      </svg>
      <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Training error and exponential loss against rounds">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={run.losses.map((v, k) => `${CX(k + 1).toFixed(1)},${CY(v).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} points={run.errs.map((v, k) => `${CX(k + 1).toFixed(1)},${CY(v).toFixed(1)}`).join(" ")} />
        <line x1={CX(T)} x2={CX(T)} y1={8} y2={H2 - 14} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <line x1={24} x2={W2 - 12} y1={CY(0)} y2={CY(0)} stroke="var(--border)" />
        <text x={24} y={H2 - 2} className="viz-label">round 1</text>
        <text x={W2 - 12} y={H2 - 2} textAnchor="end" className="viz-label">round {ROUNDS}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        training error {run.errs[T - 1].toFixed(3)}; exponential loss {run.losses[T - 1].toFixed(3)}; latest stump α = {m[T - 1].a.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The positive class is a disc, which no single axis-aligned stump can carve out. Each round fits the stump with the
        lowest weighted error, then multiplies the weights of the points it got wrong by a common factor, so the next stump
        attends to them; point size shows the current weight. The shading is the sign of the weighted vote. In the lower
        plot, the upper curve is the exponential loss, which falls every round and bounds the training error, the lower
        curve.
      </figcaption>
    </figure>
  );
}
