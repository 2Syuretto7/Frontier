import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ResponseTypesViz } from "@/components/viz/ResponseTypesViz";
import type { LessonContent } from "@/lib/types";

const LINEAR = `import numpy as np

def abduct(B, x):
    return (np.eye(len(B)) - B) @ x                            # step 1: the noise that explains what was seen

def counterfactual(B, x, k, val):
    u = abduct(B, x)
    B2 = B.copy(); B2[k] = 0; u[k] = val                       # step 2: replace X_k's equation by X_k := val
    return np.linalg.solve(np.eye(len(B)) - B2, u)             # step 3: recompute with the same noise

def cf_change(B, x, k, val, j):
    return float(counterfactual(B, x, k, val)[j] - x[j])`;

const BOUNDS = `def pns_bounds(py_x, py_x0):
    return max(0.0, py_x - py_x0), min(py_x, 1 - py_x0)        # from experimental data alone (Tian and Pearl)

def pn_bounds(p_xy, p_y, py_x0, p_x0y0):
    lo = max(0.0, (p_y - py_x0) / p_xy)
    hi = min(1.0, ((1 - py_x0) - p_x0y0) / p_xy)               # combine observational and experimental data
    return lo, hi

def pn_monotone(py_given_x, py_given_x0):
    return (py_given_x - py_given_x0) / py_given_x             # excess risk ratio: exogeneity and no harm`;

