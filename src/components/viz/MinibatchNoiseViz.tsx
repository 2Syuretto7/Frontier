"use client";

import { useMemo, useState } from "react";

const N = 256;
const SIZES = [1, 8, 64, 256];

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// a fixed dataset for least squares y = 1.5 x1 - 0.5 x2 + noise, evaluated at w = (0, 0)
const DATA = (() => {
  const r = makeRng(11);
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: N }, () => {
    const x1 = gauss(), x2 = gauss();
    return { x1, x2, y: 1.5 * x1 - 0.5 * x2 + 0.8 * gauss() };
  });
})();
// per-example gradient of (w.x - y)^2 at w = 0 is -2 y x
const G = DATA.map(({ x1, x2, y }) => [-2 * y * x1, -2 * y * x2]);
const FULL = G.reduce((a, g) => [a[0] + g[0] / N, a[1] + g[1] / N], [0, 0]);

function sample(bs: number, count: number) {
  const r = makeRng(5 + bs);
  return Array.from({ length: count }, () => {
    const idx = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const s = [0, 0];
    idx.slice(0, bs).forEach((i) => { s[0] += G[i][0] / bs; s[1] += G[i][1] / bs; });
    return s;
  });
}

/** Mini-batch gradients scatter around the full-batch gradient, with spread shrinking like 1 / sqrt(batch size). */
export function MinibatchNoiseViz() {
  const [bs, setBs] = useState(8);
  const pts = useMemo(() => sample(bs, 60), [bs]);
  const mean = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  const sd = Math.sqrt(pts.reduce((a, p) => a + (p[0] - FULL[0]) ** 2 + (p[1] - FULL[1]) ** 2, 0) / pts.length);
  const W = 300, H = 220, sc = 12;
  const px = (x: number) => W / 2 + (x - FULL[0]) * sc, py = (y: number) => H / 2 - (y - FULL[1]) * sc;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {SIZES.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={bs === s} onClick={() => setBs(s)}>batch {s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Sixty mini-batch gradients around the full gradient">
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="var(--border)" />
        {pts.map((p, i) => <circle key={i} cx={Math.max(2, Math.min(W - 2, px(p[0])))} cy={Math.max(2, Math.min(H - 2, py(p[1])))} r={2.6} fill="var(--accent)" opacity={0.6} />)}
        <circle cx={px(FULL[0])} cy={py(FULL[1])} r={5} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <text x={px(FULL[0]) + 8} y={py(FULL[1]) - 8} className="viz-label">full gradient</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        full gradient ({FULL[0].toFixed(2)}, {FULL[1].toFixed(2)}), mean of the 60 ({mean[0].toFixed(2)}, {mean[1].toFixed(2)}), spread {sd.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each dot is the gradient of one shuffled mini-batch of a 256-example least-squares problem.{" "}
        {bs === 256
          ? "A batch of all 256 examples is the full gradient: no spread at all, but every step costs a full pass."
          : `They centre on the full gradient, because a random batch is an unbiased sample. Quadrupling the batch roughly halves the spread.${bs === 1 ? " (Dots beyond the frame are pinned to its edge.)" : ""}`}
      </figcaption>
    </figure>
  );
}
