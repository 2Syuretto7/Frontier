"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const V = 24, K = 4, D = 2, H = 16, N = 2;
const SNAPS = [0, 300, 1000, 4000];
const cls = (w: number) => w % K;

/** Hidden trigram model: the next word's class depends on the classes of the last two words; the word is uniform within its class. */
export function hiddenTable(seed: number) {
  const z = makeNormal(makeRng(seed));
  return Array.from({ length: K * K }, () => {
    const e = Array.from({ length: K }, () => Math.exp(1.8 * z()));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  });
}

export function generate(T: number[][], n: number, seed: number) {
  const u = makeRng(seed), t = [0, 1];
  while (t.length < n) {
    const row = T[cls(t[t.length - 2]) * K + cls(t[t.length - 1])];
    let r = u(), k = 0;
    while (k < K - 1 && r > row[k]) r -= row[k++];
    t.push(k + K * Math.floor(u() * (V / K)));
  }
  return t;
}

type Params = { C: number[][]; W: number[][]; b: number[]; U: number[][]; c: number[] };

export function initParams(seed: number): Params {
  const z = makeNormal(makeRng(seed));
  const mat = (r: number, q: number, s: number) => Array.from({ length: r }, () => Array.from({ length: q }, () => s * z()));
  return { C: mat(V, D, 1), W: mat(N * D, H, 1 / Math.sqrt(N * D)), b: new Array(H).fill(0), U: mat(H, V, 1 / Math.sqrt(H)), c: new Array(V).fill(0) };
}

function forward(P: Params, ctx: number[]) {
  const e = ctx.flatMap((w) => P.C[w]);
  const h = P.b.map((bj, j) => Math.tanh(e.reduce((a, ei, i) => a + ei * P.W[i][j], bj)));
  const z = P.c.map((ck, k) => h.reduce((a, hj, j) => a + hj * P.U[j][k], ck));
  const m = Math.max(...z), ex = z.map((v) => Math.exp(v - m)), s = ex.reduce((a, v) => a + v, 0);
  return { e, h, p: ex.map((v) => v / s) };
}

/** One minibatch step of plain SGD on the cross-entropy, backpropagating into the shared embedding table. */
function step(P: Params, t: number[], idx: number[], lr: number) {
  const g = lr / idx.length;
  for (const i of idx) {
    const ctx = t.slice(i, i + N), y = t[i + N], { e, h, p } = forward(P, ctx);
    p[y] -= 1;
    const dh = h.map((hj, j) => (1 - hj * hj) * p.reduce((a, pk, k) => a + pk * P.U[j][k], 0));
    const de = e.map((_, i2) => dh.reduce((a, d, j) => a + d * P.W[i2][j], 0));
    for (let j = 0; j < H; j++) for (let k = 0; k < V; k++) P.U[j][k] -= g * h[j] * p[k];
    for (let k = 0; k < V; k++) P.c[k] -= g * p[k];
    for (let i2 = 0; i2 < N * D; i2++) for (let j = 0; j < H; j++) P.W[i2][j] -= g * e[i2] * dh[j];
    for (let j = 0; j < H; j++) P.b[j] -= g * dh[j];
    for (let a = 0; a < N; a++) for (let d = 0; d < D; d++) P.C[ctx[a]][d] -= g * de[a * D + d];
  }
}

export function perplexity(P: Params, t: number[]) {
  let s = 0;
  for (let i = 0; i + N < t.length; i++) s += Math.log(forward(P, t.slice(i, i + N)).p[t[i + N]]);
  return Math.exp(-s / (t.length - N));
}

export function run(seed = 3) {
  const T = hiddenTable(seed), train = generate(T, 3000, 1), test = generate(T, 2000, 99);
  let truth = 0;
  for (let i = 2; i < test.length; i++) truth += Math.log(T[cls(test[i - 2]) * K + cls(test[i - 1])][cls(test[i])] / (V / K));
  const P = initParams(1), u = makeRng(5), out: { C: number[][]; ppl: number }[] = [];
  for (let s = 0; s <= SNAPS[SNAPS.length - 1]; s++) {
    if (SNAPS.includes(s)) out.push({ C: P.C.map((r) => [...r]), ppl: perplexity(P, test) });
    step(P, train, Array.from({ length: 32 }, () => Math.floor(u() * (train.length - N))), 0.5);
  }
  return { snaps: out, truth: Math.exp(-truth / (test.length - 2)) };
}

const MARK = ["circle", "square", "triangle", "cross"] as const;

function Marker({ x, y, k }: { x: number; y: number; k: number }) {
  const col = k % 2 ? "var(--danger)" : "var(--accent)";
  if (MARK[k] === "circle") return <circle cx={x} cy={y} r={4} fill={col} />;
  if (MARK[k] === "square") return <rect x={x - 3.5} y={y - 3.5} width={7} height={7} fill={col} />;
  if (MARK[k] === "triangle") return <polygon points={`${x},${y - 4.5} ${x - 4.5},${y + 3.5} ${x + 4.5},${y + 3.5}`} fill={col} />;
  return <path d={`M${x - 4},${y - 4}L${x + 4},${y + 4}M${x - 4},${y + 4}L${x + 4},${y - 4}`} stroke={col} strokeWidth={2} />;
}

export function MlpLmViz() {
  const [si, setSi] = useState(3);
  const [res, setRes] = useState<ReturnType<typeof run> | null>(null);
  useEffect(() => setRes(run()), []);
  const W = 260, R = 4;
  const s = (v: number) => W / 2 + (v / R) * (W / 2 - 10);
  const snap = res?.snaps[si];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SNAPS.map((n, i) => (
          <button key={n} type="button" className="seg" aria-pressed={i === si} onClick={() => setSi(i)}>{n} steps</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Two-dimensional word embeddings learned by a neural language model, marked by hidden word class">
        <rect x={0.5} y={0.5} width={W - 1} height={W - 1} fill="none" stroke="var(--border)" />
        <line x1={s(0)} y1={4} x2={s(0)} y2={W - 4} stroke="var(--border)" strokeDasharray="2 3" />
        <line x1={4} y1={s(0)} x2={W - 4} y2={s(0)} stroke="var(--border)" strokeDasharray="2 3" />
        {snap?.C.map(([a, b], w) => <Marker key={w} x={s(Math.max(-R, Math.min(R, a)))} y={s(-Math.max(-R, Math.min(R, b)))} k={cls(w)} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {snap && res ? `test perplexity ${snap.ppl.toFixed(2)}; true model ${res.truth.toFixed(2)}; vocabulary 24` : "training"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Text from a hidden model with 24 words in four classes (the four marker shapes): the next word depends only on the
        classes of the previous two. A neural language model with 2-dimensional embeddings, a 16-unit hidden layer and a
        two-word context is trained by SGD on 3000 tokens. The classes are never shown to it, yet words of the same class
        drift together, because they make the same predictions.
      </figcaption>
    </figure>
  );
}
