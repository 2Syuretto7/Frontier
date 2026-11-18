import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NormDescentViz } from "@/components/viz/NormDescentViz";
import type { LessonContent } from "@/lib/types";

const DIR = `import numpy as np

def dual_norm(g, p):
    q = 1.0 if p == np.inf else np.inf if p == 1 else p / (p - 1)
    return float(np.linalg.norm(np.asarray(g, float), q))

def steepest_dir(g, p):
    g = np.asarray(g, float)
    if p == np.inf:
        return -np.sign(g)
    if p == 1:
        d = np.zeros_like(g)
        i = int(np.argmax(np.abs(g)))
        d[i] = -np.sign(g[i])
        return d
    d = -np.sign(g) * np.abs(g) ** (1 / (p - 1))
    return d / np.linalg.norm(d, p)

def steepest_step(g, p, L):
    return dual_norm(g, p) / L * steepest_dir(g, p)`;

const SMOOTH = `import numpy as np

def smoothness(h, p):
    return float(np.sum(h)) if p == np.inf else float(np.max(h))

def guaranteed_decrease(g, h, p):
    q = 1 if p == np.inf else np.inf if p == 1 else 2
    return float(np.linalg.norm(np.asarray(g, float), q)) ** 2 / (2 * smoothness(h, p))

def run_steepest(h, x0, p, steps):
    h, x = np.asarray(h, float), np.asarray(x0, float).copy()
    L, out = smoothness(h, p), []
    for _ in range(steps):
        g = h * x
        if p == np.inf:
            x = x - np.sum(np.abs(g)) / L * np.sign(g)
        elif p == 1:
            i = int(np.argmax(np.abs(g)))
            x[i] -= g[i] / L
        else:
            x = x - g / L
        out.append(0.5 * float(np.sum(h * x * x)))
    return out`;

