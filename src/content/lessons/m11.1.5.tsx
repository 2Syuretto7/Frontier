import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StagnationViz } from "@/components/viz/StagnationViz";
import type { LessonContent } from "@/lib/types";

const GR = `import numpy as np

def round_nearest_grid(x, h):
    return np.round(x / h) * h

def round_stochastic_grid(x, h, rng):
    lo = np.floor(x / h) * h
    p = (x - lo) / h
    return lo + h * (rng.random(np.shape(x)) < p)`;

const ACC = `import numpy as np

def sr_f16(x, rng):
    lo = np.float16(x)
    if float(lo) > x:
        lo = np.nextafter(lo, np.float16(-np.inf))
    hi = np.nextafter(lo, np.float16(np.inf))
    p = (x - float(lo)) / (float(hi) - float(lo))
    return hi if rng.random() < p else lo

def accumulate(n, step, mode, rng):
    s = np.float16(0)
    for _ in range(n):
        x = float(s) + step
        s = np.float16(x) if mode == 'rn' else sr_f16(x, rng)
    return float(s)`;

export const lesson: LessonContent = {
  id: "m11.1.5",
  minutes: 45,
  links: {
    requires: ["m11.1.4"],
    revisits: ["m11.1.2"],
    foreshadows: ["m11.2.2"],
  },

  puzzle: (
    <>
      <p>
        Store a weight in BF16 and add a learning-rate-sized update of 10⁻⁴ to it a million times. If the weight is around
        1, the update is less than half the gap between neighbouring BF16 numbers, so round-to-nearest returns the old
        weight every single time: a million updates, no change at all. Rounding to nearest is the most accurate choice for
        any single operation. How can making each operation less accurate, by rounding at random, make the whole computation
        more accurate?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Round-to-nearest is deterministic, so its errors can line up: the same small increment is thrown away the same way
        every time. Stochastic rounding rounds up with probability equal to how far the exact value lies towards the upper
        neighbour. Each result is less accurate, but it is right on average, so errors behave like independent random
        noise and cancel instead of accumulating. A tiny update to a large number is kept with small probability, which in
        expectation is exactly the update.
      </p>
      <StagnationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stochastic rounding">
        <p>If a ≤ x ≤ b with a and b adjacent representable numbers, stochastic rounding returns</p>
        <MD>{"\\mathrm{SR}(x) = \\begin{cases} b & \\text{with probability } (x - a)/(b - a), \\\\ a & \\text{with probability } (b - x)/(b - a), \\end{cases}"}</MD>
        <p>using fresh randomness for each operation.</p>
      </Definition>

      <Theorem title="unbiased with bounded variance">
        <p>
          <M>{"\\mathbb{E}[\\mathrm{SR}(x)] = x"}</M> and{" "}
          <M>{"\\mathrm{Var}[\\mathrm{SR}(x)] = (x - a)(b - x) \\leq (b - a)^2/4"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E} = b\\frac{x - a}{b - a} + a\\frac{b - x}{b - a} = \\frac{bx - ab + ab - ax}{b - a} = x"}</M>. The
          error SR(x) − x is b − x with probability (x − a)/(b − a) and a − x otherwise, so its variance is{" "}
          <M>{"(b - x)^2\\frac{x - a}{b - a} + (x - a)^2\\frac{b - x}{b - a} = (x - a)(b - x)"}</M>, and a product of two
          nonnegative numbers with fixed sum b − a is at most <M>{"((b - a)/2)^2"}</M>.
        </p>
        <Code>{GR}</Code>
      </Proof>

      <Theorem title="no stagnation">
        <p>
          With round-to-nearest, if <M>{"0 < \\delta < h/2"}</M> where h is the spacing at s, then{" "}
          <M>{"\\mathrm{fl}(s + \\delta) = s"}</M>, so a running sum of increments δ stops growing. With stochastic rounding,
          the computed sums <M>{"\\hat s_k"}</M> satisfy <M>{"\\mathbb{E}[\\hat s_k] = k\\delta"}</M> exactly.
        </p>
      </Theorem>
      <Proof>
        <p>
          For round-to-nearest, s is a float and s + δ is closer to s than to s + h. For stochastic rounding, write{" "}
          <M>{"\\hat s_{k+1} = \\hat s_k + \\delta + \\eta_k"}</M> with <M>{"\\eta_k"}</M> the rounding error; given the past,{" "}
          <M>{"\\mathbb{E}[\\eta_k] = 0"}</M> by the previous theorem, so taking expectations and inducting gives{" "}
          <M>{"\\mathbb{E}[\\hat s_k] = k\\delta"}</M>.
        </p>
      </Proof>

      <Remark title="error growth and use">
        <p>
          The errors <M>{"\\eta_k"}</M> form a martingale difference sequence with variance at most <M>{"h^2/4"}</M> each, so
          the total error is typically of order <M>{"\\sqrt n\\,h"}</M>, and by the Azuma–Hoeffding inequality it is at most
          a constant times <M>{"\\sqrt{n\\log(1/\\epsilon)}\\,h"}</M> with probability <M>{"1 - \\epsilon"}</M>, against the
          worst-case n·h/2 that round-to-nearest can incur. Hardware for low-precision training increasingly supports
          stochastic rounding for weight updates and gradient accumulation, where tiny increments to large values are the
          norm. In the code, rounding 0.3 to the integer grid gives 0 every time with round-to-nearest (and ties go to even:
          0.5, 1.5, 2.5 become 0, 2, 2), but averages 0.3 with variance 0.21 stochastically. Adding 10⁻⁴ ten thousand times in
          float16 stalls at 0.25 with round-to-nearest and reaches 1.0 stochastically; adding 0.01 four thousand times stalls
          at 32 instead of 40.
        </p>
        <Code>{ACC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "p",
      rung: "check",
      prompt: <p>Stochastically rounding 2.3 to the integer grid, what is the probability of getting 3?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>What is the variance of the stochastic rounding of 2.3 to the integer grid?</p>,
      answer: { kind: "numeric", value: 0.21, tolerance: 0.0001 },
    },
    {
      key: "stall",
      rung: "apply",
      prompt: <p>A running sum s is updated by s ← fl(s + δ) with round-to-nearest. When does it stop changing?</p>,
      answer: {
        kind: "choice",
        options: [
          "When δ is less than half the spacing between floats near s",
          "When δ is less than machine epsilon",
          "When s exceeds 1/δ",
          "Never, since each addition is correctly rounded",
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

def round_nearest_grid(x, h):
    return np.round(x / h) * h

def round_stochastic_grid(x, h, rng):
    lo = np.floor(x / h) * h
    p = (x - lo) / h
    return lo + h * (rng.random(np.shape(x)) < p)

rng = np.random.default_rng(0); x = np.full(100000, 0.3)
print(round_nearest_grid(0.3, 1.0), round(float(round_stochastic_grid(x, 1.0, rng).mean()), 2))
print(round_nearest_grid(np.array([0.5, 1.5, 2.5]), 1.0).tolist(), round(float(round_stochastic_grid(x, 1.0, rng).var()), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 0.3\n[0.0, 2.0, 2.0] 0.21", "0.0 0.3\n[1.0, 2.0, 3.0] 0.21", "0.0 0.0\n[0.0, 2.0, 2.0] 0.0", "0.3 0.3\n[0.0, 2.0, 2.0] 0.25"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sr_f16(x, rng):
    lo = np.float16(x)
    if float(lo) > x:
        lo = np.nextafter(lo, np.float16(-np.inf))
    hi = np.nextafter(lo, np.float16(np.inf))
    p = (x - float(lo)) / (float(hi) - float(lo))
    return hi if rng.random() < p else lo

def accumulate(n, step, mode, rng):
    s = np.float16(0)
    for _ in range(n):
        x = float(s) + step
        s = np.float16(x) if mode == 'rn' else sr_f16(x, rng)
    return float(s)

rng = np.random.default_rng(1)
print(accumulate(10000, 1e-4, 'rn', rng), round(accumulate(10000, 1e-4, 'sr', rng), 2))
print(accumulate(4000, 0.01, 'rn', rng), round(accumulate(4000, 0.01, 'sr', rng)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.25 1.0\n32.0 41", "1.0 1.0\n40.0 40", "0.25 0.25\n32.0 32", "0.125 1.0\n16.0 41"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>round_nearest_grid(x, h)</C> (round to the nearest multiple of h, ties to an even multiple) and{" "}
          <C>round_stochastic_grid(x, h, rng)</C> (stochastic rounding to multiples of h, elementwise, using{" "}
          <C>rng.random</C>).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def round_nearest_grid(x, h):
    return x

def round_stochastic_grid(x, h, rng):
    return x
`,
        solution: GR,
        tests: [
          { name: "nearest", code: `assert np.allclose(round_nearest_grid(np.array([0.24, 0.26, 0.75, 1.25]), 0.5), [0.0, 0.5, 1.0, 1.0])` },
          { name: "sr", code: `rng = np.random.default_rng(5); x = np.full(200000, 1.7)
y = round_stochastic_grid(x, 0.5, rng)
assert set(np.unique(y)) <= {1.5, 2.0} and abs(y.mean() - 1.7) < 0.005 and abs(y.var() - 0.2 * 0.3) < 0.005
assert np.all(round_stochastic_grid(np.array([1.0, 2.5]), 0.5, rng) == [1.0, 2.5])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sr_f16(x, rng)</C>, stochastic rounding of a Python float to float16 using its two float16 neighbours, and{" "}
          <C>accumulate(n, step, mode, rng)</C>, which adds step to a float16 running sum n times with mode &apos;rn&apos;
          or &apos;sr&apos; and returns the final sum as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sr_f16(x, rng):
    return np.float16(x)

def accumulate(n, step, mode, rng):
    return 0.0
`,
        solution: ACC,
        tests: [
          { name: "sr16", code: `rng = np.random.default_rng(2)
vals = [float(sr_f16(1.0 + 2.0 ** -12, rng)) for _ in range(4000)]
assert set(vals) <= {1.0, 1.0 + 2.0 ** -10} and abs(np.mean(vals) - (1.0 + 2.0 ** -12)) < 2.0 ** -15 and float(sr_f16(0.5, rng)) == 0.5` },
          { name: "acc", code: `rng = np.random.default_rng(3)
assert abs(accumulate(3000, 1e-3, 'rn', rng) - 3.0) > 0.5 and abs(accumulate(3000, 1e-3, 'sr', rng) - 3.0) < 0.1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let a ≤ x ≤ b with a &lt; b adjacent floats. Prove that stochastic rounding satisfies E[SR(x)] = x and Var[SR(x)] =
          (x − a)(b − x) ≤ (b − a)²/4.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes E[SR(x)] = b(x − a)/(b − a) + a(b − x)/(b − a) and simplifies it to x.",
          "Computes the variance from the two error values b − x and a − x with their probabilities, simplifying to (x − a)(b − x).",
          "Bounds the product of the two nonnegative numbers x − a and b − x, whose sum is b − a, by ((b − a)/2)².",
        ],
      },
    },
    {
      key: "over",
      rung: "stretch",
      prompt: <p>In float16 with round-to-nearest, adding 0.01 to a running sum s with 16 ≤ s &lt; 32 increases s by how much each time?</p>,
      answer: { kind: "numeric", value: 0.015625, tolerance: 0.000001 },
    },
  ],

  teachBack:
    "Explain to a friend why repeatedly adding a tiny increment in low precision with round-to-nearest stalls, how stochastic rounding is unbiased and what its variance is, and why its errors grow like √n rather than n.",

  glimpse: (
    <>
      <p>
        So far the question has been how big the rounding errors are. The next chapter asks how much they matter: how
        sensitive the answer to a problem is to small changes in its data, whatever algorithm computes it.
      </p>
    </>
  ),
};
