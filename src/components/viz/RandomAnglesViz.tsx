"use client";

import { useMemo, useState } from "react";

const PAIRS = 1500, DIMS = [2, 5, 20, 100, 500, 2000];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Angles in degrees between PAIRS pairs of independent Gaussian vectors in dimension d, and the spread of their cosines. */
export function simulate(d: number) {
  const r = rand(53 + d);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const angles: number[] = [], cosines: number[] = [];
  for (let k = 0; k < PAIRS; k++) {
    let dot = 0, uu = 0, vv = 0;
    for (let i = 0; i < d; i++) { const u = gauss(), v = gauss(); dot += u * v; uu += u * u; vv += v * v; }
    const c = dot / Math.sqrt(uu * vv);
    cosines.push(c);
    angles.push((Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI);
  }
  const sd = Math.sqrt(cosines.reduce((a, c) => a + c * c, 0) / PAIRS);
  const within = angles.filter((a) => Math.abs(a - 90) < 10).length / PAIRS;
  return { angles, sd, within };
}

export function RandomAnglesViz() {
  const [d, setD] = useState(20);
  const { angles, sd, within } = useMemo(() => simulate(d), [d]);
  const W = 330, H = 170, X0 = 10, Y0 = 8, PW = W - 20, PH = H - Y0 - 30, BINS = 60;
  const hist = new Array(BINS).fill(0);
  angles.forEach((a) => hist[Math.min(BINS - 1, Math.floor((a / 180) * BINS))]++);
  const top = Math.max(...hist);
  const sx = (v: number) => X0 + (v / 180) * PW;
  const bw = PW / BINS;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">dimension d</span>
        <div className="segmented" role="group" aria-label="Dimension">
          {DIMS.map((v) => (
            <button key={v} type="button" className="seg" aria-pressed={d === v} onClick={() => setD(v)}>{v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of angles between pairs of random vectors">
        <rect x={sx(80)} y={Y0} width={sx(100) - sx(80)} height={PH} fill="var(--accent-soft)" opacity={0.5} />
        {hist.map((h, b) => h > 0 && (
          <rect key={b} x={X0 + b * bw} y={Y0 + PH - (h / top) * PH} width={Math.max(bw - 0.5, 0.5)} height={(h / top) * PH} fill="var(--accent)" />
        ))}
        <line x1={sx(90)} x2={sx(90)} y1={Y0} y2={Y0 + PH} stroke="var(--danger)" strokeWidth={1.5} />
        {[0, 45, 90, 135, 180].map((v) => (
          <text key={v} x={sx(v)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{v}°</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">angle between two random vectors</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`sd of cosine ${sd.toFixed(3)}; 1/√d = ${(1 / Math.sqrt(d)).toFixed(3)}; ${(within * 100).toFixed(1)}% of angles within 10° of 90°`}
      </div>
      <figcaption className="viz-caption">
        Fifteen hundred pairs of independent Gaussian vectors, and the angle between each pair. In the plane every angle is
        equally likely. As d grows the angles pile up at 90° (red): the cosine has standard deviation 1/√d, so from about
        d = 500 on essentially every pair is within 10° of orthogonal (shaded band). Two random directions in high dimension
        are, to a very good approximation, perpendicular.
      </figcaption>
    </figure>
  );
}
