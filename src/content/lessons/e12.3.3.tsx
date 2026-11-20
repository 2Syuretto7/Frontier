import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JacobiViz } from "@/components/viz/JacobiViz";
import type { LessonContent } from "@/lib/types";

const JACOBI = `def jacobi_step(f, prefix, guess):
    return [f(prefix + guess[:i]) for i in range(len(guess))]   # every position updated in parallel

def jacobi_decode(f, prefix, n, init):
    guess, it = list(init), 0
    while True:
        new = jacobi_step(f, prefix, guess)
        it += 1
        if new == guess:
            return guess, it                        # a fixed point: nothing changed
        guess = new

def greedy(f, prefix, n):
    seq = list(prefix)
    for _ in range(n):
        seq.append(f(seq))
    return seq[len(prefix):]`;

const PARALLEL = `def unmask_step(conf, masked, k):
    best = sorted(masked, key=lambda i: -conf[i])[:k]
    return sorted(best)                             # reveal the k most confident masked positions

def steps_needed(n, k):
    return -(-n // k)

def ngram_guess(pool, last):
    return pool.get(last, [[]])[0]                  # a cached continuation of the last token, if any`;

export const lesson: LessonContent = {
  id: "e12.3.3",
  minutes: 50,
  links: {
    requires: ["e12.3.2", "m8.9.4"],
    revisits: ["m7.1.5", "e12.2.3"],
    foreshadows: ["e12.4.1"],
  },

  puzzle: (
    <>
      <p>
        Greedy decoding is a recurrence: each token is a function of all earlier ones. Recurrences can sometimes be solved by guessing
        the whole answer and refining every part of it at once, as in iterative methods for linear systems. Can a language model fill in
        a whole sentence in a few parallel passes, with no draft model at all? And what goes wrong when a model emits several tokens at
        once, each chosen on its own?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Jacobi decoding guesses n future tokens, runs one forward pass that recomputes every position from the current guess, and
        repeats until nothing changes, a fixed-point iteration (m8.9.4). The fixed point is exactly the greedy output, and each pass
        fixes at least one more token, so it is never slower in passes than greedy decoding, but a model trained left to right rarely gets
        later tokens right from wrong earlier ones. Lookahead decoding feeds the iteration guesses from a cache of n-grams seen during
        earlier iterations. Masked diffusion language models are trained for parallelism: they reveal several of the most confident
        masked positions per step. Choosing tokens at several positions independently can, however, combine incompatible choices.
      </p>
      <JacobiViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Jacobi decoding">
        <p>
          With a greedy next-token function f, <C>jacobi_step</C> replaces each guessed token i by f applied to the prefix and the first i
          guessed tokens, all in parallel. <C>jacobi_decode</C> starts from <C>init</C> of length n and iterates until a step changes
          nothing, returning the tokens and the number of steps, including the final one that confirms the fixed point. <C>greedy</C>{" "}
          decodes n tokens one at a time.
        </p>
        <Code>{JACOBI}</Code>
      </Definition>

      <Theorem title="Jacobi decoding converges to greedy">
        <p>
          After t Jacobi steps, the first t tokens equal the greedy output, whatever the initial guess. Hence the iteration reaches the
          greedy output within n steps and detects it by step n + 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on t. Position 0 depends only on the prefix, so after one step it equals the greedy first token. If after t steps
          positions 0 to t − 1 are correct, then in step t + 1 position t is computed from the prefix and those correct tokens, so it
          equals the greedy token t, and positions before it are recomputed from correct inputs and stay correct. After n steps all are
          correct, and the next step changes nothing. Speed-up comes only when several positions happen to become correct in one step.
        </p>
      </Proof>

      <Definition title="many tokens per step">
        <p>
          <C>unmask_step</C> chooses, among the still-masked positions, the k with highest model confidence, returned in position order.{" "}
          <C>steps_needed</C> is the number of steps to reveal n tokens at k per step. <C>ngram_guess</C> returns the first cached
          continuation of the last token from an n-gram pool, or an empty list, as lookahead decoding does to seed its guesses.
        </p>
        <Code>{PARALLEL}</Code>
      </Definition>

      <Theorem title="independent choices can be inconsistent">
        <p>
          Suppose the joint distribution of two positions puts probability <M>{"p_i"}</M> on each of m consistent pairs{" "}
          <M>{"(a_i, b_i)"}</M> with distinct <M>{"a_i"}</M> and distinct <M>{"b_i"}</M>. Sampling each position independently from its
          marginal yields an inconsistent pair with probability <M>{"1 - \\sum_i p_i^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The marginals give <M>{"a_i"}</M> and <M>{"b_j"}</M> probabilities <M>{"p_i"}</M> and <M>{"p_j"}</M>. Independent sampling
          (m7.1.5) produces <M>{"(a_i, b_j)"}</M> with probability <M>{"p_i p_j"}</M>, and the pair is consistent only when i = j, since
          the a&apos;s and b&apos;s are distinct. Summing over i gives <M>{"\\sum_i p_i^2"}</M> for consistency. With two equally likely
          pairs the failure rate is a half. This is why parallel decoders reveal only confident positions, whose marginals are nearly
          deterministic, or refine their choices over several steps.
        </p>
      </Proof>

      <Remark title="parallel decoding in practice">
        <p>
          Plain Jacobi decoding gives little speed-up on standard models; consistency-trained variants teach the model to jump to the
          fixed point from noisy guesses. Lookahead decoding keeps an n-gram pool built from the iteration itself, and prompt lookup
          reuses n-grams from the prompt, which works well for editing and summarisation where output repeats input, much like prefix reuse
          (e12.2.3). Some models are pre-trained with multi-token prediction heads. Masked diffusion language models generate by revealing
          tokens over a fixed number of steps, trading quality against the number of tokens revealed per step.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Jacobi iteration does solve the decoding recurrence in parallel and always reaches the greedy answer, but a model trained
          left to right usually settles only one token per pass, so passes are not saved unless good guesses come from an n-gram cache or
          the model is trained for it. Emitting several tokens chosen independently can pair words that never go together; parallel
          decoders limit this by committing only to confident positions.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "jacobi_bound",
      rung: "check",
      prompt: (
        <p>
          Jacobi decoding guesses 16 tokens. At most how many steps, counting the step that confirms the fixed point, can it take?
        </p>
      ),
      answer: { kind: "numeric", value: 17, tolerance: 0 },
    },
    {
      key: "steps",
      rung: "check",
      prompt: <p>A masked diffusion model reveals 24 tokens per step. How many steps does it need for 1,000 tokens?</p>,
      answer: { kind: "numeric", value: 42, tolerance: 0 },
    },
    {
      key: "why_slow",
      rung: "apply",
      prompt: <p>Why does plain Jacobi decoding rarely speed up a standard autoregressive model?</p>,
      answer: {
        kind: "choice",
        options: [
          "Given wrong earlier tokens, the model rarely predicts the correct later ones, so usually only one more token settles per pass",
          "Each Jacobi pass is many times more expensive than a decode step",
          "Jacobi iteration may converge to a different output from greedy decoding",
          "It needs a separate draft model",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def jacobi_step(f, prefix, guess):
    return [f(prefix + guess[:i]) for i in range(len(guess))]   # every position updated in parallel

def jacobi_decode(f, prefix, n, init):
    guess, it = list(init), 0
    while True:
        new = jacobi_step(f, prefix, guess)
        it += 1
        if new == guess:
            return guess, it                        # a fixed point: nothing changed
        guess = new

def greedy(f, prefix, n):
    seq = list(prefix)
    for _ in range(n):
        seq.append(f(seq))
    return seq[len(prefix):]

f = lambda seq: (seq[-1] + 1) % 5; g = jacobi_step(f, [3], [0, 0, 0])
print(g, jacobi_decode(f, [3], 3, [0, 0, 0]), greedy(f, [3], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 1, 1] ([4, 0, 1], 4) [4, 0, 1]",
          "[4, 0, 1] ([4, 0, 1], 4) [4, 0, 1]",
          "[4, 1, 1] ([4, 0, 1], 3) [4, 0, 1]",
          "[4, 1, 1] ([4, 0, 2], 4) [4, 0, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def unmask_step(conf, masked, k):
    best = sorted(masked, key=lambda i: -conf[i])[:k]
    return sorted(best)                             # reveal the k most confident masked positions

def steps_needed(n, k):
    return -(-n // k)

def ngram_guess(pool, last):
    return pool.get(last, [[]])[0]                  # a cached continuation of the last token, if any

conf = [0.9, 0.2, 0.7, 0.95, 0.5]
print(unmask_step(conf, [0, 1, 2, 4], 2), steps_needed(10, 3), ngram_guess({7: [[8, 9], [8, 1]]}, 7))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 2] 4 [8, 9]", "[0, 3] 4 [8, 9]", "[0, 2] 3 [8, 9]", "[0, 2] 4 [8, 1]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jacobi_step(f, prefix, guess)</C>, <C>jacobi_decode(f, prefix, n, init)</C>, with <C>len(init) == n</C>, and{" "}
          <C>greedy(f, prefix, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def jacobi_step(f, prefix, guess):
    return list(guess)

def jacobi_decode(f, prefix, n, init):
    return list(init), 1

def greedy(f, prefix, n):
    return [f(prefix)] * n
`,
        solution: JACOBI,
        tests: [
          { name: "step", code: `f = lambda s: sum(s) % 10\nassert jacobi_step(f, [1], [5, 5]) == [1, 6] and greedy(f, [1], 3) == [1, 2, 4]` },
          { name: "decode", code: `f = lambda s: sum(s) % 10\nassert jacobi_decode(f, [1], 3, [1, 2, 4]) == ([1, 2, 4], 1)\nt, it = jacobi_decode(f, [1], 3, [0, 0, 0])\nassert t == [1, 2, 4] and it <= 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>unmask_step(conf, masked, k)</C>, <C>steps_needed(n, k)</C> and <C>ngram_guess(pool, last)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def unmask_step(conf, masked, k):
    return masked[:k]

def steps_needed(n, k):
    return n // k

def ngram_guess(pool, last):
    return []
`,
        solution: PARALLEL,
        tests: [
          { name: "unmask", code: `assert unmask_step([0.1, 0.8, 0.3, 0.9], [0, 1, 2], 2) == [1, 2] and unmask_step([0.5], [0], 3) == [0]` },
          { name: "misc", code: `assert steps_needed(9, 3) == 3 and steps_needed(10, 3) == 4 and ngram_guess({1: [[2]]}, 1) == [2] and ngram_guess({}, 5) == []` },
        ],
      },
    },
    {
      key: "inconsistent",
      rung: "stretch",
      prompt: (
        <p>
          Two positions are jointly &quot;New York&quot; with probability 0.5, &quot;Los Angeles&quot; with 0.3 and &quot;San
          Diego&quot; with 0.2. If each position is sampled independently from its marginal, what is the probability of an inconsistent
          pair? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.62, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Faster decoding reduces the number of passes. The next chapter reduces the cost of each pass by storing weights, activations and
        caches in fewer bits, starting with how numbers are mapped to small integers.
      </p>
    </>
  ),
};
