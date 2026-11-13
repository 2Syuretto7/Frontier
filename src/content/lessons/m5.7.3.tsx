import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PolarCellsViz } from "@/components/viz/PolarCellsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.7.3",
  minutes: 65,
  links: {
    requires: ["m5.7.2", "m5.2.3"],
    revisits: ["m2.6.4", "m5.4.3"],
    foreshadows: ["m5.7.4"],
  },

  puzzle: (
    <>
      <p>
        The bell curve <M>{"e^{-x^2}"}</M> has no elementary antiderivative, yet the area under it is exactly{" "}
        <M>{"\\sqrt\\pi"}</M>. The classic proof squares the integral, turning it into an integral over the whole plane, and then
        switches to polar coordinates, where it becomes easy.
      </p>
      <p>But when you switch coordinates, how must the area element dx dy change?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A change of variables x = T(u) carries a small cell of area du to a small patch of area about{" "}
        <M>{"|\\det J_T(u)|\\,du"}</M>, as we saw in the Jacobian lesson. So to integrate over x you can integrate over u,
        weighting each cell by that stretch factor.
      </p>
      <PolarCellsViz />
      <p>
        For polar coordinates the factor is r, so <M>{"dx\\,dy = r\\,dr\\,d\\theta"}</M>. For a linear map it is the constant{" "}
        <M>{"|\\det A|"}</M>. In probability the same factor converts one density into another, which is how normalising flows
        compute exact likelihoods.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="change of variables">
        <p>
          Let T be a <M>{"C^1"}</M> map that is one-to-one from an open set U onto T(U), with <M>{"\\det J_T \\ne 0"}</M> on U.
          For f integrable on T(U),
        </p>
        <MD>{"\\int_{T(U)} f(x)\\,dx = \\int_U f(T(u))\\, |\\det J_T(u)|\\,du."}</MD>
        <p>
          The conditions may fail on a set of zero area, such as the ray θ = 0 or the point r = 0 for polar coordinates.
        </p>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) Cover U by a fine grid of cells <M>{"Q_k"}</M> with centres <M>{"u_k"}</M>. Their images partition T(U), and
          by the Jacobian lesson, <M>{"\\mathrm{area}(T(Q_k)) = |\\det J_T(u_k)|\\,\\mathrm{area}(Q_k)\\,(1 + o(1))"}</M> uniformly
          as the cells shrink. So <M>{"\\sum_k f(T(u_k))\\,\\mathrm{area}(T(Q_k))"}</M>, a Riemann-type sum for the left side, is
          close to <M>{"\\sum_k f(T(u_k))|\\det J_T(u_k)|\\,\\mathrm{area}(Q_k)"}</M>, a Riemann sum for the right side. Both tend
          to their integrals.
        </p>
      </Proof>

      <Example title="the Gaussian integral">
        <p>Let <M>{"I = \\int_{-\\infty}^\\infty e^{-x^2}dx"}</M>. By Fubini (Tonelli, since the integrand is positive),</p>
        <MD>{"I^2 = \\iint_{\\mathbb R^2} e^{-(x^2 + y^2)}\\,dx\\,dy = \\int_0^{2\\pi}\\!\\!\\int_0^\\infty e^{-r^2} r\\,dr\\,d\\theta = 2\\pi \\cdot \\tfrac12 = \\pi,"}</MD>
        <p>so <M>{"I = \\sqrt\\pi"}</M>. The factor r is what makes the inner integral elementary.</p>
      </Example>

      <Example title="spherical coordinates and linear maps">
        <ul>
          <li>
            <M>{"(\\rho, \\varphi, \\theta) \\mapsto (\\rho\\sin\\varphi\\cos\\theta, \\rho\\sin\\varphi\\sin\\theta, \\rho\\cos\\varphi)"}</M>{" "}
            has <M>{"|\\det J| = \\rho^2 \\sin\\varphi"}</M>, so the unit ball has volume{" "}
            <M>{"\\int_0^{2\\pi}\\int_0^\\pi\\int_0^1 \\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta = \\tfrac43\\pi"}</M>.
          </li>
          <li>
            For x = Au with A invertible, <M>{"\\mathrm{vol}(A\\,D) = |\\det A|\\,\\mathrm{vol}(D)"}</M>: the ellipse{" "}
            <M>{"x^2/a^2 + y^2/b^2 \\le 1"}</M> is the unit disc stretched by diag(a, b), so its area is πab.
          </li>
        </ul>
      </Example>

      <Remark title="densities and normalising flows">
        <p>
          If X has density <M>{"p_X"}</M> and Y = T(X) with T invertible, then{" "}
          <M>{"p_Y(y) = p_X(T^{-1}(y))\\,|\\det J_{T^{-1}}(y)|"}</M>, that is{" "}
          <M>{"\\log p_Y(y) = \\log p_X(x) - \\log|\\det J_T(x)|"}</M> with x = <M>{"T^{-1}(y)"}</M>. A normalising flow is a
          learned invertible T whose log-determinant is cheap; its exact log-likelihood is this formula, and its gradient uses{" "}
          <M>{"\\nabla \\log|\\det| = J^{-\\top}"}</M> from chapter 4.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "polar",
      rung: "check",
      prompt: <p>In polar coordinates, what does dx dy become?</p>,
      answer: { kind: "choice", options: ["r dr dθ", "dr dθ", "r² dr dθ", "(1/r) dr dθ"], correct: [0] },
    },
    {
      key: "ellipse",
      rung: "check",
      prompt: <p>What is the area of the ellipse <M>{"x^2/4 + y^2/9 \\le 1"}</M>? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 6 * Math.PI, tolerance: 0.01 },
    },
    {
      key: "disc",
      rung: "apply",
      prompt: (
        <p>
          Compute <M>{"\\iint_{x^2 + y^2 \\le 4} (x^2 + y^2)\\,dA"}</M> using polar coordinates. Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 8 * Math.PI, tolerance: 0.01 },
    },
    {
      key: "gauss",
      rung: "apply",
      prompt: <p>What is <M>{"\\int_{-\\infty}^{\\infty} e^{-x^2/2}\\,dx"}</M>? Give four decimal places.</p>,
      answer: { kind: "numeric", value: Math.sqrt(2 * Math.PI), tolerance: 1e-4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
n = 400
r = (np.arange(n) + 0.5) * 3 / n
t = (np.arange(n) + 0.5) * 2 * np.pi / n
Rr, Tt = np.meshgrid(r, t)
with_r = np.sum(np.exp(-Rr ** 2) * Rr) * (3 / n) * (2 * np.pi / n)
without = np.sum(np.exp(-Rr ** 2)) * (3 / n) * (2 * np.pi / n)
print(round(with_r, 3), round(without, 3))`}</Code>
          <p>
            Integrating <M>{"e^{-(x^2 + y^2)}"}</M> over the disc of radius 3 in polar coordinates, with and without the factor r.
            What does this print?
          </p>
        </>
      ),
      answer: { kind: "choice", options: ["3.141 5.568", "3.142 3.142", "5.568 3.141", "1.571 2.784"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 0.0], [1.0, 1.0]])
b = np.array([1.0, -1.0])
y = np.array([3.0, 0.5])
x = np.linalg.solve(A, y - b)
log_px = -0.5 * x @ x - np.log(2 * np.pi)
log_py = log_px - np.log(abs(np.linalg.det(A)))
print(x, round(np.log(abs(np.linalg.det(A))), 4), round(log_py, 4))`}</Code>
          <p>The density of Y = AX + b for a standard normal X, at one point. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.  0.5] 0.6931 -3.156", "[1.  0.5] 0.6931 -1.7698", "[2.  1.5] 0.6931 -3.156", "[1.  0.5] -0.6931 -1.7698"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>polar_integral(f, R, n)</C>, the integral of f(x, y) over the disc of radius R, by the midpoint rule on an n ×
          n grid in (r, θ) with the Jacobian factor; and <C>ball_integral(f, R, n)</C>, the integral of f(x, y, z) over the ball
          of radius R by the midpoint rule on an n × n × n grid in spherical coordinates (ρ, φ, θ) with factor{" "}
          <M>{"\\rho^2\\sin\\varphi"}</M>. f works elementwise on arrays.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def polar_integral(f, R, n):
    return 0.0

