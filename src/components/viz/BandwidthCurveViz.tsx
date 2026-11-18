"use client";

import { useState } from "react";

const LINKS = [
  { name: "DRAM", lat: 80e-9, bw: 50e9, color: "var(--accent)" },
  { name: "GPU HBM", lat: 500e-9, bw: 2e12, color: "var(--success)" },
  { name: "PCIe", lat: 5e-6, bw: 25e9, color: "var(--danger)" },
  { name: "network", lat: 10e-6, bw: 12.5e9, color: "var(--text-muted)" },
];
const LO = 1, HI = 9;

/** Fraction of peak bandwidth reached by one transfer of n bytes under T = latency + n / bandwidth. */
export function fraction(n: number, lat: number, bw: number) {
  return n / (lat * bw + n);
}

function bytes(n: number) {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1000 && i < 3) { n /= 1000; i++; }
  return `${n >= 100 ? n.toFixed(0) : n.toPrecision(2)} ${u[i]}`;
}

function time(t: number) {
  if (t < 1e-6) return `${(t * 1e9).toPrecision(3)} ns`;
  if (t < 1e-3) return `${(t * 1e6).toPrecision(3)} µs`;
  return `${(t * 1e3).toPrecision(3)} ms`;
}

export function BandwidthCurveViz() {
  const [e, setE] = useState(5);
  const n = 10 ** e;
  const W = 320, H = 190, X0 = 34, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 30;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const sy = (f: number) => Y0 + PH - f * PH;
  const xs = Array.from({ length: 81 }, (_, i) => LO + (i * (HI - LO)) / 80);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="bw-size">transfer size: {bytes(n)}</label>
        <input id="bw-size" type="range" min={LO} max={HI} step={0.25} value={e} onChange={(ev) => setE(Number(ev.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Fraction of peak bandwidth against transfer size for four links">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={W - 10} y1={sy(f)} y2={sy(f)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(f) + 4} textAnchor="end" className="viz-label">{f}</text>
          </g>
        ))}
        {[1, 3, 5, 7, 9].map((x) => (
          <text key={x} x={sx(x)} y={H - 10} textAnchor="middle" className="viz-label">{bytes(10 ** x)}</text>
        ))}
        {LINKS.map((l) => (
          <path key={l.name} d={xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(fraction(10 ** x, l.lat, l.bw)).toFixed(1)}`).join(" ")} fill="none" stroke={l.color} strokeWidth={2} />
        ))}
        <line x1={sx(e)} x2={sx(e)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
      </svg>
      <div style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {LINKS.map((l) => (
          <div key={l.name} className="mono">
            <span style={{ display: "inline-block", width: 10, height: 10, background: l.color, marginRight: 6 }} />
            {`${l.name}: ${time(l.lat + n / l.bw)}, ${(100 * fraction(n, l.lat, l.bw)).toFixed(0)}% of peak, half-power size ${bytes(l.lat * l.bw)}`}
          </div>
        ))}
      </div>
      <figcaption className="viz-caption">
        Four links described by a latency and a peak bandwidth, with orders of magnitude typical of current hardware. A
        transfer of n bytes takes the latency plus n divided by the bandwidth, so small transfers are dominated by the fixed
        cost and see only a sliver of the peak. Each curve passes 50% at its half-power size, latency times bandwidth. The
        GPU&apos;s memory has the highest peak but also the largest half-power size: it needs about a megabyte in flight
        before its bandwidth shows.
      </figcaption>
    </figure>
  );
}
