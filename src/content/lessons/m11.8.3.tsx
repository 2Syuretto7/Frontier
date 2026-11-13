import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FlowSamplerViz } from "@/components/viz/FlowSamplerViz";
import type { LessonContent } from "@/lib/types";

const DN = `import numpy as np

MU, S, PI = np.array([-2.0, 2.0]), np.array([0.3, 0.3]), np.array([0.5, 0.5])

def denoise(x, t):
    var = S ** 2 + t ** 2
    logw = np.log(PI) - 0.5 * (x[:, None] - MU) ** 2 / var - 0.5 * np.log(var)
    w = np.exp(logw - logw.max(axis=1, keepdims=True)); w /= w.sum(axis=1, keepdims=True)
    return (w * (MU + S ** 2 / var * (x[:, None] - MU))).sum(axis=1)

def velocity(x, t):
    return (x - denoise(x, t)) / t

def time_grid(n, t_max=80.0, t_min=0.002, rho=7.0):
    i = np.arange(n) / (n - 1)
    return (t_max ** (1 / rho) + i * (t_min ** (1 / rho) - t_max ** (1 / rho))) ** rho`;

const SA = `import numpy as np

def euler_sampler(v, x, ts):
    for t, t_next in zip(ts[:-1], ts[1:]):
        x = x + (t_next - t) * v(x, t)
    return x

def heun_sampler(v, x, ts):
    nfe = 0
    for t, t_next in zip(ts[:-1], ts[1:]):
        d = v(x, t); x_e = x + (t_next - t) * d; nfe += 1
        if t_next > 0:
            x = x + 0.5 * (t_next - t) * (d + v(x_e, t_next)); nfe += 1
        else:
            x = x_e
    return x, nfe

def gaussian_flow(x, T, t, mu, s):
    return mu + (x - mu) * np.sqrt((s ** 2 + t ** 2) / (s ** 2 + T ** 2))`;