def ball_integral(f, R, n):
    return 0.0
`,
        solution: `import numpy as np

def polar_integral(f, R, n):
    r = (np.arange(n) + 0.5) * R / n
    t = (np.arange(n) + 0.5) * 2 * np.pi / n
    Rr, T = np.meshgrid(r, t)
    vals = f(Rr * np.cos(T), Rr * np.sin(T)) * Rr
    return float(vals.sum() * (R / n) * (2 * np.pi / n))

def ball_integral(f, R, n):
    rho = (np.arange(n) + 0.5) * R / n
    phi = (np.arange(n) + 0.5) * np.pi / n
    th = (np.arange(n) + 0.5) * 2 * np.pi / n
    P, F, T = np.meshgrid(rho, phi, th, indexing="ij")
    x, y, z = P * np.sin(F) * np.cos(T), P * np.sin(F) * np.sin(T), P * np.cos(F)
    vals = f(x, y, z) * P ** 2 * np.sin(F)
    return float(vals.sum() * (R / n) * (np.pi / n) * (2 * np.pi / n))
`,
        tests: [
          { name: "disc", code: `import numpy as np
one = lambda x, y: np.ones_like(x)
assert abs(polar_integral(one, 2.0, 200) - 4 * np.pi) < 1e-9, 'With the factor r the area of a disc is exact here.'
assert abs(polar_integral(lambda x, y: x ** 2 + y ** 2, 2.0, 400) - 8 * np.pi) < 1e-3` },
          { name: "ball", code: `import numpy as np
