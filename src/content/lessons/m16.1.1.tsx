import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PacThresholdViz } from "@/components/viz/PacThresholdViz";
import type { LessonContent } from "@/lib/types";

const THRESHOLD = `import math

def learn_threshold(samples):
    pos = [x for x, y in samples if y == 1]
    return min(pos) if pos else 1.0

def true_error(t_hat, t):
    return abs(t_hat - t)

def pac_sample_size(eps, delta):
    return math.ceil(math.log(1 / delta) / eps)`;

const RECTANGLE = `import math

def learn_rectangle(samples):
    pos = [p for p, y in samples if y == 1]
    if not pos:
        return None
    xs, ys = [p[0] for p in pos], [p[1] for p in pos]
    return (min(xs), max(xs), min(ys), max(ys))

def predict_rect(box, p):
    return box is not None and box[0] <= p[0] <= box[1] and box[2] <= p[1] <= box[3]

def rect_sample_size(eps, delta):
    return math.ceil(4 * math.log(4 / delta) / eps)`;

export const lesson: LessonContent = {
  id: "m16.1.1",
  minutes: 45,
  links: {
    requires: ["m15.1.2"],
    revisits: ["m9.1.1"],
    foreshadows: ["m16.1.2", "m16.2.1", "m16.2.2"],
  },

  puzzle: (
    <>
      <p>
        A sensor is faulty above some unknown temperature t, and you can test it at temperatures drawn from whatever
        distribution the factory happens to produce. You do not know that distribution and you never will. How many tests
        guarantee that your estimated cut-off misclassifies at most 1% of future readings, and how can such a guarantee hold
        without knowing the distribution at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        No finite sample makes the learner certain to be accurate: an unlucky sample can always mislead it. So the guarantee
        has two dials. The accuracy ε says how close to perfect the learned rule must be; the confidence δ allows a small
        chance that the sample was unrepresentative. &ldquo;Probably approximately correct&rdquo; means: with probability at
        least 1 − δ over the sample, the error is at most ε.
      </p>
      <p>
        For a threshold the argument is short. The learner goes wrong by more than ε only if no example landed in the strip of
        probability ε just above the true cut-off. Each example misses that strip with probability 1 − ε, so all m miss it
        with probability <M>{"(1 - \\varepsilon)^m"}</M>, whatever the distribution.
      </p>
      <PacThresholdViz />
    </>
  ),

  theory: (
    <>
      <Definition title="PAC learnability">
        <p>
          Fix a domain X, a hypothesis class H of functions <M>{"X \\to \\{0, 1\\}"}</M> and the loss{" "}
          <M>{"L_D(h) = \\Pr_{x \\sim D}[h(x) \\neq f(x)]"}</M>. H is PAC learnable in the realisable case if there are a
          function <M>{"m_H(\\varepsilon, \\delta)"}</M> and an algorithm A such that for every ε, δ in (0, 1), every distribution
          D on X and every target f in H, given <M>{"m \\ge m_H(\\varepsilon, \\delta)"}</M> examples drawn independently from D
          and labelled by f, A returns h with <M>{"L_D(h) \\le \\varepsilon"}</M> with probability at least 1 − δ.
        </p>
      </Definition>

      <Theorem title="thresholds are PAC learnable">
        <p>
          For thresholds <M>{"h_t(x) = \\mathbf 1[x \\ge t]"}</M> on the real line, returning the smallest positive example
          achieves error at most ε with probability at least 1 − δ once
        </p>
        <MD>{"m \\ge \\frac{\\ln(1/\\delta)}{\\varepsilon}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The learned threshold <M>{"\\hat t"}</M> is never below t, so its errors are exactly the points of{" "}
          <M>{"[t, \\hat t)"}</M> (<C>learn_threshold</C>, <C>true_error</C> for the uniform distribution). If{" "}
          <M>{"D[t, \\infty) \\le \\varepsilon"}</M> there is nothing to prove. Otherwise let s be the smallest point with{" "}
          <M>{"D[t, s] \\ge \\varepsilon"}</M>. The error exceeds ε only if <M>{"\\hat t > s"}</M>, that is, only if no example
          fell in [t, s]. Each example avoids that interval with probability at most 1 − ε, so by independence
        </p>
        <MD>{"\\Pr[L_D(\\hat h) > \\varepsilon] \\le (1 - \\varepsilon)^m \\le e^{-\\varepsilon m},"}</MD>
        <p>
          using <M>{"1 - u \\le e^{-u}"}</M>. Setting <M>{"e^{-\\varepsilon m} \\le \\delta"}</M> gives the bound (<C>pac_sample_size</C>).
          Nothing about D was used beyond independence: the guarantee is distribution-free.
        </p>
        <Code>{THRESHOLD}</Code>
      </Proof>

      <Example title="axis-aligned rectangles">
        <p>
          Let H be the indicators of axis-aligned rectangles in the plane, and let the learner return the smallest rectangle
          containing every positive example (<C>learn_rectangle</C>, <C>predict_rect</C>). Its errors lie inside the target
          rectangle but outside the learned one. Grow a strip inward from each of the four sides of the target until it has
          probability ε/4. If every strip contains an example, the learned rectangle covers all but those strips and its error is
          at most ε. A union bound over the four strips gives failure probability at most{" "}
          <M>{"4 (1 - \\varepsilon/4)^m \\le 4 e^{-\\varepsilon m / 4}"}</M>, so <M>{"m \\ge 4 \\ln(4/\\delta)/\\varepsilon"}</M>{" "}
          examples suffice (<C>rect_sample_size</C>).
        </p>
        <Code>{RECTANGLE}</Code>
      </Example>

      <Definition title="agnostic PAC learning">
        <p>
          Usually no hypothesis is perfect: labels are noisy, or the truth is outside H. Then D is a distribution over pairs
          (x, y), and the requirement becomes{" "}
          <M>{"L_D(h) \\le \\min_{h' \\in H} L_D(h') + \\varepsilon"}</M> with probability at least 1 − δ. The learner competes
          with the best rule in the class rather than with the truth. Sample complexities in this setting grow like{" "}
          <M>{"1/\\varepsilon^2"}</M> rather than <M>{"1/\\varepsilon"}</M>, as the next lessons show.
        </p>
      </Definition>

      <Remark title="what the definition leaves out">
        <p>
          PAC learnability is about the number of examples, not about computation: a class can need few examples yet have no
          efficient learner. The learner may also be <em>improper</em>, returning a hypothesis outside H. And the bound is
          worst-case over distributions, which makes it robust but often pessimistic for the distributions met in practice.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>How many examples does the bound ln(1/δ)/ε require for learning a threshold with ε = 0.02 and δ = 0.1?</p>,
      answer: { kind: "numeric", value: 116, tolerance: 0.5 },
    },
    {
      key: "exact",
      rung: "check",
      prompt: <p>With ε = 0.1 and m = 30, what is (1 − ε)^m, the bound on the probability that the threshold learner&apos;s error exceeds ε? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0424, tolerance: 0.0001 },
    },
    {
      key: "delta",
      rung: "apply",
      prompt: <p>In a PAC guarantee, what is the probability 1 − δ taken over?</p>,
      answer: {
        kind: "choice",
        options: [
          "The random draw of the training sample; a small fraction of unlucky samples may still mislead the learner",
          "The random draw of a single test point",
          "A prior distribution over target functions",
          "The choice of the distribution D, which is assumed random",
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

def learn_threshold(samples):
    pos = [x for x, y in samples if y == 1]
    return min(pos) if pos else 1.0

def true_error(t_hat, t):
    return abs(t_hat - t)

def pac_sample_size(eps, delta):
    return math.ceil(math.log(1 / delta) / eps)

print(learn_threshold([(0.1, 0), (0.45, 1), (0.3, 0), (0.8, 1)]), learn_threshold([(0.2, 0)]), round(true_error(0.45, 0.4), 4))
print(pac_sample_size(0.1, 0.05), pac_sample_size(0.01, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.45 1.0 0.05\n30 300",
          "0.1 1.0 0.05\n30 300",
          "0.45 0.2 0.05\n30 300",
          "0.45 1.0 0.05\n29 299",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def learn_rectangle(samples):
    pos = [p for p, y in samples if y == 1]
    if not pos:
        return None
    xs, ys = [p[0] for p in pos], [p[1] for p in pos]
    return (min(xs), max(xs), min(ys), max(ys))

def predict_rect(box, p):
    return box is not None and box[0] <= p[0] <= box[1] and box[2] <= p[1] <= box[3]

def rect_sample_size(eps, delta):
    return math.ceil(4 * math.log(4 / delta) / eps)

box = learn_rectangle([((1, 2), 1), ((3, 1), 1), ((2, 5), 0), ((2, 2), 1)])
print(box, predict_rect(box, (2, 1.5)), predict_rect(box, (0, 0)), predict_rect(None, (1, 1)), rect_sample_size(0.1, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1, 3, 1, 2) True False False 176",
          "(1, 3, 1, 5) True False False 176",
          "(1, 3, 1, 2) False False False 176",
          "(1, 3, 1, 2) True False False 30",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>learn_threshold(samples)</C>, returning the smallest positive example or 1.0 if there is none,{" "}
          <C>true_error(t_hat, t)</C> under the uniform distribution on [0, 1], and <C>pac_sample_size(eps, delta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def learn_threshold(samples):
    return 0.0

def true_error(t_hat, t):
    return 0.0

def pac_sample_size(eps, delta):
    return 1
`,
        solution: THRESHOLD,
        tests: [
          { name: "learner", code: `assert learn_threshold([(0.7, 1), (0.2, 0), (0.55, 1)]) == 0.55 and learn_threshold([]) == 1.0 and learn_threshold([(0.9, 0)]) == 1.0 and abs(true_error(0.35, 0.5) - 0.15) < 1e-12` },
          { name: "sample size", code: `assert pac_sample_size(0.1, 0.01) == 47 and pac_sample_size(0.25, 0.5) == 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>learn_rectangle(samples)</C>, returning the tightest box (x_min, x_max, y_min, y_max) around the positive
          points or None, <C>predict_rect(box, p)</C>, and <C>rect_sample_size(eps, delta)</C> from the four-strip argument.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def learn_rectangle(samples):
    return None

def predict_rect(box, p):
    return False

def rect_sample_size(eps, delta):
    return 1
`,
        solution: RECTANGLE,
        tests: [
          { name: "rectangle", code: `assert learn_rectangle([((0, 0), 0)]) is None and learn_rectangle([((2, 3), 1), ((5, -1), 1), ((9, 9), 0)]) == (2, 5, -1, 3)
assert predict_rect((0, 1, 0, 1), (1, 1)) and not predict_rect((0, 1, 0, 1), (1.5, 0.5))` },
          { name: "sample size", code: `assert rect_sample_size(0.2, 0.4) == 47 and rect_sample_size(0.5, 0.04) == 37` },
        ],
      },
    },
    {
      key: "interval",
      rung: "stretch",
      prompt: (
        <p>
          The class is intervals [a, b] on the line, and the learner returns the smallest interval containing every positive
          example. Adapting the strip argument, how many examples guarantee error at most 0.1 with probability at least 0.99?
        </p>
      ),
      answer: { kind: "numeric", value: 106, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Both learners here did the same thing: return a hypothesis that agrees with every example. The next lesson makes that
        the general recipe, empirical risk minimisation, and shows how it can fail when the class is too rich.
      </p>
    </>
  ),
};
