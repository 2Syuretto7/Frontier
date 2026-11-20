import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FunnelViz } from "@/components/viz/FunnelViz";
import type { LessonContent } from "@/lib/types";

const CARD = `def funnel(stages):
    out, prev = [], None
    for name, tokens in stages:
        out.append((name, tokens, 1.0 if prev is None else tokens / prev))   # share kept by this stage
        prev = tokens
    return out

def source_shares(tokens):
    total = sum(tokens.values())
    return {k: v / total for k, v in sorted(tokens.items(), key=lambda kv: -kv[1])}

def missing_fields(card, required):
    return [f for f in required if not card.get(f)]   # absent or empty`;

const SUMMARY = `def retention(kept_fracs):
    r = 1.0
    for f in kept_fracs:
        r *= f
    return r

def effective_sources(shares):
    return 1 / sum(p * p for p in shares.values())   # inverse Simpson index

def under_represented(shares, floor):
    return sorted(k for k, p in shares.items() if p < floor)`;

export const lesson: LessonContent = {
  id: "e11.8.4",
  minutes: 45,
  links: {
    requires: ["e11.8.3", "e11.1.4"],
    revisits: ["e11.2.3", "e11.3.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A year after release, users find that a model is weak in Tamil and oddly good at one benchmark, and a rights holder asks
        whether its books were used. The original team has moved on. Which sources were crawled, under what licences, what each filter
        removed, how the mixture was set, and what was decontaminated must now be reconstructed from scattered scripts, if it can be at
        all. What should have been written down, and when?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A data card, also called a datasheet for a dataset, is a short structured document published with a corpus or a model that
        records where the data came from, how it was processed and what it is fit for. It is easiest to write as the pipeline runs: each
        stage logs how many documents and tokens it received and kept, per source and per language, and the card is generated from
        these logs. The numbers show readers what the corpus covers and where it is thin, often more clearly than prose.
      </p>
      <FunnelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="assembling a card">
        <p>
          <C>funnel</C> takes stage names with the tokens remaining after each and adds the share kept relative to the previous stage,
          with 1.0 for the first. <C>source_shares</C> converts tokens per source into shares, largest first. <C>missing_fields</C> lists
          the required fields that are absent or empty, so an incomplete card fails a release check.
        </p>
        <Code>{CARD}</Code>
      </Definition>

      <Theorem title="retention multiplies">
        <p>
          If stage i keeps a fraction <M>{"f_i"}</M> of what it receives, the fraction of raw tokens that survives k stages is{" "}
          <M>{"\\prod_{i=1}^k f_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"T_i"}</M> be the tokens after stage i, so <M>{"T_i = f_i T_{i-1}"}</M>. Then{" "}
          <M>{"T_k / T_0 = \\prod_{i=1}^k T_i / T_{i-1} = \\prod_{i=1}^k f_i"}</M>, a telescoping product. A card that reports only
          the final size hides which stage removed what; reporting each <M>{"f_i"}</M>, per language and source, shows for instance that
          a quality classifier (e11.3.2) removed most of a language that language identification (e11.2.3) had kept.
        </p>
      </Proof>

      <Definition title="summarising a mixture">
        <p>
          <C>retention</C> multiplies keep fractions. <C>effective_sources</C> is <M>{"1/\\sum_i p_i^2"}</M>, the number of equally sized
          sources that would be as concentrated as the given shares. <C>under_represented</C> lists, sorted, the sources or languages
          below a share floor.
        </p>
        <Code>{SUMMARY}</Code>
      </Definition>

      <Theorem title="range of the effective number">
        <p>
          For N shares <M>{"p_i \\ge 0"}</M> summing to 1, <M>{"1 \\le 1/\\sum_i p_i^2 \\le N"}</M>, with the upper bound attained
          exactly when all shares equal 1/N.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"0 \\le p_i \\le 1"}</M>, <M>{"p_i^2 \\le p_i"}</M>, so <M>{"\\sum_i p_i^2 \\le 1"}</M>. By Cauchy–Schwarz,{" "}
          <M>{"1 = (\\sum_i p_i \\cdot 1)^2 \\le N \\sum_i p_i^2"}</M>, so <M>{"\\sum_i p_i^2 \\ge 1/N"}</M>, with equality exactly when
          the <M>{"p_i"}</M> are all equal. Taking reciprocals gives the bounds. A corpus with fifty sources but an effective number of
          two is, in practice, two sources.
        </p>
      </Proof>

      <Remark title="data cards in practice">
        <p>
          Datasheets for datasets proposed questions on motivation, composition, collection, preprocessing, uses, distribution and
          maintenance; data cards and dataset nutrition labels are related formats. Open pre-training corpora publish their sources,
          licences, filter thresholds, deduplication settings and decontamination lists, often with the code. Model reports summarise
          the training mixture, data cut-off date, languages, use of synthetic data (e11.1.4) and opt-out handling. Cards are versioned
          with the data, and generated from pipeline logs so they stay true when the pipeline changes.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A card generated from the pipeline would have shown the Tamil share falling below the floor after the quality classifier, the
          benchmark among the decontamination lists or not, and the book sources with their licences and opt-out status. With it, each
          question is a lookup rather than an investigation, and the gaps it records are the starting point for the next version of the
          corpus.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "retained",
      rung: "check",
      prompt: (
        <p>
          A pipeline starts from 10T raw tokens; its stages keep 50%, 80% and 70% of what each receives. How many trillion tokens
          remain?
        </p>
      ),
      answer: { kind: "numeric", value: 2.8, tolerance: 0.001 },
    },
    {
      key: "effective",
      rung: "check",
      prompt: <p>Three sources have shares 0.5, 0.25 and 0.25. What is the effective number of sources? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.67, tolerance: 0.01 },
    },
    {
      key: "contents",
      rung: "apply",
      prompt: <p>Which set of information belongs in a data card for a pre-training corpus?</p>,
      answer: {
        kind: "choice",
        options: [
          "Sources and licences, each processing stage with what it removed, the mixture, decontamination, and known gaps",
          "Only the total number of tokens",
          "The model's benchmark scores",
          "The hardware used to tokenise the corpus",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def funnel(stages):
    out, prev = [], None
    for name, tokens in stages:
        out.append((name, tokens, 1.0 if prev is None else tokens / prev))   # share kept by this stage
        prev = tokens
    return out

def source_shares(tokens):
    total = sum(tokens.values())
    return {k: v / total for k, v in sorted(tokens.items(), key=lambda kv: -kv[1])}

def missing_fields(card, required):
    return [f for f in required if not card.get(f)]   # absent or empty

f = funnel([("raw", 1000), ("lang", 600), ("dedup", 300)])
print(f[2], source_shares({"web": 30, "code": 10, "books": 10}), missing_fields({"name": "C1", "license": "", "sources": ["web"]}, ["name", "license", "contact"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('dedup', 300, 0.5) {'web': 0.6, 'code': 0.2, 'books': 0.2} ['license', 'contact']",
          "('dedup', 300, 0.3) {'web': 0.6, 'code': 0.2, 'books': 0.2} ['license', 'contact']",
          "('dedup', 300, 0.5) {'web': 0.6, 'code': 0.2, 'books': 0.2} ['contact']",
          "('dedup', 300, 0.5) {'books': 0.2, 'code': 0.2, 'web': 0.6} ['license', 'contact']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def retention(kept_fracs):
    r = 1.0
    for f in kept_fracs:
        r *= f
    return r

def effective_sources(shares):
    return 1 / sum(p * p for p in shares.values())   # inverse Simpson index

def under_represented(shares, floor):
    return sorted(k for k, p in shares.items() if p < floor)

s = {"en": 0.7, "hi": 0.2, "ta": 0.1}
print(round(retention([0.6, 0.5, 0.9]), 2), round(effective_sources(s), 2), under_represented(s, 0.15))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.27 1.85 ['ta']", "0.27 3.0 ['ta']", "2.0 1.85 ['ta']", "0.27 1.85 ['hi', 'ta']"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>funnel(stages)</C>, returning <C>(name, tokens, kept)</C> triples; <C>source_shares(tokens)</C>, ordered by
          decreasing share with ties in their original order; and <C>missing_fields(card, required)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def funnel(stages):
    return [(name, tokens, 1.0) for name, tokens in stages]

def source_shares(tokens):
    return dict(tokens)

def missing_fields(card, required):
    return [f for f in required if f not in card]
`,
        solution: CARD,
        tests: [
          { name: "funnel", code: `assert funnel([("a", 80), ("b", 20), ("c", 5)]) == [("a", 80, 1.0), ("b", 20, 0.25), ("c", 5, 0.25)] and funnel([]) == []` },
          { name: "shares", code: `s = source_shares({"x": 1, "y": 3, "z": 1})\nassert list(s) == ["y", "x", "z"] and s == {"y": 0.6, "x": 0.2, "z": 0.2}\nassert missing_fields({"a": [], "b": 0, "c": "ok"}, ["a", "b", "c", "d"]) == ["a", "b", "d"]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>retention(kept_fracs)</C>, <C>effective_sources(shares)</C> and <C>under_represented(shares, floor)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def retention(kept_fracs):
    return min(kept_fracs)

def effective_sources(shares):
    return float(len(shares))

def under_represented(shares, floor):
    return []
`,
        solution: SUMMARY,
        tests: [
          { name: "retention", code: `assert abs(retention([0.5, 0.4]) - 0.2) < 1e-12 and retention([]) == 1.0\nassert abs(effective_sources({"a": 0.25, "b": 0.25, "c": 0.25, "d": 0.25}) - 4) < 1e-12 and abs(effective_sources({"a": 0.8, "b": 0.2}) - 1 / 0.68) < 1e-12` },
          { name: "floor", code: `assert under_represented({"z": 0.05, "a": 0.01, "m": 0.94}, 0.1) == ["a", "z"] and under_represented({"a": 1.0}, 0.5) == []` },
        ],
      },
    },
    {
      key: "concentrated",
      rung: "stretch",
      prompt: (
        <p>
          Five sources: the largest has share 0.6 and the other four share the rest equally. What is the effective number of sources?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the data side of foundation models: from crawls and documents through filtering, deduplication, tokenisation,
        mixtures and synthetic data to sharding, loading and documentation. The corpus is ready, and the remaining courses turn to what
        is built on it.
      </p>
    </>
  ),
};
