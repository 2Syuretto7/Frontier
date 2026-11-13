"use client";

import { useState } from "react";

// f(x, y) = (x² − y², 2xy), the complex map z ↦ z²
const f = (x: number, y: number): [number, number] => [x * x - y * y, 2 * x * y];
const S = 230, SC1 = 60, SC2 = 34;
const p1 = (x: number, y: number) => `${(S / 2 + x * SC1).toFixed(1)},${(S / 2 - y * SC1).toFixed(1)}`;
const p2 = (u: number, v: number) => `${(S / 2 + u * SC2).toFixed(1)},${(S / 2 - v * SC2).toFixed(1)}`;

/** A small disc around a point and its image under (x² − y², 2xy): one-to-one where det J ≠ 0, folded where it vanishes. */
export function LocalInverseViz() {
  const [r, setR] = useState(1.2);
  const ang = 0.6;
  const a: [number, number] = [r * Math.cos(ang), r * Math.sin(ang)];
  const rad = 0.5;
  const detJ = 4 * (a[0] * a[0] + a[1] * a[1]);
  const rings = [0.25, 0.5].map((q) => q * rad);
  const spokes = 12;
  const disc: string[] = [];
  const image: string[] = [];
  rings.forEach((q) => {
    const d: string[] = [], im: string[] = [];
    for (let k = 0; k <= 72; k++) {
      const t = (2 * Math.PI * k) / 72;
      const x = a[0] + 2 * q * Math.cos(t), y = a[1] + 2 * q * Math.sin(t);
      d.push(p1(x, y));
      im.push(p2(...f(x, y)));
    }
    disc.push(d.join(" "));
    image.push(im.join(" "));
  });
  const spokeLines = Array.from({ length: spokes }, (_, k) => {
    const t = (2 * Math.PI * k) / spokes;
    const d: string[] = [], im: string[] = [];
    for (let j = 0; j <= 10; j++) {
      const x = a[0] + rad * (j / 10) * Math.cos(t), y = a[1] + rad * (j / 10) * Math.sin(t);
      d.push(p1(x, y));
      im.push(p2(...f(x, y)));
    }
    return { d: d.join(" "), im: im.join(" "), hue: k };
  });
  const containsZero = r < rad;
  return (
    <figure className="viz">
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "46%", minWidth: 150, maxWidth: 260 }} role="img" aria-label="A disc in the domain">
          <line x1={0} y1={S / 2} x2={S} y2={S / 2} stroke="var(--border)" />
          <line x1={S / 2} y1={0} x2={S / 2} y2={S} stroke="var(--border)" />
          {spokeLines.map((s) => <polyline key={s.hue} points={s.d} fill="none" stroke={s.hue === 0 ? "var(--danger)" : "var(--text-faint)"} strokeWidth={s.hue === 0 ? 2 : 1} />)}
          {disc.map((d, i) => <polyline key={i} points={d} fill="none" stroke="var(--accent)" strokeWidth={1.6} />)}
          <text x={6} y={14} className="viz-label">domain</text>
        </svg>
        <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "46%", minWidth: 150, maxWidth: 260 }} role="img" aria-label="Its image under the map">
          <line x1={0} y1={S / 2} x2={S} y2={S / 2} stroke="var(--border)" />
          <line x1={S / 2} y1={0} x2={S / 2} y2={S} stroke="var(--border)" />
          {spokeLines.map((s) => <polyline key={s.hue} points={s.im} fill="none" stroke={s.hue === 0 ? "var(--danger)" : "var(--text-faint)"} strokeWidth={s.hue === 0 ? 2 : 1} />)}
          {image.map((d, i) => <polyline key={i} points={d} fill="none" stroke="var(--accent)" strokeWidth={1.6} />)}
          <text x={6} y={14} className="viz-label">image</text>
        </svg>
      </div>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">|a| = {r.toFixed(2)}</span>
        <input type="range" min={0} max={1.6} step={0.05} value={r} onChange={(e) => setR(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center" }}>det J(a) = 4|a|² = {detJ.toFixed(2)}</div>
      <figcaption className="viz-caption" aria-live="polite">
        The map f(x, y) = (x² − y², 2xy) applied to a disc of radius {rad} around a.{" "}
        {containsZero
          ? "The disc now contains the origin, where det J = 0. Its image wraps around twice, so points in the image have two preimages in the disc: no inverse exists there."
          : "Away from the origin the image is a slightly bent disc covered exactly once, so f has an inverse near a, as the inverse function theorem promises. Note that f(−a) = f(a): the inverse is only local."}
      </figcaption>
    </figure>
  );
}
