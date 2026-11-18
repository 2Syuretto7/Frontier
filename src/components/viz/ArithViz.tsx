"use client";

import { useState } from "react";

const PRESETS: { name: string; p: number[] }[] = [
  { name: "½ ¼ ¼", p: [0.5, 0.25, 0.25] },
  { name: "0.7 0.2 0.1", p: [0.7, 0.2, 0.1] },
  { name: "0.9 0.05 0.05", p: [0.9, 0.05, 0.05] },
];
const SYM = ["a", "b", "c"];
const MAXLEN = 12;

export function intervals(msg: number[], p: number[]) {
  const c = [0];
  p.forEach((q) => c.push(c[c.length - 1] + q));
  const out: { lo: number; w: number }[] = [{ lo: 0, w: 1 }];
  let lo = 0, w = 1;
  for (const s of msg) {
    lo += w * c[s];
    w *= p[s];
    out.push({ lo, w });
  }
  return { c, out };
}

export function codeword(lo: number, w: number) {
  for (let k = 1; k < 60; k++) {
    const n = Math.ceil(lo * 2 ** k - 1e-12);
    if ((n + 1) / 2 ** k <= lo + w + 1e-12) return n.toString(2).padStart(k, "0");
  }
  return "";
}

/** Arithmetic coding: each symbol narrows the interval to its slice; the code is a short binary fraction inside. */
export function ArithViz() {
  const [pi, setPi] = useState(1);
  const [msg, setMsg] = useState<number[]>([0, 1, 0]);
  const p = PRESETS[pi].p;
  const { c, out } = intervals(msg, p);
  const last = out[out.length - 1];
  const code = codeword(last.lo, last.w);
  const bits = -Math.log2(last.w);
  const W = 330, X0 = 20, BW = W - 40;
  const rows = out.slice(Math.max(0, out.length - 5));
  const first = out.length - rows.length;
  const RH = 26, H = 34 + rows.length * (RH + 12);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {PRESETS.map((q, i) => (
          <button key={q.name} type="button" className="seg" aria-pressed={i === pi} onClick={() => setPi(i)}>{q.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        {SYM.map((s, i) => (
          <button key={s} type="button" className="seg" disabled={msg.length >= MAXLEN} onClick={() => setMsg([...msg, i])}>add {s}</button>
        ))}
        <button type="button" className="seg" disabled={msg.length === 0} onClick={() => setMsg(msg.slice(0, -1))}>undo</button>
        <button type="button" className="seg" onClick={() => setMsg([])}>clear</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Nested intervals of arithmetic coding, each row zoomed to the interval of the row above">
        <rect x={X0} y={6} width={BW} height={10} fill="none" stroke="var(--border)" />
        <rect x={X0 + last.lo * BW} y={6} width={Math.max(1, last.w * BW)} height={10} fill="var(--danger)" />
        <text x={X0} y={28} className="viz-label">0</text>
        <text x={X0 + BW} y={28} textAnchor="end" className="viz-label">1</text>
        {rows.map((r, j) => {
          const y = 36 + j * (RH + 12);
          const depth = first + j;
          const next = depth < msg.length ? msg[depth] : -1;
          return (
            <g key={depth}>
              {p.map((q, s) => (
                <g key={s}>
                  <rect x={X0 + c[s] * BW} y={y} width={q * BW} height={RH} fill={s === next ? "var(--accent)" : "none"} opacity={s === next ? 0.6 : 1} stroke="var(--text-muted)" />
                  {q * BW > 14 && <text x={X0 + (c[s] + q / 2) * BW} y={y + RH / 2 + 4} textAnchor="middle" className="viz-label">{SYM[s]}</text>}
                </g>
              ))}
              <text x={X0 - 4} y={y + RH / 2 + 4} textAnchor="end" className="viz-label">{depth}</text>
              <text x={X0 + BW} y={y + RH + 10} textAnchor="end" className="viz-label">width {r.w.toPrecision(3)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowWrap: "anywhere" }}>
        message {msg.map((s) => SYM[s]).join("") || "(empty)"}; P = {last.w.toPrecision(4)}; −log₂ P = {bits.toFixed(2)}; code {code || "(none needed)"} ({code.length} bits)
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each row is the current interval stretched to full width and split in proportion to the probabilities; the shaded
        slice is the next symbol, and it becomes the next row. The red mark on the top bar is the final interval inside
        [0, 1). Its width is the probability of the whole message, and the code is the shortest binary fraction whose
        dyadic interval fits inside, never more than two bits above −log₂ P.
      </figcaption>
    </figure>
  );
}
