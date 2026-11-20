import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MarginBoundViz } from "@/components/viz/MarginBoundViz";
import type { LessonContent } from "@/lib/types";

const MARGINS = `def margins(w, data):
    return [y * sum(a * b for a, b in zip(w, x)) for x, y in data]

def ramp_loss(t, gamma):
    if t <= 0:
        return 1.0
    return 0.0 if t >= gamma else 1 - t / gamma

def margin_error(w, data, gamma):
    return sum(t < gamma for t in margins(w, data)) / len(data)`;

const BOUNDS = `import math

def margin_bound(m_err, B, X, gamma, m, delta):
    return m_err + 2 * B * X / (gamma * math.sqrt(m)) + math.sqrt(math.log(1 / delta) / (2 * m))

def normalised_margin(w, data):
    n = math.sqrt(sum(c * c for c in w))
    return min(y * sum(a * b for a, b in zip(w, x)) for x, y in data) / n

def bound_over_grid(ms, B, X, delta, grid):
    m = len(ms)
    return min(margin_bound(sum(t < g for t in ms) / m, B, X, g, m, delta / len(grid)) for g in grid)`;

export const lesson: LessonContent = {
  id: "m16.3.2",
  minutes: 45,
  links: {
    requires: ["m16.3.1"],
    revisits: ["m16.2.2"],
    foreshadows: ["m16.5.1", "m16.7.3"],
  },

  puzzle: (
    <>
      <p>
        Half-spaces in a million dimensions have VC dimension a million and one, so the VC bound needs millions of examples
        before it says anything. Yet a linear classifier on a million features, trained on ten thousand examples, often works.
        Two separators may both classify the training set perfectly, one squeezing between the classes and one passing with
        room to spare. Should their guarantees differ, and can the room to spare stand in for the dimension?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A classifier that separates the data by a wide margin is robust: small perturbations of the points do not change its
        predictions, so it cannot be exploiting accidents of the sample. Scoring a classifier by how many points it gets right
        <em> by at least γ</em>, rather than merely right, replaces the counting of labellings with a Lipschitz loss, and the
        Rademacher bound for norm-bounded linear functions then depends on the margin and not on the dimension.
      </p>
      <MarginBoundViz />
    </>
  ),

  theory: (
    <>
      <Definition title="margin and ramp loss">
        <p>
          For a real-valued predictor f and a labelled point (x, y) with y = ±1, the margin is y f(x) (<C>margins</C>); the
          prediction sign f(x) is correct when it is positive. The ramp loss at scale γ is 1 for margins at most 0, 0 for
          margins at least γ, and linear in between (<C>ramp_loss</C>). It lies between the 0-1 loss and the margin loss{" "}
          <M>{"\\mathbf 1[y f(x) < \\gamma]"}</M> (<C>margin_error</C>), and it is 1/γ-Lipschitz.
        </p>
        <Code>{MARGINS}</Code>
      </Definition>

      <Theorem title="the margin bound">
        <p>
          Let <M>{"F = \\{x \\mapsto \\langle w, x \\rangle : \\|w\\| \\le B\\}"}</M> and <M>{"\\|x\\| \\le X"}</M>. For fixed γ &gt; 0,
          with probability at least 1 − δ, every f in F satisfies
        </p>
        <MD>{"\\Pr[y f(x) \\le 0] \\le \\frac1m \\big|\\{i : y_i f(x_i) < \\gamma\\}\\big| + \\frac{2BX}{\\gamma\\sqrt m} + \\sqrt{\\frac{\\ln(1/\\delta)}{2m}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The 0-1 loss is at most the ramp loss, and the ramp loss is at most the margin loss, so it suffices to bound the
          expected ramp loss by its empirical value plus a deviation term. Apply the Rademacher bound (m16.3.1) to the class
          of ramp losses of F. By the contraction lemma its complexity is at most 1/γ times that of the margins{" "}
          <M>{"(x, y) \\mapsto y\\langle w, x\\rangle"}</M>, which is a bounded linear class with complexity at most{" "}
          <M>{"BX/\\sqrt m"}</M>. Doubling gives the middle term (<C>margin_bound</C>).
        </p>
      </Proof>

      <Remark title="choosing γ after seeing the data">
        <p>
          The bound holds for a γ fixed in advance, but the best γ depends on the margins found. Apply it on a grid of K values
          with confidence δ/K each; by the union bound all K hold at once, and the smallest can be used (<C>bound_over_grid</C>).
          A geometric grid <M>{"\\gamma_k = 2^{-k}"}</M> costs only a <M>{"\\ln\\log_2(1/\\gamma)"}</M> term. Only the ratio of
          the margin to the scale BX matters, so it is often stated with the normalised margin{" "}
          <M>{"\\min_i y_i \\langle w, x_i\\rangle / \\|w\\|"}</M> (<C>normalised_margin</C>).
        </p>
        <Code>{BOUNDS}</Code>
      </Remark>

      <Theorem title="dimension-free shattering">
        <p>
          Linear classifiers that achieve normalised margin γ on points of norm at most X can shatter at most{" "}
          <M>{"(X/\\gamma)^2"}</M> points, in any dimension.
        </p>
      </Theorem>
      <Proof>
        <p>
          If m points are shattered with margin γ by unit vectors, then for every sign vector σ some unit w has{" "}
          <M>{"\\sigma_i \\langle w, x_i \\rangle \\ge \\gamma"}</M>, so <M>{"\\langle w, \\sum_i \\sigma_i x_i \\rangle \\ge m\\gamma"}</M> and{" "}
          <M>{"\\|\\sum_i \\sigma_i x_i\\| \\ge m\\gamma"}</M>. Averaging the square over random σ gives{" "}
          <M>{"\\sum_i \\|x_i\\|^2 \\ge m^2\\gamma^2"}</M>, so <M>{"mX^2 \\ge m^2\\gamma^2"}</M> and <M>{"m \\le (X/\\gamma)^2"}</M>.
        </p>
      </Proof>

      <Remark title="where margins lead">
        <p>
          Maximising the margin is the support vector machine, and the bound explains why it can use enormous feature spaces,
          even infinite ones through kernels (m16.5.1). Margin ideas also reappear in the analysis of deep networks: gradient
          descent on separable data drifts towards the maximum-margin solution (m16.7.3), and normalised-margin bounds for
          networks replace the norm of w by products of layer norms.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>A separator has no margin errors at γ, with BX/γ = 10, on m = 40000 examples. What is the margin bound at δ = 0.01? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1076, tolerance: 0.0001 },
    },
    {
      key: "ramp",
      rung: "check",
      prompt: <p>What is the ramp loss at scale γ = 0.4 of a point with margin 0.3?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "dimension",
      rung: "apply",
      prompt: <p>Why does the margin bound for linear classifiers not depend on the dimension of the inputs?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its complexity term comes from the Rademacher complexity of norm-bounded linear functions, which depends on the norms B and X, not on the number of coordinates",
          "It assumes the inputs have been projected to two dimensions",
          "The margin loss ignores all but one coordinate of x",
          "High-dimensional data are always separable",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def margins(w, data):
    return [y * sum(a * b for a, b in zip(w, x)) for x, y in data]

def ramp_loss(t, gamma):
    if t <= 0:
        return 1.0
    return 0.0 if t >= gamma else 1 - t / gamma

def margin_error(w, data, gamma):
    return sum(t < gamma for t in margins(w, data)) / len(data)

d = [((1, 0), 1), ((0, 2), -1), ((-1, -1), -1)]; print(margins((2, -1), d), round(margin_error((2, -1), d, 1.5), 4))
print(ramp_loss(-0.5, 1), ramp_loss(0.25, 1), ramp_loss(3, 2), ramp_loss(1, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 2, 1] 0.3333\n1.0 0.75 0.0 0.75",
          "[2, -2, 1] 0.3333\n1.0 0.75 0.0 0.75",
          "[2, 2, 1] 0.6667\n1.0 0.75 0.0 0.75",
          "[2, 2, 1] 0.3333\n1.0 0.25 0.0 0.75",
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

def margin_bound(m_err, B, X, gamma, m, delta):
    return m_err + 2 * B * X / (gamma * math.sqrt(m)) + math.sqrt(math.log(1 / delta) / (2 * m))

def normalised_margin(w, data):
    n = math.sqrt(sum(c * c for c in w))
    return min(y * sum(a * b for a, b in zip(w, x)) for x, y in data) / n

def bound_over_grid(ms, B, X, delta, grid):
    m = len(ms)
    return min(margin_bound(sum(t < g for t in ms) / m, B, X, g, m, delta / len(grid)) for g in grid)

print(round(margin_bound(0.1, 1, 1, 0.1, 10000, 0.05), 4), round(normalised_margin((3, 4), [((1, 0), 1), ((0, -1), -1)]), 4))
print(round(bound_over_grid([0.5, 0.2, 0.05, 0.9] * 2500, 1, 1, 0.1, [0.1, 0.5]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3122 0.6\n0.4622",
          "0.2122 0.6\n0.4622",
          "0.3122 3.0\n0.4622",
          "0.3122 0.6\n0.5522",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>margins(w, data)</C>, <C>ramp_loss(t, gamma)</C> and <C>margin_error(w, data, gamma)</C>, the fraction of
          points with margin strictly below gamma.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def margins(w, data):
    return [0 for _ in data]

def ramp_loss(t, gamma):
    return 0.0

def margin_error(w, data, gamma):
    return 0.0
`,
        solution: MARGINS,
        tests: [
          { name: "margins", code: `D = [((1, 2), 1), ((2, -3), -1)]; assert margins((1, 1), D) == [3, 1] and margin_error((1, 1), D, 2) == 0.5 and margin_error((1, 1), D, 1) == 0.0` },
          { name: "ramp", code: `assert ramp_loss(0, 1) == 1.0 and ramp_loss(0.5, 2) == 0.75 and ramp_loss(2, 2) == 0.0 and ramp_loss(-3, 0.1) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>margin_bound(m_err, B, X, gamma, m, delta)</C>, <C>normalised_margin(w, data)</C>, and{" "}
          <C>bound_over_grid(ms, B, X, delta, grid)</C>, the smallest bound over the grid with confidence split evenly.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def margin_bound(m_err, B, X, gamma, m, delta):
    return m_err

def normalised_margin(w, data):
    return 0.0

def bound_over_grid(ms, B, X, delta, grid):
    return 1.0
`,
        solution: BOUNDS,
        tests: [
          { name: "bound", code: `assert abs(margin_bound(0.0, 2, 1, 0.5, 64, math.exp(-8)) - 1.25) < 1e-12 and abs(margin_bound(0.5, 1, 1, 1.0, 4, 1.0) - 1.5) < 1e-12` },
          { name: "margin and grid", code: `assert abs(normalised_margin((0, 2), [((1, 1), 1), ((5, -3), -1)]) - 1.0) < 1e-12
assert abs(bound_over_grid([0.2] * 100, 1, 1, 0.1, [0.1, 0.3]) - margin_bound(1.0, 1, 1, 0.3, 100, 0.05)) < 1e-12` },
        ],
      },
    },
    {
      key: "howmany",
      rung: "stretch",
      prompt: (
        <p>
          Data of norm at most 1 are separable with normalised margin 0.05. Taking B = 1 and γ = 0.05, so that there are no
          margin errors, how many thousand examples make the margin bound at most 0.1 with δ = 0.05? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 169.9, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Rademacher complexity averages over random signs; covering numbers take a geometric view instead, counting how many
        balls of radius ε it takes to cover the class. The next lesson connects the two and shows how chaining sharpens the
        bounds.
      </p>
    </>
  ),
};
