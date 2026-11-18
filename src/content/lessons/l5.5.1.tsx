import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DecodeStrategyViz } from "@/components/viz/DecodeStrategyViz";
import type { LessonContent } from "@/lib/types";

const SEARCH = `import numpy as np

def greedy(next_logprobs, prompt, eos, max_new):
    toks, total = [], 0.0
    while len(toks) < max_new and eos not in toks:
        lp = next_logprobs(list(prompt) + toks)
        toks.append(int(np.argmax(lp)))
        total += float(lp[toks[-1]])
    return toks, total

def beam_search(next_logprobs, prompt, eos, max_new, k, alpha=0.0):
    beams, done = [([], 0.0)], []
    while beams and len(beams[0][0]) < max_new:
        cand = []
        for toks, s in beams:
            lp = next_logprobs(list(prompt) + toks)
            cand += [(toks + [t], s + float(lp[t])) for t in range(len(lp))]
        cand.sort(key=lambda c: -c[1])
        beams = []
        for toks, s in cand[:k]:
            (done if toks[-1] == eos else beams).append((toks, s))
    return max(done + beams, key=lambda c: c[1] / len(c[0]) ** alpha)

def best_sequence(next_logprobs, prompt, eos, max_new):
    best = ([], -np.inf)
    def go(toks, s):
        nonlocal best
        if s <= best[1]:
            return
        if (toks and toks[-1] == eos) or len(toks) == max_new:
            best = (toks, s)
            return
        lp = next_logprobs(list(prompt) + toks)
        for t in range(len(lp)):
            go(toks + [t], s + float(lp[t]))
    go([], 0.0)
    return best`;

const RANK = `def gnmt_penalty(length, alpha):
    return ((5 + length) / 6) ** alpha

def rerank(hyps, alpha):
    return max(hyps, key=lambda h: h[1] / gnmt_penalty(len(h[0]), alpha))

def repeat_rate(tokens, n):
    seen, rep = set(), 0
    grams = [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]
    for g in grams:
        rep += g in seen
        seen.add(g)
    return rep / max(len(grams), 1)`;

