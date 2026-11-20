"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const TRUE = { E: 1.8, A: 6, alpha: 0.3 };
const XS = Array.from({ length: 10 }, (_, i) => Math.pow(10, 1 + (i * 3) / 9));
const TARGET = 1e6;

function data() {
  const r = rand(37);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return XS.map((x) => (TRUE.E + TRUE.A * Math.pow(x, -TRUE.alpha)) * Math.exp(0.006 * normal()));
}
const YS = data();

function fitPower(xs: number[], ys: number[], E: number) {
  const u = xs.map(Math.log), v = ys.map((y) => Math.log(y - E));
  const mu = u.reduce((a, b) => a + b, 0) / u.length, mv = v.reduce((a, b) => a + b, 0) / v.length;
  const s = u.reduce((acc, a, i) => acc + (a - mu) * (v[i] - mv), 0) / u.reduce((acc, a) => acc + (a - mu) ** 2, 0);
  return { E, A: Math.exp(mv - s * mu), alpha: -s };
}

/** Fit L = E + A x^(−α): with E fixed, or with E chosen on a grid to minimise squared error in log L. */
export function fit(n: number, mode: "zero" | "fitted" | "high") {
  const xs = XS.slice(0, n), ys = YS.slice(0, n);
  if (mode === "zero") return fitPower(xs, ys, 0);
  if (mode === "high") return fitPower(xs, ys, 2.0);
  let best = fitPower(xs, ys, 0), bestErr = Infinity;
  for (let E = 0; E < Math.min(...ys) - 1e-3; E += 0.005) {
    const f = fitPower(xs, ys, E);
    const err = xs.reduce((s, x, i) => s + (Math.log(E + f.A * Math.pow(x, -f.alpha)) - Math.log(ys[i])) ** 2, 0);
    if (err < bestErr) { bestErr = err; best = f; }
  }
  return best;
}

type Mode = "zero" | "fitted" | "high";
const LABEL: Record<Mode, string> = { zero: "E = 0", fitted: "E fitted", high: "E = 2.0" };

export function PowerFitViz() {
  const [mode, setMode] = useState<Mode>("fitted");
  const [n, setN] = useState(7);
  const f = useMemo(() => fit(n, mode), [n, mode]);
  const W = 330, H = 170, X0 = 30, PW = 290, Y0 = 8, PH = 130;
  const lx0 = 1, lx1 = 6, L0 = 0.6, L1 = 5;
  const px = (x: number) => X0 + ((Math.log10(x) - lx0) / (lx1 - lx0)) * PW;
  const py = (l: number) => Y0 + PH - ((Math.max(L0 - 0.2, Math.min(L1, l)) - L0) / (L1 - L0)) * PH;
  const grid = Array.from({ length: 61 }, (_, i) => Math.pow(10, lx0 + ((lx1 - lx0) * i) / 60));
  const curve = (p: { E: number; A: number; alpha: number }) => grid.map((x) => `${px(x).toFixed(1)},${py(p.E + p.A * Math.pow(x, -p.alpha)).toFixed(1)}`).join(" ");
  const pred = f.E + f.A * Math.pow(TARGET, -f.alpha), truth = TRUE.E + TRUE.A * Math.pow(TARGET, -TRUE.alpha);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Irreducible loss in the fit">
          {(["zero", "fitted", "high"] as Mode[]).map((m) => (
            <button key={m} className="seg" aria-pressed={mode === m} onClick={() => setMode(m)}>{LABEL[m]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Points used in the fit">
          {[4, 7, 10].map((v) => (
            <button key={v} className="seg" aria-pressed={n === v} onClick={() => setN(v)}>fit {v} runs</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Power-law fits to training runs and their extrapolation">
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[1, 2, 3, 4, 5, 6].map((e) => (
          <text key={e} x={px(Math.pow(10, e))} y={Y0 + PH + 12} textAnchor={e === 6 ? "end" : "middle"} className="viz-label">10^{e}</text>
        ))}
        <polyline points={curve(TRUE)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline points={curve(f)} fill="none" stroke="var(--accent)" strokeWidth={1.8} />
        {XS.map((x, i) => (
          <circle key={i} cx={px(x)} cy={py(YS[i])} r={3} style={{ fill: i < n ? "var(--code-function)" : "var(--surface)" }} stroke="var(--code-function)" />
        ))}
        <text x={X0} y={H - 2} className="viz-label">compute (log); filled: runs used; dashed: true law</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        fit: E = {f.E.toFixed(3)}, A = {f.A.toFixed(2)}, α = {f.alpha.toFixed(3)}; predicted loss at 10^6: {pred.toFixed(3)} (true {truth.toFixed(3)})
      </div>
      <figcaption className="viz-caption">
        Ten runs whose losses follow L = 1.8 + 6x^−0.3 with half a percent of noise. Fitting a pure power law (E = 0) gives a
        straight line in log-log space and too small an exponent, which still matches the runs but extrapolates badly.
        Fixing E too high bends the curve the other way. Fitting E as well works, but with few small runs E and α trade off
        against each other and the extrapolation is fragile.
      </figcaption>
    </figure>
  );
}