export const lesson: LessonContent = {
  id: "m11.8.3",
  minutes: 55,
  links: {
    requires: ["m11.8.1", "m7.5.5"],
    revisits: ["m11.8.2", "m7.6.1", "m11.7.1"],
    foreshadows: ["m19.5.1", "m19.6.2", "l12.1.3"],
  },

  puzzle: (
    <>
      <p>
        An image generator of the diffusion family starts from pure noise and turns it into a picture by integrating a
        differential equation, and every evaluation of the right-hand side is a full pass through a network with billions
        of parameters. Early samplers took 1000 steps. Later ones take 20 to 50 with the same trained network and no
        visible loss of quality. The network did not change; only the numerical method did. Take a toy version with an exact
        right-hand side: 40 Euler steps spaced evenly in time miss the right answer by 0.76, while the same 40 steps placed
        differently miss by 0.07, and Heun&apos;s method with the same budget by 0.04. Where do these gains come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Add Gaussian noise of growing size t to data, and the data distribution blurs into a wide Gaussian. There is a
        differential equation that runs this blurring backwards deterministically: at each moment it moves a point away from
        its best guess of the clean data, scaled by 1/t. Solving it from t = 80 down to 0 turns noise samples into data
        samples. Everything from the last two lessons applies: higher-order methods buy accuracy per evaluation, and because
        the field changes on the scale of t itself, steps should be large when t is large and tiny near 0.
      </p>
      <FlowSamplerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="noising, the denoiser and the probability flow ODE">
        <p>
          Let <M>{"x_t = x_0 + t\\varepsilon"}</M> with <M>{"x_0 \\sim p_0"}</M> (the data) and{" "}
          <M>{"\\varepsilon \\sim N(0, 1)"}</M> independent, and let <M>{"p_t"}</M> be the law of <M>{"x_t"}</M>. The denoiser
          is <M>{"D(x, t) = \\mathbb{E}[x_0 \\mid x_t = x]"}</M>, and the probability flow ODE is
        </p>
        <MD>{"\\frac{dx}{dt} = \\frac{x - D(x, t)}{t} = -t\\,\\nabla\\log p_t(x)."}</MD>
        <p>
          The second form uses Tweedie&apos;s formula <M>{"D(x, t) = x + t^2\\nabla\\log p_t(x)"}</M>. The general fact, proved in
          a later course, is that if <M>{"x(T) \\sim p_T"}</M> then the solution at time 0 has law <M>{"p_0"}</M>. For large T,{" "}
          <M>{"p_T \\approx N(0, T^2)"}</M>, which is easy to sample. A diffusion model is a network trained to approximate D.
        </p>
      </Definition>

      <Theorem title="the Gaussian case, solved exactly">
        <p>
          If <M>{"p_0 = N(\\mu, s^2)"}</M> then <M>{"D(x, t) = \\mu + \\frac{s^2}{s^2 + t^2}(x - \\mu)"}</M>, the ODE is{" "}
          <M>{"x' = \\frac{t(x - \\mu)}{s^2 + t^2}"}</M>, and its solution is
        </p>
        <MD>{"x(t) = \\mu + (x(T) - \\mu)\\sqrt{\\frac{s^2 + t^2}{s^2 + T^2}}."}</MD>
        <p>
          So the flow maps <M>{"N(\\mu, s^2 + T^2)"}</M> at time T exactly onto <M>{"N(\\mu, s^2)"}</M> at time 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(x_0, x_t)"}</M> is jointly Gaussian with <M>{"\\mathrm{Var}(x_t) = s^2 + t^2"}</M> and{" "}
          <M>{"\\mathrm{Cov}(x_0, x_t) = s^2"}</M>, so conditioning gives{" "}
          <M>{"\\mathbb{E}[x_0 \\mid x_t = x] = \\mu + \\frac{s^2}{s^2 + t^2}(x - \\mu)"}</M>. Then{" "}
          <M>{"x - D = \\frac{t^2}{s^2 + t^2}(x - \\mu)"}</M>, and dividing by t gives the ODE. For u = x − μ,{" "}
          <M>{"u'/u = \\frac{t}{s^2 + t^2} = \\tfrac12\\frac{d}{dt}\\log(s^2 + t^2)"}</M>, which integrates to the formula. If{" "}
          <M>{"x(T) - \\mu \\sim N(0, s^2 + T^2)"}</M>, multiplying by <M>{"\\sqrt{s^2/(s^2 + T^2)}"}</M> gives{" "}
          <M>{"N(0, s^2)"}</M>.
        </p>
      </Proof>

      <Theorem title="mixtures of Gaussians">
        <p>
          If <M>{"p_0 = \\sum_k \\pi_kN(\\mu_k, s_k^2)"}</M>, then{" "}
          <M>{"D(x, t) = \\sum_k w_k(x, t)\\left(\\mu_k + \\frac{s_k^2}{s_k^2 + t^2}(x - \\mu_k)\\right)"}</M> with{" "}
          <M>{"w_k \\propto \\pi_k\\,N(x;\\, \\mu_k, s_k^2 + t^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let K be the component that generated <M>{"x_0"}</M>. By the tower property,{" "}
          <M>{"\\mathbb{E}[x_0 \\mid x_t] = \\sum_k P(K = k \\mid x_t)\\,\\mathbb{E}[x_0 \\mid x_t, K = k]"}</M>. Given K = k
          the pair is Gaussian, so the inner expectation is the formula above. Under K = k,{" "}
          <M>{"x_t \\sim N(\\mu_k, s_k^2 + t^2)"}</M>, so Bayes&apos; rule gives{" "}
          <M>{"P(K = k \\mid x_t = x) \\propto \\pi_kN(x;\\, \\mu_k, s_k^2 + t^2)"}</M>. The code computes the weights in log space
          to avoid underflow and uses the exact D as a stand-in for a trained network.
        </p>
        <Code>{DN}</Code>
      </Proof>

      <Remark title="where the steps go">
        <p>
          The field <M>{"(x - D)/t"}</M> varies on the scale of t: from t = 80 to 40 almost nothing happens, while between
          t = 0.5 and 0.1 the paths split between the modes. Evenly spaced steps waste most evaluations at large t. The grid
          of Karras and coauthors is evenly spaced in <M>{"t^{1/7}"}</M> between <M>{"t_{\\max}"}</M> and{" "}
          <M>{"t_{\\min}"}</M>, then a final step to 0; with 5 points it is 80, 17.5, 2.5, 0.17, 0.002. In the Gaussian test
          below, 40 Euler steps give a worst error of 0.76 on a uniform grid and 0.07 on this one.
        </p>
      </Remark>

      <Remark title="Euler is denoise-and-renoise; Heun is second order">
        <p>
          An Euler step from t to t′ is <M>{"x + (t' - t)\\frac{x - D}{t} = D + \\frac{t'}{t}(x - D)"}</M>: predict the clean
          point, then put back the current noise estimate <M>{"x - D"}</M> shrunk to the new level. This is the DDIM update,
          and it is also what an exponential integrator gives when it solves the linear part x/t exactly and freezes D over
          the step, the same splitting idea as with the matrix exponential. Heun&apos;s method costs two evaluations per step
          except for the last step to t = 0, where it falls back to Euler since D is undefined there. With 20 Heun steps
          (39 evaluations) the error falls to 0.041. With very few steps, though, Heun&apos;s corrector can overshoot, as the
          picture shows.
        </p>
        <Code>{SA}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gauss",
      rung: "check",
      prompt: (
        <p>
          Data are N(0, 1). The flow starts at time T with T² = 99 from x(T) = 10. What is x(0)?
        </p>
      ),
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "den",
      rung: "check",
      prompt: <p>For data N(0, 1), what is the denoiser D(3, 1), the best guess of x₀ given x₁ = 3?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p>Why do good samplers place their time steps densely near t = 0 and sparsely at large t?</p>,
      answer: {
        kind: "choice",
        options: [
          "The velocity (x − D)/t changes on the scale of t, so a fixed accuracy needs steps roughly proportional to t",
          "The network is cheaper to evaluate at small t",
          "The noise at large t is so large that errors there cannot be corrected later",
          "Stability requires h < 2t at every step, whatever the accuracy",
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

MU, S, PI = np.array([-2.0, 2.0]), np.array([0.3, 0.3]), np.array([0.5, 0.5])

def denoise(x, t):
    var = S ** 2 + t ** 2
    logw = np.log(PI) - 0.5 * (x[:, None] - MU) ** 2 / var - 0.5 * np.log(var)
    w = np.exp(logw - logw.max(axis=1, keepdims=True)); w /= w.sum(axis=1, keepdims=True)
    return (w * (MU + S ** 2 / var * (x[:, None] - MU))).sum(axis=1)

def velocity(x, t):
    return (x - denoise(x, t)) / t

def time_grid(n, t_max=80.0, t_min=0.002, rho=7.0):
    i = np.arange(n) / (n - 1)
    return (t_max ** (1 / rho) + i * (t_min ** (1 / rho) - t_max ** (1 / rho))) ** rho

print([round(float(t), 3) for t in time_grid(5)])
x = np.array([-1.0, 0.1, 3.0])
print(np.round(denoise(x, 1.0), 2), np.round(denoise(x, 80.0), 2) + 0.0)
print(np.round(velocity(x, 1.0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[80.0, 17.528, 2.515, 0.17, 0.002]\n[-1.83  0.34  2.08] [0. 0. 0.]\n[ 0.83 -0.24  0.92]",
          "[80.0, 60.0, 40.0, 20.0, 0.002]\n[-1.83  0.34  2.08] [0. 0. 0.]\n[ 0.83 -0.24  0.92]",
          "[80.0, 17.528, 2.515, 0.17, 0.002]\n[-2.  2.  2.] [-1.   0.1  3. ]\n[ 1.  -1.9  1. ]",
          "[80.0, 17.528, 2.515, 0.17, 0.002]\n[-1.83  0.34  2.08] [-1.   0.1  3. ]\n[ 0.83 -0.24  0.92]",
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

def euler_sampler(v, x, ts):
    for t, t_next in zip(ts[:-1], ts[1:]):
        x = x + (t_next - t) * v(x, t)
    return x

def heun_sampler(v, x, ts):
    nfe = 0
    for t, t_next in zip(ts[:-1], ts[1:]):
        d = v(x, t); x_e = x + (t_next - t) * d; nfe += 1
        if t_next > 0:
            x = x + 0.5 * (t_next - t) * (d + v(x_e, t_next)); nfe += 1
        else:
            x = x_e
    return x, nfe

def gaussian_flow(x, T, t, mu, s):
    return mu + (x - mu) * np.sqrt((s ** 2 + t ** 2) / (s ** 2 + T ** 2))

mu, s, T = 1.0, 0.5, 80.0
v = lambda x, t: t * (x - mu) / (s ** 2 + t ** 2)
z = np.array([-1.0, 0.0, 1.0, 2.0]); xT = mu + np.sqrt(s ** 2 + T ** 2) * z; x0 = mu + s * z
print(np.round(gaussian_flow(xT, T, 0.0, mu, s), 4), bool(np.allclose(gaussian_flow(xT, T, 0.0, mu, s), x0)))
uni = np.linspace(T, 0.0, 41)
kar = np.append((T ** (1 / 7) + np.linspace(0, 1, 40) * (0.002 ** (1 / 7) - T ** (1 / 7))) ** 7, 0.0)
err = lambda y: float(np.abs(y - x0).max())
xh, nfe = heun_sampler(v, xT, kar[::2])
print([round(err(euler_sampler(v, xT, g)), 2) for g in (uni, kar)], round(err(xh), 3), nfe)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5 1.  1.5 2. ] True\n[0.76, 0.07] 0.041 39",
          "[0.5 1.  1.5 2. ] True\n[0.07, 0.76] 0.041 39",
          "[0.5 1.  1.5 2. ] True\n[0.76, 0.07] 0.041 40",
          "[-79. 1. 81. 161.] False\n[0.76, 0.07] 0.041 39",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With module-level arrays <C>MU</C>, <C>S</C>, <C>PI</C> describing a Gaussian mixture, write{" "}
          <C>denoise(x, t)</C> for an array x, <C>velocity(x, t)</C> = (x − D)/t, and{" "}
          <C>time_grid(n, t_max, t_min, rho)</C>, n points evenly spaced in t^(1/ρ) from t_max down to t_min.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

MU, S, PI = np.array([-2.0, 2.0]), np.array([0.3, 0.3]), np.array([0.5, 0.5])

def denoise(x, t):
    return x

def velocity(x, t):
    return 0 * x

def time_grid(n, t_max=80.0, t_min=0.002, rho=7.0):
    return np.linspace(t_max, t_min, n)
`,
        solution: DN,
        tests: [
          { name: "grid", code: `g = time_grid(5)
assert np.isclose(g[0], 80.0) and np.isclose(g[-1], 0.002) and np.all(np.diff(g) < 0)
assert np.isclose(g[1], (80 ** (1 / 7) + 0.25 * (0.002 ** (1 / 7) - 80 ** (1 / 7))) ** 7) and np.allclose(time_grid(3, 16.0, 1.0, 2.0), [16.0, 6.25, 1.0])` },
          { name: "denoise", code: `MU, S, PI = np.array([1.0]), np.array([2.0]), np.array([1.0])
assert np.allclose(denoise(np.array([3.0, 1.0]), 2.0), [2.0, 1.0]) and np.allclose(velocity(np.array([3.0]), 2.0), [0.5])
MU, S, PI = np.array([-2.0, 2.0]), np.array([0.3, 0.3]), np.array([0.5, 0.5])
d = denoise(np.array([-1.0, 0.0, 2.5]), 0.05)
assert abs(d[1]) < 1e-12 and d[0] < -0.99 and np.isclose(d[2], 2.0 + 0.09 / 0.0925 * 0.5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler_sampler(v, x, ts)</C>, stepping along the decreasing grid <C>ts</C>;{" "}
          <C>heun_sampler(v, x, ts)</C>, returning the final x and the number of evaluations, using an Euler step whenever
          the next time is 0; and <C>gaussian_flow(x, T, t, mu, s)</C>, the exact solution for Gaussian data.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def euler_sampler(v, x, ts):
    return x

def heun_sampler(v, x, ts):
    return x, 0

def gaussian_flow(x, T, t, mu, s):
    return x
`,
        solution: SA,
        tests: [
          { name: "steps", code: `assert np.isclose(euler_sampler(lambda x, t: 1.0, 0.0, [3.0, 2.0, 0.0]), -3.0)
y, n = heun_sampler(lambda x, t: t, 0.0, [3.0, 2.0, 1.0, 0.0])
assert n == 5 and np.isclose(y, -2.5 - 1.5 - 1.0)` },
          { name: "flow", code: `assert np.allclose(gaussian_flow(np.array([11.0, 1.0]), np.sqrt(99.0), 0.0, 1.0, 1.0), [2.0, 1.0])
v = lambda x, t: t * (x - 1.0) / (0.25 + t ** 2); ts = np.append(np.geomspace(80.0, 0.002, 30), 0.0)
xT = np.array([-40.0, 0.0, 70.0]); y, n = heun_sampler(v, xT, ts)
assert n == 59 and np.allclose(y, gaussian_flow(xT, 80.0, 0.0, 1.0, 0.5), atol=0.05)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For data N(μ, s²), the probability flow ODE is x′ = t(x − μ)/(s² + t²). Show that x(t) = μ + (x(T) − μ)√((s² + t²)/(s² +
          T²)) solves it, and deduce that if x(T) ~ N(μ, s² + T²) then x(0) ~ N(μ, s²).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates: d/dt √(s² + t²) = t/√(s² + t²), so x′(t) = (x(T) − μ)·t/(√(s² + t²)√(s² + T²)).",
          "Rewrites this as t(x(t) − μ)/(s² + t²), confirming the ODE, and notes the formula gives x(T) at t = T.",
          "At t = 0, x(0) − μ = (x(T) − μ)·s/√(s² + T²), a scaling of an N(0, s² + T²) variable, so x(0) ~ N(μ, s²).",
        ],
      },
    },
    {
      key: "renoise",
      rung: "stretch",
      prompt: (
        <p>
          At t = 2 the state is x = 4 and the denoiser returns D = 1. What is the state after one Euler step to t′ = 1?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a diffusion model turns noise into data by solving a differential equation backwards in noise level, why the Gaussian case can be solved exactly, why steps should be spaced in proportion to the noise level, and why an Euler step is the same as predicting the clean image and adding back a smaller amount of the current noise.",

  glimpse: (
    <>
      <p>
        This ends the numerical methods course. The next course is information theory: entropy, cross-entropy and the KL
        divergence, the quantities that loss functions, compression and the training objectives of generative models are
        built from.
      </p>
    </>
  ),
};
