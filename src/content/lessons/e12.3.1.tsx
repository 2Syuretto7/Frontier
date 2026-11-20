import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SpecDecodeViz } from "@/components/viz/SpecDecodeViz";
import type { LessonContent } from "@/lib/types";

const ACCEPT = `def accept_prob(p, q, x):
    return min(1.0, p[x] / q[x])                    # keep a draft token with probability p/q, capped at 1

def residual(p, q):
    r = [max(pi - qi, 0.0) for pi, qi in zip(p, q)]
    s = sum(r)
    return [ri / s for ri in r]                     # resample from here after a rejection

def verify(drafts, ps, qs, us):
    for i, x in enumerate(drafts):
        if us[i] >= accept_prob(ps[i], qs[i], x):
            return i                                # drafts before position i are kept
    return len(drafts)`;

const GAIN = `def alpha_from(p, q):
    return sum(min(pi, qi) for pi, qi in zip(p, q))   # chance a draft token is accepted

def expected_tokens(alpha, k):
    return (1 - alpha ** (k + 1)) / (1 - alpha)       # accepted drafts plus the target's own token

def speedup(alpha, k, c):
    return expected_tokens(alpha, k) / (k * c + 1)    # c: cost of a draft step relative to a target step`;

export const lesson: LessonContent = {
  id: "e12.3.1",
  minutes: 55,
  links: {
    requires: ["e12.1.1", "m13.2.2"],
    revisits: ["l9.2.1", "e12.2.1"],
    foreshadows: ["e12.3.2"],
  },

  puzzle: (
    <>
      <p>
        A 70B-parameter model decodes one token per forward pass, and at batch 1 each pass is limited by reading its weights, so a
        pass that checks five tokens costs barely more than a pass that produces one. A 1B-parameter model from the same family
        guesses the 70B model&apos;s next token correctly most of the time. Can the small model&apos;s guesses be used to produce
        several tokens per pass of the large one, while guaranteeing that the output has exactly the large model&apos;s
        distribution, not merely something close to it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A cheap draft model proposes k tokens one by one. The target model then scores all k positions in a single forward pass, just as
        it scores a prompt during prefill. Each draft token is accepted with probability <M>{"\\min(1, p/q)"}</M>, where p and q are the
        target&apos;s and draft&apos;s probabilities for it; at the first rejection, a replacement is drawn from the part of p that q
        under-weights, and the rest are discarded. This is rejection sampling (m13.2.2) arranged so that every pass of the target yields
        at least one token and often several, with the target&apos;s distribution preserved exactly.
      </p>
      <SpecDecodeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the acceptance rule">
        <p>
          <C>accept_prob</C> is <M>{"\\min(1, p(x)/q(x))"}</M> for a drafted token x. <C>residual</C> is the distribution{" "}
          <M>{"r \\propto \\max(p - q, 0)"}</M> used after a rejection. <C>verify</C> takes drafted tokens, the target and draft
          distributions at each position, and uniform draws, and returns how many drafts are accepted before the first rejection.
        </p>
        <Code>{ACCEPT}</Code>
      </Definition>

      <Theorem title="speculative sampling is exact">
        <p>
          If x is drawn from q, accepted with probability <M>{"\\min(1, p(x)/q(x))"}</M>, and otherwise replaced by a draw from r, the
          resulting token has distribution exactly p.
        </p>
      </Theorem>
      <Proof>
        <p>
          The probability of outputting y by acceptance is <M>{"q(y)\\min(1, p(y)/q(y)) = \\min(p(y), q(y))"}</M>. The overall rejection
          probability is <M>{"1 - \\sum_x \\min(p(x), q(x)) = \\sum_x \\max(p(x) - q(x), 0)"}</M>, call it Z, and then y is drawn with
          probability <M>{"\\max(p(y) - q(y), 0)/Z"}</M>. The total is{" "}
          <M>{"\\min(p(y), q(y)) + \\max(p(y) - q(y), 0) = p(y)"}</M>. Applying this at each position in turn, conditioned on the accepted
          prefix, makes the whole sequence distributed as if sampled from the target alone.
        </p>
      </Proof>

      <Definition title="how much it helps">
        <p>
          <C>alpha_from</C> is the acceptance probability <M>{"\\alpha = \\sum_x \\min(p(x), q(x))"}</M>, one minus the total variation
          distance between p and q. <C>expected_tokens</C> is the expected number of tokens per target pass with k drafts, and{" "}
          <C>speedup</C> divides it by the cost of a round, k draft steps at relative cost c plus one target pass.
        </p>
        <Code>{GAIN}</Code>
      </Definition>

      <Theorem title="tokens per target pass">
        <p>
          If each draft is accepted independently with probability α, a round with k drafts yields{" "}
          <M>{"(1 - \\alpha^{k + 1})/(1 - \\alpha)"}</M> tokens in expectation.
        </p>
      </Theorem>
      <Proof>
        <p>
          The round yields the accepted drafts plus one token from the target: a correction after a rejection, or a bonus token when all
          k are accepted, since the target&apos;s pass already gives the next distribution. The number accepted is at least i with
          probability <M>{"\\alpha^i"}</M> for <M>{"i \\le k"}</M>, so the expected count is{" "}
          <M>{"\\sum_{i=1}^k \\alpha^i"}</M>, and adding 1 gives <M>{"\\sum_{i=0}^k \\alpha^i = (1 - \\alpha^{k+1})/(1 - \\alpha)"}</M>.
          Because the gain saturates while the draft cost grows linearly in k, there is a best k for each α and c.
        </p>
      </Proof>

      <Remark title="speculative decoding in practice">
        <p>
          Draft models are typically small members of the same family, often distilled from the target (l9.2.1) to raise α; acceptance
          is high on predictable text such as code and low on creative writing. Greedy decoding uses the simpler rule of accepting drafts
          that match the target&apos;s argmax. The benefit is largest at small batch sizes, where the target is memory-bound; with large
          continuous batches (e12.2.1) the target is already busy and the extra verification compute competes with other sequences, so
          servers adapt or disable speculation under load.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The 1B model drafts, say, five tokens; the 70B model checks them in one pass costing little more than a single decode step.
          With α around 0.8, a round yields about 3.7 tokens on average, and since five 1B steps cost a small fraction of a 70B pass, the
          response comes out roughly three times faster. By the exactness theorem the output distribution is that of the 70B model.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "alpha",
      rung: "check",
      prompt: <p>The target gives probabilities (0.5, 0.5) and the draft (0.9, 0.1) to two tokens. What is the acceptance rate α?</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 0.001 },
    },
    {
      key: "tokens",
      rung: "check",
      prompt: <p>With α = 0.6 and k = 3 drafts per round, how many tokens does a round yield on average? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.176, tolerance: 0.001 },
    },
    {
      key: "batch",
      rung: "apply",
      prompt: <p>Why does speculative decoding help less when a server already runs large batches?</p>,
      answer: {
        kind: "choice",
        options: [
          "At large batch the target is closer to compute-bound, so verifying extra draft tokens is no longer nearly free",
          "Large batches change the output distribution",
          "Draft models cannot be batched",
          "Acceptance rates are zero at large batch",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def accept_prob(p, q, x):
    return min(1.0, p[x] / q[x])                    # keep a draft token with probability p/q, capped at 1

def residual(p, q):
    r = [max(pi - qi, 0.0) for pi, qi in zip(p, q)]
    s = sum(r)
    return [ri / s for ri in r]                     # resample from here after a rejection

def verify(drafts, ps, qs, us):
    for i, x in enumerate(drafts):
        if us[i] >= accept_prob(ps[i], qs[i], x):
            return i                                # drafts before position i are kept
    return len(drafts)

p, q = [0.5, 0.3, 0.2], [0.2, 0.6, 0.2]
print(accept_prob(p, q, 1), residual(p, q), verify([0, 1, 2], [p, p, p], [q, q, q], [0.9, 0.7, 0.1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 [1.0, 0.0, 0.0] 1", "2.0 [1.0, 0.0, 0.0] 1", "0.5 [0.3, 0.0, 0.0] 1", "0.5 [1.0, 0.0, 0.0] 2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def alpha_from(p, q):
    return sum(min(pi, qi) for pi, qi in zip(p, q))   # chance a draft token is accepted

def expected_tokens(alpha, k):
    return (1 - alpha ** (k + 1)) / (1 - alpha)       # accepted drafts plus the target's own token

def speedup(alpha, k, c):
    return expected_tokens(alpha, k) / (k * c + 1)    # c: cost of a draft step relative to a target step

a = alpha_from([0.5, 0.3, 0.2], [0.2, 0.6, 0.2])
print(round(a, 2), round(expected_tokens(0.8, 4), 3), round(speedup(0.8, 4, 0.05), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.7 3.362 2.8", "0.3 3.362 2.8", "0.7 2.952 2.8", "0.7 3.362 3.36"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>accept_prob(p, q, x)</C>, <C>residual(p, q)</C> and <C>verify(drafts, ps, qs, us)</C>, where a draft is rejected when{" "}
          <C>{"us[i] >= accept_prob(...)"}</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def accept_prob(p, q, x):
    return p[x] / q[x]

def residual(p, q):
    return list(p)

def verify(drafts, ps, qs, us):
    return len(drafts)
`,
        solution: ACCEPT,
        tests: [
          { name: "rule", code: `assert accept_prob([0.9, 0.1], [0.3, 0.7], 0) == 1.0 and abs(accept_prob([0.9, 0.1], [0.3, 0.7], 1) - 1 / 7) < 1e-12\nr = residual([0.6, 0.3, 0.1], [0.2, 0.2, 0.6])\nassert abs(r[0] - 0.8) < 1e-12 and abs(r[1] - 0.2) < 1e-12 and r[2] == 0.0` },
          { name: "verify", code: `p, q = [0.5, 0.5], [0.25, 0.75]\nassert verify([0, 0, 1], [p] * 3, [q] * 3, [0.99, 0.5, 0.7]) == 2 and verify([1], [p], [q], [0.1]) == 1 and verify([], [], [], []) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>alpha_from(p, q)</C>, <C>expected_tokens(alpha, k)</C> for α &lt; 1, and <C>speedup(alpha, k, c)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def alpha_from(p, q):
    return 1.0

def expected_tokens(alpha, k):
    return 1 + alpha * k

def speedup(alpha, k, c):
    return expected_tokens(alpha, k)
`,
        solution: GAIN,
        tests: [
          { name: "alpha", code: `assert abs(alpha_from([0.7, 0.3], [0.4, 0.6]) - 0.7) < 1e-12 and alpha_from([1.0, 0.0], [0.0, 1.0]) == 0` },
          { name: "gain", code: `assert abs(expected_tokens(0.5, 2) - 1.75) < 1e-12 and expected_tokens(0.0, 9) == 1.0\nassert abs(speedup(0.5, 2, 0.25) - 1.75 / 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "best_k",
      rung: "stretch",
      prompt: (
        <p>
          With α = 0.8 and a draft step costing 0.05 of a target pass, which number of drafts k maximises the speed-up formula above?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A separate draft model must be trained, served and kept in sync with the target. The next lesson attaches cheap extra heads to the
        target itself, so that it drafts its own future tokens.
      </p>
    </>
  ),
};
