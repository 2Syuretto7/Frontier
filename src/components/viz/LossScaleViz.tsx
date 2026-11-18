"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

/** log2 of gradient magnitudes: centred near 2⁻²⁷ with a spread of 5 binades, as in a deep network's small layers. */
const normal = makeNormal(makeRng(11));
export const LOGS = Array.from({ length: 4000 }, () => -27 + 5 * normal());

/** Smallest positive subnormal and largest finite value, as log2, for float16 and bfloat16. */
export const FORMATS = {
  fp16: { min: -24, normal: -14, max: Math.log2(65504) },
  bf16: { min: -133, normal: -126, max: Math.log2(3.3895e38) },
} as const;
type Fmt = keyof typeof FORMATS;

export function lost(fmt: Fmt, shift: number) {
  const f = FORMATS[fmt];
  let under = 0, over = 0;
  for (const l of LOGS) {
    if (l + shift < f.min) under++;
    else if (l + shift > f.max) over++;
  }
  return { under: under / LOGS.length, over: over / LOGS.length };
}

const SHIFTS = [0, 8, 16, 32];
const LO = -50, HI = 40, BIN = 1;

export function LossScaleViz() {
  const [fmt, setFmt] = useState<Fmt>("fp16");
  const [shift, setShift] = useState(0);
  const f = FORMATS[fmt];
  const counts = new Array((HI - LO) / BIN).fill(0);
  for (const l of LOGS) {
    const k = Math.floor((l + shift - LO) / BIN);
    if (k >= 0 && k < counts.length) counts[k]++;
  }
  const cmax = Math.max(...counts);
  const W = 320, H = 140, X0 = 8, PW = W - 16, PH = 110;
  const sx = (l: number) => X0 + ((l - LO) / (HI - LO)) * PW;
  const { under, over } = lost(fmt, shift);
  const zoneL = Math.max(LO, Math.min(HI, f.min)), zoneR = Math.max(LO, Math.min(HI, f.max));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {(["fp16", "bf16"] as Fmt[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={fmt === k} onClick={() => setFmt(k)}>{k}</button>
        ))}
        <span className="viz-label">loss scale</span>
        {SHIFTS.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={shift === s} onClick={() => setShift(s)}>{s === 0 ? "1" : `2^${s}`}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of scaled gradient magnitudes against the representable range">
        <rect x={sx(zoneL)} y={8} width={Math.max(sx(zoneR) - sx(zoneL), 0)} height={PH} fill="var(--accent)" fillOpacity={0.08} />
        {f.min > LO && <line x1={sx(f.min)} y1={8} x2={sx(f.min)} y2={8 + PH} stroke="var(--danger)" strokeDasharray="3 2" />}
        {f.normal > LO && <line x1={sx(f.normal)} y1={8} x2={sx(f.normal)} y2={8 + PH} stroke="var(--text-muted)" strokeDasharray="2 3" />}
        {f.max < HI && <line x1={sx(f.max)} y1={8} x2={sx(f.max)} y2={8 + PH} stroke="var(--danger)" strokeDasharray="3 2" />}
        {counts.map((c, k) => {
          const l = LO + k * BIN, bad = l + BIN <= f.min || l >= f.max;
          const h = (c / cmax) * (PH - 6);
          return <rect key={k} x={sx(l) + 0.5} y={8 + PH - h} width={Math.max(sx(l + BIN) - sx(l) - 1, 1)} height={h} fill={bad ? "var(--danger)" : "var(--accent)"} fillOpacity={0.8} />;
        })}
        <line x1={X0} y1={8 + PH} x2={X0 + PW} y2={8 + PH} stroke="var(--border)" />
        {[-40, -24, -14, 0, 16, 32].map((l) => (
          <text key={l} x={sx(l)} y={H + 12} textAnchor="middle" className="viz-label">{`2^${l}`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`flushed to zero ${(100 * under).toFixed(1)}%   overflowed to inf ${(100 * over).toFixed(1)}%`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Magnitudes of 4000 gradient entries on a log scale, multiplied by the loss scale before being stored in the chosen
        format. The shaded band is what the format can hold; the dashed red lines are its smallest subnormal and largest
        finite value, and the grey line where subnormals begin, below which precision drops. In float16 most of these
        gradients vanish unscaled; a scale of 2^16 moves almost all of them into range, and 2^32 pushes the largest past
        65504. bfloat16 has float32&apos;s exponent range, so it needs no scaling at all.
      </figcaption>
    </figure>
  );
}
