import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DoremiViz } from "@/components/viz/DoremiViz";
import type { LessonContent } from "@/lib/types";

const DOREMI = `import numpy as np

def excess_loss(proxy, ref):
    return np.maximum(np.asarray(proxy) - np.asarray(ref), 0.0)   # how far the proxy lags the reference, per domain

def doremi_step(alpha, excess, eta, c):
    a = np.asarray(alpha) * np.exp(eta * np.asarray(excess))      # exponentiated gradient on the domain weights
    a /= a.sum()
    return (1 - c) * a + c / len(a)               # mix with uniform so no domain vanishes

def simulate(ref, E, k, steps=200, eta=1.0, c=1e-3):
    alpha = np.full(len(ref), 1 / len(ref))
    seen, history = np.zeros(len(ref)), []
    for _ in range(steps):
        seen += alpha                             # toy proxy: each domain's loss falls with the data it has had
        proxy = np.asarray(E) + np.asarray(k) / (1 + seen)
        alpha = doremi_step(alpha, excess_loss(proxy, ref), eta, c)
        history.append(alpha)
    return np.mean(history, axis=0)               # the final weights average over the run`;

const REGMIX = `import numpy as np

def fit_linear(W, y):
    coef, *_ = np.linalg.lstsq(np.asarray(W, dtype=float), np.asarray(y, dtype=float), rcond=None)
    return coef                                   # no intercept: the weights already sum to 1

def predict(coef, w):
    return float(np.asarray(w, dtype=float) @ coef)

def best_mixture(coef, candidates):
    return min(candidates, key=lambda w: predict(coef, w))`;

