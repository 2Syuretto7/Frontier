"use client";

import { useMemo, useState } from "react";

const V = 16, STEPS = 300, BATCH = 128, WARM = 30, N = 20000;
const PEAKS = [0.003, 0.03, 0.3];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random Markov chain over V symbols: each row puts most of its mass on a few successors. */
function makeChain() {
  const u = rand(3);
  const P = Array.from({ length: V }, () => {
    const w = Array.from({ length: V }, () => Math.pow(u(), 6));
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / s);
  });
  const pi = new Array(V).fill(1 / V);
  for (let it = 0; it < 200; it++) {
    const nx = new Array(V).fill(0);
    for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) nx[j] += pi[i] * P[i][j];
    for (let j = 0; j < V; j++) pi[j] = nx[j];
  }
  let H = 0;
  for (let i = 0; i < V; i++) for (let j = 0; j < V; j++) if (P[i][j] > 0) H -= pi[i] * P[i][j] * Math.log(P[i][j]);
  const data = new Int32Array(N);
  for (let n = 1; n < N; n++) {
    let r = u(), j = 0;
    const row = P[data[n - 1]];
    while (j < V - 1 && r > row[j]) r -= row[j++];
    data[n] = j;
  }
  return { data, H };
}

const CHAIN = makeChain();

export function schedule(step: number, peak: number, warm: boolean) {
  const w = warm ? WARM : 0;
  if (step < w) return (peak * (step + 1)) / w;
  const frac = Math.min((step - w) / (STEPS - w), 1);
  return peak * (0.1 + 0.9 * 0.5 * (1 + Math.cos(Math.PI * frac)));
}

/** Train a bigram logit table with AdamW, the schedule above and global-norm clipping at 1. */
export function trainBigram(peak: number, warm: boolean) {
  const u = rand(9);
  const W = new Float64Array(V * V).map(() => 0.02 * (u() - 0.5) * 3.4);
  const m = new Float64Array(V * V), v = new Float64Array(V * V), g = new Float64Array(V * V);
  const losses: number[] = [];
  for (let t = 1; t <= STEPS; t++) {
    g.fill(0);
    let loss = 0;
    for (let b = 0; b < BATCH; b++) {
      const s = Math.floor(u() * (N - 1)), a = CHAIN.data[s], y = CHAIN.data[s + 1];
      let mx = -Infinity;
      for (let j = 0; j < V; j++) mx = Math.max(mx, W[a * V + j]);
      let tot = 0;
      for (let j = 0; j < V; j++) tot += Math.exp(W[a * V + j] - mx);
      loss += Math.log(tot) + mx - W[a * V + y];
      for (let j = 0; j < V; j++) g[a * V + j] += Math.exp(W[a * V + j] - mx) / tot / BATCH;
      g[a * V + y] -= 1 / BATCH;
    }
    losses.push(loss / BATCH);
    const gn = Math.sqrt(g.reduce((s, x) => s + x * x, 0)), sc = Math.min(1, 1 / (gn + 1e-12));
    const lr = schedule(t - 1, peak, warm);
    for (let i = 0; i < V * V; i++) {
      const gi = g[i] * sc;
      m[i] = 0.9 * m[i] + 0.1 * gi;
      v[i] = 0.95 * v[i] + 0.05 * gi * gi;
      const mh = m[i] / (1 - 0.9 ** t), vh = v[i] / (1 - 0.95 ** t);
      W[i] -= lr * (mh / (Math.sqrt(vh) + 1e-8) + 0.1 * W[i]);
    }
  }
  const sm: number[] = [];
  let e = 0;
  losses.forEach((x, i) => { e = 0.9 * e + 0.1 * x; sm.push(e / (1 - 0.9 ** (i + 1))); });
  return { losses, smooth: sm };
}

export function BigramTrainViz() {
  const [pi, setPi] = useState(1);
  const [warm, setWarm] = useState(true);
  const peak = PEAKS[pi];
  const run = useMemo(() => trainBigram(peak, warm), [peak, warm]);
  const W = 340, X0 = 34, PW = W - X0 - 10, Y0 = 10, PH = 140, LH = 40, gap = 26;
  const H = Y0 + PH + gap + LH + 22;
  const top = Math.log(V) + 0.3, bot = Math.max(0, CHAIN.H - 0.4);
  const sx = (s: number) => X0 + (s / STEPS) * PW;
  const sy = (l: number) => Y0 + ((top - Math.min(Math.max(l, bot), top)) / (top - bot)) * PH;
  const ly = (lr: number) => Y0 + PH + gap + LH - (lr / peak) * LH;
  const path = (vs: number[], f: (x: number) => number) => vs.map((x, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)},${f(x).toFixed(1)}`).join(" ");
  const lrs = Array.from({ length: STEPS }, (_, s) => schedule(s, peak, warm));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">peak learning rate</span>
        {PEAKS.map((p, i) => (
          <button key={p} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{p}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">warmup</span>
        <button type="button" className="seg" aria-pressed={warm} onClick={() => setWarm(true)}>{WARM} steps</button>
        <button type="button" className="seg" aria-pressed={!warm} onClick={() => setWarm(false)}>none</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Training loss of a bigram model against steps, with the learning-rate schedule below">
        <line x1={X0} x2={W - 10} y1={sy(Math.log(V))} y2={sy(Math.log(V))} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <text x={X0 + 4} y={sy(Math.log(V)) - 4} className="viz-label">log V</text>
        <line x1={X0} x2={W - 10} y1={sy(CHAIN.H)} y2={sy(CHAIN.H)} stroke="var(--success)" strokeDasharray="4 3" />
        <text x={X0 + 4} y={sy(CHAIN.H) + 14} className="viz-label">entropy rate</text>
        <path d={path(run.losses, sy)} fill="none" stroke="var(--border)" />
        <path d={path(run.smooth, sy)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={path(lrs, ly)} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <text x={X0 - 4} y={ly(peak) + 4} textAnchor="end" className="viz-label">lr</text>
        {[0, 100, 200, 300].map((s) => (
          <text key={s} x={sx(s)} y={H - 6} textAnchor="middle" className="viz-label">{s}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`final smoothed loss ${run.smooth[STEPS - 1].toFixed(3)}, entropy rate ${CHAIN.H.toFixed(3)}, log V ${Math.log(V).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A bigram model, a 16 × 16 table of logits, trained on text from a random Markov chain with AdamW, a warmup and
        cosine schedule (red, bottom) and gradient clipping. The loss starts at log V, as a fresh model should, and the
        smoothed curve (blue) falls towards the chain&apos;s entropy rate, the best average loss any model can reach; batch
        noise scatters single readings (grey) around it. With a peak of 0.003 the model is still far above the floor after
        300 steps, while 0.03 and 0.3 reach it. A table this small trains stably either way, so warmup barely matters here;
        it matters in deep networks, where the first large steps can push the branches into a bad region.
      </figcaption>
    </figure>
  );
}
