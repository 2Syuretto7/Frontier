"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type P = [number, number];
const K = 16, BATCH = 64, GAMMA = 0.9;
const CENTRES: P[] = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);

/** Train a 16-code vector quantiser by exponential moving averages on minibatches; optionally restart codes that fall out of use. */
export function train(steps: number, restart: boolean, seed = 4) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const draw = (): P => { const c = CENTRES[Math.floor(r() * 8)]; return [c[0] + 0.15 * nrm(), c[1] + 0.15 * nrm()]; };
  let cb: P[] = Array.from({ length: K }, () => [1.3 + 0.25 * r(), 1.3 + 0.25 * r()]);
  let cnt = new Array(K).fill(1), sum: P[] = cb.map((c) => [...c] as P);
  const near = (p: P) => { let b = 0, bd = Infinity; cb.forEach((c, k) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (d < bd) { bd = d; b = k; } }); return b; };
  for (let t = 0; t < steps; t++) {
    const batch = Array.from({ length: BATCH }, draw);
    const n = new Array(K).fill(0), s: P[] = cb.map(() => [0, 0]);
    for (const p of batch) { const k = near(p); n[k]++; s[k][0] += p[0]; s[k][1] += p[1]; }
    cnt = cnt.map((c, k) => GAMMA * c + (1 - GAMMA) * n[k]);
    sum = sum.map((u, k) => [GAMMA * u[0] + (1 - GAMMA) * s[k][0], GAMMA * u[1] + (1 - GAMMA) * s[k][1]]);
    cb = sum.map((u, k) => [u[0] / Math.max(cnt[k], 1e-9), u[1] / Math.max(cnt[k], 1e-9)]);
    if (restart) cnt.forEach((c, k) => { if (c < 0.1) { const p = batch[Math.floor(r() * BATCH)]; cb[k] = [p[0], p[1]]; cnt[k] = 1; sum[k] = [p[0], p[1]]; } });
  }
  const test = Array.from({ length: 2000 }, draw), use = new Array(K).fill(0);
  let mse = 0;
  for (const p of test) { const k = near(p); use[k]++; mse += (p[0] - cb[k][0]) ** 2 + (p[1] - cb[k][1]) ** 2; }
  const h = use.reduce((a, u) => (u ? a - (u / test.length) * Math.log(u / test.length) : a), 0);
  return { cb, used: use.filter((u) => u > 0).length, ppl: Math.exp(h), mse: mse / test.length, test: test.slice(0, 400) };
}

const STEPS = [0, 10, 50, 300];

export function CodebookViz() {
  const [si, setSi] = useState(2), [restart, setRestart] = useState(false);
  const res = useMemo(() => train(STEPS[si], restart), [si, restart]);
  const W = 240, c = W / 2, s = W / 3.6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">updates</span>
        <div className="segmented" role="group" aria-label="Number of updates">
          {STEPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{v}</button>)}
        </div>
        <span className="viz-label">restart dead codes</span>
        <div className="segmented" role="group" aria-label="Restart dead codes">
          <button type="button" className="seg" aria-pressed={!restart} onClick={() => setRestart(false)}>off</button>
          <button type="button" className="seg" aria-pressed={restart} onClick={() => setRestart(true)}>on</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Data and codebook vectors">
        <rect x={0} y={0} width={W} height={W} fill="var(--bg-subtle)" />
        {res.test.map((p, i) => <circle key={i} cx={c + s * p[0]} cy={c - s * p[1]} r={1.3} fill="var(--text-muted)" fillOpacity={0.5} />)}
        {res.cb.map((p, i) => <rect key={`c${i}`} x={c + s * p[0] - 4} y={c - s * p[1] - 4} width={8} height={8} fill="var(--accent)" stroke="var(--bg)" />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> encoder outputs</span>
        <span><span style={{ color: "var(--accent)" }}>■</span> code vectors (16)</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`codes used ${res.used} of ${K}, usage perplexity ${res.ppl.toFixed(2)}, error ${res.mse.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption">
        Sixteen code vectors start bunched together outside the data, the eight clusters of encoder outputs, and are updated
        by moving averages of the points assigned to them. A code that wins no points never moves. After 50 updates only 4
        codes are in use, a usage perplexity of 3.80, and the error is 0.244. Restarting any code whose usage has decayed to
        near zero at a randomly chosen encoder output puts all 16 to work (perplexity 14.58, error 0.033). Even after 300
        updates the run without restarts lags, with perplexity 11.04 and twice the error.
      </figcaption>
    </figure>
  );
}
