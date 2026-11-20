"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NE = 4;
const WR = [[1.6, 0.2], [-0.4, 1.5], [-1.4, -0.6], [0.5, -1.7]];
const COLS = ["var(--code-function)", "var(--code-string)", "var(--accent)", "var(--code-number)"];

function tokens() {
  const r = rand(17);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: 40 }, () => [normal(), normal()]);
}
const TOK = tokens();

type Rule = "softmax" | "sigmoid";

/** Router logits, then top-k gates renormalised over the chosen experts. */
export function gates(x: number[], k: number, rule: Rule) {
  const z = WR.map((w) => w[0] * x[0] + w[1] * x[1]);
  const a = rule === "softmax" ? (() => { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((p, q) => p + q, 0); return e.map((v) => v / s); })() : z.map((v) => 1 / (1 + Math.exp(-v)));
  const idx = [...a.keys()].sort((i, j) => a[j] - a[i]).slice(0, k);
  const t = idx.reduce((s, i) => s + a[i], 0);
  const g = new Array<number>(NE).fill(0);
  idx.forEach((i) => (g[i] = a[i] / t));
  return { z, g };
}

export function RouterMapViz() {
  const [k, setK] = useState(2);
  const [rule, setRule] = useState<Rule>("softmax");
  const [t, setT] = useState(7);
  const W = 330, H = 196, S = 170, X0 = 6, Y0 = 6, R = 3;
  const px = (v: number) => X0 + ((v + R) / (2 * R)) * S;
  const py = (v: number) => Y0 + ((R - v) / (2 * R)) * S;
  const cells = useMemo(() => {
    const out: { x: number; y: number; c: number }[] = [];
    const n = 34;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = -R + ((i + 0.5) * 2 * R) / n, y = -R + ((j + 0.5) * 2 * R) / n;
      const z = WR.map((w) => w[0] * x + w[1] * y);
      out.push({ x, y, c: z.indexOf(Math.max(...z)) });
    }
    return out;
  }, []);
  const load = new Array<number>(NE).fill(0);
  TOK.forEach((x) => gates(x, k, rule).g.forEach((g, i) => { if (g > 0) load[i]++; }));
  const { z, g } = gates(TOK[t], k, rule);
  const cs = S / 34;
  const BX = X0 + S + 22, BW = W - BX - 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Experts per token">
          {[1, 2, 3].map((v) => (
            <button key={v} className="seg" aria-pressed={k === v} onClick={() => setK(v)}>top-{v}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Gating rule">
          {(["softmax", "sigmoid"] as Rule[]).map((v) => (
            <button key={v} className="seg" aria-pressed={rule === v} onClick={() => setRule(v)}>{v}</button>
          ))}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          token {t}
          <input type="range" min={0} max={TOK.length - 1} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="Token to inspect" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Router regions in a two-dimensional token space and the gates of one token">
        {cells.map((c, i) => (
          <rect key={i} x={px(c.x) - cs / 2} y={py(c.y) - cs / 2} width={cs + 0.3} height={cs + 0.3} style={{ fill: COLS[c.c] }} opacity={0.22} />
        ))}
        {TOK.map((x, i) => Math.abs(x[0]) > R || Math.abs(x[1]) > R ? null : (
          <circle key={i} cx={px(x[0])} cy={py(x[1])} r={i === t ? 5 : 2.6} style={{ fill: COLS[gates(x, 1, rule).z.indexOf(Math.max(...gates(x, 1, rule).z))] }} stroke={i === t ? "var(--text)" : "none"} strokeWidth={1.5} />
        ))}
        {WR.map((w, i) => (
          <line key={i} x1={px(0)} y1={py(0)} x2={px(w[0])} y2={py(w[1])} stroke={COLS[i]} strokeWidth={2} />
        ))}
        {g.map((v, i) => (
          <g key={i}>
            <text x={BX} y={Y0 + 24 + i * 34} className="viz-label">expert {i}</text>
            <rect x={BX} y={Y0 + 28 + i * 34} width={BW} height={8} fill="var(--border)" />
            <rect x={BX} y={Y0 + 28 + i * 34} width={v * BW} height={8} style={{ fill: COLS[i] }} />
          </g>
        ))}
        <text x={X0} y={H - 4} className="viz-label">regions: top-1 expert; lines: router vectors</text>
        <text x={BX} y={Y0 + 4} className="viz-label">gates of token {t}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        token {t}: logits [{z.map((v) => v.toFixed(2)).join(", ")}], gates [{g.map((v) => v.toFixed(3)).join(", ")}]; tokens sent to each expert:{" "}
        {load.join(" / ")}
      </div>
      <figcaption className="viz-caption">
        A router is a linear map from a token to one logit per expert, so the top-1 choice carves the token space into convex
        regions around the router vectors. Each token is processed only by its top-k experts, and their outputs are mixed with
        gates renormalised over the chosen few. With softmax gating the gates are sharp when one logit dominates; with
        sigmoid gating each expert&apos;s affinity is judged on its own before renormalising, so the gates are flatter.
      </figcaption>
    </figure>
  );
}
