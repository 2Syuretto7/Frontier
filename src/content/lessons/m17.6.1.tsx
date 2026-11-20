import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SaddleStagesViz } from "@/components/viz/SaddleStagesViz";
import type { LessonContent } from "@/lib/types";

const MODES = `import math

def mode_strength(s, a0, t):
    return s / (1 + (s / a0 - 1) * math.exp(-2 * s * t))

def half_time(s, a0):
    return math.log(s / a0 - 1) / (2 * s)

def loss_at(svals, a0, t):
    return 0.5 * sum((s - mode_strength(s, a0, t)) ** 2 for s in svals)`;

const SCALAR = `def uv_train(u, v, s, lr, steps):
    out = [u * v]
    for _ in range(steps):
        r = u * v - s
        u, v = u - lr * r * v, v - lr * r * u
        out.append(u * v)
    return out

def first_cross(xs, level):
    for i, x in enumerate(xs):
        if x >= level:
            return i
    return -1

def effective_rank(vals, frac):
    m = max(vals)
    return sum(1 for v in vals if v >= frac * m)`;

export const lesson: LessonContent = {
  id: "m17.6.1",
  minutes: 50,
  links: {
    requires: ["m17.3.3"],
    revisits: ["m6.4.1", "m16.7.3"],
    foreshadows: ["m17.6.2", "m17.6.4"],
  },

  puzzle: (
    <>
      <p>
        Loss curves of neural networks are often not smooth descents but staircases: long plateaus where nothing seems to
        happen, then a sudden drop, then another plateau. Even a network with no nonlinearity at all, just two matrices
        multiplied together, trained on a fixed linear map, does this. What is the network doing on a plateau, and what
        decides how long it waits?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        From a tiny initialisation the network starts near the origin, where the gradient is almost zero: a saddle point.
        It escapes along the direction of fastest growth, the strongest singular mode of the target, which grows
        exponentially from a tiny seed, slowly at first and then all at once. Once that mode is learned the network sits
        near a new saddle, where the next mode starts its own slow exponential growth. Learning proceeds mode by mode, in
        order of strength.
      </p>
      <SaddleStagesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the deep linear model">
        <p>
          Fit a target map <M>{"S = \\sum_\\alpha s_\\alpha u_\\alpha v_\\alpha^\\top"}</M> (its SVD, m6.4.1) with a product <M>{"W_2 W_1"}</M> by gradient flow on{" "}
          <M>{"\\tfrac12\\|W_2W_1 - S\\|_F^2"}</M>, the loss for whitened inputs. Call the initialisation <em>aligned and balanced</em> with seed{" "}
          <M>{"a_0"}</M> if <M>{"W_1 = \\sqrt{a_0}\\sum_\\alpha r_\\alpha v_\\alpha^\\top"}</M> and <M>{"W_2 = \\sqrt{a_0}\\sum_\\alpha u_\\alpha r_\\alpha^\\top"}</M> for
          orthonormal <M>{"r_\\alpha"}</M>.
        </p>
      </Definition>

      <Theorem title="mode dynamics (Saxe, McClelland and Ganguli)">
        <p>
          From an aligned and balanced initialisation, <M>{"W_2W_1 = \\sum_\\alpha a_\\alpha(t)\\, u_\\alpha v_\\alpha^\\top"}</M> for all t, where each
          strength obeys <M>{"\\dot a = 2a(s - a)"}</M>, so
        </p>
        <MD>{"a_\\alpha(t) = \\frac{s_\\alpha}{1 + (s_\\alpha/a_0 - 1)\\, e^{-2s_\\alpha t}}, \\qquad t_{1/2} = \\frac{\\ln(s_\\alpha/a_0 - 1)}{2 s_\\alpha}"}</MD>
        <p>
          (<C>mode_strength</C>, <C>half_time</C>), and the loss is <M>{"\\tfrac12\\sum_\\alpha (s_\\alpha - a_\\alpha(t))^2"}</M> (<C>loss_at</C>).
        </p>
        <Code>{MODES}</Code>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"W_1 = \\sum b_\\alpha r_\\alpha v_\\alpha^\\top"}</M> and <M>{"W_2 = \\sum c_\\alpha u_\\alpha r_\\alpha^\\top"}</M>. The gradients are{" "}
          <M>{"-\\nabla_{W_1} = W_2^\\top (S - W_2W_1)"}</M> and <M>{"-\\nabla_{W_2} = (S - W_2W_1)W_1^\\top"}</M>, and with this form both stay in the same
          span, mode by mode: <M>{"\\dot b = c(s - bc)"}</M> and <M>{"\\dot c = b(s - bc)"}</M>. Then <M>{"\\frac{d}{dt}(b^2 - c^2) = 0"}</M>, so balance{" "}
          <M>{"b = c"}</M> persists, and <M>{"a = bc"}</M> satisfies <M>{"\\dot a = \\dot b c + b\\dot c = (b^2 + c^2)(s - a) = 2a(s - a)"}</M>. This logistic
          equation separates: <M>{"\\frac{da}{a(s-a)} = 2\\,dt"}</M>, giving the formula; setting <M>{"a = s/2"}</M> gives{" "}
          <M>{"e^{2st_{1/2}} = s/a_0 - 1"}</M>.
        </p>
      </Proof>

      <Theorem title="saddles and plateaus">
        <p>
          Every <M>{"W_2W_1 = \\sum_{\\alpha \\in K} s_\\alpha u_\\alpha v_\\alpha^\\top"}</M> with K a proper subset of the modes, including the origin, is a
          critical point of the loss and not a minimum. With seed <M>{"a_0 \\to 0"}</M>, the trajectory spends a time of order{" "}
          <M>{"\\ln(1/a_0)/(2s_\\alpha)"}</M> waiting for mode α, so modes are learned one at a time in decreasing order of{" "}
          <M>{"s_\\alpha"}</M>, and the rank of <M>{"W_2W_1"}</M> grows by one at each stage.
        </p>
      </Theorem>
      <Proof>
        <p>
          At such a point the residual is <M>{"\\sum_{\\alpha\\notin K} s_\\alpha u_\\alpha v_\\alpha^\\top"}</M>, orthogonal to the learned modes, so both
          gradients vanish: the factors <M>{"W_1, W_2"}</M> have zero components on the unlearned modes. Perturbing a missing mode by{" "}
          <M>{"b = c = \\delta"}</M> changes the loss by <M>{"-s_\\alpha\\delta^2 + O(\\delta^4)"}</M>, so it is not a minimum. The waiting time is the
          half time with <M>{"\\ln(s/a_0 - 1) \\approx \\ln(1/a_0)"}</M>; the differences of these times between modes grow without bound as{" "}
          <M>{"a_0 \\to 0"}</M>, separating the stages.
        </p>
      </Proof>

      <Example title="checking it numerically">
        <p>
          The viz uses random, not aligned, initialisation, but the picture survives: shrinking the initial weights by a
          factor 1000 shrinks the seed <M>{"a_0"}</M> by about <M>{"10^6"}</M>, which should delay mode s by about{" "}
          <M>{"\\ln(10^6)/(2s)"}</M>: 2.3 time units for s = 3 and 13.8 for s = 0.5, close to what the readout shows. For a single mode,
          plain gradient descent on <M>{"uv"}</M> is a few lines (<C>uv_train</C>), and the stage times and the rank can be read off
          numerically (<C>first_cross</C>, <C>effective_rank</C>).
        </p>
        <Code>{SCALAR}</Code>
      </Example>

      <Remark title="beyond linear networks">
        <p>
          Jacot and colleagues proved that in the limit of small initialisation, deep linear networks follow a
          saddle-to-saddle path visiting critical points of increasing rank, which is one route to the low-rank implicit
          bias of m16.7.3. Staircase loss curves also appear in nonlinear networks, for example when a transformer abruptly
          forms the attention circuit that copies earlier tokens, and the same mechanism, exponential escape from a
          near-critical point seeded by a tiny initial component, is a leading explanation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half",
      rung: "check",
      prompt: <p>A mode of strength s = 2 starts from seed a₀ = 10⁻⁴. How long until it is half learned? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.4759, tolerance: 0.0002 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>Two modes, s = 2 and s = 0.5, start from the same seed 10⁻⁶. What is the ratio of their half times, weaker to stronger? Give four decimals.</p>,
      answer: { kind: "numeric", value: 3.6178, tolerance: 0.0003 },
    },
    {
      key: "plateau",
      rung: "apply",
      prompt: <p>What is the network doing during a plateau, according to this theory?</p>,
      answer: {
        kind: "choice",
        options: [
          "Sitting near a saddle point while the next mode grows exponentially from a tiny component, too small yet to affect the loss",
          "Oscillating around a minimum because the learning rate is too large",
          "Forgetting the modes it has already learned",
          "Searching randomly among equivalent minima",
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

def mode_strength(s, a0, t):
    return s / (1 + (s / a0 - 1) * math.exp(-2 * s * t))

def half_time(s, a0):
    return math.log(s / a0 - 1) / (2 * s)

def loss_at(svals, a0, t):
    return 0.5 * sum((s - mode_strength(s, a0, t)) ** 2 for s in svals)

print(mode_strength(2.0, 2.0, 5.0), mode_strength(1.0, 0.5, 0.0), half_time(1.0, 0.5), round(half_time(0.5, 0.5 / (1 + math.e)), 4))
print(round(loss_at([2.0, 1.0], 1e-6, 0.0), 4), round(loss_at([2.0, 1.0], 2.0, 3.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.5 0.0 1.0\n2.5 0.0",
          "2.0 0.5 0.0 0.5\n2.5 0.0",
          "2.0 0.25 0.0 1.0\n2.5 0.0",
          "2.0 0.5 0.6931 1.0\n5.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def uv_train(u, v, s, lr, steps):
    out = [u * v]
    for _ in range(steps):
        r = u * v - s
        u, v = u - lr * r * v, v - lr * r * u
        out.append(u * v)
    return out

def first_cross(xs, level):
    for i, x in enumerate(xs):
        if x >= level:
            return i
    return -1

def effective_rank(vals, frac):
    m = max(vals)
    return sum(1 for v in vals if v >= frac * m)

print(uv_train(1.0, 1.0, 1.0, 0.1, 3), uv_train(0.5, 0.5, 1.0, 0.5, 1))
print(first_cross([0.1, 0.4, 0.6, 0.9], 0.5), first_cross([0.1], 0.5), effective_rank([3, 2, 0.01, 0.001], 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 1.0, 1.0] [0.25, 0.47265625]\n2 -1 2",
          "[1.0, 1.0, 1.0] [0.25, 0.47265625]\n2 -1 2",
          "[1.0, 1.0, 1.0, 1.0] [0.25, 0.4375]\n2 -1 2",
          "[1.0, 1.0, 1.0, 1.0] [0.25, 0.47265625]\n3 0 4",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mode_strength(s, a0, t)</C>, <C>half_time(s, a0)</C> and <C>loss_at(svals, a0, t)</C> for modes all started from the
          same seed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mode_strength(s, a0, t):
    return a0 * math.exp(2 * s * t)

def half_time(s, a0):
    return 0.0

def loss_at(svals, a0, t):
    return 0.0
`,
        solution: MODES,
        tests: [
          { name: "logistic", code: `assert abs(mode_strength(1.0, 0.1, math.log(3) / 2) - 0.25) < 1e-12 and abs(half_time(2.0, 0.4) - math.log(4) / 4) < 1e-12` },
          { name: "loss", code: `assert abs(loss_at([3.0, 1.0], 1.0, 0.0) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>uv_train(u, v, s, lr, steps)</C>, gradient descent on <M>{"\\tfrac12(uv - s)^2"}</M> returning the list of products including
          the initial one; <C>first_cross(xs, level)</C>, the first index with value at least level, or −1; and{" "}
          <C>effective_rank(vals, frac)</C>, the number of values at least frac times the largest.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def uv_train(u, v, s, lr, steps):
    return [u * v]

def first_cross(xs, level):
    return -1

def effective_rank(vals, frac):
    return len(vals)
`,
        solution: SCALAR,
        tests: [
          { name: "train", code: `xs = uv_train(1.0, 0.5, 2.5, 0.2, 2)\nassert len(xs) == 3 and abs(xs[1] - 1.08) < 1e-12 and abs(xs[2] - 1.80610848) < 1e-12` },
          { name: "read off", code: `assert first_cross([0, 3, 2, 5], 2.5) == 1 and first_cross([1, 2], 3) == -1 and effective_rank([10, 1, 0.5], 0.05) == 3 and effective_rank([10, 1, 0.5], 0.08) == 2` },
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: (
        <p>
          Run gradient descent on a single mode with u = v = 0.01, target s = 1.5 and learning rate 0.05. At which step does the
          product uv first reach 0.75? (Step 0 is the initial value.)
        </p>
      ),
      answer: { kind: "numeric", value: 66, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Staircases in the training loss are one surprise; another is a staircase in the test loss long after the training
        loss has hit zero. Networks trained on small algorithmic tasks can memorise first and generalise thousands of steps
        later: grokking.
      </p>
    </>
  ),
};
