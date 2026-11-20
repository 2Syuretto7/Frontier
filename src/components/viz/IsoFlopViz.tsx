"use client";

import { useState } from "react";

type Fit = { E: number; A: number; B: number; alpha: number; beta: number };
const FITS: Record<string, [string, Fit]> = {
  chin: ["published fit", { E: 1.69, A: 406.4, B: 410.7, alpha: 0.34, beta: 0.28 }],
  equal: ["equal exponents", { E: 1.69, A: 406.4, B: 410.7, alpha: 0.3, beta: 0.3 }],
};
const BUDGETS = [18, 19, 20, 21, 22, 23, 24];
const COLORS = ["var(--code-string)", "var(--code-function)", "var(--code-keyword)", "var(--accent)", "var(--code-number)", "var(--text-muted)", "var(--text)"];

export const loss = (N: number, D: number, p: Fit) => p.E + p.A / N ** p.alpha + p.B / D ** p.beta;
export function optimum(C: number, p: Fit) {
  const G = ((p.alpha * p.A) / (p.beta * p.B)) ** (1 / (p.alpha + p.beta));
  const N = G * (C / 6) ** (p.beta / (p.alpha + p.beta));
  return { N, D: C / (6 * N) };
}

export function IsoFlopViz() {
  const [fit, setFit] = useState("chin");
  const [sel, setSel] = useState(22);
  const p = FITS[fit][1];
  const W = 330, H = 176, X0 = 40, PW = 280, Y0 = 144, PH = 130, NLO = 7, NHI = 12, LLO = 1.8, LHI = 4;
  const px = (lN: number) => X0 + ((lN - NLO) / (NHI - NLO)) * PW;
  const py = (L: number) => Y0 - ((Math.min(LHI, L) - LLO) / (LHI - LLO)) * PH;
  const grid = Array.from({ length: 101 }, (_, i) => NLO + (i * (NHI - NLO)) / 100);
  const opt = optimum(10 ** sel, p);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Loss fit">
          {Object.entries(FITS).map(([k, [label]]) => (
            <button key={k} className="seg" aria-pressed={fit === k} onClick={() => setFit(k)}>{label}</button>
          ))}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          budget 10^{sel} FLOPs
          <input type="range" min={18} max={24} step={1} value={sel} onChange={(e) => setSel(Number(e.target.value))} aria-label="Compute budget exponent" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Loss against model size along curves of fixed compute">
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        {[2, 2.5, 3, 3.5].map((L) => <text key={L} x={X0 - 4} y={py(L) + 4} textAnchor="end" className="viz-label">{L.toFixed(1)}</text>)}
        {[7, 8, 9, 10, 11, 12].map((e) => <text key={e} x={px(e)} y={Y0 + 12} textAnchor="middle" className="viz-label">10{String(e).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]).join("")}</text>)}
        {BUDGETS.map((e, k) => {
          const C = 10 ** e;
          const pts = grid.map((lN) => [lN, loss(10 ** lN, C / (6 * 10 ** lN), p)]).filter(([, L]) => L <= LHI).map(([lN, L]) => [px(lN), py(L)]);
          const o = optimum(C, p);
          return (
            <g key={e}>
              <path d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[k]} strokeWidth={e === sel ? 2.6 : 1.3} opacity={e === sel ? 1 : 0.7} />
              <circle cx={px(Math.log10(o.N))} cy={py(loss(o.N, o.D, p))} r={e === sel ? 4.5 : 3} fill="var(--surface)" stroke={COLORS[k]} strokeWidth={2} />
            </g>
          );
        })}
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">parameters N (log scale); one curve per budget</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        at 10^{sel} FLOPs: N* = {(opt.N / 1e9).toPrecision(3)} billion, D* = {(opt.D / 1e9).toPrecision(3)} billion tokens, {(opt.D / opt.N).toFixed(1)} tokens per parameter, loss {loss(opt.N, opt.D, p).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Each curve fixes a compute budget C = 6ND, from 10¹⁸ to 10²⁴ FLOPs, and shows the loss L = E + A/N^α + B/D^β as the
        budget is split between model size and data. Too small a model is capacity-limited, too large a model sees too few
        tokens, and the circles mark the best split. With the published Chinchilla constants the best size grows a little
        more slowly than the data; with equal exponents both grow like √C and the ratio of tokens to parameters is constant.
      </figcaption>
    </figure>
  );
}
