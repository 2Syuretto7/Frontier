"use client";

import { useState } from "react";

const LAT = 0.02, BW = 1e8, NIC = 25e9, SIZES = [1e4, 1e6, 1e8], STREAMS = [1, 4, 16, 64, 256, 1024];

/** Aggregate read throughput in bytes per second with `streams` parallel GET requests of objects of `size` bytes. */
export const throughput = (size: number, streams: number) => Math.min((streams * size) / (LAT + size / BW), NIC);

const label = (s: number) => (s >= 1e8 ? "100 MB" : s >= 1e6 ? "1 MB" : "10 KB");
const COLORS = ["var(--danger)", "var(--accent)", "var(--success)"];
const rate = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB/s` : `${(b / 1e6).toFixed(1)} MB/s`);

export function ObjectStoreViz() {
  const [si, setSi] = useState(1);
  const W = 330, H = 190, X0 = 62, Y0 = 10, PW = W - 80, PH = H - Y0 - 34, YMIN = 5, YMAX = 11;
  const sx = (s: number) => X0 + (Math.log2(s) / 10) * PW;
  const sy = (b: number) => Y0 + PH - ((Math.log10(b) - YMIN) / (YMAX - YMIN)) * PH;
  const size = SIZES[si], best = throughput(size, 1024), tb = 1e12 / best;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">object size</span>
        <div className="segmented" role="group" aria-label="Object size">
          {SIZES.map((s, i) => <button key={s} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{label(s)}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Read throughput against the number of parallel requests">
        {[5, 7, 9, 11].map((l) => (
          <g key={l}>
            <line x1={X0} x2={X0 + PW} y1={sy(10 ** l)} y2={sy(10 ** l)} stroke="var(--border)" strokeDasharray={l > 5 ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(10 ** l) + 4} textAnchor="end" className="viz-label">{["100 KB/s", "10 MB/s", "1 GB/s", "100 GB/s"][(l - 5) / 2]}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={sy(NIC)} y2={sy(NIC)} stroke="var(--text-muted)" strokeDasharray="5 3" />
        {SIZES.map((s, i) => (
          <g key={s} opacity={i === si ? 1 : 0.35}>
            <path d={STREAMS.map((n, k) => `${k ? "L" : "M"}${sx(n).toFixed(1)},${sy(throughput(s, n)).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[i]} strokeWidth={i === si ? 2.2 : 1.4} />
            {STREAMS.map((n) => <circle key={n} cx={sx(n)} cy={sy(throughput(s, n))} r={2.5} fill={COLORS[i]} />)}
          </g>
        ))}
        {STREAMS.map((n) => <text key={n} x={sx(n)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{n}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">parallel requests</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        {SIZES.map((s, i) => <span key={s}><span style={{ color: COLORS[i] }}>●</span> {`${label(s)} objects`}</span>)}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${label(size)} objects: one request ${rate(throughput(size, 1))}, 1024 requests ${rate(best)}; 1 TB takes ${tb >= 120 ? `${(tb / 60).toFixed(0)} min` : `${tb.toFixed(0)} s`}`}
      </div>
      <figcaption className="viz-caption">
        Each GET request pays about 20 ms before its first byte and then streams at 100 MB/s, and the reading machine&apos;s
        network tops out at 25 GB/s (dashed). A single request on 10 KB objects achieves 0.5 MB/s, because it spends almost all
        its time waiting; even 1024 parallel requests reach only 0.5 GB/s, so reading a terabyte takes over half an hour. Objects
        of 100 MB reach the network limit with 256 requests and read a terabyte in about 40 seconds. This is why training data
        is packed into large shards.
      </figcaption>
    </figure>
  );
}
