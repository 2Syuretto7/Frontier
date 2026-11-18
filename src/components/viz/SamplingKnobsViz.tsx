"use client";

import { useMemo, useState } from "react";

const N = 20;
const CONTEXTS = [
  { name: "confident", logits: [6, 3.2, 2.9, 1.5, 1.2, 1, 0.8, 0.5, 0.4, 0.2, 0, -0.2, -0.3, -0.5, -0.6, -0.8, -1, -1.2, -1.5, -2] },
  { name: "open-ended", logits: [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0, -0.3, -0.6, -1, -1.5] },
];
const TEMPS = [0.5, 0.8, 1, 1.5];
const METHODS = ["none", "top-k 5", "top-p 0.9", "min-p 0.1"];

/** Temperature, then one truncation rule, then renormalisation; returns the distributions before and after truncation. */
export function reshape(logits: number[], T: number, method: number) {
  const z = logits.map((l) => l / T), m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / s);
  const order = p.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const keep = new Array(N).fill(method === 0);
  if (method === 1) order.slice(0, 5).forEach((i) => (keep[i] = true));
  if (method === 2) {
    let c = 0;
    for (const i of order) { keep[i] = true; c += p[i]; if (c >= 0.9) break; }
  }
  if (method === 3) p.forEach((v, i) => (keep[i] = v >= 0.1 * p[order[0]]));
  const kept = p.reduce((a, v, i) => a + (keep[i] ? v : 0), 0);
  const q = p.map((v, i) => (keep[i] ? v / kept : 0));
  const H = (r: number[]) => -r.reduce((a, v) => a + (v > 0 ? v * Math.log(v) : 0), 0);
  return { p, q, kept: keep.filter(Boolean).length, removed: Math.max(0, 1 - kept), Hp: H(p), Hq: H(q) };
}

export function SamplingKnobsViz() {
  const [ci, setCi] = useState(0);
  const [ti, setTi] = useState(2);
  const [mi, setMi] = useState(2);
  const r = useMemo(() => reshape(CONTEXTS[ci].logits, TEMPS[ti], mi), [ci, ti, mi]);
  const W = 320, H = 150, X0 = 8, bw = (W - 16) / N, PH = 130;
  const top = Math.max(...r.p, ...r.q);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">context</span>
        {CONTEXTS.map((c, i) => (
          <button key={c.name} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">temperature</span>
        {TEMPS.map((t, i) => (
          <button key={t} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{t}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">truncation</span>
        {METHODS.map((m, i) => (
          <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Next-token probabilities before and after temperature and truncation">
        <line x1={X0} x2={W - 8} y1={PH + 2} y2={PH + 2} stroke="var(--border)" />
        {r.p.map((v, i) => {
          const hq = (r.q[i] / top) * (PH - 4), hp = (v / top) * (PH - 4);
          return (
            <g key={i}>
              <rect x={X0 + i * bw + 2} y={PH + 2 - hq} width={bw - 4} height={hq} fill="var(--accent)" />
              <rect x={X0 + i * bw + 2} y={PH + 2 - hp} width={bw - 4} height={hp} fill="none" stroke="var(--text-muted)" strokeDasharray="2 2" />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`kept ${r.kept} of ${N} tokens, removed mass ${r.removed.toFixed(3)}, entropy ${r.Hp.toFixed(2)} → ${r.Hq.toFixed(2)} nats`}
      </div>
      <figcaption className="viz-caption">
        Twenty candidate next tokens. Dashed outlines are the probabilities after temperature; filled bars are what is
        actually sampled from after truncation and renormalisation. Top-k keeps five tokens whatever the shape, too many
        for the confident context and too few for the open one. Top-p and min-p adapt: they keep a handful when one token
        dominates and many when the distribution is flat. Raising the temperature flattens everything and lets more tokens
        through top-p, while min-p&apos;s cut moves with the top probability.
      </figcaption>
    </figure>
  );
}
