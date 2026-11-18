"use client";

import { useState } from "react";

const LEVELS = [
  { name: "L1", cap: 48e3, lat: 1.2e-9, color: "var(--success)" },
  { name: "L2", cap: 2e6, lat: 4e-9, color: "var(--accent)" },
  { name: "L3", cap: 32e6, lat: 15e-9, color: "var(--text-muted)" },
];
const MEM = 90e-9;
const LO = 3, HI = 9.5;

/** Where random accesses to a working set of W bytes are served, and their mean latency, for nested caches. */
export function serve(W: number) {
  const shares: number[] = [];
  let covered = 0, lat = 0;
  for (const l of LEVELS) {
    const h = Math.min(1, l.cap / W);
    shares.push(h - covered);
    lat += (h - covered) * l.lat;
    covered = h;
  }
  shares.push(1 - covered);
  return { shares, lat: lat + (1 - covered) * MEM };
}

function bytes(n: number) {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1000 && i < 3) { n /= 1000; i++; }
  return `${n >= 100 ? n.toFixed(0) : n.toPrecision(2)} ${u[i]}`;
}

export function WorkingSetViz() {
  const [e, setE] = useState(6.5);
  const W = 10 ** e;
  const r = serve(W);
  const SW = 320, H = 190, X0 = 40, Y0 = 10, PW = SW - X0 - 10, PH = H - Y0 - 30;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  const sy = (t: number) => Y0 + PH - (t / 100e-9) * PH;
  const xs = Array.from({ length: 131 }, (_, i) => LO + (i * (HI - LO)) / 130);
  const names = [...LEVELS.map((l) => l.name), "DRAM"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="ws-size">working set: {bytes(W)}</label>
        <input id="ws-size" type="range" min={LO} max={HI} step={0.05} value={e} onChange={(ev) => setE(Number(ev.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${SW} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Mean latency of random accesses against working-set size">
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <line x1={X0} x2={SW - 10} y1={sy(t * 1e-9)} y2={sy(t * 1e-9)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(t * 1e-9) + 4} textAnchor="end" className="viz-label">{`${t} ns`}</text>
          </g>
        ))}
        {[3, 5, 7, 9].map((x) => (
          <text key={x} x={sx(x)} y={H - 10} textAnchor="middle" className="viz-label">{bytes(10 ** x)}</text>
        ))}
        {LEVELS.map((l) => (
          <line key={l.name} x1={sx(Math.log10(l.cap))} x2={sx(Math.log10(l.cap))} y1={Y0} y2={Y0 + PH} stroke={l.color} strokeDasharray="3 3" />
        ))}
        <path d={xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(serve(10 ** x).lat).toFixed(1)}`).join(" ")} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <circle cx={sx(e)} cy={sy(r.lat)} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`mean latency ${(r.lat * 1e9).toFixed(1)} ns; served by ${r.shares.map((s, i) => `${names[i]} ${(100 * s).toFixed(0)}%`).join(", ")}`}
      </div>
      <figcaption className="viz-caption">
        The model behind a pointer-chasing benchmark: every load goes to a uniformly random line of a working set of the
        chosen size, and each cache level (dashed lines at its capacity) holds as much of it as fits. The mean latency
        steps up as the working set outgrows each level, and the steps are smoothed because a set slightly too big for a
        cache still hits it most of the time. Measured curves look like this, which is how cache sizes and latencies are
        read off a machine whose specification you do not have.
      </figcaption>
    </figure>
  );
}
