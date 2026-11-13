"use client";

import { useState } from "react";

const Z = [2.0, 0.5, 3.5, 1.0, 3.0, 6.0, 4.0, 2.5, 5.5, 1.5];

/** Streaming log-sum-exp: a running maximum m and a sum s of exp(zᵢ − m) that is rescaled whenever the maximum grows. */
export function OnlineSoftmaxViz() {
  const [t, setT] = useState(3);
  let m = -Infinity, s = 0, scale = 1, rescaled = false;
  for (let i = 0; i < t; i++) {
    const z = Z[i];
    if (z > m) {
      const f = Math.exp(m - z);
      if (i === t - 1 && i > 0) { scale = f; rescaled = true; }
      s = s * f + 1;
      m = z;
    } else {
      s += Math.exp(z - m);
    }
  }
  const W = 330, H = 160, n = Z.length;
  const bw = (W - 40) / n;
  const X = (i: number) => 30 + i * bw;
  const Yz = (z: number) => H - 20 - (z / 7) * (H - 50);
  const Yp = (p: number) => H - 20 - p * (H - 50);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          seen {t} of {n}
          <input type="range" min={1} max={n} value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="number of logits seen" style={{ width: 140 }} />
        </label>
        <button type="button" className="seg" onClick={() => setT(t >= n ? 1 : t + 1)}>next logit</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Logits arriving one at a time with their running softmax weights">
        <line x1={26} x2={W - 8} y1={H - 20} y2={H - 20} stroke="var(--border)" />
        {Z.map((z, i) => {
          const seen = i < t;
          const p = seen ? Math.exp(z - m) / s : 0;
          return (
            <g key={i}>
              <rect x={X(i) + 3} y={Yz(z)} width={bw / 2 - 3} height={H - 20 - Yz(z)} fill="var(--text-muted)" opacity={seen ? 0.45 : 0.12} />
              {seen && <rect x={X(i) + bw / 2} y={Yp(p)} width={bw / 2 - 3} height={H - 20 - Yp(p)} fill="var(--accent)" opacity={0.8} />}
              <text x={X(i) + bw / 2} y={H - 6} textAnchor="middle" className="viz-label">{i + 1}</text>
            </g>
          );
        })}
        <line x1={26} x2={W - 8} y1={Yz(m)} y2={Yz(m)} stroke="var(--danger)" strokeDasharray="4 3" />
        <text x={W - 8} y={Yz(m) - 4} textAnchor="end" className="viz-label">running max m</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        m = {m.toFixed(2)}, s = {s.toFixed(4)}, log-sum-exp so far = {(m + Math.log(s)).toFixed(4)}
        {rescaled ? `; new maximum, old s multiplied by e^(m_old − m) = ${scale.toFixed(4)}` : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey bars are logits arriving one at a time; accent bars are the softmax weights of the logits seen so far. The
        algorithm keeps only the running maximum m (red dashed line) and s, the sum of exp(zᵢ − m) over the logits seen.
        Every exponent is at most 0, so nothing overflows. When a new logit beats the maximum, the old sum is multiplied by
        exp(m_old − m_new) to bring it to the new reference point. At the end m + log s is exactly the log-sum-exp, after
        one pass and with constant memory, the trick behind attention kernels that never store the full score matrix.
      </figcaption>
    </figure>
  );
}
