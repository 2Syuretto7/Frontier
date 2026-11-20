import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ClockAlgorithmViz } from "@/components/viz/ClockAlgorithmViz";
import type { LessonContent } from "@/lib/types";

const CLOCK = `import math

def embed(a, freqs, p):
    return [f(2 * math.pi * k * a / p) for k in freqs for f in (math.cos, math.sin)]

def combine(ea, eb):
    out = []
    for i in range(0, len(ea), 2):
        ca, sa, cb, sb = ea[i], ea[i + 1], eb[i], eb[i + 1]
        out += [ca * cb - sa * sb, sa * cb + ca * sb]
    return out

def clock_logits(a, b, freqs, p):
    s = combine(embed(a, freqs, p), embed(b, freqs, p))
    return [sum(s[2 * j] * math.cos(2 * math.pi * k * c / p) + s[2 * j + 1] * math.sin(2 * math.pi * k * c / p)
                for j, k in enumerate(freqs)) for c in range(p)]`;

const ADD = `def ones_digit(a, b):
    return (a % 10 + b % 10) % 10

def rough_range(a, b, unit):
    lo = a // unit * unit + b // unit * unit
    return lo, lo + 2 * (unit - 1)

def combine_paths(lo, hi, d):
    return [n for n in range(lo, hi + 1) if n % 10 == d]`;