export const lesson: LessonContent = {
  id: "e11.6.2",
  minutes: 50,
  links: {
    requires: ["e11.6.1", "m3.5.3"],
    revisits: ["m16.6.3", "m10.7.4"],
    foreshadows: ["e11.6.3"],
  },

  puzzle: (
    <>
      <p>
        A corpus has twenty domains. Hand-tuning twenty weights with full training runs is impossible, and fitting a scaling law per
        domain ignores how domains help each other. One team trains a small model whose own training adjusts the weights as it goes,
        leaning toward whatever domain it currently finds hardest, and transfers the resulting weights to a model thirty times larger,
        which then trains faster than with the original weights. Another trains hundreds of tiny models on random mixtures and fits a
        regression. How do these methods work, and what can go wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        DoReMi trains a reference model on default weights, then a proxy model of the same size whose weights are updated during
        training: domains where the proxy&apos;s loss is well above the reference&apos;s get more weight, multiplicatively, so the proxy
        cannot neglect any domain it could still learn. The average of these weights over training becomes the mixture for the large
        model. Regression approaches instead treat the mixture as an input, measure the loss of many cheap runs, and fit a model that
        predicts loss from weights.
      </p>
      <DoremiViz />
    </>
  ),

  theory: (
    <>
      <Definition title="DoReMi">
        <p>
          <C>excess_loss</C> is <M>{"\\lambda_d = \\max(L^{\\text{proxy}}_d - L^{\\text{ref}}_d, 0)"}</M>. <C>doremi_step</C> sets{" "}
          <M>{"\\alpha_d \\leftarrow \\alpha_d e^{\\eta \\lambda_d}"}</M>, normalises, and mixes with the uniform distribution by a small
          c. <C>simulate</C> runs the loop on a toy proxy whose loss on each domain falls with the weight it has received, and returns
          the average weights.
        </p>
        <Code>{DOREMI}</Code>
      </Definition>

      <Theorem title="the update is mirror ascent">
        <p>
          Before smoothing, the update is the unique maximiser over the simplex of{" "}
          <M>{"\\langle \\alpha, \\lambda \\rangle - \\tfrac1\\eta \\mathrm{KL}(\\alpha \\,\\|\\, \\alpha^{\\text{old}})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The objective is strictly concave in α, since KL is strictly convex. With a multiplier μ for{" "}
          <M>{"\\sum_d \\alpha_d = 1"}</M>, setting the derivative to zero gives{" "}
          <M>{"\\lambda_d - \\tfrac1\\eta (\\log(\\alpha_d/\\alpha^{\\text{old}}_d) + 1) = \\mu"}</M>, so{" "}
          <M>{"\\alpha_d \\propto \\alpha^{\\text{old}}_d e^{\\eta \\lambda_d}"}</M>. This is exponentiated gradient, or mirror ascent
          with the entropy (m10.7.4), on the worst-case objective <M>{"\\max_\\alpha \\sum_d \\alpha_d \\lambda_d"}</M>: the multiplicative
          weights method (m16.6.3) playing against the proxy model.
        </p>
      </Proof>

      <Definition title="regression on mixtures">
        <p>
          Given small runs with weight vectors <M>{"w^{(i)}"}</M> and losses <M>{"y_i"}</M>, <C>fit_linear</C> fits{" "}
          <M>{"y \\approx w \\cdot \\beta"}</M> by least squares (m3.5.3); no intercept is needed because weights sum to 1, which would
          make an intercept redundant. <C>predict</C> evaluates the fit, and <C>best_mixture</C> picks the candidate with the lowest
          prediction.
        </p>
        <Code>{REGMIX}</Code>
      </Definition>

      <Theorem title="linear fits pick corners">
        <p>
          Over the whole simplex, a linear prediction <M>{"w \\cdot \\beta"}</M> is minimised at a vertex: all weight on the domain with
          the smallest <M>{"\\beta_d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any w in the simplex, <M>{"w \\cdot \\beta = \\sum_d w_d \\beta_d \\ge \\min_d \\beta_d \\sum_d w_d = \\min_d \\beta_d"}</M>,
          with equality at the vertex of that domain. So a linear model cannot express diminishing returns, and searching freely over
          mixtures with it is meaningless; practical regression methods use non-linear models, such as gradient-boosted trees, or restrict
          the search to candidates near the mixtures that were actually run.
        </p>
      </Proof>

      <Remark title="learned mixtures in practice">
        <p>
          DoReMi, with 280M-parameter proxy and reference models, found weights that let an 8B model reach the baseline&apos;s accuracy
          in far fewer steps on The Pile. Its weights depend on the reference model and on how domains are defined, and later work found
          the gains sensitive to these choices. RegMix trained hundreds of very small models on random mixtures and fit a boosted-tree
          regressor, then simulated the best mixture. Online methods adjust weights during the main run itself. Every learned mixture
          should be checked with ablations at a larger scale, the subject of the next lesson.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The first team ran DoReMi: the proxy&apos;s weights drifted toward domains where it lagged the reference and settled once it
          caught up, and their average transferred to the large model. The second ran a regression, which works when the regressor can
          represent diminishing returns and the search stays near observed mixtures; a linear fit would have put all weight on one domain.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "step",
      rung: "check",
      prompt: (
        <p>
          With weights (0.5, 0.5), excess losses (0.2, 0), η = 1 and no smoothing, what is the first domain&apos;s new weight? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.55, tolerance: 0.001 },
    },
    {
      key: "smooth",
      rung: "check",
      prompt: <p>With four domains and c = 0.1, what does smoothing turn a normalised weight of 0.02 into? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.043, tolerance: 0.0001 },
    },
    {
      key: "average",
      rung: "apply",
      prompt: <p>Why does DoReMi use the weights averaged over the proxy&apos;s training rather than the final weights?</p>,
      answer: {
        kind: "choice",
        options: [
          "The weights move as the proxy learns, and the average reflects how much data each domain needed over the whole run",
          "The final weights are always uniform",
          "Averaging removes the need for a reference model",
          "The large model trains on the proxy's data",
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

def excess_loss(proxy, ref):
    return np.maximum(np.asarray(proxy) - np.asarray(ref), 0.0)   # how far the proxy lags the reference, per domain

def doremi_step(alpha, excess, eta, c):
    a = np.asarray(alpha) * np.exp(eta * np.asarray(excess))      # exponentiated gradient on the domain weights
    a /= a.sum()
    return (1 - c) * a + c / len(a)               # mix with uniform so no domain vanishes

def simulate(ref, E, k, steps=200, eta=1.0, c=1e-3):
    alpha = np.full(len(ref), 1 / len(ref))
    seen, history = np.zeros(len(ref)), []
    for _ in range(steps):
        seen += alpha                             # toy proxy: each domain's loss falls with the data it has had
        proxy = np.asarray(E) + np.asarray(k) / (1 + seen)
        alpha = doremi_step(alpha, excess_loss(proxy, ref), eta, c)
        history.append(alpha)
    return np.mean(history, axis=0)               # the final weights average over the run

a = doremi_step([0.5, 0.5], excess_loss([2.3, 1.0], [2.0, 1.2]), 1.0, 0.0)
print(excess_loss([2.3, 1.0], [2.0, 1.2]).round(2).tolist(), np.round(a, 3).tolist(), np.round(doremi_step([1.0, 0.0], [0, 0], 1.0, 0.5), 2).tolist(), simulate([1, 1], [0.5, 0.5], [2, 2], 50).round(2).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.3, 0.0] [0.574, 0.426] [0.75, 0.25] [0.5, 0.5]",
          "[0.3, 0.0] [0.5, 0.5] [0.75, 0.25] [0.5, 0.5]",
          "[0.3, -0.2] [0.574, 0.426] [0.75, 0.25] [0.5, 0.5]",
          "[0.3, 0.0] [0.574, 0.426] [1.0, 0.0] [0.5, 0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fit_linear(W, y):
    coef, *_ = np.linalg.lstsq(np.asarray(W, dtype=float), np.asarray(y, dtype=float), rcond=None)
    return coef                                   # no intercept: the weights already sum to 1

def predict(coef, w):
    return float(np.asarray(w, dtype=float) @ coef)

def best_mixture(coef, candidates):
    return min(candidates, key=lambda w: predict(coef, w))

coef = fit_linear([[1, 0], [0, 1], [0.5, 0.5]], [3.0, 2.0, 2.5])
print(np.round(coef, 2).tolist(), round(predict(coef, [0.25, 0.75]), 2), best_mixture(coef, [[0.9, 0.1], [0.3, 0.7], [0.6, 0.4]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[3.0, 2.0] 2.25 [0.3, 0.7]", "[3.0, 2.0] 2.75 [0.3, 0.7]", "[3.0, 2.0] 2.25 [0.9, 0.1]", "[2.0, 3.0] 2.25 [0.3, 0.7]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>excess_loss(proxy, ref)</C>; <C>doremi_step(alpha, excess, eta, c)</C>; and{" "}
          <C>simulate(ref, E, k, steps=200, eta=1.0, c=1e-3)</C>, which starts from uniform weights and at each step adds the current
          weights to the data seen, sets the proxy loss to <M>{"E_d + k_d/(1 + \\text{seen}_d)"}</M>, updates the weights, and records
          them, returning their mean.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def excess_loss(proxy, ref):
    return np.asarray(proxy) - np.asarray(ref)

def doremi_step(alpha, excess, eta, c):
    return np.asarray(alpha, dtype=float)

def simulate(ref, E, k, steps=200, eta=1.0, c=1e-3):
    return np.full(len(ref), 1 / len(ref))
`,
        solution: DOREMI,
        tests: [
          { name: "step", code: `assert excess_loss([1.0, 3.0], [2.0, 1.0]).tolist() == [0.0, 2.0]\na = doremi_step([0.25, 0.75], [np.log(3), 0.0], 1.0, 0.0)\nassert np.allclose(a, [0.5, 0.5]) and np.allclose(doremi_step([1.0, 0.0], [0.0, 0.0], 1.0, 0.2), [0.9, 0.1])` },
          { name: "simulate", code: `w = simulate([1.0, 1.0], [0.5, 0.9], [2.0, 2.0], 100, 1.0, 0.0)\nassert abs(w.sum() - 1) < 1e-9 and w[1] > 0.6\nassert np.allclose(simulate([5.0, 5.0], [0.0, 0.0], [1.0, 1.0], 10), [0.5, 0.5])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_linear(W, y)</C>, least squares without an intercept using <C>np.linalg.lstsq</C>; <C>predict(coef, w)</C>,
          returning a float; and <C>best_mixture(coef, candidates)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_linear(W, y):
    return np.zeros(len(W[0]))

def predict(coef, w):
    return 0.0

def best_mixture(coef, candidates):
    return candidates[0]
`,
        solution: REGMIX,
        tests: [
          { name: "fit", code: `c = fit_linear([[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.2, 0.3, 0.5]], [2.0, 3.0, 4.0, 3.3])\nassert np.allclose(c, [2.0, 3.0, 4.0]) and abs(predict(c, [0.5, 0.5, 0.0]) - 2.5) < 1e-9 and isinstance(predict(c, [1, 0, 0]), float)` },
          { name: "best", code: `assert best_mixture(np.array([2.0, 1.0]), [[0.5, 0.5], [0.1, 0.9], [0.8, 0.2]]) == [0.1, 0.9]` },
        ],
      },
    },
    {
      key: "corner",
      rung: "stretch",
      prompt: (
        <p>
          A linear fit gives per-domain coefficients 2.9 for web, 2.4 for code and 3.6 for books. What predicted loss does the best
          mixture over the whole simplex achieve?
        </p>
      ),
      answer: { kind: "numeric", value: 2.4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every method so far predicts what will happen at scale from something smaller. The next lesson asks how small ablation runs can
        be trusted to rank data choices correctly, and how to design them.
      </p>
    </>
  ),
};
