"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const POPS = ["equal rates", "spread rates", "half impossible"];
const KS = [1, 10, 100, 1000];
const P = 4000;

/** Per-problem success rates with mean 0.2: all equal; Beta(0.5, 2); or half zero and half Beta(1, 1.5). Draws P problems. */
export function rates(pop: number, seed = 31) {
  const r = rand(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const gamma = (a: number): number => {
    if (a < 1) return gamma(a + 1) * Math.pow(r(), 1 / a);
    const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      const x = gauss(), v = (1 + c * x) ** 3;
      if (v > 0 && Math.log(1 - r()) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
    }
  };
  const beta = (a: number, b: number) => { const x = gamma(a); return x / (x + gamma(b)); };
  return Array.from({ length: P }, (_, i) => (pop === 0 ? 0.2 : pop === 1 ? beta(0.5, 2) : i % 2 ? 0 : beta(1, 1.5)));
}

const GRID = Array.from({ length: 31 }, (_, i) => Math.pow(10, (3 * i) / 30));

/** Expected pass@k (at least one of k succeeds) and pass^k (all k succeed), averaged over problems. */
export function curves(rs: number[]) {
  const at = (k: number) => rs.reduce((a, p) => a + 1 - Math.pow(1 - p, k), 0) / rs.length;
  const hat = (k: number) => rs.reduce((a, p) => a + Math.pow(p, k), 0) / rs.length;
  return { at, hat };
}

export function PassAtKViz() {
  const [pop, setPop] = useState(1);
  const [k, setK] = useState(2);
  const all = useMemo(() => [0, 1, 2].map((i) => curves(rates(i))), []);
  const W = 330, H = 180, X0 = 30, PW = 290, Y0 = 8, PH = 140;
  const px = (kk: number) => X0 + (Math.log10(kk) / 3) * PW;
  const py = (y: number) => Y0 + PH - y * PH;
  const path = (f: (k: number) => number) => GRID.map((kk, i) => `${i ? "L" : "M"}${px(kk).toFixed(1)},${py(f(kk)).toFixed(1)}`).join(" ");
  const cur = all[pop];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How success rates vary across problems">
          {POPS.map((name, i) => <button key={name} type="button" className="seg" aria-pressed={pop === i} onClick={() => setPop(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Number of samples k">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>k = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="pass@k and pass^k against k">
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {all.map((c, i) => i !== pop && <path key={i} d={path(c.at)} fill="none" stroke="var(--border-strong)" strokeWidth={1} />)}
        <path d={path(cur.at)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={path(cur.hat)} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <line x1={px(KS[k])} x2={px(KS[k])} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {KS.map((v) => <text key={v} x={px(v)} y={Y0 + PH + 13} textAnchor={v === 1 ? "start" : v === 1000 ? "end" : "middle"} className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">samples per problem, k</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        pass@1 {cur.at(1).toFixed(3)}; at k = {KS[k]}: pass@k {cur.at(KS[k]).toFixed(3)}, pass^k {cur.hat(KS[k]).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Three benchmarks with the same pass@1, about 0.2. The coloured upper curve is pass@k, the chance that at least one of k samples
        succeeds; the lower is pass^k, the chance that all k do. Grey curves show pass@k for the other two benchmarks. When every
        problem is equally hard, pass@k races to 1. When some problems are out of reach, it levels off at the fraction that can be
        solved at all, however many samples are drawn.
      </figcaption>
    </figure>
  );
}
