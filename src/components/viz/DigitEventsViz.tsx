"use client";

import { useState } from "react";

type Ev = { label: string; test: (u: number) => boolean };

const bit = (u: number, k: number) => Math.floor(u * 2 ** k) % 2;

/** Events about a single uniform point U in [0, 1). */
export const EVENTS: Ev[] = [
  { label: "1st digit 1", test: (u) => bit(u, 1) === 1 },
  { label: "2nd digit 1", test: (u) => bit(u, 2) === 1 },
  { label: "3rd digit 1", test: (u) => bit(u, 3) === 1 },
  { label: "digits 1, 2 agree", test: (u) => bit(u, 1) === bit(u, 2) },
  { label: "U < 1/3", test: (u) => u < 1 / 3 },
];

const N = 4800;
const GRID = Array.from({ length: N }, (_, i) => (i + 0.5) / N);

export function measure(f: (u: number) => boolean) {
  return GRID.reduce((s, u) => s + (f(u) ? 1 : 0), 0) / N;
}

export function pairStats(i: number, j: number) {
  const A = EVENTS[i].test, B = EVENTS[j].test;
  const pa = measure(A), pb = measure(B), pab = measure((u) => A(u) && B(u));
  return { pa, pb, pab, prod: pa * pb, indep: Math.abs(pab - pa * pb) < 1e-3 };
}

function Strip({ y, f, color, label }: { y: number; f: (u: number) => boolean; color: string; label: string }) {
  const X0 = 52, PW = 270, cells = 240;
  const rects = [];
  for (let c = 0; c < cells; c++) {
    if (!f((c + 0.5) / cells)) continue;
    let e = c;
    while (e + 1 < cells && f((e + 1.5) / cells)) e++;
    rects.push(<rect key={c} x={X0 + (c * PW) / cells} y={y} width={((e - c + 1) * PW) / cells} height={18} fill={color} />);
    c = e;
  }
  return (
    <g>
      <text x={X0 - 6} y={y + 13} textAnchor="end" className="viz-label">{label}</text>
      <rect x={X0} y={y} width={PW} height={18} fill="none" stroke="var(--border)" />
      {rects}
    </g>
  );
}

export function DigitEventsViz() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(3);
  const s = pairStats(a, b);
  const A = EVENTS[a].test, B = EVENTS[b].test;
  const pick = (cur: number, set: (k: number) => void, name: string) => (
    <div className="segmented" role="group" aria-label={`Event ${name}`} style={{ flexWrap: "wrap" }}>
      {EVENTS.map((e, k) => (
        <button key={e.label} type="button" className="seg" aria-pressed={cur === k} onClick={() => set(k)}>{e.label}</button>
      ))}
    </div>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        <span className="viz-label">A</span>{pick(a, setA, "A")}
        <span className="viz-label">B</span>{pick(b, setB, "B")}
      </div>
      <svg viewBox="0 0 330 96" style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="The events A, B and their intersection as subsets of the unit interval">
        <Strip y={4} f={A} color="var(--accent)" label="A" />
        <Strip y={28} f={B} color="var(--code-function)" label="B" />
        <Strip y={52} f={(u) => A(u) && B(u)} color="var(--text)" label="A ∩ B" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => <text key={v} x={52 + v * 270} y={92} textAnchor="middle" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        P(A) = {s.pa.toFixed(3)}, P(B) = {s.pb.toFixed(3)}, P(A ∩ B) = {s.pab.toFixed(3)}, P(A)P(B) = {s.prod.toFixed(3)}: {a === b ? "the same event" : s.indep ? "independent" : "dependent"}
      </div>
      <figcaption className="viz-caption">
        One uniform point U in [0, 1) with Lebesgue measure as probability. Its binary digits are independent fair coin
        tosses: each digit event has length 1/2, and any two of them overlap in length exactly 1/4. The event that the first
        two digits agree is independent of each digit separately, yet determined by the two together, so the three events are
        pairwise but not mutually independent. The event U &lt; 1/3 is not independent of the first digit.
      </figcaption>
    </figure>
  );
}
