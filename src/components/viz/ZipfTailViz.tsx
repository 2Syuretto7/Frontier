"use client";

import { useMemo, useState } from "react";

const K = 1_000_000;
const XS = Array.from({ length: 13 }, (_, i) => 10 ** (1 + i * 0.25));
type Mode = "capacity" | "data";

/** Reducible loss for a Zipf law p_k ∝ k^-a: mass beyond the first N features, or mass not yet seen in D samples. */
export function zipfCurve(a: number, mode: Mode) {
  const p = new Float64Array(K);
  let Z = 0;
  for (let k = 1; k <= K; k++) { p[k - 1] = k ** -a; Z += p[k - 1]; }
  for (let k = 0; k < K; k++) p[k] /= Z;
  if (mode === "capacity") {
    const tail = new Float64Array(K + 1);
    for (let k = K - 1; k >= 0; k--) tail[k] = tail[k + 1] + p[k];
    return XS.map((N) => tail[Math.round(N)]);
  }
  return XS.map((D) => {
    let s = 0;
    for (let k = 0; k < K; k++) {
      const q = p[k], t = q * Math.exp(D * Math.log1p(-q));
      s += t;
      if (q * D < 1e-3 && k > 10) { s += tailMass(p, k + 1); break; }
    }
    return s;
  });
}
function tailMass(p: Float64Array, from: number) {
  let s = 0;
  for (let k = from; k < p.length; k++) s += p[k];
  return s;
}

function slope(ys: number[]) {
  const lx = XS.map(Math.log10), ly = ys.map(Math.log10);
  const mx = lx.reduce((s, x) => s + x, 0) / lx.length, my = ly.reduce((s, y) => s + y, 0) / ly.length;
  let num = 0, den = 0;
  lx.forEach((x, i) => { num += (x - mx) * (ly[i] - my); den += (x - mx) ** 2; });
  return num / den;
}

export function ZipfTailViz() {
  const [a, setA] = useState(2);
  const [mode, setMode] = useState<Mode>("capacity");
  const ys = useMemo(() => zipfCurve(a, mode), [a, mode]);
  const pred = mode === "capacity" ? a - 1 : (a - 1) / a;
  const fit = slope(ys);
  const W = 330, H = 170, X0 = 40, PW = 276, Y0 = 140, PH = 126;
  const lys = ys.map(Math.log10);
  const lo = Math.floor(Math.min(...lys)), hi = Math.ceil(Math.max(...lys));
  const px = (x: number) => X0 + ((Math.log10(x) - 1) / 3) * PW;
  const py = (l: number) => Y0 - ((l - lo) / Math.max(1, hi - lo)) * PH;
  const ref = XS.map((x) => lys[0] - pred * (Math.log10(x) - 1));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="What grows">
          <button className="seg" aria-pressed={mode === "capacity"} onClick={() => setMode("capacity")}>features learned N</button>
          <button className="seg" aria-pressed={mode === "data"} onClick={() => setMode("data")}>samples seen D</button>
        </div>
        <div className="segmented" role="group" aria-label="Zipf exponent">
          {[1.5, 2, 3].map((v) => (
            <button key={v} className="seg" aria-pressed={a === v} onClick={() => setA(v)}>a = {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Reducible loss against model or data size on log-log axes">
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((e) => (
          <text key={e} x={X0 - 4} y={py(e) + 4} textAnchor="end" className="viz-label">10{e < 0 ? "⁻" : ""}{"⁰¹²³⁴⁵⁶⁷⁸⁹"[Math.abs(e)]}</text>
        ))}
        {[10, 100, 1000, 10000].map((x, i) => <text key={x} x={px(x)} y={Y0 + 12} textAnchor="middle" className="viz-label">10{"¹²³⁴"[i]}</text>)}
        <path d={ref.map((l, i) => `${i ? "L" : "M"}${px(XS[i]).toFixed(1)},${py(l).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={lys.map((l, i) => `${i ? "L" : "M"}${px(XS[i]).toFixed(1)},${py(l).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        {lys.map((l, i) => <circle key={i} cx={px(XS[i])} cy={py(l)} r={2.5} fill="var(--code-function)" />)}
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">{mode === "capacity" ? "N" : "D"} (log scale); dashed: predicted slope</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        fitted slope {fit.toFixed(3)}, predicted −{pred.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Features of the data occur with Zipf frequencies p_k ∝ k^−a. Under &ldquo;features learned&rdquo;, a model knows the N
        most common features exactly, so its loss is the probability mass of the rest. Under &ldquo;samples seen&rdquo;, a model
        memorises every feature it has met at least once in D samples. Both losses are power laws, with exponents a − 1 and
        (a − 1)/a set by the data, not by the model; heavier tails, smaller a, give slower scaling.
      </figcaption>
    </figure>
  );
}