export const lesson: LessonContent = {
  id: "m22.3.2",
  minutes: 55,
  links: {
    requires: ["m22.3.1", "m22.1.2"],
    revisits: ["m22.1.3", "m22.2.2"],
    foreshadows: ["m22.5.3"],
  },

  puzzle: (
    <>
      <p>
        A worker exposed to a chemical develops a disease and sues the employer. The court asks whether the disease would have
        occurred without the exposure. A trial shows the exposure raises the disease rate from 30% to 60%. Is it more likely
        than not that this worker&apos;s disease was caused by the exposure? The question concerns one person in one world that
        did not happen, and the trial was about populations.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A counterfactual keeps everything we have learned about a particular case and changes one thing. In a structural model
        that means three steps: infer the noise that explains what was observed, replace one equation, and rerun the model with
        the same noise. Different models that agree on every experiment can disagree on these answers, because experiments
        reveal how many people respond in each way only through sums. The figure shows four populations with identical
        experimental results and different shares of people whom the treatment actually helped.
      </p>
      <ResponseTypesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="counterfactual">
        <p>
          In a structural causal model with noise U, <M>{"Y_x(u)"}</M> is the value of Y with <M>{"\\mathrm{do}(X = x)"}</M> and noise
          u. Given evidence e about the actual world, the counterfactual distribution is{" "}
          <M>{"P(Y_x = y \\mid e) = \\sum_u P(u \\mid e)\\, \\mathbf 1[Y_x(u) = y]"}</M>. It is computed in three steps: abduction
          (update the noise distribution to <M>{"P(u \\mid e)"}</M>), action (replace the assignment of X by x) and prediction
          (evaluate the modified model under the updated noise).
        </p>
      </Definition>

      <Theorem title="counterfactuals in linear models">
        <p>
          For <M>{"X = BX + U"}</M> with all variables observed, the evidence <M>{"X = x"}</M> determines the noise{" "}
          <M>{"u = (I - B)x"}</M> (<C>abduct</C>), the counterfactual is the solution of the modified system{" "}
          (<C>counterfactual</C>), and the counterfactual change in <M>{"X_j"}</M> from setting <M>{"X_k = v"}</M> is the total effect
          of <M>{"X_k"}</M> on <M>{"X_j"}</M> times <M>{"v - x_k"}</M>, whatever else was observed (<C>cf_change</C>).
        </p>
        <Code>{LINEAR}</Code>
      </Theorem>
      <Proof>
        <p>
          With all variables observed, <M>{"x = Bx + u"}</M> gives u exactly, so abduction is deterministic. Let{" "}
          <M>{"B'"}</M> be B with row k zeroed and <M>{"u'"}</M> be u with entry k replaced by v. The counterfactual x′ solves{" "}
          <M>{"x' = B'x' + u'"}</M>, and the actual x solves <M>{"x = B'x + u''"}</M> with <M>{"u''"}</M> equal to u except{" "}
          <M>{"u''_k = x_k"}</M>. Subtracting,{" "}
          <M>{"x' - x = (I - B')^{-1}(v - x_k)e_k"}</M>, whose entry j is the sum over directed paths from k to j of products of
          coefficients, the total effect. In a linear model every unit has the same effect, so unit-level counterfactuals add
          nothing to interventional knowledge; the interesting cases are nonlinear.
        </p>
      </Proof>

      <Definition title="probabilities of causation">
        <p>For binary X and Y, with x′ and y′ the other values:</p>
        <MD>{"\\mathrm{PN} = P(Y_{x'} = y' \\mid X = x, Y = y), \\quad \\mathrm{PS} = P(Y_x = y \\mid X = x', Y = y'), \\quad \\mathrm{PNS} = P(Y_x = y, Y_{x'} = y')."}</MD>
        <p>
          PN, the probability of necessity, is the court&apos;s question: given exposure and disease, would the disease have been
          absent without exposure? PNS is the share of units for whom x is both needed and enough, the helped type of the figure.
        </p>
      </Definition>

      <Theorem title="bounds from experiments (Tian and Pearl)">
        <p>
          From <M>{"P(y_x) = P(Y_x = y)"}</M> and <M>{"P(y_{x'})"}</M> alone,{" "}
          <M>{"\\max(0, P(y_x) - P(y_{x'})) \\le \\mathrm{PNS} \\le \\min(P(y_x), 1 - P(y_{x'}))"}</M> (<C>pns_bounds</C>), and both
          ends are attained by some model.
        </p>
        <Code>{BOUNDS}</Code>
      </Theorem>
      <Proof>
        <p>
          Every unit has one of four response types: always (y under both), helped (y only under x), hurt (y only under x′),
          never. With shares a, h, k, n summing to 1, <M>{"P(y_x) = a + h"}</M> and <M>{"P(y_{x'}) = a + k"}</M>, and PNS = h. Then{" "}
          <M>{"h = P(y_x) - P(y_{x'}) + k \\ge P(y_x) - P(y_{x'})"}</M>, <M>{"h \\le a + h = P(y_x)"}</M> and{" "}
          <M>{"h \\le 1 - a - k = 1 - P(y_{x'})"}</M>. Setting k = 0 or a = 0, as the figure does at its ends, attains the bounds
          when the remaining shares are nonnegative.
        </p>
      </Proof>

      <Theorem title="probability of necessity under exogeneity and monotonicity">
        <p>
          If X is independent of the response type (exogeneity, as in a randomised trial) and no unit is hurt (monotonicity),
          then <M>{"\\mathrm{PN} = \\dfrac{P(y \\mid x) - P(y \\mid x')}{P(y \\mid x)}"}</M>, the excess risk ratio (<C>pn_monotone</C>).
          Without these assumptions, combining observational and experimental data gives the bounds of <C>pn_bounds</C>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The units with X = x and Y = y are, by exogeneity, a random sample of the always and helped types, in proportion a to
          h. Of these, only the helped would lack y under x′, so <M>{"\\mathrm{PN} = h/(a + h)"}</M>. With k = 0,{" "}
          <M>{"h = P(y_x) - P(y_{x'})"}</M> and <M>{"a + h = P(y_x)"}</M>, and exogeneity turns these into the observational
          conditionals.
        </p>
      </Proof>

      <Example title="the courtroom">
        <p>
          In the puzzle, the trial gives 0.6 and 0.3. If exposure never prevents disease, PN = (0.6 − 0.3)/0.6 = 0.5: exactly at the
          civil standard of more likely than not, and no higher. Without monotonicity, PN could be lower. The same algebra
          underlies attribution in epidemiology, and the abduction-action-prediction recipe underlies counterfactual fairness in
          machine learning, which asks whether a decision would change had a protected attribute been different with everything
          else about the person held fixed.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "lin",
      rung: "check",
      prompt: (
        <p>
          In the model <M>{"X := U_1"}</M>, <M>{"Y := 2X + U_2"}</M>, we observe X = 1 and Y = 3. What would Y have been had X been 0?
        </p>
      ),
      answer: { kind: "numeric", value: 1, tolerance: 0.0005 },
    },
    {
      key: "pn",
      rung: "check",
      prompt: (
        <p>
          In a randomised trial the outcome rate is 0.8 under treatment and 0.2 under control, and treatment never prevents the
          outcome. What is the probability of necessity for a treated unit with the outcome?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0005 },
    },
    {
      key: "ident",
      rung: "apply",
      prompt: <p>Why can PNS not be computed exactly from any number of randomised experiments on X?</p>,
      answer: {
        kind: "choice",
        options: [
          "Experiments reveal the marginal laws of Y under each setting, but PNS depends on their joint law across the two settings, which no unit ever reveals",
          "Because experiments have sampling error",
          "Because PNS is only defined for observational data",
          "Because PNS requires X to be continuous",
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

def abduct(B, x):
    return (np.eye(len(B)) - B) @ x                            # step 1: the noise that explains what was seen

def counterfactual(B, x, k, val):
    u = abduct(B, x)
    B2 = B.copy(); B2[k] = 0; u[k] = val                       # step 2: replace X_k's equation by X_k := val
    return np.linalg.solve(np.eye(len(B)) - B2, u)             # step 3: recompute with the same noise

def cf_change(B, x, k, val, j):
    return float(counterfactual(B, x, k, val)[j] - x[j])

B = np.array([[0.0, 0, 0], [2, 0, 0], [0, 1, 0]]); x = np.array([1.0, 3, 4])
print(abduct(B, x).tolist(), (counterfactual(B, x, 0, 0.0) + 0.0).tolist(), cf_change(B, x, 1, 0.0, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 1.0] [0.0, 1.0, 2.0] -3.0",
          "[1.0, 1.0, 1.0] [0.0, 3.0, 4.0] -3.0",
          "[1.0, 1.0, 1.0] [0.0, 1.0, 2.0] -4.0",
          "[1.0, 2.0, 3.0] [0.0, 1.0, 2.0] -3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pns_bounds(py_x, py_x0):
    return max(0.0, py_x - py_x0), min(py_x, 1 - py_x0)        # from experimental data alone (Tian and Pearl)

def pn_bounds(p_xy, p_y, py_x0, p_x0y0):
    lo = max(0.0, (p_y - py_x0) / p_xy)
    hi = min(1.0, ((1 - py_x0) - p_x0y0) / p_xy)               # combine observational and experimental data
    return lo, hi

def pn_monotone(py_given_x, py_given_x0):
    return (py_given_x - py_given_x0) / py_given_x             # excess risk ratio: exogeneity and no harm

print(pns_bounds(0.6, 0.3), [round(v, 3) for v in pn_bounds(0.25, 0.5, 0.3, 0.45)], round(pn_monotone(0.8, 0.5), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.3, 0.6) [0.8, 1.0] 0.375",
          "(0.3, 0.7) [0.8, 1.0] 0.375",
          "(0.3, 0.6) [0.8, 1.0] 0.625",
          "(0.3, 0.6) [0.4, 1.0] 0.375",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a fully observed linear model <M>{"X = BX + U"}</M>, write <C>abduct(B, x)</C>, <C>counterfactual(B, x, k, val)</C>{" "}
          and <C>cf_change(B, x, k, val, j)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def abduct(B, x):
    return x.copy()

def counterfactual(B, x, k, val):
    y = x.copy(); y[k] = val
    return y

def cf_change(B, x, k, val, j):
    return float(val - x[k])
`,
        solution: LINEAR,
        tests: [
          { name: "abduct", code: `assert np.allclose(abduct(np.array([[0.0, 0], [3, 0]]), np.array([1.0, 5])), [1, 2])` },
          { name: "cf", code: `B = np.array([[0.0, 0, 0], [2, 0, 0], [0, -1, 0]]); x = np.array([1.0, 1, 2])\nassert np.allclose(counterfactual(B, x, 0, 3.0), [3, 5, -2]) and abs(cf_change(B, x, 0, 3.0, 2) + 4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pns_bounds(py_x, py_x0)</C>, <C>pn_bounds(p_xy, p_y, py_x0, p_x0y0)</C> using{" "}
          <M>{"\\max\\big(0, \\tfrac{P(y) - P(y_{x'})}{P(x, y)}\\big) \\le \\mathrm{PN} \\le \\min\\big(1, \\tfrac{P(y'_{x'}) - P(x', y')}{P(x, y)}\\big)"}</M>,
          and <C>pn_monotone(py_given_x, py_given_x0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pns_bounds(py_x, py_x0):
    return 0.0, 1.0

def pn_bounds(p_xy, p_y, py_x0, p_x0y0):
    return 0.0, 1.0

def pn_monotone(py_given_x, py_given_x0):
    return py_given_x - py_given_x0
`,
        solution: BOUNDS,
        tests: [
          { name: "pns", code: `lo, hi = pns_bounds(0.9, 0.2); assert abs(lo - 0.7) < 1e-12 and abs(hi - 0.8) < 1e-12\nassert pns_bounds(0.3, 0.6) == (0.0, 0.3)` },
          { name: "pn", code: `assert abs(pn_monotone(0.5, 0.1) - 0.8) < 1e-12\nlo, hi = pn_bounds(0.4, 0.5, 0.3, 0.3); assert abs(lo - 0.5) < 1e-12 and abs(hi - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          In the model <M>{"X := U_1"}</M>, <M>{"M := X + U_2"}</M>, <M>{"Y := M + X + U_3"}</M>, we observe X = 1, M = 3, Y = 5. What
          would Y have been had X been 2?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the graph was given. The next chapter asks how much of it the data can reveal: which arrows are forced by
        conditional independencies, and when the shape of the noise breaks the symmetry between cause and effect.
      </p>
    </>
  ),
};
