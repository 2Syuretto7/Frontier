import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ErmGapViz } from "@/components/viz/ErmGapViz";
import type { LessonContent } from "@/lib/types";

const ERM = `def empirical_risk(h, samples):
    return sum(h(x) != y for x, y in samples) / len(samples)

def erm(hypotheses, samples):
    return min(hypotheses, key=lambda h: empirical_risk(h, samples))

def memoriser(samples):
    table = dict(samples)
    return lambda x: table.get(x, 0)`;

const FINITE = `import math

def finite_class_size(n_hyp, eps, delta):
    return math.ceil(math.log(n_hyp / delta) / eps)

def union_bound(errors, eps, m):
    return sum((1 - e) ** m for e in errors if e > eps)

def excess_risk_split(learned, best_in_class, bayes):
    return best_in_class - bayes, learned - best_in_class`;

export const lesson: LessonContent = {
  id: "m16.1.2",
  minutes: 45,
  links: {
    requires: ["m16.1.1"],
    revisits: ["m9.2.4"],
    foreshadows: ["m16.1.3", "m16.2.1", "m16.4.2"],
  },

  puzzle: (
    <>
      <p>
        A learner that stores every training example in a table and looks it up at test time makes no mistakes on the
        training data. On new data it is useless. A learner restricted to thresholds makes a few training mistakes and
        generalises well. Both minimise training error over their own class. What makes the difference, and can the
        difference be quantified?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The true risk is unobservable, so a learner minimises the training error instead and hopes the two are close. They
        are close when the class is small enough that no hypothesis can fit the sample by accident. A table that can store
        any labelling fits noise as happily as signal; a class of thresholds cannot. Choosing the class in advance, before
        seeing data, is the learner&apos;s inductive bias.
      </p>
      <ErmGapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="empirical risk minimisation">
        <p>
          For a sample <M>{"S = ((x_1, y_1), \\dots, (x_m, y_m))"}</M>, the empirical risk of h is{" "}
          <M>{"L_S(h) = \\tfrac1m |\\{i : h(x_i) \\neq y_i\\}|"}</M> (<C>empirical_risk</C>). ERM over a class H returns any{" "}
          <M>{"h_S \\in \\arg\\min_{h \\in H} L_S(h)"}</M> (<C>erm</C>). Without restricting H, ERM can return the memoriser,
          which has <M>{"L_S = 0"}</M> and true risk as bad as guessing whenever test points are new (<C>memoriser</C>).
        </p>
        <Code>{ERM}</Code>
      </Definition>

      <Theorem title="ERM over a finite class">
        <p>
          Let H be finite and the problem realisable. With probability at least 1 − δ, every h in H with{" "}
          <M>{"L_S(h) = 0"}</M> has <M>{"L_D(h) \\le \\varepsilon"}</M>, provided
        </p>
        <MD>{"m \\ge \\frac{\\ln(|H| / \\delta)}{\\varepsilon}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Call h bad if <M>{"L_D(h) > \\varepsilon"}</M>. A fixed bad h labels each example correctly with probability less
          than 1 − ε, so it fits all m with probability below <M>{"(1 - \\varepsilon)^m \\le e^{-\\varepsilon m}"}</M>. ERM fails only
          if some bad h fits the sample, and by the union bound that has probability at most the sum over bad hypotheses
          (<C>union_bound</C>), hence at most <M>{"|H| e^{-\\varepsilon m}"}</M>. Setting this to δ gives the bound
          (<C>finite_class_size</C>). The size of the class enters only through its logarithm: a class of a million
          hypotheses costs about 14/ε extra examples, and a class described by b bits costs at most b ln 2 / ε.
        </p>
        <Code>{FINITE}</Code>
      </Proof>

      <Definition title="approximation and estimation error">
        <p>
          Let <M>{"L^*"}</M> be the Bayes risk, the lowest risk of any function. The excess risk of the learned{" "}
          <M>{"h_S"}</M> splits as
        </p>
        <MD>{"L_D(h_S) - L^* = \\underbrace{\\min_{h \\in H} L_D(h) - L^*}_{\\text{approximation}} + \\underbrace{L_D(h_S) - \\min_{h \\in H} L_D(h)}_{\\text{estimation}}"}</MD>
        <p>
          (<C>excess_risk_split</C>). A richer class lowers the approximation error and raises the estimation error. This
          bias-complexity trade-off is the learning-theory form of the bias-variance trade-off (m9.2.4), and regularisation
          (m16.4.2) is one way to move along it continuously.
        </p>
      </Definition>

      <Remark title="ERM is a principle, not an algorithm">
        <p>
          Minimising the 0-1 training error exactly is computationally hard even for half-spaces. Practice minimises a
          convex surrogate such as the logistic or hinge loss, which is why the surrogate&apos;s relation to the 0-1 loss
          matters. The statistical theory in this course mostly assumes that ERM can be carried out and asks how many
          examples it needs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>A class has 1024 hypotheses and the problem is realisable. How many examples does the bound ln(|H|/δ)/ε require for ε = 0.01 and δ = 0.05?</p>,
      answer: { kind: "numeric", value: 993, tolerance: 0.5 },
    },
    {
      key: "union",
      rung: "check",
      prompt: <p>Two hypotheses have true error 0.15 and 0.25, and the rest have error below ε = 0.1. With m = 20 examples, what is the union bound on the probability that a bad hypothesis fits the whole sample? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0419, tolerance: 0.0001 },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: <p>Moving from a small hypothesis class to a much richer one, with the same amount of data, typically does what?</p>,
      answer: {
        kind: "choice",
        options: [
          "Lowers the approximation error and raises the estimation error",
          "Lowers both the approximation and the estimation error",
          "Raises the approximation error and lowers the estimation error",
          "Leaves the excess risk unchanged, since ERM always finds the best hypothesis",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def empirical_risk(h, samples):
    return sum(h(x) != y for x, y in samples) / len(samples)

def erm(hypotheses, samples):
    return min(hypotheses, key=lambda h: empirical_risk(h, samples))

def memoriser(samples):
    table = dict(samples)
    return lambda x: table.get(x, 0)

S = [(1, 0), (2, 1), (3, 1), (5, 1)]; H = [lambda x: 0, lambda x: 1, lambda x: int(x >= 2), lambda x: int(x >= 4)]
print([empirical_risk(h, S) for h in H], H.index(erm(H, S)), memoriser(S)(3), memoriser(S)(4), empirical_risk(memoriser(S), S))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.75, 0.25, 0.0, 0.5] 2 1 0 0.0",
          "[0.25, 0.75, 0.0, 0.5] 2 1 0 0.0",
          "[0.75, 0.25, 0.0, 0.5] 2 1 1 0.0",
          "[0.75, 0.25, 0.0, 0.5] 3 1 0 0.0",
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

def finite_class_size(n_hyp, eps, delta):
    return math.ceil(math.log(n_hyp / delta) / eps)

def union_bound(errors, eps, m):
    return sum((1 - e) ** m for e in errors if e > eps)

def excess_risk_split(learned, best_in_class, bayes):
    return best_in_class - bayes, learned - best_in_class

print(finite_class_size(1000, 0.05, 0.01), finite_class_size(2 ** 20, 0.05, 0.01))
print(round(union_bound([0.01, 0.2, 0.3], 0.1, 10), 4), excess_risk_split(0.25, 0.125, 0.0625))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "231 370\n0.1356 (0.0625, 0.125)",
          "230 369\n0.1356 (0.0625, 0.125)",
          "231 370\n1.04 (0.0625, 0.125)",
          "231 370\n0.1356 (0.125, 0.0625)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>empirical_risk(h, samples)</C>, <C>erm(hypotheses, samples)</C>, returning the first hypothesis with the
          smallest empirical risk, and <C>memoriser(samples)</C>, which returns a function that looks up stored labels and
          predicts 0 for unseen points.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def empirical_risk(h, samples):
    return 0.0

def erm(hypotheses, samples):
    return hypotheses[0]

def memoriser(samples):
    return lambda x: 1
`,
        solution: ERM,
        tests: [
          { name: "risk and erm", code: `S = [(0, 0), (1, 1), (2, 1), (3, 0)]
H = [lambda x: 1, lambda x: int(x >= 1), lambda x: int(1 <= x <= 2), lambda x: int(x == 1 or x == 2)]
assert empirical_risk(H[0], S) == 0.5 and empirical_risk(H[1], S) == 0.25 and erm(H, S) is H[2]` },
          { name: "memoriser", code: `f = memoriser([(1, 1), (7, 0), (9, 1)]); assert f(1) == 1 and f(7) == 0 and f(9) == 1 and f(5) == 0 and empirical_risk(f, [(1, 1), (9, 1)]) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>finite_class_size(n_hyp, eps, delta)</C>, <C>union_bound(errors, eps, m)</C>, summing the probability that
          each hypothesis with error above eps fits m examples, and <C>excess_risk_split(learned, best_in_class, bayes)</C>,
          returning the approximation and estimation errors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def finite_class_size(n_hyp, eps, delta):
    return 1

def union_bound(errors, eps, m):
    return 0.0

def excess_risk_split(learned, best_in_class, bayes):
    return 0.0, 0.0
`,
        solution: FINITE,
        tests: [
          { name: "size", code: `assert finite_class_size(1, 0.1, 0.01) == 47 and finite_class_size(100, 0.5, 0.5) == 11` },
          { name: "union and split", code: `assert abs(union_bound([0.5, 0.05, 0.75], 0.1, 2) - 0.3125) < 1e-12 and union_bound([0.01], 0.1, 5) == 0
assert excess_risk_split(0.5, 0.25, 0.0) == (0.25, 0.25) and excess_risk_split(0.375, 0.125, 0.125) == (0.0, 0.25)` },
        ],
      },
    },
    {
      key: "epsilon",
      rung: "stretch",
      prompt: (
        <p>
          ERM over a realisable class of one million hypotheses returns a consistent hypothesis on 500 examples. What error
          level ε does the finite-class bound guarantee with confidence 0.95? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0336, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If small classes generalise, why not make the class as large as possible and let the data decide? The next lesson
        shows that no learner can succeed on every problem: some prior restriction is unavoidable.
      </p>
    </>
  ),
};
