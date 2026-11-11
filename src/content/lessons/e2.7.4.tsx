import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BeamViz } from "@/components/viz/BeamViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.7.4",
  minutes: 55,
  links: {
    requires: ["e2.7.3", "e2.5.3"],
    revisits: ["e2.7.2", "e2.6.1"],
    foreshadows: ["l5.5.1", "l5.5.2"],
  },

  puzzle: (
    <>
      <p>
        A translation model must choose a sentence of 20 words from a vocabulary of 50,000. There are 50,000²⁰ sentences, about
        10⁹⁴, more than the atoms in the universe, so dynamic programming over all prefixes is out. Picking the single most
        likely word each time is fast but can walk into a dead end: a likely first word may force an unlikely sentence. Is
        there something in between, and what does it cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep the k best partial answers instead of one. At each step extend every kept prefix by every possible next token,
        score all the extensions, and keep the k best. Width 1 is greedy; unlimited width is exhaustive search. A small beam
        often recovers what greedy misses, because a prefix that is second best now can survive long enough to show it leads
        somewhere better. Below, greedy commits to B because it is the likeliest first token, and misses AAA; width 2 finds it.
      </p>
      <BeamViz />
    </>
  ),

  theory: (
    <>
      <Definition title="beam search">
        <p>
          A sequence model gives <M>{"p(t \\mid \\text{prefix})"}</M>; a sequence&rsquo;s probability is the product of its
          steps, so its log probability is a sum. Beam search with width k:
        </p>
        <Code>{`import math

def beam_search(model, k, length):
    beams = [((), 0.0)]                       # (tokens, log probability)
    for _ in range(length):
        cand = [(seq + (t,), lp + math.log(p))
                for seq, lp in beams
                for t, p in model(seq).items()]
        cand.sort(key=lambda c: -c[1])
        beams = cand[:k]
    return beams`}</Code>
        <p>
          Work: each step scores at most kV extensions for vocabulary size V and selects the top k, which is a top-k selection
          (E2.5.3), not a full sort: O(kV) per step with quickselect or a size-k heap. Memory is O(k × length). Add log
          probabilities; multiplied probabilities underflow to 0 after a few hundred tokens.
        </p>
      </Definition>

      <Theorem title="what beam search does and does not guarantee">
        <p>
          With width at least V<sup>L − 1</sup> beam search finds the most probable sequence of length L. With smaller width
          it can miss it, and widening the beam can make the answer worse.
        </p>
      </Theorem>
      <Proof>
        <p>
          With width V<sup>L − 1</sup> nothing is pruned before the last step, since at most V<sup>L − 1</sup> prefixes of
          length L − 1 exist; at the last step every complete sequence is scored, and the best is kept. The visualisation
          already shows a miss at width 1. For the last claim, let the first token be A, B or C with probabilities 0.34, 0.33,
          0.33; after A let the next be A, B, C with 0.4, 0.3, 0.3, and after AA let A be certain; after B let A and B each
          have 0.5, and after BA or BB let all three tokens have 1/3. Width 1 follows A, A, A for 0.136. Width 2 keeps A and B,
          then BA and BB (0.165 each) push out AA (0.136), and every completion of those has probability 0.055. Which prefixes
          survive depends on the width, so a wider beam need not do better.
        </p>
      </Proof>

      <Example title="stopping and length">
        <p>
          Real sequences end with an end token, <C>&lt;/s&gt;</C>. A hypothesis that emits it is set aside as finished, and the
          search continues with the remaining unfinished ones. Every extra token multiplies the probability by a number below
          1, so comparing finished hypotheses by raw log probability favours short outputs. Dividing by{" "}
          <M>{"\\text{length}^{\\alpha}"}</M> with <M>{"\\alpha"}</M> between 0.6 and 1 is the usual correction; neural
          translation systems tune it.
        </p>
      </Example>

      <Example title="beyond text">
        <p>
          Beam search works for any problem built step by step with a score that adds up: travelling-salesman tours extended
          city by city, keeping the k cheapest partial tours (width 1 is the nearest-neighbour heuristic); parsing; planning;
          and speech recognition, where it searches over an acoustic model and a language model together. It is a pruned
          breadth-first search: breadth-first because all partial answers advance one step at a time, pruned because only k
          survive.
        </p>
      </Example>

      <Remark title="when not to use it">
        <p>
          For open-ended generation, the most probable text is often dull and repetitive, so chat models sample instead, with
          temperature, top-k or top-p (nucleus) filtering, all built on the selection of E2.5.3. Beam search is still standard
          where there is one right answer, such as translation, speech recognition and constrained decoding. Its
          &ldquo;probability-maximising&rdquo; answers can be worse than smaller beams&rsquo; for real-world quality, a known
          effect called the beam search curse.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "width1",
      rung: "check",
      prompt: <p>Beam search with width 1 is the same as which method?</p>,
      answer: { kind: "choice", options: ["Greedy decoding", "Exhaustive search", "Breadth-first search with no pruning", "Random sampling"], correct: [0] },
    },
    {
      key: "scored",
      rung: "apply",
      prompt: <p>Beam width 5, vocabulary 1,000, length 20. After the first step (which scores 1,000), each step extends all 5 kept prefixes by every token. How many extensions are scored in total?</p>,
      answer: { kind: "numeric", value: 96000 },
    },
    {
      key: "logs",
      rung: "apply",
      prompt: <p>Why does beam search add log probabilities rather than multiply probabilities?</p>,
      answer: {
        kind: "choice",
        options: ["Products of many probabilities below 1 underflow to 0 in floating point", "Logarithms make the search exhaustive", "Multiplication is slower than a heap", "Log probabilities are always positive"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

probs = {"": {"I": 0.5, "We": 0.4, "You": 0.1},
         "I": {"am": 0.4, "was": 0.35, "think": 0.25},
         "We": {"are": 0.9, "were": 0.1},
         "You": {"are": 1.0}}

def beam(k):
    beams, scored = [("", 0.0)], 0
    for _ in range(2):
        cand = []
        for prefix, lp in beams:
            last = prefix.split()[-1] if prefix else ""
            for word, p in probs[last].items():
                cand.append(((prefix + " " + word).strip(), lp + math.log(p)))
                scored += 1
        beams = sorted(cand, key=lambda c: -c[1])[:k]
    best, lp = beams[0]
    return best, round(math.exp(lp), 2), scored

print(beam(1), beam(2))`}</Code>
          <p>A two-word beam search, counting the extensions it scores. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["('I am', 0.2, 6) ('We are', 0.36, 8)", "('I am', 0.2, 6) ('I am', 0.2, 8)", "('I am', 0.2, 6) ('We are', 0.36, 9)", "('I am', 0.5, 6) ('We are', 0.9, 8)"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

hyps = {"Yes.": [0.5, 0.3],
        "Yes, it is.": [0.5, 0.6, 0.7, 0.8, 0.7],
        "No.": [0.2, 0.9]}

def pick(alpha):
    def score(h):
        lp = sum(math.log(p) for p in hyps[h])
        return lp / len(hyps[h]) ** alpha
    return max(hyps, key=score)

print(pick(0), "|", pick(1), "|", pick(0.5))`}</Code>
          <p>Choosing among finished hypotheses with length normalisation. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["No. | Yes, it is. | Yes, it is.", "Yes. | Yes, it is. | Yes, it is.", "No. | No. | Yes, it is.", "No. | Yes, it is. | No."],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A model is a function from a tuple of tokens to a dict of next-token probabilities. Write{" "}
            <C>beam_search(model, k, length)</C>, returning the k best <C>(tokens, log_prob)</C> pairs of the given length,
            best first, ties broken by the smaller token tuple, calling the model only on kept prefixes; it must cope with
            1,200 steps. Then write <C>exhaustive(model, length)</C>, the single best pair by depth-first search, pruning any
            prefix already worse than the best complete sequence found (log probabilities only fall as a sequence grows), with
            the same tie rule.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def beam_search(model, k, length):
    seq, p = (), 1.0
    for _ in range(length):
        tok, q = max(model(seq).items(), key=lambda kv: kv[1])
        seq, p = seq + (tok,), p * q
    return [(seq, math.log(p) if p > 0 else -math.inf)]

def exhaustive(model, length):
    return beam_search(model, 1, length)[0]
`,
        solution: `import math

def beam_search(model, k, length):
    beams = [((), 0.0)]
    for _ in range(length):
        cand = []
        for seq, lp in beams:
            for tok, p in model(seq).items():
                if p > 0:
                    cand.append((seq + (tok,), lp + math.log(p)))
        cand.sort(key=lambda c: (-c[1], c[0]))
        beams = cand[:k]
    return beams

def exhaustive(model, length):
    best = (None, -math.inf)
    stack = [((), 0.0)]
    while stack:
        seq, lp = stack.pop()
        if lp < best[1]:
            continue                         # log probabilities only fall: prune
        if len(seq) == length:
            if lp > best[1] or (lp == best[1] and seq < best[0]):
                best = (seq, lp)
            continue
        for tok, p in model(seq).items():
            if p > 0:
                stack.append((seq + (tok,), lp + math.log(p)))
    return best
`,
        tests: [
          { name: "beam search", code: `import math, random, itertools
START, NEXT = {'A': 0.4, 'B': 0.5, 'C': 0.1}, {'A': {'A': 0.6, 'B': 0.3, 'C': 0.1}, 'B': {'A': 0.4, 'B': 0.5, 'C': 0.1}, 'C': {'A': 0.7, 'B': 0.2, 'C': 0.1}}
model = lambda seq: NEXT[seq[-1]] if seq else START
g = beam_search(model, 1, 3)
assert len(g) == 1 and g[0][0] == ('B', 'B', 'B') and math.isclose(g[0][1], math.log(0.125)), g
b = beam_search(model, 2, 3)
assert [s for s, _ in b] == [('A', 'A', 'A'), ('B', 'B', 'B')] and math.isclose(b[0][1], math.log(0.144)), b
assert beam_search(model, 5, 0) == [((), 0.0)]
calls = []
def counted(seq):
    calls.append(seq)
    return model(seq)
beam_search(counted, 3, 6)
assert len(calls) <= 1 + 3 * 5, f'{len(calls)} model calls: expand only the k kept prefixes.'
rng = random.Random(35)
for _ in range(100):
    V = rng.randint(2, 4)
    table = {}
    def m(seq):
        if seq not in table:
            w = [rng.random() + 0.01 for _ in range(V)]
            table[seq] = {chr(97 + i): x / sum(w) for i, x in enumerate(w)}
        return table[seq]
    L = rng.randint(1, 4)
    every = sorted(((sum(math.log(m(s[:i])[s[i]]) for i in range(L)), s) for s in itertools.product([chr(97 + i) for i in range(V)], repeat=L)), key=lambda x: (-x[0], x[1]))
    full = beam_search(m, V ** L, L)
    assert [s for s, _ in full] == [s for _, s in every], 'With k as large as all sequences, beam search is exhaustive.'` },
          { name: "exhaustive", code: `import math, random, itertools
START, NEXT = {'A': 0.4, 'B': 0.5, 'C': 0.1}, {'A': {'A': 0.6, 'B': 0.3, 'C': 0.1}, 'B': {'A': 0.4, 'B': 0.5, 'C': 0.1}, 'C': {'A': 0.7, 'B': 0.2, 'C': 0.1}}
model = lambda seq: NEXT[seq[-1]] if seq else START
s, lp = exhaustive(model, 3)
assert s == ('A', 'A', 'A') and math.isclose(lp, math.log(0.144))
half = lambda seq: {'x': 0.5, 'y': 0.5} if len(seq) % 2 else {'x': 0.6, 'y': 0.4}
s, lp = exhaustive(half, 6)
assert s == ('x', 'x', 'x', 'x', 'x', 'x') and math.isclose(lp, 3 * math.log(0.6) + 3 * math.log(0.5))
rng = random.Random(36)
for _ in range(100):
    table = {}
    def m(seq):
        if seq not in table:
            w = [rng.random() + 0.01 for _ in range(3)]
            table[seq] = {t: x / sum(w) for t, x in zip('abc', w)}
        return table[seq]
    L = rng.randint(1, 5)
    best = max(itertools.product('abc', repeat=L), key=lambda s: sum(math.log(m(s[:i])[s[i]]) for i in range(L)))
    assert exhaustive(m, L)[0] == best
long = lambda seq: {'u': 0.5, 'v': 0.3, 'w': 0.2}
seq, lp = beam_search(long, 2, 1200)[0]
assert seq == ('u',) * 1200 and math.isclose(lp, 1200 * math.log(0.5)), 'Add log probabilities: 0.5 ** 1200 underflows to 0.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two practical beams:</p>
          <ul>
            <li>
              <C>beam_with_eos(model, k, max_len, alpha=0.0)</C>: each step, sort the extensions of the live prefixes (best
              first, ties by tokens) and walk down the list, setting aside any ending in <C>&apos;&lt;/s&gt;&apos;</C> as
              finished, until k unfinished ones are kept. Stop after max_len steps or when none are live. Return the finished
              pair with the highest log_prob / len(tokens) ** alpha (ties by tokens), or the best unfinished one if none
              finished, with its raw log probability.
            </li>
            <li>
              <C>beam_tsp(dist, k)</C>: tours start and end at city 0. Extend partial tours by each unvisited city, keep the k
              cheapest (ties by the tour tuple), and at the end close each tour back to 0. Return <C>(cost, tour)</C> with tour
              like <C>[0, 2, 3, 1, 0]</C>.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def beam_with_eos(model, k, max_len, alpha=0.0):
    seq = ()
    for _ in range(max_len):
        tok = max(model(seq).items(), key=lambda kv: kv[1])[0]
        seq += (tok,)
        if tok == '</s>':
            break
    return seq, 0.0

def beam_tsp(dist, k):
    n = len(dist)
    tour = list(range(n)) + [0]
    return sum(dist[a][b] for a, b in zip(tour, tour[1:])), tour
`,
        solution: `import math

def beam_with_eos(model, k, max_len, alpha=0.0):
    def score(c):
        return c[1] / len(c[0]) ** alpha
    live, done = [((), 0.0)], []
    for _ in range(max_len):
        cand = []
        for seq, lp in live:
            for tok, p in model(seq).items():
                if p > 0:
                    cand.append((seq + (tok,), lp + math.log(p)))
        cand.sort(key=lambda c: (-c[1], c[0]))
        live = []
        for c in cand:
            if len(live) == k:
                break
            if c[0][-1] == '</s>':
                done.append(c)
            else:
                live.append(c)
        if not live:
            break
    pool = done or live
    return min(pool, key=lambda c: (-score(c), c[0]))

def beam_tsp(dist, k):
    n = len(dist)
    if n == 1:
        return 0, [0, 0]
    beams = [(0, (0,))]
    for _ in range(n - 1):
        cand = [(cost + dist[t[-1]][c], t + (c,)) for cost, t in beams for c in range(n) if c not in t]
        cand.sort()
        beams = cand[:k]
    cost, tour = min((cost + dist[t[-1]][0], t) for cost, t in beams)
    return cost, list(tour) + [0]
`,
        tests: [
          { name: "end tokens", code: `import math
def m(seq):
    if not seq:
        return {'yes': 0.6, 'well': 0.4}
    if seq == ('yes',):
        return {'</s>': 0.5, 'and': 0.5}
    if seq[-1] == 'and':
        return {'no': 0.5, '</s>': 0.5}
    if seq[0] == 'well':
        return {'</s>': 0.1, 'it': 0.9} if len(seq) < 5 else {'</s>': 1.0}
    return {'</s>': 1.0}
s, lp = beam_with_eos(m, 3, 10)
assert s == ('yes', '</s>') and math.isclose(lp, math.log(0.3)), (s, lp)
s, lp = beam_with_eos(m, 3, 10, alpha=1.0)
assert s == ('well', 'it', 'it', 'it', 'it', '</s>'), f'With length normalisation the long answer wins, not {s}.'
assert math.isclose(lp, math.log(0.4 * 0.9 ** 4)), 'Return the raw log probability, not the normalised score.'
s, lp = beam_with_eos(m, 1, 10)
assert s == ('yes', '</s>'), s
s, lp = beam_with_eos(lambda seq: {'a': 0.7, 'b': 0.3}, 2, 4)
assert s == ('a', 'a', 'a', 'a'), 'If nothing finishes, return the best unfinished sequence.'
expanded = []
def watch(seq):
    assert not seq or seq[-1] != '</s>', 'Never extend a finished sequence.'
    expanded.append(seq)
    return m(seq)
beam_with_eos(watch, 2, 10, alpha=1.0)
assert len(expanded) <= 1 + 2 * 9` },
          { name: "tours", code: `import itertools, random, math
D = [[0, 2, 9, 10], [1, 0, 6, 4], [15, 7, 0, 8], [6, 3, 12, 0]]
cost, tour = beam_tsp(D, 1)
assert tour == [0, 1, 3, 2, 0] and cost == 2 + 4 + 12 + 15 == 33, (cost, tour)
cost, tour = beam_tsp(D, 6)
assert cost == 21 and tour == [0, 2, 3, 1, 0], (cost, tour)
assert beam_tsp([[0]], 3) == (0, [0, 0])
rng = random.Random(37)
for _ in range(60):
    n = rng.randint(2, 7)
    pts = [(rng.random(), rng.random()) for _ in range(n)]
    D = [[math.dist(p, q) for q in pts] for p in pts]
    best = min(sum(D[a][b] for a, b in zip((0,) + p, p + (0,))) for p in itertools.permutations(range(1, n)))
    cost, tour = beam_tsp(D, math.factorial(n))
    assert math.isclose(cost, best), 'With a beam as wide as all tours, beam search is exact.'
    assert tour[0] == tour[-1] == 0 and sorted(tour[:-1]) == list(range(n))
    assert math.isclose(cost, sum(D[a][b] for a, b in zip(tour, tour[1:])))
    c1, t1 = beam_tsp(D, 1)
    here, seen, nn = 0, {0}, [0]
    for _ in range(n - 1):
        here = min((c for c in range(n) if c not in seen), key=lambda c: (D[here][c], c))
        seen.add(here); nn.append(here)
    assert t1 == nn + [0], 'Width 1 is the nearest-neighbour tour.'` },
        ],
      },
    },
    {
      key: "exact",
      rung: "prove",
      prompt: <p>Prove that if the model&rsquo;s next-token distribution does not depend on the prefix at all, beam search of any width k ≥ 1 returns the most probable sequence.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes the sequence probability is then a product of independent per-position factors p(t₁)p(t₂)…",
          "The best sequence takes the most probable token at every position.",
          "Shows by induction that the best prefix of each length is always the top beam: extending it by the top token beats every other extension.",
          "Concludes that width 1, and so any width, returns the best sequence (with ties handled consistently).",
        ],
      },
    },
    {
      key: "viterbi",
      rung: "stretch",
      prompt: <p>Suppose the next-token distribution depends only on the last token, as in a bigram model. Give an O(L V²) dynamic programme that finds the most probable sequence of length L exactly, explain why keeping one prefix per last token loses nothing, and compare its cost with beam search.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines best[i][t] as the highest log probability of a length-i prefix ending in token t, with a back pointer.",
          "Recurrence best[i][t] = max over s of best[i − 1][s] + log p(t | s), with best[1][t] = log p(t).",
          "Argues that two prefixes ending in the same token have identical futures, so only the better one can lead to the optimum.",
          "Gives O(L V²) time against beam search's O(L k V), noting the DP is exact while the beam is not; this is the Viterbi algorithm.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how beam search sits between picking the likeliest word each time and trying every possible sentence, and why it adds logarithms.",

  glimpse: (
    <p>
      Chapter 7 is done. The last chapter turns to strings: finding a pattern in text in linear time, searching a whole genome
      with a sorted list of suffixes, and measuring how far apart two strings are, a dynamic programme you can now write.
    </p>
  ),
};
