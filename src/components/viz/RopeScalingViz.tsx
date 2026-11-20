"use client";

import { useMemo, useState } from "react";

const D = 128, BASE = 10000, L = 4096;

type Method = "none" | "pi" | "ntk" | "yarn";

/** Wavelength in positions of each rotary pair after scaling the context by s with the chosen method. */
export function wavelengths(method: Method, s: number) {
  const base = method === "ntk" ? BASE * Math.pow(s, D / (D - 2)) : BASE;
  return Array.from({ length: D / 2 }, (_, i) => {
    const f = Math.pow(base, (-2 * i) / D);
    let g = 1;
    if (method === "pi") g = 1 / s;
    if (method === "yarn") {
      const r = (L * f) / (2 * Math.PI);
      const w = Math.min(1, Math.max(0, (r - 1) / 31));
      g = (1 - w) / s + w;
    }
    return (2 * Math.PI) / (f * g);
  });
}

const LABEL: Record<Method, string> = { none: "none", pi: "interpolation", ntk: "NTK base", yarn: "YaRN" };

export function RopeScalingViz() {
  const [method, setMethod] = useState<Method>("yarn");
  const [s, setS] = useState(8);
  const orig = useMemo(() => wavelengths("none", s), [s]);
  const wl = useMemo(() => wavelengths(method, s), [method, s]);
  const W = 330, H = 216, X0 = 40, PW = 280, Y0 = 8, PH = 160, LMIN = 0.5, LMAX = 6.5;
  const px = (i: number) => X0 + (i / (D / 2 - 1)) * PW;
  const py = (w: number) => Y0 + PH - ((Math.log10(w) - LMIN) / (LMAX - LMIN)) * PH;
  const line = (ws: number[]) => ws.map((w, i) => `${px(i).toFixed(1)},${py(w).toFixed(1)}`).join(" ");
  const fast = wl[0] / orig[0], slow = wl[D / 2 - 1] / orig[D / 2 - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Scaling method">
          {(Object.keys(LABEL) as Method[]).map((m) => (
            <button key={m} className="seg" aria-pressed={method === m} onClick={() => setMethod(m)}>{LABEL[m]}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Scale factor">
          {[4, 8, 32].map((v) => (
            <button key={v} className="seg" aria-pressed={s === v} onClick={() => setS(v)}>s = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Wavelength of each rotary pair before and after scaling">
        {[1, 2, 3, 4, 5, 6].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(10 ** e) + 3} textAnchor="end" className="viz-label">10{["", "¹", "²", "³", "⁴", "⁵", "⁶"][e]}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={py(L)} y2={py(L)} stroke="var(--code-string)" strokeDasharray="5 3" />
        <text x={X0 + 2} y={py(L) + 11} className="viz-label" style={{ fill: "var(--code-string)" }}>training length 4,096</text>
        <line x1={X0} x2={X0 + PW} y1={py(L * s)} y2={py(L * s)} stroke="var(--danger)" strokeDasharray="5 3" />
        <text x={X0 + 2} y={py(L * s) - 4} className="viz-label" style={{ fill: "var(--danger)" }}>target length {(L * s).toLocaleString("en-IN")}</text>
        <polyline points={line(orig)} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline points={line(wl)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0} y={H - 18} className="viz-label">rotary pair, fastest (left) to slowest (right)</text>
        <text x={X0} y={H - 4} className="viz-label">wavelength in positions, log scale; grey: original</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {LABEL[method]}: fastest pair stretched {fast.toFixed(2)}×, slowest {slow.toFixed(2)}×
      </div>
      <figcaption className="viz-caption">
        Each rotary pair turns with its own wavelength. Pairs whose wavelength is longer than the training length never
        completed a turn in training, so at longer positions they produce angles the model has not seen. Interpolation stretches
        every pair by s, blurring the fast pairs that resolve nearby tokens. Raising the base stretches slow pairs most and fast
        pairs hardly at all. YaRN leaves pairs with many turns alone, interpolates those with less than one, and blends in
        between.
      </figcaption>
    </figure>
  );
}
