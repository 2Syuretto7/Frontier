"use client";

import { useState } from "react";

type Eq = [number, number, number, number]; // a x + b = c x + d

const PRESETS: Eq[] = [[3, 2, 1, 8], [5, 1, 2, 13], [4, 6, 1, 15], [2, 9, 4, 3]];

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

function side(a: number, b: number) {
  const parts = [a ? (a === 1 ? "x" : `${a}x`) : "", b ? String(b) : ""].filter(Boolean);
  return parts.length ? parts.join(" + ") : "0";
}

function Pan({ x0, xs, ones, label }: { x0: number; xs: number; ones: number; label: string }) {
  const items = [...Array(xs).fill("x"), ...Array(ones).fill("1")] as string[];
  return (
    <g>
      <line x1={x0} y1={120} x2={x0 + 240} y2={120} className="viz-axis" strokeWidth={2} />
      {items.map((t, i) => {
        const col = i % 8, row = Math.floor(i / 8);
        const cx = x0 + 18 + col * 29, cy = 104 - row * 28;
        return t === "x"
          ? <g key={i}><rect x={cx - 12} y={cy - 12} width={24} height={24} rx={4} className="viz-node is-paired" /><text x={cx} y={cy + 4} textAnchor="middle" className="viz-label is-on">x</text></g>
          : <circle key={i} cx={cx} cy={cy} r={9} className="viz-node" />;
      })}
      <text x={x0 + 120} y={146} textAnchor="middle" className="viz-label">{label}</text>
    </g>
  );
}

/** Solving a linear equation by doing the same thing to both sides of a balance. */
export function BalanceViz() {
  const [preset, setPreset] = useState(0);
  const [eq, setEq] = useState<Eq>(PRESETS[0]);
  const [log, setLog] = useState<string[]>([]);
  const [a, b, c, d] = eq;
  const g = gcd(gcd(a, b), gcd(c, d));
  const solved = (a === 1 && b === 0 && c === 0) || (c === 1 && d === 0 && a === 0);
  const answer = a === 1 && b === 0 && c === 0 ? d : b;

  const act = (next: Eq, what: string) => { setEq(next); setLog((l) => [...l, what]); };
  const load = (i: number) => { setPreset(i); setEq(PRESETS[i]); setLog([]); };

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 160" role="img" aria-label={`${side(a, b)} balances ${side(c, d)}`}>
        <polygon points="310,120 296,150 324,150" className="viz-node" />
        <Pan x0={30} xs={a} ones={b} label={side(a, b)} />
        <Pan x0={350} xs={c} ones={d} label={side(c, d)} />
        <text x={310} y={40} textAnchor="middle" className="viz-label is-on">=</text>
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" disabled={b < 1 || d < 1} onClick={() => act([a, b - 1, c, d - 1], "take 1 from each side")}>Take 1 from each side</button>
        <button type="button" className="btn" disabled={a < 1 || c < 1} onClick={() => act([a - 1, b, c - 1, d], "take x from each side")}>Take x from each side</button>
        <button type="button" className="btn" disabled={g < 2} onClick={() => act([a / g, b / g, c / g, d / g], `divide each side by ${g}`)}>
          {g >= 2 ? `Divide each side by ${g}` : "Divide each side"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => load((preset + 1) % PRESETS.length)}>New equation</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {solved
          ? <>Solved: <span className="mono">x = {answer}</span>. Check it in the original equation, <span className="mono">{side(PRESETS[preset][0], PRESETS[preset][1])} = {side(PRESETS[preset][2], PRESETS[preset][3])}</span>.</>
          : <>Each square is an unknown weight x; each circle weighs 1. The pans balance. Whatever you do to one side, do to the other, and they still balance.</>}
        {log.length > 0 && <> Steps: {log.join(", ")}.</>}
      </figcaption>
    </figure>
  );
}