one = lambda x, y, z: np.ones_like(x)
assert abs(ball_integral(one, 1.0, 60) - 4 * np.pi / 3) < 1e-3
assert abs(ball_integral(lambda x, y, z: z ** 2, 1.0, 60) - 4 * np.pi / 15) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          A one-layer normalising flow: y = Ax + b with x standard normal in <M>{"\\mathbb R^n"}</M>. Write{" "}
          <C>flow_logpdf(y, A, b)</C>, returning log p(y) by the change-of-variables formula, with x found by a linear solve and
          the log-determinant from <C>np.linalg.slogdet</C>. The check compares it with the normal density with covariance{" "}
          <M>{"AA^\\top"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def flow_logpdf(y, A, b):
    return 0.0
`,
        solution: `import numpy as np

def flow_logpdf(y, A, b):
    y, A, b = np.asarray(y, float), np.asarray(A, float), np.asarray(b, float)
    x = np.linalg.solve(A, y - b)
    n = len(x)
    log_px = -0.5 * x @ x - 0.5 * n * np.log(2 * np.pi)
    sign, logdet = np.linalg.slogdet(A)
    return float(log_px - logdet)
`,
        tests: [
          { name: "matches the Gaussian", code: `import numpy as np
rng = np.random.default_rng(0)
A, b, y = rng.standard_normal((3, 3)), rng.standard_normal(3), rng.standard_normal(3)
S = A @ A.T
d = y - b
ref = -0.5 * d @ np.linalg.solve(S, d) - 0.5 * np.log(np.linalg.det(2 * np.pi * S))
assert abs(flow_logpdf(y, A, b) - ref) < 1e-10` },
          { name: "integrates to one", code: `import numpy as np
A, b = np.array([[2.0, 0.0], [1.0, 1.0]]), np.array([1.0, -1.0])
g = np.linspace(-12, 12, 241)
h = g[1] - g[0]
tot = sum(np.exp(flow_logpdf([u, v], A, b)) for u in g for v in g) * h * h
assert abs(tot - 1) < 1e-3, tot` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Show that the polar map has <M>{"|\\det J| = r"}</M>, and use it with Fubini to prove{" "}
          <M>{"\\int_{-\\infty}^\\infty e^{-x^2}\\,dx = \\sqrt\\pi"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes J = [[cos θ, −r sin θ], [sin θ, r cos θ]] and det J = r cos²θ + r sin²θ = r.",
          "Writes I² = ∫∫ e^{−(x²+y²)} dx dy using Fubini or Tonelli (justified by positivity).",
          "Changes to polar coordinates: ∫₀^{2π} ∫₀^∞ e^{−r²} r dr dθ, and evaluates the inner integral as ½ by substitution.",
          "Concludes I² = π and I = √π since I > 0.",
        ],
      },
    },
    {
      key: "ball",
      rung: "stretch",
      prompt: <p>Using spherical coordinates, what is the volume of the unit ball in <M>{"\\mathbb R^3"}</M>? Give four decimal places.</p>,
      answer: { kind: "numeric", value: (4 * Math.PI) / 3, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why changing variables in a multiple integral needs the absolute Jacobian determinant, using polar coordinates and the Gaussian integral as the example.",

  glimpse: (
    <p>
      In two or three dimensions, grids work well. In a hundred they are hopeless. The last lesson asks why, and what
      randomness offers instead.
    </p>
  ),
};