export const lesson: LessonContent = {
  id: "l5.5.1",
  minutes: 45,
  links: {
    requires: ["l5.4.4"],
    revisits: ["e2.7.4", "l5.3.4"],
    foreshadows: ["l5.5.2"],
  },

  puzzle: (
    <>
      <p>
        If a language model is a good model of text, its single most probable continuation ought to be a good continuation.
        In practice, searching harder for that most probable output often makes things worse: greedy decoding gets stuck
        repeating a phrase, and exact search in translation models has been found to return the empty translation
        astonishingly often. How can the most likely answer be so bad?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sequence&apos;s probability is a product of next-token probabilities, every one below 1, so each extra token can
        only lower it. Short outputs therefore have a built-in advantage, and the very shortest, ending at once, can be the
        most probable of all. Greedy decoding has the opposite problem: it looks one step ahead, and a pattern whose next
        token is always the likeliest, such as a repeated phrase, can trap it for ever. Beam search sits between the two,
        and the usual patch for its short-output bias, dividing by length, can reward the repetition instead.
      </p>
      <DecodeStrategyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="greedy decoding, beam search and the mode">
        <p>
          With a model giving <M>{"\\log p(y_t \\mid x, y_{<t})"}</M> and an end token ⟨eos⟩, <em>greedy</em> decoding takes
          the most probable token at each step. <em>Beam search</em> of width k keeps the k highest-scoring partial outputs,
          extends each by every token, and keeps the best k again; hypotheses that end leave the beam. The <em>mode</em> is
          the most probable complete output, which the third function finds exactly on small problems.
        </p>
        <Code>{SEARCH}</Code>
      </Definition>

      <Theorem title="scores only fall">
        <p>
          The log-probability of any extension of a partial output is at most that of the partial output. So once a complete
          output with score s is known, every partial output with score at most s can be discarded without losing the mode.
        </p>
      </Theorem>
      <Proof>
        <p>
          Extending adds terms <M>{"\\log p(y_t \\mid \\cdot) \\le 0"}</M>. A partial output with score at most s can only
          lead to complete outputs with score at most s, none better than the one already found. This is the pruning test at
          the top of <C>best_sequence</C>, and it also lets beam search stop as soon as its best finished score beats every
          live hypothesis.
        </p>
      </Proof>

      <Theorem title="when the empty output is the mode">
        <p>
          If ⟨eos⟩ has probability at least q as the first token, and every other token has probability at most q at every
          step, then the mode is the output that ends immediately.
        </p>
      </Theorem>
      <Proof>
        <p>
          Any other complete output contains at least one token other than ⟨eos⟩, whose probability is at most q, and all
          its other factors are at most 1, so its probability is at most q. The condition is sufficient, not necessary: in
          the picture the empty output is the mode even when continuing is likelier than ending at every step, because a
          continuation has to pay many factors.
        </p>
      </Proof>

      <Theorem title="length normalisation rewards loops">
        <p>
          Suppose some cycle of tokens can be repeated with average log-probability c per token. Then outputs that follow it
          n times have per-token score tending to c, so if every output that ends has per-token score below c, a search that
          ranks by score divided by length prefers ever longer repetitions, up to the length limit.
        </p>
      </Theorem>
      <Proof>
        <p>
          Repeating the cycle n times and then ending adds a fixed cost <M>{"\\ell"}</M> for ending to <M>{"cnm"}</M>, where m is
          the cycle length, so the average is <M>{"(cnm + \\ell)/(nm + 1) \\to c"}</M>. Any fixed finished output has a fixed
          average below c and is eventually beaten. Practical penalties such as GNMT&apos;s{" "}
          <M>{"((5 + |y|)/6)^\\alpha"}</M> with α between 0.6 and 1 soften the division, and repetition checks catch the rest.
        </p>
        <Code>{RANK}</Code>
      </Proof>

      <Remark title="where search is used">
        <p>
          Beam search works well where the output is nearly determined by the input, such as translation and speech
          recognition, with widths of 4 to 10. For open-ended text the most probable continuations are bland and repetitive
          even when they are not degenerate, so chat models sample instead, which is the next lesson. Greedy decoding stays
          useful for deterministic evaluation. A beam of width k needs k KV caches, though the shared prompt can be stored
          once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gnmt",
      rung: "check",
      prompt: <p>What is the GNMT length penalty ((5 + |y|)/6)^α for an output of 10 tokens with α = 0.6? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.7329, tolerance: 0.00006 },
    },
    {
      key: "loop",
      rung: "check",
      prompt: <p>In the picture with ⟨eos⟩ probability 0.45, each loop token has probability 0.495. What is the log-probability of greedy&apos;s 12-token output? Give four decimals.</p>,
      answer: { kind: "numeric", value: -8.4384, tolerance: 0.00006 },
    },
    {
      key: "short",
      rung: "apply",
      prompt: <p>Why does beam search scored by total log-probability tend to prefer short outputs?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every additional token adds a log-probability of at most zero, so longer outputs can only score lower than their prefixes",
          "The beam is too narrow to hold long outputs",
          "The model assigns ⟨eos⟩ the highest probability at every step",
          "The KV cache limits the output length",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def greedy(next_logprobs, prompt, eos, max_new):
    toks, total = [], 0.0
    while len(toks) < max_new and eos not in toks:
        lp = next_logprobs(list(prompt) + toks)
        toks.append(int(np.argmax(lp)))
        total += float(lp[toks[-1]])
    return toks, total

def beam_search(next_logprobs, prompt, eos, max_new, k, alpha=0.0):
    beams, done = [([], 0.0)], []
    while beams and len(beams[0][0]) < max_new:
        cand = []
        for toks, s in beams:
            lp = next_logprobs(list(prompt) + toks)
            cand += [(toks + [t], s + float(lp[t])) for t in range(len(lp))]
        cand.sort(key=lambda c: -c[1])
        beams = []
        for toks, s in cand[:k]:
            (done if toks[-1] == eos else beams).append((toks, s))
    return max(done + beams, key=lambda c: c[1] / len(c[0]) ** alpha)

def best_sequence(next_logprobs, prompt, eos, max_new):
    best = ([], -np.inf)
    def go(toks, s):
        nonlocal best
        if s <= best[1]:
            return
        if (toks and toks[-1] == eos) or len(toks) == max_new:
            best = (toks, s)
            return
        lp = next_logprobs(list(prompt) + toks)
        for t in range(len(lp)):
            go(toks + [t], s + float(lp[t]))
    go([], 0.0)
    return best

P = np.log(np.array([[0.05, 0.5, 0.45], [0.5, 0.05, 0.45], [1 / 3, 1 / 3, 1 / 3]])); lp = lambda s: P[s[-1]]
print(greedy(lp, [0], 2, 6)[0], best_sequence(lp, [0], 2, 6)[0])
print(beam_search(lp, [0], 2, 6, 2)[0], beam_search(lp, [0], 2, 6, 2, alpha=1.0)[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 1, 0, 1, 0] [2]\n[2] [1, 0, 1, 0, 1, 0]",
          "[1, 0, 1, 0, 1, 0] [2]\n[2] [2]",
          "[2] [2]\n[2] [1, 0, 1, 0, 1, 0]",
          "[1, 0, 1, 0, 1, 0] [1, 0, 2]\n[2] [1, 0, 1, 0, 1, 0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gnmt_penalty(length, alpha):
    return ((5 + length) / 6) ** alpha

def rerank(hyps, alpha):
    return max(hyps, key=lambda h: h[1] / gnmt_penalty(len(h[0]), alpha))

def repeat_rate(tokens, n):
    seen, rep = set(), 0
    grams = [tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]
    for g in grams:
        rep += g in seen
        seen.add(g)
    return rep / max(len(grams), 1)

print(round(gnmt_penalty(1, 1.0), 4), round(gnmt_penalty(7, 0.6), 4))
hyps = [([2], -1.0), ([1, 0, 2], -1.5)]; print(rerank(hyps, 0.0)[0], rerank(hyps, 2.0)[0], repeat_rate([1, 0, 1, 0, 1, 0], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.5157\n[2] [1, 0, 2] 0.6",
          "1.0 1.5157\n[2] [2] 0.6",
          "1.0 1.5157\n[2] [1, 0, 2] 0.5",
          "0.0 1.5157\n[1, 0, 2] [1, 0, 2] 0.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>greedy(next_logprobs, prompt, eos, max_new)</C>, returning the new tokens and their total log-probability;{" "}
          <C>beam_search(next_logprobs, prompt, eos, max_new, k, alpha=0.0)</C>, returning the best (tokens, score) among
          finished and surviving hypotheses by score divided by length to the power alpha; and{" "}
          <C>best_sequence(next_logprobs, prompt, eos, max_new)</C>, the exact mode by depth-first search with pruning, where
          an output is complete when it ends with eos or reaches max_new tokens.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def greedy(next_logprobs, prompt, eos, max_new):
    return [], 0.0

def beam_search(next_logprobs, prompt, eos, max_new, k, alpha=0.0):
    return [], 0.0

def best_sequence(next_logprobs, prompt, eos, max_new):
    return [], 0.0
`,
        solution: SEARCH,
        tests: [
          { name: "toy", code: `P = np.log(np.array([[0.05, 0.5, 0.45], [0.5, 0.05, 0.45], [1 / 3] * 3])); lp = lambda s: P[s[-1]]
g, s = greedy(lp, [0], 2, 6); assert g == [1, 0, 1, 0, 1, 0] and abs(s - 6 * np.log(0.5)) < 1e-12
assert best_sequence(lp, [0], 2, 6)[0] == [2] and beam_search(lp, [0], 2, 6, 2)[0] == [2] and beam_search(lp, [0], 2, 6, 2, alpha=1.0)[0] == [1, 0, 1, 0, 1, 0]
Q = np.log(np.array([[0.1, 0.6, 0.3], [0.1, 0.1, 0.8], [1 / 3] * 3])); lq = lambda s: Q[s[-1]]; assert greedy(lq, [0], 2, 5)[0] == [1, 2]` },
          { name: "search", code: `rng = np.random.default_rng(0); T = np.log(rng.dirichlet(np.ones(4), size=4)); lp = lambda s: T[s[-1]]
best = best_sequence(lp, [0], 3, 4); import itertools
alls = []
for n in range(1, 5):
    for seq in itertools.product(range(4), repeat=n):
        if 3 in seq[:-1] or (n < 4 and seq[-1] != 3): continue
        ctx = [0]; s = 0.0
        for t in seq: s += T[ctx[-1]][t]; ctx.append(t)
        alls.append((list(seq), s))
m = max(alls, key=lambda a: a[1]); assert best[0] == m[0] and abs(best[1] - m[1]) < 1e-12
b = beam_search(lp, [0], 3, 4, 64); assert b[0] == m[0] and abs(b[1] - m[1]) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gnmt_penalty(length, alpha)</C>; <C>rerank(hyps, alpha)</C>, choosing from (tokens, log-probability) pairs
          the best by log-probability divided by the penalty; and <C>repeat_rate(tokens, n)</C>, the fraction of the n-grams
          of tokens that already occurred earlier in it, 0 if there are none.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gnmt_penalty(length, alpha):
    return 1.0

def rerank(hyps, alpha):
    return hyps[0]

def repeat_rate(tokens, n):
    return 0.0
`,
        solution: RANK,
        tests: [
          { name: "penalty", code: `assert gnmt_penalty(1, 1.0) == 1.0 and abs(gnmt_penalty(10, 0.6) - 2.5 ** 0.6) < 1e-12 and gnmt_penalty(50, 0.0) == 1.0
hyps = [([2], -1.0), ([1, 0, 2], -1.5)]; assert rerank(hyps, 0.0) == hyps[0] and rerank(hyps, 2.0) == hyps[1]` },
          { name: "repeats", code: `assert abs(repeat_rate([1, 0, 1, 0, 1, 0], 2) - 0.6) < 1e-12 and repeat_rate([1, 2, 3], 2) == 0 and repeat_rate([1], 2) == 0
assert abs(repeat_rate([5, 5, 5, 5], 1) - 0.75) < 1e-12 and abs(repeat_rate(list("abcabc"), 3) - 0.25) < 1e-12` },
        ],
      },
    },
    {
      key: "nodes",
      rung: "stretch",
      prompt: <p>Without pruning, how many times does exhaustive search call the model on the toy language of the picture (tokens a, b and ⟨eos⟩) with at most 12 new tokens?</p>,
      answer: { kind: "numeric", value: 4095, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        If the most probable output is often not what we want, the alternative is to sample from the model&apos;s
        distribution, reshaped so that the long tail of unlikely tokens does not derail the text. Next: temperature, top-k,
        top-p and min-p.
      </p>
    </>
  ),
};
