"use client";

import { useMemo, useState } from "react";

const LINE = 16, LINES = 8;

const PATTERNS: Record<string, { label: string; trace: number[]; note: string }> = {
  scan: {
    label: "scan an array",
    trace: Array.from({ length: 32 }, (_, i) => i * 4),
    note: "Four 4-byte ints share each 16-byte line, so only the first touch of a line misses: spatial locality.",
  },
  pair: {
    label: "a[i] + b[i]",
    trace: Array.from({ length: 16 }, (_, i) => [i * 4, 128 + i * 4]).flat(),
    note: "b starts exactly 128 bytes after a, so a[i] and b[i] map to the same set. With one way they evict each other on every access: conflict misses.",
  },
  loop: {
    label: "reuse 10 lines",
    trace: [0, 1, 2].flatMap(() => Array.from({ length: 10 }, (_, i) => i * LINE)),
    note: "Ten lines are reused round and round, but only eight fit. LRU always evicts the line needed soonest: capacity misses, whatever the associativity.",
  },
};

type Way = { line: number; last: number };

function simulate(trace: number[], ways: number) {
  const sets = LINES / ways;
  const cache: Way[][] = Array.from({ length: sets }, () => []);
  const hits: boolean[] = [];
  const snaps: Way[][][] = [];
  trace.forEach((addr, t) => {
    const ln = Math.floor(addr / LINE), s = cache[ln % sets];
    const k = s.findIndex((w) => w.line === ln);
    if (k >= 0) { s[k].last = t; hits.push(true); }
    else {
      if (s.length === ways) { let v = 0; s.forEach((w, j) => { if (w.last < s[v].last) v = j; }); s.splice(v, 1, { line: ln, last: t }); }
      else s.push({ line: ln, last: t });
      hits.push(false);
    }
    snaps.push(cache.map((x) => x.map((w) => ({ ...w }))));
  });
  return { hits, snaps, sets };
}

/** An 8-line cache with 16-byte lines: choose the associativity and an access pattern, then step through it. */
export function CacheViz() {
  const [ways, setWays] = useState(1);
  const [pat, setPat] = useState<keyof typeof PATTERNS>("pair");
  const trace = PATTERNS[pat].trace;
  const [t, setT] = useState(trace.length - 1);
  const { hits, snaps, sets } = useMemo(() => simulate(trace, ways), [trace, ways]);
  const at = Math.min(t, trace.length - 1);
  const snap = snaps[at];
  const cur = Math.floor(trace[at] / LINE);
  const nHit = hits.slice(0, at + 1).filter(Boolean).length;
  const cw = 46, ch = 26, W = 70 + ways * (cw + 4), H = sets * (ch + 4) + 6;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Associativity">
        {[1, 2, 8].map((w) => (
          <button key={w} type="button" className="seg" aria-pressed={ways === w} onClick={() => setWays(w)}>
            {w === 1 ? "direct-mapped" : w === 8 ? "fully associative" : "2-way"}
          </button>
        ))}
      </div>
      <div className="segmented" role="group" aria-label="Access pattern">
        {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((p) => (
          <button key={p} type="button" className="seg" aria-pressed={pat === p} onClick={() => { setPat(p); setT(PATTERNS[p].trace.length - 1); }}>{PATTERNS[p].label}</button>
        ))}
      </div>
      <div className="viz-sliders">
        <label>
          <span>Access {at + 1} of {trace.length}</span>
          <input type="range" min={0} max={trace.length - 1} value={at} onChange={(e) => setT(Number(e.target.value))} aria-label="Access number" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cache contents after access ${at + 1}: ${nHit} hits so far`} style={{ maxWidth: Math.max(W, 260) * 1.6 }}>
        {snap.map((s, i) => (
          <g key={i}>
            <text x={4} y={6 + i * (ch + 4) + ch / 2 + 4} className="plot-tick" style={{ fontSize: 10 }}>set {i}</text>
            {Array.from({ length: ways }, (_, j) => {
              const w = s[j];
              const isCur = w && w.line === cur;
              return (
                <g key={j}>
                  <rect x={56 + j * (cw + 4)} y={6 + i * (ch + 4)} width={cw} height={ch} rx={4} className={w ? "viz-cell is-on" : "viz-cell"} style={isCur ? { stroke: hits[at] ? "var(--success)" : "var(--danger)", strokeWidth: 2.5 } : undefined} />
                  {w && <text x={56 + j * (cw + 4) + cw / 2} y={6 + i * (ch + 4) + ch / 2 + 4} textAnchor="middle" className="viz-label mono" style={{ fontSize: 11 }}>L{w.line}</text>}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Address <span className="mono">{trace[at]}</span> is in line <span className="mono">L{cur}</span>, set{" "}
        <span className="mono">{cur % sets}</span>: a <strong>{hits[at] ? "hit" : "miss"}</strong>. So far{" "}
        <span className="mono">{nHit}</span> hits and <span className="mono">{at + 1 - nHit}</span> misses. {PATTERNS[pat].note}
      </figcaption>
    </figure>
  );
}
