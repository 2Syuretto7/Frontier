"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 5, TASKS = 300;
const NS = Array.from({ length: 20 }, (_, i) => 2 * (i + 1));

function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
    [M[i], M[piv]] = [M[piv], M[i]];
    for (let r = i + 1; r < n; r++) {
      const f = M[r][i] / M[i][i];
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
    x[i] = s / M[i][i];
  }
  return x;
}

/** Mean of ‖ŵ − w*‖² over random noiseless linear tasks with N in-context examples, for k GD steps and least squares. */
export function icl(N: number, k: number, seed: number) {
  const r = rand(seed * 1009 + N);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const eta = k === 1 ? N / (N + D + 1) : 1 / (1 + Math.sqrt(D / N)) ** 2;
  let gd = 0, ls = 0;
  for (let t = 0; t < TASKS; t++) {
    const w = Array.from({ length: D }, normal);
    const X = Array.from({ length: N }, () => Array.from({ length: D }, normal));
    const y = X.map((x) => x.reduce((s, v, j) => s + v * w[j], 0));
    let u = new Array<number>(D).fill(0);
    for (let s = 0; s < k; s++) {
      const g = new Array<number>(D).fill(0);
      X.forEach((x, i) => {
        const res = y[i] - x.reduce((acc, v, j) => acc + v * u[j], 0);
        for (let j = 0; j < D; j++) g[j] += (res * x[j]) / N;
      });
      u = u.map((v, j) => v + eta * g[j]);
    }
    gd += u.reduce((s, v, j) => s + (v - w[j]) ** 2, 0);
    let wl: number[];
    if (N >= D) {
      const A = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => X.reduce((s, x) => s + x[i] * x[j], 0)));
      wl = solve(A, Array.from({ length: D }, (_, i) => X.reduce((s, x, n) => s + x[i] * y[n], 0)));
    } else {
      const G = X.map((a) => X.map((b) => a.reduce((s, v, j) => s + v * b[j], 0)));
      const c = solve(G, y);
      wl = Array.from({ length: D }, (_, j) => X.reduce((s, x, n) => s + x[j] * c[n], 0));
    }
    ls += wl.reduce((s, v, j) => s + (v - w[j]) ** 2, 0);
  }
  return { gd: gd / TASKS, ls: ls / TASKS };
}

export function InContextGdViz() {
  const [k, setK] = useState(1);
  const data = useMemo(() => NS.map((N) => icl(N, k, 1)), [k]);
  const theory = NS.map((N) => (D * (D + 1)) / (N + D + 1));
  const W = 330, H = 170, X0 = 34, PW = 286, Y0 = 140, PH = 126, LO = -3, HI = 1;
  const px = (N: number) => X0 + ((N - 2) / 38) * PW;
  const py = (v: number) => Y0 - ((Math.max(LO, Math.min(HI, Math.log10(Math.max(v, 1e-9)))) - LO) / (HI - LO)) * PH;
  const at20 = data[NS.indexOf(20)];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Gradient steps, one per attention layer">
          {[1, 2, 4, 8].map((v) => (
            <button key={v} className="seg" aria-pressed={k === v} onClick={() => setK(v)}>{v} {v === 1 ? "layer" : "layers"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Error of in-context predictors against the number of examples">
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        {[-3, -2, -1, 0, 1].map((e) => <text key={e} x={X0 - 4} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">10{e < 0 ? "⁻" : ""}{"⁰¹²³"[Math.abs(e)]}</text>)}
        {[2, 10, 20, 30, 40].map((N) => <text key={N} x={px(N)} y={Y0 + 12} textAnchor="middle" className="viz-label">{N}</text>)}
        {k === 1 ? <path d={theory.map((v, i) => `${i ? "L" : "M"}${px(NS[i]).toFixed(1)},${py(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="5 4" /> : null}
        <path d={data.map((v, i) => `${i ? "L" : "M"}${px(NS[i]).toFixed(1)},${py(v.gd).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <path d={data.map((v, i) => `${i ? "L" : "M"}${px(NS[i]).toFixed(1)},${py(v.ls).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0 + PW} y={16} textAnchor="end" className="viz-label" style={{ fill: "var(--code-function)" }}>gradient descent, {k} {k === 1 ? "step" : "steps"}</text>
        <text x={X0 + PW} y={30} textAnchor="end" className="viz-label" style={{ fill: "var(--accent)" }}>least squares</text>
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">examples in context N; error ‖ŵ − w*‖² (log)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        at N = 20 in d = {D}: {k} GD {k === 1 ? "step" : "steps"} {at20.gd.toFixed(3)}, least squares {at20.ls < 1e-6 ? "below 10⁻⁶" : at20.ls.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Random noiseless linear regression tasks in 5 dimensions, averaged over 300 tasks per point. One layer of linear
        self-attention can compute exactly one gradient descent step from zero on the examples in its context, so stacking
        layers gives more steps. One step, with the best step size, has error d(d + 1)/(N + d + 1) (dashed), far above least
        squares, which is exact once N ≥ d. Each extra layer closes part of the gap; with several steps the step size is set to
        1/(1 + √(d/N))², which keeps the iteration stable.
      </figcaption>
    </figure>
  );
}