export const lesson: LessonContent = {
  id: "m14.3.1",
  minutes: 45,
  links: {
    requires: ["m14.1.1", "m6.5.1"],
    revisits: ["m14.2.3", "m10.2.4"],
    foreshadows: ["m14.3.2", "m14.3.4", "m14.3.5"],
  },

  puzzle: (
    <>
      <p>
        &quot;Move against the gradient&quot; sounds like the only sensible rule, but it hides a choice. The direction of
        steepest descent is the one that lowers the loss most per unit of distance, and distance needs a norm. Measure it
        with the Euclidean norm and you get gradient descent; measure it by the largest change to any single coordinate and
        you get something else entirely, an algorithm you have already met under another name. Which norm should an
        optimiser use?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Picture the unit ball of a norm and the gradient as a direction. The steepest direction is the point of the ball
        that the gradient pushes against hardest. For the round Euclidean ball that is the gradient itself. For the cube
        of the max norm it is a corner, the vector of signs: every coordinate moves by the same amount. For the diamond of
        the ℓ₁ norm it is a vertex, a single coordinate. How far to go depends on how quickly the gradient changes when
        measured in the same norm, and a norm that suits the loss&apos;s curvature lets you take a step that is both long
        and safe.
      </p>
      <NormDescentViz />
    </>
  ),

  theory: (
    <>
      <Definition title="steepest descent under a norm">
        <p>
          For a norm ‖·‖ with dual norm <M>{"\\|g\\|_* = \\max_{\\|d\\| \\le 1}\\langle g, d\\rangle"}</M>, the steepest
          descent direction is <M>{"d^* = \\arg\\min_{\\|d\\| \\le 1}\\langle g, d\\rangle"}</M>, so{" "}
          <M>{"\\langle g, d^*\\rangle = -\\|g\\|_*"}</M>. The function f is L-smooth with respect to ‖·‖ if{" "}
          <M>{"f(x+\\Delta) \\le f(x) + \\langle \\nabla f(x), \\Delta\\rangle + \\tfrac{L}{2}\\|\\Delta\\|^2"}</M> for all x
          and Δ.
        </p>
      </Definition>

      <Theorem title="the steepest directions of the ℓp norms">
        <p>
          Let q be the conjugate exponent, 1/p + 1/q = 1. For ℓ₂, <M>{"d^* = -g/\\|g\\|_2"}</M>. For ℓ∞,{" "}
          <M>{"d^* = -\\operatorname{sign}(g)"}</M> and <M>{"\\|g\\|_* = \\|g\\|_1"}</M>. For ℓ₁,{" "}
          <M>{"d^* = -\\operatorname{sign}(g_i)e_i"}</M> with i maximising <M>{"|g_i|"}</M>, and{" "}
          <M>{"\\|g\\|_* = \\|g\\|_\\infty"}</M>. For 1 &lt; p &lt; ∞,{" "}
          <M>{"d^*_i \\propto -\\operatorname{sign}(g_i)|g_i|^{q-1}"}</M>, normalised to <M>{"\\|d^*\\|_p = 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Hölder&apos;s inequality gives <M>{"\\langle g, d\\rangle \\ge -\\|g\\|_q\\|d\\|_p \\ge -\\|g\\|_q"}</M>, so{" "}
          <M>{"\\|g\\|_* = \\|g\\|_q"}</M>, and it remains to show each d* attains the bound. For ℓ∞,{" "}
          <M>{"\\langle g, -\\operatorname{sign}(g)\\rangle = -\\sum|g_i|"}</M>. For ℓ₁, the single coordinate gives{" "}
          <M>{"-\\max|g_i|"}</M>. For 1 &lt; p &lt; ∞, with <M>{"d_i = -\\operatorname{sign}(g_i)|g_i|^{q-1}"}</M> we have{" "}
          <M>{"\\langle g, d\\rangle = -\\sum|g_i|^q"}</M> and <M>{"\\|d\\|_p^p = \\sum|g_i|^{(q-1)p} = \\sum|g_i|^q"}</M>, so
          after normalising <M>{"\\langle g, d\\rangle = -\\|g\\|_q^q/\\|g\\|_q^{q/p} = -\\|g\\|_q"}</M>.
        </p>
        <Code>{DIR}</Code>
      </Proof>

      <Theorem title="the step and the guaranteed decrease">
        <p>
          If f is L-smooth with respect to ‖·‖, the step <M>{"\\Delta = (\\|g\\|_*/L)\\,d^*"}</M> minimises the upper bound
          and guarantees <M>{"f(x+\\Delta) \\le f(x) - \\|g\\|_*^2/(2L)"}</M>. For{" "}
          <M>{"f = \\tfrac12\\sum_i h_ix_i^2"}</M> with <M>{"h_i > 0"}</M>, the smallest constants are{" "}
          <M>{"L_2 = L_1 = \\max_i h_i"}</M> and <M>{"L_\\infty = \\sum_i h_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write Δ = s·d with ‖d‖ ≤ 1 and s ≥ 0. The bound is <M>{"\\langle g, sd\\rangle + \\tfrac{L}{2}s^2"}</M>,
          minimised over d by d* (value <M>{"-s\\|g\\|_*"}</M>) and then over s at <M>{"s = \\|g\\|_*/L"}</M>, giving{" "}
          <M>{"-\\|g\\|_*^2/(2L)"}</M>. For the quadratic the remainder is exactly <M>{"\\tfrac12\\sum h_i\\Delta_i^2"}</M>.
          It is at most <M>{"\\tfrac12\\max h\\,\\|\\Delta\\|_2^2 \\le \\tfrac12\\max h\\,\\|\\Delta\\|_1^2"}</M>, with equality
          for Δ along the stiffest axis, and at most <M>{"\\tfrac12\\sum h\\,\\|\\Delta\\|_\\infty^2"}</M>, with equality for
          Δ a vector of ±1.
        </p>
        <Code>{SMOOTH}</Code>
      </Proof>

      <Remark title="which norm wins">
        <p>
          The ℓ∞ guarantee <M>{"\\|g\\|_1^2/(2\\sum h)"}</M> beats the ℓ₂ guarantee <M>{"\\|g\\|_2^2/(2\\max h)"}</M> when the
          gradient is spread over many coordinates, so <M>{"\\|g\\|_1^2"}</M> is close to <M>{"d\\|g\\|_2^2"}</M>, and the
          curvature is concentrated, so <M>{"\\sum h"}</M> is close to <M>{"\\max h"}</M>. That is the &quot;one stiff&quot;
          case in the figure. Sign descent is Adam with its averages switched off, so this is one explanation of why Adam
          does well: it is steepest descent in a geometry that tolerates a few stiff directions. The catch is that the
          stiff directions of a real network need not be aligned with the coordinate axes. For a weight matrix the natural
          analogue of the max norm is the spectral norm, whose steepest direction orthogonalises the gradient; that is the
          idea behind Muon, later in this chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dual",
      rung: "check",
      prompt: <p>The gradient is g = (3, −4, 12). What is the dual norm of the ℓ∞ norm at g, the rate of decrease along the steepest ℓ∞ direction?</p>,
      answer: { kind: "numeric", value: 19, tolerance: 0.0001 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          On ½Σhᵢxᵢ² in 100 dimensions with h = (100, 1, 1, …, 1), the gradient has every |gᵢ| = 1. By what factor is the
          ℓ∞ guaranteed decrease larger than the ℓ₂ one? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 50.25, tolerance: 0.006 },
    },
    {
      key: "sign",
      rung: "apply",
      prompt: <p>Adam with β₁ = β₂ = 0 and ε = 0 steps by −η·sign(g). Of which norm is that the steepest descent direction?</p>,
      answer: {
        kind: "choice",
        options: [
          "The ℓ∞ norm, whose unit ball is a cube with corners at the sign vectors",
          "The ℓ₂ norm",
          "The ℓ₁ norm",
          "None: sign descent is not steepest descent for any norm",
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

def dual_norm(g, p):
    q = 1.0 if p == np.inf else np.inf if p == 1 else p / (p - 1)
    return float(np.linalg.norm(np.asarray(g, float), q))

def steepest_dir(g, p):
    g = np.asarray(g, float)
    if p == np.inf:
        return -np.sign(g)
    if p == 1:
        d = np.zeros_like(g)
        i = int(np.argmax(np.abs(g)))
        d[i] = -np.sign(g[i])
        return d
    d = -np.sign(g) * np.abs(g) ** (1 / (p - 1))
    return d / np.linalg.norm(d, p)

def steepest_step(g, p, L):
    return dual_norm(g, p) / L * steepest_dir(g, p)

g = [3.0, -4.0]
print([round(dual_norm(g, p), 3) for p in (1, 2, np.inf)], steepest_dir(g, 1), steepest_dir(g, np.inf), steepest_dir(g, 2))
print(steepest_step(g, np.inf, 2.0), round(float(np.dot(g, steepest_dir(g, 3))), 3), round(dual_norm(g, 3), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 5.0, 7.0] [0. 1.] [-1.  1.] [-0.6  0.8]\n[-3.5  3.5] -5.584 5.584",
          "[7.0, 5.0, 4.0] [0. 1.] [-1.  1.] [-0.6  0.8]\n[-2.  2.] -5.584 5.584",
          "[4.0, 5.0, 7.0] [-1.  0.] [-1.  1.] [-0.6  0.8]\n[-3.5  3.5] -5.584 5.584",
          "[4.0, 5.0, 7.0] [0. 1.] [-1.  1.] [-0.6  0.8]\n[-3.5  3.5] -4.498 4.498",
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

def smoothness(h, p):
    return float(np.sum(h)) if p == np.inf else float(np.max(h))

def guaranteed_decrease(g, h, p):
    q = 1 if p == np.inf else np.inf if p == 1 else 2
    return float(np.linalg.norm(np.asarray(g, float), q)) ** 2 / (2 * smoothness(h, p))

def run_steepest(h, x0, p, steps):
    h, x = np.asarray(h, float), np.asarray(x0, float).copy()
    L, out = smoothness(h, p), []
    for _ in range(steps):
        g = h * x
        if p == np.inf:
            x = x - np.sum(np.abs(g)) / L * np.sign(g)
        elif p == 1:
            i = int(np.argmax(np.abs(g)))
            x[i] -= g[i] / L
        else:
            x = x - g / L
        out.append(0.5 * float(np.sum(h * x * x)))
    return out

h = [100.0, 1.0, 1.0, 1.0]
print(smoothness(h, 2), smoothness(h, np.inf), round(guaranteed_decrease([100.0, 1.0, 1.0, 1.0], h, 2), 3), round(guaranteed_decrease([100.0, 1.0, 1.0, 1.0], h, np.inf), 3))
print([round(v, 3) for v in run_steepest([4.0, 1.0], [1.0, -2.0], np.inf, 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "100.0 103.0 50.015 51.5\n[0.4, 0.144]",
          "103.0 100.0 51.5 50.015\n[0.4, 0.144]",
          "100.0 103.0 50.015 51.5\n[0.4, 0.0]",
          "100.0 100.0 50.015 53.045\n[0.4, 0.144]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dual_norm(g, p)</C>, the dual of the ℓp norm at g, for p = 1, p = <C>np.inf</C> or 1 &lt; p &lt; ∞;{" "}
          <C>steepest_dir(g, p)</C>, a d* with ‖d*‖_p = 1 (for ℓ₁ take the first index of largest |gᵢ|); and{" "}
          <C>steepest_step(g, p, L)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dual_norm(g, p):
    return float(np.linalg.norm(g))

def steepest_dir(g, p):
    g = np.asarray(g, float)
    return -g / np.linalg.norm(g)

def steepest_step(g, p, L):
    return -np.asarray(g, float) / L
`,
        solution: DIR,
        tests: [
          { name: "dual", code: `g = [3.0, -4.0, 12.0]; assert abs(dual_norm(g, np.inf) - 19) < 1e-12 and abs(dual_norm(g, 1) - 12) < 1e-12 and abs(dual_norm(g, 2) - 13) < 1e-12
assert abs(dual_norm([3.0, -4.0], 4) - np.linalg.norm([3.0, -4.0], 4 / 3)) < 1e-12
assert np.allclose(steepest_dir([1.0, -3.0, 3.0], 1), [0, 1, 0]) and np.allclose(steepest_step([3.0, -4.0], np.inf, 2.0), [-3.5, 3.5])` },
          { name: "attain", code: `rng = np.random.default_rng(0)
for p in [1, 1.5, 2, 3, np.inf]:
    g = rng.standard_normal(6); d = steepest_dir(g, p)
    assert abs(np.linalg.norm(d, p) - 1) < 1e-9 and abs(g @ d + dual_norm(g, p)) < 1e-9
    e = rng.standard_normal(6); e /= np.linalg.norm(e, p); assert g @ e >= g @ d - 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For <C>f = ½Σhᵢxᵢ²</C>, write <C>smoothness(h, p)</C> for p = 1, 2 or <C>np.inf</C>;{" "}
          <C>guaranteed_decrease(g, h, p)</C>, equal to <C>‖g‖_*²/(2L)</C>; and <C>run_steepest(h, x0, p, steps)</C>, taking
          the steps <C>(‖g‖_*/L)d*</C> and returning the loss after each (ℓ₁ updates the first largest coordinate).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def smoothness(h, p):
    return float(np.max(h))

def guaranteed_decrease(g, h, p):
    return 0.0

def run_steepest(h, x0, p, steps):
    return []
`,
        solution: SMOOTH,
        tests: [
          { name: "constants", code: `h = [100.0, 1.0, 1.0, 1.0]; assert smoothness(h, np.inf) == 103 and smoothness(h, 2) == 100 and smoothness(h, 1) == 100
assert abs(guaranteed_decrease([100.0, 1.0, 1.0, 1.0], h, np.inf) - 51.5) < 1e-9 and abs(guaranteed_decrease([3.0, -4.0], [1.0, 1.0], 1) - 8) < 1e-9
assert np.allclose(run_steepest([4.0, 1.0], [1.0, -2.0], np.inf, 2), [0.4, 0.144])` },
          { name: "guarantee", code: `rng = np.random.default_rng(2)
for p in [1, 2, np.inf]:
    h = rng.random(8) * 10 + 0.1; x = rng.standard_normal(8); f = [0.5 * float(np.sum(h * x * x))] + run_steepest(h, x, p, 30)
    assert len(f) == 31
    y = x.copy(); fy = run_steepest(h, y, p, 1)[0]; assert f[0] - fy >= guaranteed_decrease(h * x, h, p) - 1e-9 and all(a >= b - 1e-12 for a, b in zip(f, f[1:]))` },
        ],
      },
    },
    {
      key: "l4",
      rung: "stretch",
      prompt: <p>For g = (3, −4), how fast does the loss fall along the steepest direction of the ℓ₄ norm, that is, what is ‖g‖_* for p = 4? Give two decimals.</p>,
      answer: { kind: "numeric", value: 5.91, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Choosing a norm is choosing a preconditioner in disguise. The next lesson makes that explicit: steepest descent in
        the norm <M>{"\\sqrt{x^\\top Px}"}</M> is gradient descent on the problem seen through <M>{"P^{-1/2}"}</M>, and the
        best P is the curvature itself.
      </p>
    </>
  ),
};
