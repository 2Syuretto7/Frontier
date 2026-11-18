"use client";

import { useEffect, useState } from "react";

const N = 32, D = 4, HID = 32, TASKS = 60, STEPS = 200, LR = 0.1, SCALE = 3;

type Mode = "plain" | "shrink" | "l2init";

function gaussian(seed: number) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni());
}

/** Effective rank exp(entropy of normalised singular values), from the eigenvalues of FᵀF by Jacobi rotations. */
function effectiveRank(F: number[][]) {
  const m = F[0].length;
  const G = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => F.reduce((s, row) => s + row[i] * row[j], 0)));
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0;
    for (let p = 0; p < m; p++) for (let q = p + 1; q < m; q++) {
      off += G[p][q] * G[p][q];
      if (Math.abs(G[p][q]) < 1e-12) continue;
      const th = 0.5 * Math.atan2(2 * G[p][q], G[q][q] - G[p][p]);
      const c = Math.cos(th), s = Math.sin(th);
      for (let k = 0; k < m; k++) {
        const gp = G[k][p], gq = G[k][q];
        G[k][p] = c * gp - s * gq; G[k][q] = s * gp + c * gq;
      }
      for (let k = 0; k < m; k++) {
        const gp = G[p][k], gq = G[q][k];
        G[p][k] = c * gp - s * gq; G[q][k] = s * gp + c * gq;
      }
    }
    if (off < 1e-18) break;
  }
  const sv = G.map((r, i) => Math.sqrt(Math.max(r[i], 0)));
  const tot = sv.reduce((a, b) => a + b, 0);
  if (tot === 0) return 0;
  let h = 0;
  for (const s of sv) if (s > 1e-9 * tot) h -= (s / tot) * Math.log(s / tot);
  return Math.exp(h);
}

/** Train a one-hidden-layer ReLU network on a sequence of random regression tasks over fixed inputs. */
export function plasticityRun(mode: Mode, seed = 1) {
  const g = gaussian(seed);
  const X = Array.from({ length: N }, () => Array.from({ length: D }, g));
  const W = Array.from({ length: D }, () => Float64Array.from({ length: HID }, () => g() / Math.sqrt(D)));
  const b = new Float64Array(HID);
  const v = Float64Array.from({ length: HID }, () => g() / Math.sqrt(HID));
  const W0 = W.map((r) => r.slice()), v0 = v.slice();
  const Z = Array.from({ length: N }, () => new Float64Array(HID));
  const r = new Float64Array(N), y = new Float64Array(N);
  const gW = Array.from({ length: D }, () => new Float64Array(HID));
  const gb = new Float64Array(HID), gv = new Float64Array(HID);
  const c = mode === "l2init" ? 0.01 : 0;
  const loss: number[] = [], dead: number[] = [], rank: number[] = [];
  const forward = () => {
    for (let n = 0; n < N; n++) {
      let p = 0;
      for (let j = 0; j < HID; j++) {
        let z = b[j];
        for (let i = 0; i < D; i++) z += X[n][i] * W[i][j];
        Z[n][j] = z;
        if (z > 0) p += z * v[j];
      }
      r[n] = (p - y[n]) / N;
    }
  };
  for (let k = 0; k < TASKS; k++) {
    for (let n = 0; n < N; n++) y[n] = SCALE * g();
    for (let t = 0; t < STEPS; t++) {
      forward();
      gb.fill(0); gv.fill(0);
      for (const row of gW) row.fill(0);
      for (let n = 0; n < N; n++) for (let j = 0; j < HID; j++) {
        const z = Z[n][j];
        if (z <= 0) continue;
        gv[j] += z * r[n];
        const gz = r[n] * v[j];
        gb[j] += gz;
        for (let i = 0; i < D; i++) gW[i][j] += X[n][i] * gz;
      }
      for (let j = 0; j < HID; j++) {
        for (let i = 0; i < D; i++) W[i][j] -= LR * (gW[i][j] + c * (W[i][j] - W0[i][j]));
        b[j] -= LR * (gb[j] + c * b[j]);
        v[j] -= LR * (gv[j] + c * (v[j] - v0[j]));
      }
    }
    forward();
    loss.push(Array.from(r).reduce((s, q) => s + 0.5 * (q * N) ** 2, 0) / N);
    let nd = 0;
    for (let j = 0; j < HID; j++) if (Z.every((z) => z[j] <= 0)) nd++;
    dead.push(nd / HID);
    rank.push(effectiveRank(Z.map((z) => Array.from(z, (q) => (q > 0 ? q : 0)))));
    if (mode === "shrink") {
      for (let j = 0; j < HID; j++) {
        for (let i = 0; i < D; i++) W[i][j] = 0.8 * W[i][j] + (0.1 * g()) / Math.sqrt(D);
        v[j] = 0.8 * v[j] + (0.1 * g()) / Math.sqrt(HID);
        b[j] = 0.8 * b[j];
      }
    }
  }
  return { loss, dead, rank };
}

