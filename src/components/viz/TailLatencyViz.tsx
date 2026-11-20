"use client";

import { useState } from "react";

const NS = [1, 10, 100, 1000], PS = [0.01, 0.001];

/** Probability that a request fanned out to n servers waits for at least one slow reply. With hedging, a leaf is slow only if both copies are. */
export const pSlow = (p: number, n: number, hedged: boolean) => 1 - (1 - (hedged ? p * p : p)) ** n;

export function TailLatencyViz() {
  const [ni, setNi] = useState(2), [hedged, setHedged] = useState(false);
  const n = NS[ni];
  const W = 330, H = 180, X0 = 40, Y0 = 8, PW = W - 50, PH = H - Y0 - 34;
  const sx = (m: number) => X0 + (Math.log10(m) / 3) * PW, sy = (f: number) => Y0 + PH - f * PH;
  const grid = Array.from({ length: 61 }, (_, i) => 10 ** ((3 * i) / 60));
  const colors = ["var(--danger)", "var(--accent)"];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">fan-out</span>
        <div className="segmented" role="group" aria-label="Servers per request">
          {NS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{x}</button>)}
        </div>
        <span className="viz-label">hedged requests</span>
        <div className="segmented" role="group" aria-label="Hedged requests">
          <button type="button" className="seg" aria-pressed={!hedged} onClick={() => setHedged(false)}>off</button>
          <button type="button" className="seg" aria-pressed={hedged} onClick={() => setHedged(true)}>on</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Probability that a request is slow against fan-out">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={X0 + PW} y1={sy(f)} y2={sy(f)} stroke="var(--border)" strokeDasharray={f ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(f) + 4} textAnchor="end" className="viz-label">{`${f * 100}%`}</text>
          </g>
        ))}
        {PS.map((p, i) => <path key={p} d={grid.map((m, k) => `${k ? "L" : "M"}${sx(m).toFixed(1)},${sy(pSlow(p, m, hedged)).toFixed(1)}`).join(" ")} fill="none" stroke={colors[i]} strokeWidth={2} />)}
        <line x1={sx(n)} x2={sx(n)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {NS.map((m) => <text key={m} x={sx(m)} y={Y0 + PH + 14} textAnchor={m === 1 ? "start" : m === 1000 ? "end" : "middle"} className="viz-label">{m}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">servers each request waits for</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        {PS.map((p, i) => <span key={p}><span style={{ color: colors[i] }}>●</span> {`each server slow ${p * 100}% of the time`}</span>)}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`fan-out ${n}: ${(pSlow(0.01, n, hedged) * 100).toFixed(1)}% of requests slow at 1%, ${(pSlow(0.001, n, hedged) * 100).toFixed(1)}% at 0.1%`}
      </div>
      <figcaption className="viz-caption">
        A request that waits for replies from n servers is as slow as its slowest reply. If each server is slow 1% of the time,
        a request to 100 servers is slow 63% of the time, and one to 1000 servers almost always: rare events at one machine
        become the common case at scale, which is why distributed systems track 99th and 99.9th percentiles rather than means.
        Hedging, sending a second copy of a request that has not answered in time, makes a leaf slow only when both copies
        are, cutting the slow fraction at fan-out 100 to 1%.
      </figcaption>
    </figure>
  );
}
