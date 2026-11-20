"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const GAPS = [0, 0.2, 0.5];
const SHARE = [0.5, 3];
const N = 400;

function erfc(x: number) {
  const t = 1 / (1 + 0.3275911 * x);
  return ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
}

/**
 * N questions with difficulty z ~ N(0, 1). Model A answers correctly with probability σ(1 + s·z) and model B with
 * σ(1 − gap + s·z), independently given the question; s sets how much the two share which questions are hard. Returns the
 * outcome per question (0 both right, 1 only A, 2 only B, 3 both wrong), the counts, the unpaired and paired standard errors of
 * the accuracy difference, and the McNemar p-value.
 */
export function discordant(gap: number, s: number, seed = 22) {
  const r = rand(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const sig = (x: number) => 1 / (1 + Math.exp(-x));
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    const z = gauss();
    const a = r() < sig(1 + s * z), b = r() < sig(1 - gap + s * z);
    out.push(a && b ? 0 : a ? 1 : b ? 2 : 3);
  }
  const cnt = [0, 1, 2, 3].map((k) => out.filter((o) => o === k).length);
  const pa = (cnt[0] + cnt[1]) / N, pb = (cnt[0] + cnt[2]) / N, d = pa - pb;
  const unpaired = Math.sqrt((pa * (1 - pa) + pb * (1 - pb)) / N);
  const paired = Math.sqrt(((cnt[1] + cnt[2]) / N - d * d) / N);
  const stat = cnt[1] + cnt[2] ? (cnt[1] - cnt[2]) ** 2 / (cnt[1] + cnt[2]) : 0;
  return { out: [...out].sort((x, y) => x - y), cnt, d, unpaired, paired, p: erfc(Math.sqrt(stat / 2)) };
}

const COLS = ["var(--border-strong)", "var(--accent)", "var(--danger)", "var(--border)"];
const NAMES = ["both right", "only A", "only B", "both wrong"];

export function DiscordantViz() {
  const [g, setG] = useState(1);
  const [s, setS] = useState(1);
  const { out, cnt, d, unpaired, paired, p } = useMemo(() => discordant(GAPS[g], SHARE[s]), [g, s]);
  const COLN = 25, CELL = 12, X0 = 8, Y0 = 4;
  const W = X0 * 2 + COLN * CELL, H = Y0 + (N / COLN) * CELL + 44;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="True gap">
          {["no gap", "small gap", "larger gap"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={g === i} onClick={() => setG(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Shared difficulty">
          {["models disagree often", "models agree often"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Outcomes of two models on 400 questions">
        {out.map((o, i) => (
          <rect key={i} x={X0 + (i % COLN) * CELL + 1} y={Y0 + Math.floor(i / COLN) * CELL + 1} width={CELL - 2} height={CELL - 2} style={{ fill: COLS[o] }} />
        ))}
        {NAMES.map((name, k) => (
          <g key={name}>
            <rect x={X0 + (k % 2) * 150} y={H - 32 + Math.floor(k / 2) * 16} width={9} height={9} style={{ fill: COLS[k] }} />
            <text x={X0 + (k % 2) * 150 + 13} y={H - 24 + Math.floor(k / 2) * 16} className="viz-label">{name} {cnt[k]}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        A − B: {(100 * d).toFixed(1)} points; standard error unpaired {(100 * unpaired).toFixed(2)}, paired {(100 * paired).toFixed(2)}; McNemar p = {p.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Two models on the same 400 questions, one square per question. Only the questions where they differ carry information about
        which is better. When the models find the same questions easy and hard, most squares are concordant, the paired standard
        error is far smaller than the one that treats the scores as independent, and a small gap becomes detectable.
      </figcaption>
    </figure>
  );
}
