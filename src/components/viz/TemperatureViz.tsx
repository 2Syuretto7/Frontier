"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const K = 10, N = 4000, SHARP = 2.5, BINS = 10, SHIFT = 0.6;

function softmax(z: number[], t: number) {
  const m = Math.max(...z), e = z.map((v) => Math.exp((v - m) / t)), s = e.reduce((a, v) => a + v, 0);
  return e.map((v) => v / s);
}

/** Labels drawn from softmax(signal * u); the model reports logits SHARP * u, so it is overconfident by a known factor. Under shift (signal < 1) the inputs carry less information than the model assumes. */
export function simulate(seed: number, signal = 1) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: N }, () => {
    const hot = Math.floor(r() * K);
    const u = Array.from({ length: K }, (_, k) => 1.5 * nrm() + (k === hot ? 2 : 0));
    const p = softmax(u.map((v) => signal * v), 1);
    let c = r(), y = 0; while (y < K - 1 && (c -= p[y]) > 0) y++;
    return { z: u.map((v) => SHARP * v), y };
  });
}

const nll = (d: { z: number[]; y: number }[], t: number) => d.reduce((a, { z, y }) => a - Math.log(softmax(z, t)[y]), 0) / d.length;

/** Ternary search over the inverse temperature, where the NLL is convex. */
export function fitT(d: { z: number[]; y: number }[]) {
  let lo = 0.01, hi = 5;
  for (let i = 0; i < 60; i++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (nll(d, 1 / a) < nll(d, 1 / b)) hi = b; else lo = a; }
  return 2 / (lo + hi);
}

export function evaluate(d: { z: number[]; y: number }[], t: number) {
  const bins = Array.from({ length: BINS }, () => ({ n: 0, acc: 0, conf: 0 }));
  let correct = 0;
  for (const { z, y } of d) {
    const p = softmax(z, t), c = Math.max(...p), k = p.indexOf(c), b = bins[Math.min(BINS - 1, Math.floor(c * BINS))];
    b.n++; b.conf += c; if (k === y) { b.acc++; correct++; }
  }
  const ece = bins.reduce((a, b) => a + (b.n ? (b.n / d.length) * Math.abs(b.acc / b.n - b.conf / b.n) : 0), 0);
  return { bins, ece, acc: correct / d.length, nll: nll(d, t) };
}

export function TemperatureViz() {
  const [scaled, setScaled] = useState(false);
  const [shift, setShift] = useState(false);
  const { test, shifted, T } = useMemo(() => { const d = simulate(5); return { test: d.slice(N / 2), shifted: simulate(9, SHIFT).slice(N / 2), T: fitT(d.slice(0, N / 2)) }; }, []);
  const e = useMemo(() => evaluate(shift ? shifted : test, scaled ? T : 1), [test, shifted, T, scaled, shift]);
  const W = 300, H = 220, X0 = 34, Y0 = 8, P = 180;
  const sx = (v: number) => X0 + v * P, sy = (v: number) => Y0 + P - v * P;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Calibration">
          <button type="button" className="seg" aria-pressed={!scaled} onClick={() => setScaled(false)}>raw logits</button>
          <button type="button" className="seg" aria-pressed={scaled} onClick={() => setScaled(true)}>temperature scaled</button>
        </div>
        <div className="segmented" role="group" aria-label="Test data">
          <button type="button" className="seg" aria-pressed={!shift} onClick={() => setShift(false)}>same distribution</button>
          <button type="button" className="seg" aria-pressed={shift} onClick={() => setShift(true)}>shifted</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="Reliability diagram">
        <rect x={sx(0)} y={sy(1)} width={P} height={P} fill="none" stroke="var(--border)" />
        {e.bins.map((b, i) => b.n ? (
          <g key={i}>
            <rect x={sx(i / BINS) + 1} y={sy(b.acc / b.n)} width={P / BINS - 2} height={(b.acc / b.n) * P} fill="var(--accent)" fillOpacity={0.55} />
            <rect x={sx(i / BINS) + 1} y={sy(b.conf / b.n)} width={P / BINS - 2} height={1.5} fill="var(--text)" />
          </g>
        ) : null)}
        <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--text)" strokeDasharray="4 3" />
        {[0, 0.5, 1].map((t) => <text key={`x${t}`} x={sx(t)} y={H - 18} textAnchor="middle" className="viz-label">{t}</text>)}
        {[0, 0.5, 1].map((t) => <text key={`y${t}`} x={X0 - 6} y={sy(t) + 4} textAnchor="end" className="viz-label">{t}</text>)}
        <text x={sx(0.5)} y={H - 3} textAnchor="middle" className="viz-label">confidence</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>■</span> accuracy in bin</span>
        <span>▬ mean confidence in bin</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        T = {(scaled ? T : 1).toFixed(2)}: accuracy {e.acc.toFixed(3)}, ECE {e.ece.toFixed(3)}, NLL {e.nll.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        A simulated ten-class classifier whose logits are 2.5 times too large: its bars fall below the diagonal. One
        temperature fitted on 2000 validation examples comes out at T = 2.62, and on 2000 fresh examples from the same
        distribution the expected calibration error falls from 0.269 to 0.033 while the accuracy stays at 0.500, since
        dividing every logit by T keeps their order. On shifted data, where the inputs carry less signal than before, the
        same temperature leaves an error of 0.144: calibration fitted on one distribution does not transfer.
      </figcaption>
    </figure>
  );
}
