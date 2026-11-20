"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const LO = -5, HI = 5;

function normal(r: () => number) {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/** Draw n points from the true density 0.6 N(-1.5, 0.6^2) + 0.4 N(1.8, 0.8^2), clipped to [LO, HI]. */
export function drawData(n: number, seed: number) {
  const r = rand(seed);
  return Array.from({ length: n }, () => {
    const x = r() < 0.6 ? -1.5 + 0.6 * normal(r) : 1.8 + 0.8 * normal(r);
    return Math.min(HI - 1e-9, Math.max(LO, x));
  });
}

const gpdf = (x: number, m: number, v: number) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);

export type Model = (x: number) => number;

/** Fit one of the model families to the training data and return its density. */
export function fitModel(kind: string, xs: number[]): Model {
  const n = xs.length;
  if (kind === "gauss") {
    const m = xs.reduce((a, x) => a + x, 0) / n, v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / n;
    return (x) => gpdf(x, m, v);
  }
  if (kind === "mix") {
    let w = [0.5, 0.5], m = [-1, 1], v = [1, 1];
    for (let it = 0; it < 100; it++) {
      const rs = xs.map((x) => { const a = w[0] * gpdf(x, m[0], v[0]), b = w[1] * gpdf(x, m[1], v[1]); return a / (a + b); });
      const nk = [rs.reduce((a, r) => a + r, 0), rs.reduce((a, r) => a + 1 - r, 0)];
      w = nk.map((k) => k / n);
      m = [xs.reduce((a, x, i) => a + rs[i] * x, 0) / nk[0], xs.reduce((a, x, i) => a + (1 - rs[i]) * x, 0) / nk[1]];
      v = [xs.reduce((a, x, i) => a + rs[i] * (x - m[0]) ** 2, 0) / nk[0], xs.reduce((a, x, i) => a + (1 - rs[i]) * (x - m[1]) ** 2, 0) / nk[1]];
    }
    return (x) => w[0] * gpdf(x, m[0], v[0]) + w[1] * gpdf(x, m[1], v[1]);
  }
  const bins = Number(kind), wd = (HI - LO) / bins, c = new Array(bins).fill(0);
  for (const x of xs) c[Math.min(bins - 1, Math.floor((x - LO) / wd))]++;
  return (x) => c[Math.min(bins - 1, Math.max(0, Math.floor((x - LO) / wd)))] / (n * wd);
}

/** Average negative log-likelihood in nats; infinite if some point gets zero density. */
export const nll = (f: Model, xs: number[]) => xs.reduce((a, x) => a - Math.log(f(x)), 0) / xs.length;

const KINDS = [["gauss", "one Gaussian"], ["mix", "two Gaussians"], ["10", "10 bins"], ["20", "20 bins"], ["40", "40 bins"]];

export function DensityFitViz() {
  const [k, setK] = useState(1);
  const { train, test } = useMemo(() => ({ train: drawData(200, 7), test: drawData(200, 8) }), []);
  const f = useMemo(() => fitModel(KINDS[k][0], train), [k, train]);
  const W = 330, H = 170, X0 = 10, Y0 = 8, PW = W - 20, PH = H - Y0 - 30, YM = 0.8;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW, sy = (y: number) => Y0 + PH - Math.min(y, YM) / YM * PH;
  const grid = Array.from({ length: 801 }, (_, i) => LO + (i * (HI - LO)) / 800);
  const truth: Model = (x) => 0.6 * gpdf(x, -1.5, 0.36) + 0.4 * gpdf(x, 1.8, 0.64);
  const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(3) : "infinite");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">model</span>
        <div className="segmented" role="group" aria-label="Model family" style={{ flexWrap: "wrap" }}>
          {KINDS.map(([key, label], i) => <button key={key} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Training data and fitted density">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        {train.map((x, i) => <line key={i} x1={sx(x)} x2={sx(x)} y1={sy(0)} y2={sy(0) + 6} stroke="var(--text-muted)" strokeOpacity={0.5} />)}
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(truth(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 20} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>●</span> fitted model</span>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> true density (dashed), training points (ticks)</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`negative log-likelihood per point: training ${fmt(nll(f, train))}, held-out ${fmt(nll(f, test))} nats (truth: ${nll(truth, test).toFixed(3)})`}
      </div>
      <figcaption className="viz-caption">
        Two hundred training points come from a two-humped density (dashed). One Gaussian is too simple: its held-out loss is
        1.95 nats per point. Two Gaussians score 1.67, as well as the true density itself. Histograms show the opposite
        failure: more bins always lower the training loss, but from 20 bins on some held-out points fall in bins that held
        no training point, get zero density and make the held-out loss infinite. A model is judged on data it has not seen.
      </figcaption>
    </figure>
  );
}
