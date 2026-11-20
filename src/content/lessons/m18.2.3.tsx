import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FatouGapViz } from "@/components/viz/FatouGapViz";
import type { LessonContent } from "@/lib/types";

const TAILS = `def integral(vals):
    return sum(vals) / len(vals)

def tail_inf(fs, n):
    return [min(f[i] for f in fs[n:]) for i in range(len(fs[0]))]

def fatou_sides(fs, n):
    return integral(tail_inf(fs, n)), min(integral(f) for f in fs[n:])`;

const SCHEFFE = `def l1_distance(p, q, h):
    return sum(abs(a - b) for a, b in zip(p, q)) * h

def scheffe(p, q, h):
    return 2 * sum(max(a - b, 0) for a, b in zip(p, q)) * h

def total_variation(p, q, h):
    return l1_distance(p, q, h) / 2`;

export const lesson: LessonContent = {
  id: "m18.2.3",
  minutes: 35,
  links: {
    requires: ["m18.2.2", "m8.2.5"],
    revisits: ["m7.3.1"],
    foreshadows: ["m18.3.4", "m18.5.4"],
  },

  puzzle: (
    <>
      <p>
        Monotone and dominated convergence give equality, but their hypotheses often cannot be checked. Suppose you only
        know that the functions are non-negative. The spike shows that the integrals need not converge to the integral of
        the limit. Is anything at all guaranteed, and in which direction can the inequality go?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mass can escape in a limit, but it cannot appear from nowhere. Whatever is still present at almost every point in
        the long run was present in every late function, so its integral cannot exceed what the integrals were in the long
        run. The limit can only lose area.
      </p>
      <FatouGapViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Fatou's lemma">
        <p>For measurable <M>{"f_n \\ge 0"}</M>,</p>
        <MD>{"\\int \\liminf_{n \\to \\infty} f_n\\, d\\mu \\le \\liminf_{n \\to \\infty} \\int f_n\\, d\\mu."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"g_n = \\inf_{k \\ge n} f_k"}</M> (<C>tail_inf</C>). Then <M>{"0 \\le g_n \\uparrow \\liminf f_n"}</M> (m8.2.5), so by monotone convergence{" "}
          <M>{"\\int g_n \\to \\int \\liminf f_n"}</M>. Also <M>{"g_n \\le f_k"}</M> for each k ≥ n, so{" "}
          <M>{"\\int g_n \\le \\inf_{k \\ge n} \\int f_k"}</M> (<C>fatou_sides</C>). Let n → ∞: the left side tends to{" "}
          <M>{"\\int \\liminf f_n"}</M> and the right side to <M>{"\\liminf \\int f_n"}</M>.
        </p>
        <Code>{TAILS}</Code>
      </Proof>

      <Example title="the inequality can be strict">
        <p>
          With <M>{"f_n = \\mathbb 1_{[0, 1/2)}"}</M> for even n and <M>{"\\mathbb 1_{[1/2, 1]}"}</M> for odd n, every integral is 1/2 but{" "}
          <M>{"\\liminf f_n = 0"}</M> everywhere. Non-negativity is needed too: <M>{"f_n = -n\\mathbb 1_{(0, 1/n)}"}</M> has{" "}
          <M>{"\\liminf f_n = 0"}</M> and integrals −1.
        </p>
      </Example>

      <Theorem title="reverse Fatou">
        <p>If <M>{"f_n \\le g"}</M> with g integrable, then <M>{"\\limsup_n \\int f_n \\le \\int \\limsup_n f_n"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Apply Fatou to the non-negative functions <M>{"g - f_n"}</M> and subtract the finite <M>{"\\int g"}</M>. Combining the two versions
          under <M>{"|f_n| \\le g"}</M> gives{" "}
          <M>{"\\int \\liminf f_n \\le \\liminf \\int f_n \\le \\limsup \\int f_n \\le \\int \\limsup f_n"}</M>, which is dominated convergence again when
          the outer two agree.
        </p>
      </Proof>

      <Theorem title="Scheffé's lemma">
        <p>
          If probability densities <M>{"p_n \\to p"}</M> almost everywhere and p is a density, then{" "}
          <M>{"\\int |p_n - p| \\to 0"}</M>, so the distributions converge in total variation:{" "}
          <M>{"\\sup_A |P_n(A) - P(A)| \\to 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since both integrate to 1, <M>{"\\int (p - p_n) = 0"}</M> and so{" "}
          <M>{"\\int |p_n - p| = 2\\int (p - p_n)^+"}</M> (<C>scheffe</C>, <C>l1_distance</C>). Now <M>{"0 \\le (p - p_n)^+ \\le p"}</M>, which is integrable,
          and <M>{"(p - p_n)^+ \\to 0"}</M>; dominated convergence finishes. For any event,{" "}
          <M>{"|P_n(A) - P(A)| \\le \\int_A |p_n - p| \\le \\tfrac12 \\int|p_n - p|"}</M> after the same splitting, which is the total variation
          distance (<C>total_variation</C>). The point is that pointwise convergence of densities (m7.3.1) is already enough for the
          strongest kind of convergence of probabilities: no mass can escape because the total is pinned at 1.
        </p>
        <Code>{SCHEFFE}</Code>
      </Proof>

      <Remark title="where Fatou is used">
        <p>
          Fatou is the tool of choice when a limit is known to exist but nothing bounds the sequence from above. It shows
          that a pointwise limit of functions with bounded integrals is integrable; that norms like{" "}
          <M>{"\\int |f|^p"}</M> are lower semicontinuous under almost-everywhere convergence; and, in the martingale convergence
          theorem (m18.5.4), that the limit of a martingale bounded in <M>{"L^1"}</M> is integrable.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "liminf",
      rung: "check",
      prompt: <p>Let fₙ be the indicator of [0, 0.7] for odd n and of [0.2, 1] for even n. What is the integral of lim inf fₙ over [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "l1",
      rung: "check",
      prompt: <p>On [0, 1] let p(x) = 1 and q(x) = 2x. What is the L¹ distance between these densities?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "direction",
      rung: "apply",
      prompt: <p>For non-negative fₙ, which statement does Fatou&apos;s lemma guarantee?</p>,
      answer: {
        kind: "choice",
        options: [
          "The integral of lim inf fₙ is at most lim inf of the integrals",
          "The integral of lim inf fₙ equals lim inf of the integrals",
          "lim sup of the integrals is at most the integral of lim sup fₙ",
          "The integrals converge whenever fₙ converges pointwise",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def integral(vals):
    return sum(vals) / len(vals)

def tail_inf(fs, n):
    return [min(f[i] for f in fs[n:]) for i in range(len(fs[0]))]

def fatou_sides(fs, n):
    return integral(tail_inf(fs, n)), min(integral(f) for f in fs[n:])

fs = [[1, 0, 1, 0], [0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 0, 1]]; print(tail_inf(fs, 0), fatou_sides(fs, 0), fatou_sides(fs, 3))
print(tail_inf([[3, 1], [2, 2], [5, 0]], 1), integral([2, 4, 9]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 0, 0, 0] (0.0, 0.5) (0.5, 0.5)\n[2, 0] 5.0",
          "[0, 0, 0, 0] (0.0, 0.5) (0.0, 0.5)\n[2, 0] 5.0",
          "[1, 1, 1, 1] (1.0, 0.5) (0.5, 0.5)\n[2, 0] 5.0",
          "[0, 0, 0, 0] (0.0, 0.5) (0.5, 0.5)\n[1, 0] 5.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def l1_distance(p, q, h):
    return sum(abs(a - b) for a, b in zip(p, q)) * h

def scheffe(p, q, h):
    return 2 * sum(max(a - b, 0) for a, b in zip(p, q)) * h

def total_variation(p, q, h):
    return l1_distance(p, q, h) / 2

p, q = [1.0, 1.0, 1.0, 1.0], [0.5, 1.5, 0.5, 1.5]; print(l1_distance(p, q, 0.25), scheffe(p, q, 0.25), total_variation(p, q, 0.25))
print(scheffe([2.0, 0.0], [0.0, 2.0], 0.5), l1_distance([1.0], [1.0], 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.5 0.25\n2.0 0.0",
          "0.5 0.25 0.25\n2.0 0.0",
          "2.0 2.0 1.0\n2.0 0.0",
          "0.5 0.5 0.25\n1.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Functions are lists of values on a common grid with equal weights. Write <C>integral(vals)</C>,{" "}
          <C>tail_inf(fs, n)</C>, the pointwise minimum of <C>fs[n:]</C>, and <C>fatou_sides(fs, n)</C> returning the pair (integral
          of the tail infimum, smallest integral in the tail).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def integral(vals):
    return 0.0

def tail_inf(fs, n):
    return fs[n]

def fatou_sides(fs, n):
    return 0.0, 0.0
`,
        solution: TAILS,
        tests: [
          { name: "tail", code: `fs = [[4, 1, 3], [2, 5, 3], [3, 3, 0]]
assert tail_inf(fs, 0) == [2, 1, 0] and tail_inf(fs, 1) == [2, 3, 0] and tail_inf(fs, 2) == [3, 3, 0] and integral([1, 2, 6]) == 3` },
          { name: "sides", code: `fs = [[4, 1, 3], [2, 5, 3], [3, 3, 0]]
a, b = fatou_sides(fs, 0)
assert abs(a - 1.0) < 1e-12 and abs(b - 2.0) < 1e-12 and fatou_sides([[1, 1]], 0) == (1.0, 1.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Densities are lists of values on a grid of spacing h. Write <C>l1_distance(p, q, h)</C>, <C>scheffe(p, q, h)</C> ={" "}
          <M>{"2\\sum (p - q)^+ h"}</M>, and <C>total_variation(p, q, h)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def l1_distance(p, q, h):
    return 0.0

def scheffe(p, q, h):
    return 0.0

def total_variation(p, q, h):
    return 0.0
`,
        solution: SCHEFFE,
        tests: [
          { name: "distances", code: `p, q = [3.0, 1.0, 0.0, 0.0], [1.0, 1.0, 1.0, 1.0]
assert l1_distance(p, q, 0.25) == 1.0 and scheffe(p, q, 0.25) == 1.0 and total_variation(p, q, 0.25) == 0.5` },
          { name: "asymmetric", code: `assert scheffe([1.0, 3.0], [2.0, 2.0], 1.0) == 2.0 and scheffe([2.0, 2.0], [1.0, 3.0], 1.0) == 2.0 and l1_distance([0.0], [4.0], 0.5) == 2.0` },
        ],
      },
    },
    {
      key: "cycle",
      rung: "stretch",
      prompt: (
        <p>
          The functions fₙ cycle through the indicators of [0, 0.6], [0.3, 0.9] and [0.5, 1] in that order. What is lim inf
          ∫fₙ minus ∫ lim inf fₙ over [0, 1]?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the space has been one-dimensional. The next lesson builds measures on products, which model independent
        experiments, and proves that a double integral can be computed one variable at a time, with care.
      </p>
    </>
  ),
};
