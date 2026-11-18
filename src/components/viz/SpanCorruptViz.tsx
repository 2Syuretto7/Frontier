"use client";

import { useMemo, useState } from "react";

const WORDS = "thank you for inviting me to your party last week it was a lovely evening and the food was wonderful so we stayed until midnight talking with old friends from school".split(" ");
const MEANS = [1, 3, 8];
const RATE = 0.15;

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Split n into k positive parts uniformly at random. */
function parts(n: number, k: number, u: () => number) {
  const cuts = Array.from({ length: n - 1 }, (_, i) => i + 1);
  for (let i = cuts.length - 1; i > 0; i--) {
    const j = Math.floor(u() * (i + 1));
    [cuts[i], cuts[j]] = [cuts[j], cuts[i]];
  }
  const c = cuts.slice(0, k - 1).sort((a, b) => a - b);
  return [...c, n].map((x, i) => x - (i ? c[i - 1] : 0));
}

/** T5-style span corruption: round(T·rate) noise tokens in round(noise/mean) spans, between kept stretches that may be empty at either end. */
export function spanCorrupt(mean: number, seed: number) {
  const u = rand(seed), T = WORDS.length;
  const noise = Math.round(T * RATE), S = Math.max(1, Math.round(noise / mean));
  const nl = parts(noise, S, u), kl = parts(T - noise + 2, S + 1, u);
  kl[0] -= 1;
  kl[S] -= 1;
  const input: { w: string; s: boolean }[] = [], target: { w: string; s: boolean }[] = [];
  let pos = 0;
  for (let k = 0; k < S; k++) {
    for (let i = 0; i < kl[k]; i++) input.push({ w: WORDS[pos++], s: false });
    input.push({ w: `<X${k}>`, s: true });
    target.push({ w: `<X${k}>`, s: true });
    for (let i = 0; i < nl[k]; i++) target.push({ w: WORDS[pos++], s: false });
  }
  for (let i = 0; i < kl[S]; i++) input.push({ w: WORDS[pos++], s: false });
  target.push({ w: `<X${S}>`, s: true });
  return { input, target, noise, S };
}

function Row({ label, items }: { label: string; items: { w: string; s: boolean }[] }) {
  return (
    <div style={{ margin: "8px 0" }}>
      <div className="viz-label" style={{ marginBottom: 4 }}>{`${label} (${items.length} tokens)`}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {items.map((c, i) => (
          <span key={i} className="mono" style={{ fontSize: 13, borderRadius: 4, padding: "1px 5px", border: "1px solid var(--border)", ...(c.s ? { background: "var(--accent-soft)", borderColor: "var(--accent)" } : {}) }}>
            {c.w}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SpanCorruptViz() {
  const [mi, setMi] = useState(1);
  const [seed, setSeed] = useState(1);
  const r = useMemo(() => spanCorrupt(MEANS[mi], seed), [mi, seed]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">mean span length</span>
        {MEANS.map((m, i) => (
          <button key={m} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{m}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>resample</button>
      </div>
      <div aria-live="polite">
        <Row label="encoder input" items={r.input} />
        <Row label="decoder target" items={r.target} />
      </div>
      <div style={{ fontSize: 13, margin: "6px 0" }}>
        {`${WORDS.length} words, ${r.noise} dropped in ${r.S} span${r.S > 1 ? "s" : ""}: input ${WORDS.length} − ${r.noise} + ${r.S} = ${r.input.length}, target ${r.noise} + ${r.S} + 1 = ${r.target.length}`}
      </div>
      <figcaption className="viz-caption">
        Span corruption as in T5. About 15% of the words are dropped in contiguous spans; each span is replaced by one
        sentinel token in the encoder&apos;s input, and the decoder must write out the sentinels followed by the words they
        hid, ending with one extra sentinel. Longer spans mean fewer sentinels, so both sequences get shorter, and filling
        a long span asks the decoder to generate several words in a row rather than guess isolated ones.
      </figcaption>
    </figure>
  );
}
