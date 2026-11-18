"use client";

import { useState } from "react";

const MAX = 20;
const LENS = [50, 200, 1000];

/** Tokens pushed through the model by the end of each turn: once each with a causal cache, or the whole history again with a bidirectional encoder. */
export function costs(m: number) {
  const cached: number[] = [], reencode: number[] = [];
  let c = 0, r = 0;
  for (let k = 1; k <= MAX; k++) {
    c += m;
    r += k * m;
    cached.push(c);
    reencode.push(r);
  }
  return { cached, reencode };
}

export function ConversationCostViz() {
  const [li, setLi] = useState(1);
  const [n, setN] = useState(10);
  const m = LENS[li];
  const { cached, reencode } = costs(m);
  const W = 320, H = 190, X0 = 50, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 30;
  const top = reencode[MAX - 1];
  const sx = (k: number) => X0 + (k / MAX) * PW;
  const sy = (v: number) => Y0 + PH - (v / top) * PH;
  const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">tokens per turn</span>
        {LENS.map((l, i) => (
          <button key={l} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{l}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="conv-turns">turns: {n}</label>
        <input id="conv-turns" type="range" min={1} max={MAX} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Tokens processed over a conversation, with and without re-encoding the history">
        <line x1={X0} x2={W - 10} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        <text x={X0 - 4} y={Y0 + 8} textAnchor="end" className="viz-label">{top >= 1e5 ? `${(top / 1e3).toFixed(0)}k` : top}</text>
        <text x={X0 - 4} y={Y0 + PH} textAnchor="end" className="viz-label">0</text>
        {[5, 10, 15, 20].map((k) => (
          <text key={k} x={sx(k)} y={H - 10} textAnchor="middle" className="viz-label">{k}</text>
        ))}
        <path d={path(reencode)} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <path d={path(cached)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={sx(n)} x2={sx(n)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="3 3" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`after ${n} turns: ${cached[n - 1]} tokens with a causal cache, ${reencode[n - 1]} re-encoding (${(reencode[n - 1] / cached[n - 1]).toFixed(1)} times)`}
      </div>
      <figcaption className="viz-caption">
        A conversation in which every turn adds the same number of tokens. A decoder-only model keeps its KV cache, so each
        token goes through the model once (blue). A bidirectional encoder must read the whole history again whenever it
        grows, because a new token can change every earlier encoder state (red). The ratio is (n + 1)/2 after n turns, the
        same whatever the turn length.
      </figcaption>
    </figure>
  );
}