const METRICS = [
  { key: "loss", label: "loss on each new task", max: 4 },
  { key: "dead", label: "fraction of dead units", max: 1 },
  { key: "rank", label: "effective rank of features", max: 16 },
] as const;

const MODES: { key: Mode; label: string; colour: string }[] = [
  { key: "plain", label: "plain gradient descent", colour: "var(--danger)" },
  { key: "shrink", label: "shrink and perturb", colour: "var(--accent)" },
  { key: "l2init", label: "L2 towards initialisation", colour: "var(--success)" },
];

export function PlasticityViz() {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("dead");
  const [runs, setRuns] = useState<Partial<Record<Mode, ReturnType<typeof plasticityRun>>>>({});
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    MODES.forEach((m, i) => {
      timers.push(window.setTimeout(() => {
        if (!cancelled) {
          const run = plasticityRun(m.key);
          setRuns((old) => ({ ...old, [m.key]: run }));
        }
      }, 50 + 30 * i));
    });
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  const spec = METRICS.find((m) => m.key === metric)!;
  const W = 320, H = 190, X1 = 34, PW = W - X1 - 8, PH = H - 34;
  const sx = (k: number) => X1 + (k / (TASKS - 1)) * PW;
  const sy = (v: number) => 8 + (1 - Math.min(v, spec.max) / spec.max) * PH;
  const smooth = (a: number[]) => a.map((_, k) => {
    const w = a.slice(Math.max(0, k - 4), k + 1);
    return w.reduce((p, q) => p + q, 0) / w.length;
  });
  const block = (a: number[], lo: number) => (a.slice(lo, lo + 10).reduce((p, q) => p + q, 0) / 10).toFixed(2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {METRICS.map((m) => (
          <button key={m.key} type="button" className="seg" aria-pressed={metric === m.key} onClick={() => setMetric(m.key)}>{m.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Plasticity measures over a sequence of tasks for three training methods">
        <line x1={X1} y1={sy(0)} x2={X1 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X1} y1={sy(0)} x2={X1} y2={sy(spec.max)} stroke="var(--border)" />
        {MODES.map((m) => {
          const run = runs[m.key];
          return run ? (
            <polyline key={m.key} fill="none" stroke={m.colour} strokeWidth={1.8}
              points={smooth(run[metric]).map((v, k) => `${sx(k)},${sy(v)}`).join(" ")} />
          ) : null;
        })}
        {[0, spec.max / 2, spec.max].map((v) => (
          <text key={v} x={X1 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[1, 30, 60].map((k) => (
          <text key={k} x={sx(k - 1)} y={H - 10} textAnchor="middle" className="viz-label">{`task ${k}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {MODES.map((m) => {
          const run = runs[m.key];
          return (
            <div key={m.key} style={{ color: m.colour }}>
              {run ? `${m.label}: tasks 1–10 ${block(run[metric], 0)}, tasks 51–60 ${block(run[metric], 50)}` : `${m.label}: training…`}
            </div>
          );
        })}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A ReLU network with 32 hidden units is trained for 200 gradient steps on each of 60 tasks: the same 32 inputs,
        new random targets every time. Curves are averaged over the last five tasks. Under plain gradient descent hidden
        units die one by one, the features collapse towards a low-rank set, and the loss reached on each new task drifts
        upwards: the network gets worse at learning. Shrinking the weights and adding a little noise between tasks, or
        pulling the weights gently back towards their initial values throughout, keeps the units alive and the features
        rich.
      </figcaption>
    </figure>
  );
}