export const lesson: LessonContent = {
  id: "l11.5.2",
  minutes: 55,
  links: {
    requires: ["l11.5.1"],
    revisits: ["l11.2.3", "l11.3.1", "l10.6.2"],
    foreshadows: ["l11.6.1"],
  },

  puzzle: (
    <>
      <p>
        A language model answers 36 + 59 = 95. Asked how, it says it added 6 and 9 to get 15, wrote the 5 and carried the 1. An attribution
        graph of the same answer shows no carry at all: one pathway works out roughly how large the sum is, and another works out
        exactly what its last digit must be. Which account describes what the model did, and what does the mismatch teach about asking
        models to explain themselves?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The tools of this course have now been applied to real models, from a two-layer network trained on modular arithmetic to
        production assistants. The findings repeat a few themes. Models often compute in ways no one designed, such as rotating angles to
        add numbers. They run several pathways in parallel and combine them. Components back each other up, so removing one can
        understate its role. And a model&apos;s description of its own reasoning is a separate output, not a readout of the computation.
      </p>
      <ClockAlgorithmViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the clock algorithm for modular addition">
        <p>
          Nanda and colleagues (2023) reverse-engineered a small transformer trained to compute (a + b) mod p for p = 113. Its embeddings
          represent a number as <M>{"(\\cos w_k a, \\sin w_k a)"}</M> for a handful of frequencies <M>{"w_k = 2\\pi k/p"}</M>
          (<C>embed</C>). Attention and the MLP compute the angle sum through the product identities{" "}
          <M>{"\\cos(x + y) = \\cos x \\cos y - \\sin x \\sin y"}</M> and its sine counterpart (<C>combine</C>), and the unembedding scores
          each answer c by <M>{"\\sum_k \\cos w_k(a + b - c)"}</M> (<C>clock_logits</C>). Training passed through memorisation before
          this circuit formed and the memorising weights were cleaned away, which is how the authors explained grokking (l10.6.2 covers
          the phenomenon).
        </p>
        <Code>{CLOCK}</Code>
      </Definition>

      <Theorem title="the clock logits peak only at the right answer">
        <p>
          Let p be prime, s = (a + b) mod p, and F a nonempty set of frequencies k with 0 &lt; k &lt; p. Then{" "}
          <M>{"\\ell(c) = \\sum_{k \\in F} \\cos(2\\pi k (s - c)/p)"}</M> equals |F| at c = s and is strictly smaller at every other c. If F
          contains all p - 1 nonzero frequencies, every wrong answer has logit exactly -1.
        </p>
      </Theorem>
      <Proof>
        <p>
          A term equals 1 exactly when k(s - c)/p is an integer, that is when p divides k(s - c). Since p is prime and does not divide k,
          this happens exactly when p divides s - c, that is c = s. So at c = s every term is 1, and at any other c every term is below 1,
          making the sum below |F|. For the second claim let <M>{"\\zeta = e^{2\\pi i (s - c)/p}"}</M>, a p-th root of unity other than 1
          when c is not s. Then <M>{"\\sum_{k=0}^{p-1} \\zeta^k = (\\zeta^p - 1)/(\\zeta - 1) = 0"}</M>, so the sum over k = 1 to p - 1 is
          -1, and its real part is the logit. A single frequency leaves near misses close to 1, as the visualisation shows; a few
          well-chosen frequencies already separate the answer clearly.
        </p>
      </Proof>

      <Remark title="indirect object identification in GPT-2 small">
        <p>
          In &ldquo;When Mary and John went to the store, John gave a drink to&rdquo; the model predicts Mary. Wang and colleagues (2022)
          found a circuit of about two dozen heads: some notice that John is repeated, using duplicate-token and induction heads (l11.2.3);
          others pass that on and suppress attention to the repeated name; and name-mover heads copy the remaining name to the output. When
          the name movers were ablated, backup heads partly took over. Such self-repair means the drop after removing a component is a
          lower bound on what it normally does.
        </p>
      </Remark>

      <Remark title="features and graphs in production models">
        <p>
          Sparse autoencoders trained on Claude 3 Sonnet (Templeton and colleagues, 2024) found features for concepts such as the Golden
          Gate Bridge that fire on text and images and across languages; clamping that feature high made the model bring the bridge into
          unrelated answers, a first example of steering by feature (next chapter). Attribution graphs on Claude 3.5 Haiku (Lindsey and
          colleagues, 2025) reported a Texas feature on the path from Dallas to Austin, candidate rhyme words chosen before a line of verse
          is written, and a default pathway that says &ldquo;I do not know&rdquo; which recognised names switch off, so that a familiar
          but unknown name can produce a confident hallucination. The same work traced addition into the two pathways of the puzzle{" "}
          (<C>ones_digit</C>, <C>rough_range</C>, <C>combine_paths</C>).
        </p>
        <Code>{ADD}</Code>
        <p>
          Case studies are chosen because they worked. Each graph covers one prompt, the replacement model leaves some of the computation
          in error nodes, and the authors noted that many prompts gave graphs they could not interpret. Read such results as existence
          proofs of mechanisms, not as a census of how the model works.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The attribution graph describes the computation, and its interventions were checked against the model; the explanation is text
          the model produced by imitating how people describe addition. For 36 + 59 the rough pathway places the sum somewhere in the
          high eighties or nineties, the digit pathway fixes the last digit as 5 from 6 + 9, and only 95 satisfies both. A model&apos;s
          account of its own reasoning is a hypothesis to test, like any other.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "single",
      rung: "check",
      prompt: (
        <p>
          A clock-algorithm circuit for addition mod 113 uses the single frequency k = 1. The correct answer has logit 1. What is the
          logit of the answer one above it? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.9985, tolerance: 0.001 },
    },
    {
      key: "ioi",
      rung: "check",
      prompt: (
        <p>
          On an indirect object prompt the logit of the correct name exceeds that of the repeated name by 3.2. Ablating the name-mover
          heads reduces the difference to 0.8. What fraction of the logit difference did the ablation remove?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.001 },
    },
    {
      key: "halluc",
      rung: "apply",
      prompt: <p>Which mechanism for hallucinated answers about people was reported from attribution graphs?</p>,
      answer: {
        kind: "choice",
        options: [
          "A default pathway that declines to answer is switched off by features for recognised names, which can fire for a familiar-sounding unknown name",
          "The model computes a calibrated probability of being wrong and refuses whenever it falls below a threshold",
          "Hallucinations arise only from errors in the final unembedding layer",
          "Features that decline to answer fire only after the answer has already been written",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def embed(a, freqs, p):
    return [f(2 * math.pi * k * a / p) for k in freqs for f in (math.cos, math.sin)]

def combine(ea, eb):
    out = []
    for i in range(0, len(ea), 2):
        ca, sa, cb, sb = ea[i], ea[i + 1], eb[i], eb[i + 1]
        out += [ca * cb - sa * sb, sa * cb + ca * sb]
    return out

def clock_logits(a, b, freqs, p):
    s = combine(embed(a, freqs, p), embed(b, freqs, p))
    return [sum(s[2 * j] * math.cos(2 * math.pi * k * c / p) + s[2 * j + 1] * math.sin(2 * math.pi * k * c / p)
                for j, k in enumerate(freqs)) for c in range(p)]

e = embed(1, [1], 6)
print([round(v, 3) for v in e], [round(v, 3) for v in combine(e, e)], max(range(5), key=lambda c: clock_logits(2, 4, [1, 2], 5)[c]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.866] [-0.5, 0.866] 1",
          "[0.5, 0.866] [0.25, 0.75] 1",
          "[0.866, 0.5] [-0.5, 0.866] 1",
          "[0.5, 0.866] [-0.5, 0.866] 6",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ones_digit(a, b):
    return (a % 10 + b % 10) % 10

def rough_range(a, b, unit):
    lo = a // unit * unit + b // unit * unit
    return lo, lo + 2 * (unit - 1)

def combine_paths(lo, hi, d):
    return [n for n in range(lo, hi + 1) if n % 10 == d]

print(ones_digit(47, 36), rough_range(47, 36, 4), combine_paths(*rough_range(47, 36, 4), ones_digit(47, 36)))
print(combine_paths(*rough_range(47, 36, 10), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 (80, 86) [83]\n[73, 83]",
          "3 (80, 86) [83]\n[83]",
          "3 (83, 83) [83]\n[73, 83]",
          "13 (80, 86) []\n[73, 83]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>embed(a, freqs, p)</C>, the list cos, sin of <M>{"2\\pi k a/p"}</M> for each k in turn; <C>combine(ea, eb)</C>, which
          turns two such lists into the cos, sin pairs of the summed angles using only products of their entries; and{" "}
          <C>clock_logits(a, b, freqs, p)</C>, the list over c from 0 to p - 1 of <M>{"\\sum_k \\cos(2\\pi k(a + b - c)/p)"}</M>, computed
          from the combined pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def embed(a, freqs, p):
    return [0.0] * (2 * len(freqs))

def combine(ea, eb):
    return list(ea)

def clock_logits(a, b, freqs, p):
    return [0.0] * p
`,
        solution: CLOCK,
        tests: [
          { name: "angles", code: `e = embed(2, [1, 3], 8)\nassert len(e) == 4 and abs(e[0]) < 1e-12 and abs(e[1] - 1) < 1e-12 and abs(e[2]) < 1e-12 and abs(e[3] + 1) < 1e-12\nc = combine(embed(3, [2], 7), embed(5, [2], 7))\nassert all(abs(x - y) < 1e-12 for x, y in zip(c, embed(8, [2], 7)))` },
          { name: "logits", code: `L = clock_logits(9, 8, [3, 5], 11)\nassert len(L) == 11 and max(range(11), key=lambda i: L[i]) == 6 and abs(L[6] - 2) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ones_digit(a, b)</C>, the last digit of a + b from the last digits alone; <C>rough_range(a, b, unit)</C>, which rounds
          each operand down to a multiple of unit and returns the pair (lo, hi) of the smallest and largest sums consistent with that; and{" "}
          <C>combine_paths(lo, hi, d)</C>, the numbers from lo to hi inclusive ending in digit d.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ones_digit(a, b):
    return 0

def rough_range(a, b, unit):
    return (0, 0)

def combine_paths(lo, hi, d):
    return []
`,
        solution: ADD,
        tests: [
          { name: "pathways", code: `assert ones_digit(68, 59) == 7\nassert rough_range(68, 59, 3) == (123, 127)` },
          { name: "combine", code: `assert combine_paths(123, 127, 7) == [127]\nassert combine_paths(60, 78, 2) == [62, 72]` },
        ],
      },
    },
    {
      key: "unit",
      rung: "stretch",
      prompt: (
        <p>
          In the two-pathway model, the rough pathway knows each operand only after rounding down to a multiple of unit, as in{" "}
          <C>rough_range</C>. What is the largest unit for which combining with the ones digit always leaves exactly one candidate sum?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Features found this way can also be used as handles. Adding a direction to the residual stream changes what the model does, and
        the next chapter turns that into a tool.
      </p>
    </>
  ),
};
