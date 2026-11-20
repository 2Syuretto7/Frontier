"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 64;
const RUNS = 6;
type Rule = "1" | "0.3" | "sqrt" | "lin";
const RULES: [Rule, string][] = [["1", "α = 1"], ["0.3", "α = 0.3"], ["sqrt", "α = 1/√L"], ["lin", "α = 1/L"]];

export function branchScale(rule: Rule, L: number) {
  return rule === "1" ? 1 : rule === "0.3" ? 0.3 : rule === "sqrt" ? 1 / Math.sqrt(L) : 1 / L;
}

/** log10 of ‖h^l‖²/‖h^0‖² along a linear residual network h ← h + α A h with Gaussian A of variance 1/N. */
export function residualPaths(alpha: number, L: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const paths: number[][] = [];
  for (let run = 0; run < RUNS; run++) {
    let h = Array.from({ length: N }, normal);
    const n0 = h.reduce((s, x) => s + x * x, 0);
    let logScale = 0;
    const path = [0];
    for (let l = 0; l < L; l++) {
      const next = h.slice();
      for (let i = 0; i < N; i++) {
        let s = 0;
        for (let j = 0; j < N; j++) s += normal() * h[j];
        next[i] += (alpha * s) / Math.sqrt(N);
      }
      const n = Math.sqrt(next.reduce((s, x) => s + x * x, 0) / n0);
      logScale += 2 * Math.log10(n);
      h = next.map((x) => x / n);
      path.push(logScale);
    }
    paths.push(path);
  }
  return paths;
}

export function ResidualScaleViz() {
  const [rule, setRule] = useState<Rule>("sqrt");
  const [L, setL] = useState(32);
  const [seed, setSeed] = useState(1);
  const alpha = branchScale(rule, L);
  const paths = useMemo(() => residualPaths(alpha, L, seed), [alpha, L, seed]);
  const theory = Array.from({ length: L + 1 }, (_, l) => l * Math.log10(1 + alpha * alpha));
  const top = Math.max(1, ...paths.map((p) => Math.max(...p)), theory[L]);
  const bottom = Math.min(0, ...paths.map((p) => Math.min(...p)));
  const W = 330, H = 160, X0 = 40, PW = 280, Y0 = 130, PH = 116;
  const px = (l: number) => X0 + (l / L) * PW;
  const py = (v: number) => Y0 - ((v - bottom) / (top - bottom)) * PH;
  const simGain = paths.reduce((s, p) => s + 10 ** p[L], 0) / RUNS;
  const relVar = (L * (2 * alpha ** 2 + alpha ** 4)) / (1 + alpha ** 2) ** 2;
  const fmt = (x: number) => (x < 1e4 ? x.toFixed(3) : x.toExponential(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Branch scale">
          {RULES.map(([k, label]) => (
            <button key={k} className="seg" aria-pressed={rule === k} onClick={() => setRule(k)}>{label}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Depth">
          {[8, 32, 128].map((d) => (
            <button key={d} className="seg" aria-pressed={L === d} onClick={() => setL(d)}>L = {d}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Squared norm of the hidden state across the layers of a residual network, on a logarithmic scale">
        <line x1={X0} x2={X0 + PW} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        <text x={X0 - 4} y={py(top) + 8} textAnchor="end" className="viz-label">{top === 1 ? "10" : `10^${top.toFixed(top < 10 ? 1 : 0)}`}</text>
        <text x={X0 - 4} y={py(0) + 4} textAnchor="end" className="viz-label">1</text>
        {paths.map((p, k) => (
          <path key={k} d={p.map((v, l) => `${l ? "L" : "M"}${px(l).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={1.2} opacity={0.7} />
        ))}
        <path d={theory.map((v, l) => `${l ? "L" : "M"}${px(l).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 3" />
        <text x={X0} y={H - 4} className="viz-label">layer 0 to {L}</text>
        <text x={X0 + PW} y={H - 4} textAnchor="end" className="viz-label">dashed: (1 + α²)^l</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        α = {alpha.toFixed(4)}: final ‖h‖² gain {fmt(simGain)} (mean of {RUNS} networks), theory {fmt((1 + alpha * alpha) ** L)}; Jacobian relative spread {relVar.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Six random linear residual networks of width 64, each block adding α times a Gaussian layer to the identity. Plotted
        is the squared length of the hidden state relative to the input, on a log scale, with the expected value as the
        dashed curve. A fixed α makes it grow exponentially in depth, so deeper networks need ever smaller learning rates.
        Shrinking α like 1/√L holds it near e whatever the depth while every block still matters; shrinking it like 1/L
        holds it near 1 but leaves the network almost the identity.
      </figcaption>
    </figure>
  );
}
