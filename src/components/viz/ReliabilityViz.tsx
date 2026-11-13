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

const N = 4000, BINS = 10;
const sig = (t: number) => 1 / (1 + Math.exp(-t));

function plattFit(s: number[], y: number[]) {
  let a = 0, b = 0;
  for (let it = 0; it < 40; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    s.forEach((si, i) => {
      const p = sig(a * si + b), w = p * (1 - p), r = y[i] - p;
      g0 += r * si; g1 += r; h00 += w * si * si; h01 += w * si; h11 += w;
    });
    const det = h00 * h11 - h01 * h01;
    a += (h11 * g0 - h01 * g1) / det;
    b += (h00 * g1 - h01 * g0) / det;
  }
  return [a, b];
}

/** A reliability diagram for a model whose logits are scaled by 1/T relative to the truth, before and after Platt scaling. */
export function ReliabilityViz() {
  const [T, setT] = useState(0.5);
  const [fix, setFix] = useState(false);
  const { z, y } = useMemo(() => {
    const r = makeRng(17);
    const z: number[] = [], y: number[] = [];
    for (let i = 0; i < N; i++) {
      const g = 2 * Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
      z.push(g);
      y.push(r() < sig(g) ? 1 : 0);
    }
    return { z, y };
  }, []);
  const q = useMemo(() => {
    const s = z.map((v) => v / T);
    if (!fix) return s.map(sig);
    const [a, b] = plattFit(s, y);
    return s.map((v) => sig(a * v + b));
  }, [fix, T, z, y]);
  const bins = Array.from({ length: BINS }, () => ({ n: 0, conf: 0, freq: 0 }));
  q.forEach((v, i) => {
    const b = bins[Math.min(Math.floor(v * BINS), BINS - 1)];
    b.n++; b.conf += v; b.freq += y[i];
  });
  const base = y.reduce((a, b) => a + b, 0) / N;
  let ece = 0, rel = 0, res = 0;
  bins.forEach((b) => {
    if (!b.n) return;
    const c = b.conf / b.n, f = b.freq / b.n, w = b.n / N;
    ece += w * Math.abs(c - f); rel += w * (c - f) ** 2; res += w * (f - base) ** 2;
  });
  const brier = q.reduce((a, v, i) => a + (v - y[i]) ** 2, 0) / N;
  const W = 220, H = 220;
  const X = (v: number) => 24 + v * (W - 34);
  const Y = (v: number) => H - 22 - v * (H - 32);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          T = {T.toFixed(2)}
          <input type="range" min={0.3} max={2.5} step={0.05} value={T} onChange={(e) => setT(Number(e.target.value))} aria-label="logit scale T" style={{ width: 120 }} />
        </label>
        <button type="button" className="seg" aria-pressed={!fix} onClick={() => setFix(false)}>raw</button>
        <button type="button" className="seg" aria-pressed={fix} onClick={() => setFix(true)}>Platt-scaled</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Reliability diagram of forecast probability against observed frequency">
        <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(1)} stroke="var(--border)" />
        {bins.map((b, i) => b.n ? (
          <g key={i}>
            <rect x={X(i / BINS) + 1} y={Y(b.freq / b.n)} width={X(1 / BINS) - X(0) - 2} height={Y(0) - Y(b.freq / b.n)} fill="var(--accent)" opacity={0.35} />
            <circle cx={X(b.conf / b.n)} cy={Y(b.freq / b.n)} r={3} fill="var(--danger)" />
          </g>
        ) : null)}
        <text x={X(0.5)} y={H - 4} textAnchor="middle" className="viz-label">forecast</text>
        <text x={8} y={Y(0.5)} className="viz-label" transform={`rotate(-90 8 ${Y(0.5)})`} textAnchor="middle">observed</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        ECE {ece.toFixed(3)}; Brier {brier.toFixed(3)} ≈ reliability {rel.toFixed(3)} − resolution {res.toFixed(3)} + uncertainty {(base * (1 - base)).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The true probability is σ(z) and the model reports σ(z/T). Each bar is the observed frequency of the event among
        forecasts in one tenth of [0, 1]; dots sit at the bin&apos;s mean forecast. A calibrated model lies on the dashed
        diagonal. With T below 1 the model is overconfident and the dots lie on a curve flatter than the diagonal; with T above
        1 it is underconfident. Platt scaling fits σ(a·logit + b) to the outcomes and restores calibration for any T,
        because here the error is exactly a rescaled logit. The Brier identity is approximate because forecasts are binned.
      </figcaption>
    </figure>
  );
}
