"use client";

import { useState } from "react";

const SENDS = ["GET /a", "\n", "Host: x\nAcc", "ept: */*\n"];

/** A TCP connection is a byte stream: the sender's send() boundaries vanish, and recv(k) returns whatever has arrived, up to k bytes. */
export function StreamViz() {
  const [k, setK] = useState(5);
  const [lag, setLag] = useState(false);
  const bytes: { ch: string; send: number }[] = SENDS.flatMap((s, i) => [...s].map((ch) => ({ ch, send: i })));
  // with network lag, data arrives in the sender's pieces, so a recv never spans two sends
  const cuts: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    let j = Math.min(bytes.length, i + k);
    if (lag) { const end = bytes.findIndex((b, x) => x >= i && b.send !== bytes[i].send); if (end > 0) j = Math.min(j, end); }
    cuts.push(j);
    i = j;
  }
  const chunks = cuts.map((c, n) => bytes.slice(n ? cuts[n - 1] : 0, c).map((b) => b.ch).join(""));
  const lines = bytes.map((b) => b.ch).join("").split("\n").slice(0, -1);
  const C = 15, perRow = 26, W = perRow * C + 10, rows = Math.ceil(bytes.length / perRow);
  const show = (ch: string) => (ch === "\n" ? "⏎" : ch === " " ? "␣" : ch);
  return (
    <figure className="viz">
      <div className="viz-sliders">
        <label>
          <span>recv({k})</span>
          <input type="range" min={1} max={20} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Bytes per recv" />
        </label>
      </div>
      <div className="segmented" role="group" aria-label="Arrival">
        <button type="button" className="seg" aria-pressed={!lag} onClick={() => setLag(false)}>all data already arrived</button>
        <button type="button" className="seg" aria-pressed={lag} onClick={() => setLag(true)}>each send arrives separately</button>
      </div>
      <svg viewBox={`0 0 ${W} ${rows * (C + 14) + 6}`} role="img" aria-label={`${chunks.length} recv calls`}>
        {bytes.map((b, x) => {
          const r = Math.floor(x / perRow), c = x % perRow;
          const cut = cuts.includes(x + 1) && x + 1 < bytes.length;
          return (
            <g key={x}>
              <rect x={5 + c * C + 1} y={4 + r * (C + 14)} width={C - 2} height={C} rx={2} className={b.send % 2 ? "viz-cell is-on" : "viz-cell"} />
              <text x={5 + c * C + C / 2} y={4 + r * (C + 14) + C - 4} textAnchor="middle" className="viz-label mono" style={{ fontSize: 10 }}>{show(b.ch)}</text>
              {cut && <line x1={5 + (c + 1) * C} x2={5 + (c + 1) * C} y1={r * (C + 14)} y2={4 + r * (C + 14) + C + 5} className="plot-curve" style={{ stroke: "var(--danger)", strokeWidth: 2 }} />}
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The sender called send four times (shading alternates per call). The receiver&rsquo;s{" "}
        <span className="mono">{chunks.length}</span> recv calls (red cuts) return{" "}
        <span className="mono">{chunks.map((c) => JSON.stringify(c)).join(", ")}</span>. Neither matches the{" "}
        <span className="mono">{lines.length}</span> lines the sender meant, <span className="mono">{lines.map((l) => JSON.stringify(l)).join(", ")}</span>:
        the receiver must buffer bytes and split on newlines (or a length prefix) itself.
      </figcaption>
    </figure>
  );
}
