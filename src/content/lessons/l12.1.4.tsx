import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EdmSolverViz } from "@/components/viz/EdmSolverViz";
import type { LessonContent } from "@/lib/types";

const PRECOND = `import math

def edm_coeffs(sigma, sd):
    r = sigma * sigma + sd * sd
    return sd * sd / r, sigma * sd / math.sqrt(r), 1 / math.sqrt(r), 0.25 * math.log(sigma)   # c_skip, c_out, c_in, c_noise

def edm_denoise(F, x, sigma, sd):
    c_skip, c_out, c_in, c_noise = edm_coeffs(sigma, sd)
    return c_skip * x + c_out * F(c_in * x, c_noise)

def edm_weight(sigma, sd):
    return (sigma * sigma + sd * sd) / (sigma * sd) ** 2      # 1 / c_out^2`;

const SAMPLERS = `def karras_sigmas(n, smin, smax, rho):
    a, b = smax ** (1 / rho), smin ** (1 / rho)
    return [(a + i / (n - 1) * (b - a)) ** rho for i in range(n)] + [0.0]

def euler_sample(x, sigmas, D):
    for s, sn in zip(sigmas, sigmas[1:]):
        x = x + (sn - s) * (x - D(x, s)) / s
    return x

def heun_sample(x, sigmas, D):
    for s, sn in zip(sigmas, sigmas[1:]):
        d = (x - D(x, s)) / s
        xe = x + (sn - s) * d                                  # Euler predictor
        if sn > 0:
            xe = x + (sn - s) * (d + (xe - D(xe, sn)) / sn) / 2   # average the two slopes
        x = xe
    return x`;

export const lesson: LessonContent = {
  id: "l12.1.4",
  minutes: 60,
  links: {
    requires: ["l12.1.3"],
    revisits: ["l12.1.2", "l7.6.2"],
    foreshadows: ["l12.2.1", "l12.4.3"],
  },

  puzzle: (
    <>
      <p>
        By 2022 diffusion papers differed in a dozen ways at once: VP or VE noise, ε or x<sub>0</sub> or score prediction,
        linear or cosine schedules, different loss weights, different samplers. When one model beat another, nobody could say
        which of these choices had mattered. Is there a way to write all of them in one frame, so that each can be tuned on its
        own? And once separated, which ones turn out to matter most?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Karras, Aittala, Aila and Laine wrote every model as the same ODE, driven by a denoiser that maps a noisy image to its
        best clean guess, and then separated three questions. How to sample: which noise levels to visit and which ODE solver
        to use. How to parameterise the network: what to feed it and what to ask it to output so that its inputs and targets
        have unit size at every noise level. How to train: which noise levels to sample and how to weight them. Each question
        then has a principled answer, and their combination set new records with far fewer network evaluations.
      </p>
      <EdmSolverViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the common frame">
        <p>
          Let the noisy data be <M>{"x = x_0 + \\sigma n"}</M> with <M>{"n \\sim \\mathcal{N}(0, I)"}</M> and let{" "}
          <M>{"D(x; \\sigma) = \\mathbb{E}[x_0 \\mid x]"}</M> be the ideal denoiser. Other models are rescalings of this: the VP
          process of l12.1.2 is <M>{"x_t = \\sqrt{\\bar\\alpha_t}\\,(x_0 + \\sigma n)"}</M> with{" "}
          <M>{"\\sigma^2 = (1 - \\bar\\alpha_t)/\\bar\\alpha_t"}</M>, as in l12.1.3, and a noise predictor is{" "}
          <M>{"\\hat\\varepsilon = (x - D)/\\sigma"}</M>. EDM uses no rescaling and takes the noise level itself as time.
        </p>
      </Definition>

      <Theorem title="the probability flow in the common frame">
        <p>
          The probability flow ODE is <M>{"dx/d\\sigma = (x - D(x; \\sigma))/\\sigma"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The noise is a VE process with variance <M>{"\\sigma^2"}</M>, so by l12.1.2 and m19.5.1 the flow is{" "}
          <M>{"dx/d\\sigma = -\\tfrac{1}{2}\\, (d\\sigma^2/d\\sigma)\\, \\nabla \\log p_\\sigma(x) = -\\sigma \\nabla \\log p_\\sigma(x)"}</M>.
          Tweedie&apos;s formula from l7.6.2 gives{" "}
          <M>{"\\nabla \\log p_\\sigma(x) = (D(x; \\sigma) - x)/\\sigma^2"}</M>; substitute.
        </p>
      </Proof>

      <Theorem title="preconditioning">
        <p>
          Write <M>{"D_\\theta(x; \\sigma) = c_{\\mathrm{skip}} x + c_{\\mathrm{out}} F_\\theta(c_{\\mathrm{in}} x; c_{\\mathrm{noise}})"}</M>{" "}
          for data with per-coordinate variance <M>{"\\sigma_d^2"}</M>. The network input has unit variance when{" "}
          <M>{"c_{\\mathrm{in}} = 1/\\sqrt{\\sigma^2 + \\sigma_d^2}"}</M>. The training target of F,{" "}
          <M>{"(x_0 - c_{\\mathrm{skip}} x)/c_{\\mathrm{out}}"}</M>, has the smallest variance when{" "}
          <M>{"c_{\\mathrm{skip}} = \\sigma_d^2/(\\sigma^2 + \\sigma_d^2)"}</M>, and that variance is 1 when{" "}
          <M>{"c_{\\mathrm{out}} = \\sigma \\sigma_d / \\sqrt{\\sigma^2 + \\sigma_d^2}"}</M> (<C>edm_coeffs</C>,{" "}
          <C>edm_denoise</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"x_0"}</M> and n are independent, so <M>{"\\mathrm{Var}(x) = \\sigma_d^2 + \\sigma^2"}</M> per coordinate, which
          fixes <M>{"c_{\\mathrm{in}}"}</M>. The target is{" "}
          <M>{"((1 - c_{\\mathrm{skip}}) x_0 - c_{\\mathrm{skip}} \\sigma n)/c_{\\mathrm{out}}"}</M> with variance{" "}
          <M>{"((1 - c_{\\mathrm{skip}})^2 \\sigma_d^2 + c_{\\mathrm{skip}}^2 \\sigma^2)/c_{\\mathrm{out}}^2"}</M>. The numerator
          is a convex quadratic in <M>{"c_{\\mathrm{skip}}"}</M>; setting its derivative{" "}
          <M>{"-2(1 - c_{\\mathrm{skip}})\\sigma_d^2 + 2 c_{\\mathrm{skip}} \\sigma^2"}</M> to zero gives the stated value, at
          which the numerator equals <M>{"\\sigma^2 \\sigma_d^2/(\\sigma^2 + \\sigma_d^2)"}</M>. Choosing{" "}
          <M>{"c_{\\mathrm{out}}^2"}</M> equal to it makes the variance 1.
        </p>
        <Code>{PRECOND}</Code>
      </Proof>

      <Remark title="what the preconditioning does">
        <p>
          At large σ, <M>{"c_{\\mathrm{skip}} \\approx 0"}</M> and the network predicts the clean image directly, which is
          sensible because the noisy input says little about it. At small σ,{" "}
          <M>{"c_{\\mathrm{skip}} \\approx 1"}</M> and the network predicts a small correction scaled by{" "}
          <M>{"c_{\\mathrm{out}} \\approx \\sigma"}</M>, close to noise prediction. Pure ε-prediction instead multiplies the
          network&apos;s error by σ at every level, amplifying it at high noise. The noise level enters as{" "}
          <M>{"c_{\\mathrm{noise}} = \\tfrac{1}{4} \\ln \\sigma"}</M>, which keeps it in a modest range.
        </p>
      </Remark>

      <Definition title="training">
        <p>
          The loss is{" "}
          <M>{"\\mathbb{E}_{\\sigma, x_0, n}\\, \\lambda(\\sigma) \\|D_\\theta(x_0 + \\sigma n; \\sigma) - x_0\\|^2 = \\mathbb{E}\\, \\lambda(\\sigma) c_{\\mathrm{out}}^2 \\|F_\\theta - \\text{target}\\|^2"}</M>.
          Taking <M>{"\\lambda = 1/c_{\\mathrm{out}}^2"}</M> (<C>edm_weight</C>) weights every level equally from the
          network&apos;s point of view. The levels are sampled with <M>{"\\ln \\sigma \\sim \\mathcal{N}(-1.2, 1.2^2)"}</M>, which
          concentrates training where the loss can still be reduced: at very small σ the task is trivial and at very large σ
          it is hopeless.
        </p>
      </Definition>

      <Definition title="sampling: levels and solver">
        <p>
          Visit{" "}
          <M>{"\\sigma_i = \\big(\\sigma_{\\max}^{1/\\rho} + \\tfrac{i}{N - 1}(\\sigma_{\\min}^{1/\\rho} - \\sigma_{\\max}^{1/\\rho})\\big)^{\\rho}"}</M>{" "}
          for i = 0, …, N − 1 and then 0, with <M>{"\\sigma_{\\max} = 80"}</M>, <M>{"\\sigma_{\\min} = 0.002"}</M> and{" "}
          <M>{"\\rho = 7"}</M> (<C>karras_sigmas</C>). Large ρ crowds the steps near σ = 0, where the denoiser changes fastest.
          Integrate with Heun&apos;s method: an Euler step, then a correction that averages the slopes at both ends, skipped on
          the final step to σ = 0 (<C>heun_sample</C>, compared with <C>euler_sample</C>). N levels cost 2N − 1 denoiser calls.
        </p>
        <Code>{SAMPLERS}</Code>
      </Definition>

      <Theorem title="Heun is second order">
        <p>
          For <M>{"x' = f(\\sigma, x)"}</M> with smooth f, one Heun step of size h has local error <M>{"O(h^3)"}</M>, against{" "}
          <M>{"O(h^2)"}</M> for Euler, so over a fixed interval the global errors are <M>{"O(h^2)"}</M> and{" "}
          <M>{"O(h)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The exact solution satisfies{" "}
          <M>{"x(\\sigma + h) = x + h f + \\tfrac{h^2}{2}(f_\\sigma + f_x f) + O(h^3)"}</M>. Heun gives{" "}
          <M>{"x + \\tfrac{h}{2}\\big(f + f(\\sigma + h, x + h f)\\big)"}</M>, and expanding the second slope,{" "}
          <M>{"f(\\sigma + h, x + hf) = f + h(f_\\sigma + f_x f) + O(h^2)"}</M>, so the two agree to <M>{"O(h^3)"}</M>. Euler
          stops at <M>{"x + hf"}</M> and misses the <M>{"h^2"}</M> term. Summing <M>{"1/h"}</M> local errors, with the
          propagation of earlier errors controlled by the Lipschitz constant of f, gives the global orders.
        </p>
      </Proof>

      <Example title="reading the figure">
        <p>
          Halving the step size halves Euler&apos;s error and quarters Heun&apos;s, as the theorem predicts, but only once the
          steps are small enough for the Taylor expansions to apply. With ρ = 1 they never are near σ = 0, and both solvers are
          poor at any budget shown. With ρ = 7 Heun overtakes Euler at about 30 evaluations. EDM reports a CIFAR-10 FID of 1.79
          for its class-conditional model with 35 evaluations, where earlier samplers had used hundreds or thousands.
        </p>
      </Example>

      <Remark title="stochasticity as a choice">
        <p>
          EDM also gives a stochastic sampler: before each step, add noise to raise σ slightly, then solve the ODE back down.
          Fresh noise can correct errors made earlier, as the Langevin corrector of l12.1.2 did, but it also costs accuracy
          per step. Its best amount depends on the dataset and on how well the network was trained, and with the improved
          training the deterministic sampler is often best. Every one of these choices is independent of the others, which is
          what made the design space useful.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cskip",
      rung: "check",
      prompt: (
        <p>
          With <M>{"\\sigma_d = 0.5"}</M>, what is <M>{"c_{\\mathrm{skip}}"}</M> at <M>{"\\sigma = 1.5"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0005 },
    },
    {
      key: "mid",
      rung: "check",
      prompt: (
        <p>
          With <M>{"\\sigma_{\\max} = 80"}</M>, <M>{"\\sigma_{\\min} = 0.002"}</M>, <M>{"\\rho = 7"}</M> and N = 3 levels, what is
          the middle level?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5152, tolerance: 0.0005 },
    },
    {
      key: "large",
      rung: "apply",
      prompt: <p>At a noise level far above <M>{"\\sigma_d"}</M>, what is the preconditioned network effectively asked to predict?</p>,
      answer: {
        kind: "choice",
        options: [
          "The clean data, scaled to unit variance, since c_skip is near 0",
          "The noise n, since c_skip is near 1",
          "The score, scaled by σ squared",
          "Nothing: the output is ignored at large σ",
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

def edm_coeffs(sigma, sd):
    r = sigma * sigma + sd * sd
    return sd * sd / r, sigma * sd / math.sqrt(r), 1 / math.sqrt(r), 0.25 * math.log(sigma)   # c_skip, c_out, c_in, c_noise

def edm_denoise(F, x, sigma, sd):
    c_skip, c_out, c_in, c_noise = edm_coeffs(sigma, sd)
    return c_skip * x + c_out * F(c_in * x, c_noise)

def edm_weight(sigma, sd):
    return (sigma * sigma + sd * sd) / (sigma * sd) ** 2      # 1 / c_out^2

cs, co, ci, cn = edm_coeffs(1.0, 1.0); F = lambda y, c: 2 * y
print(round(cs, 4), round(co, 4), round(ci, 4), cn, round(edm_denoise(F, 3.0, 1.0, 1.0), 4), edm_weight(1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.7071 0.7071 0.0 4.5 2.0",
          "0.5 0.7071 0.7071 0.0 3.0 2.0",
          "0.5 0.5 0.7071 0.0 4.5 2.0",
          "0.5 0.7071 0.7071 0.0 4.5 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def karras_sigmas(n, smin, smax, rho):
    a, b = smax ** (1 / rho), smin ** (1 / rho)
    return [(a + i / (n - 1) * (b - a)) ** rho for i in range(n)] + [0.0]

def euler_sample(x, sigmas, D):
    for s, sn in zip(sigmas, sigmas[1:]):
        x = x + (sn - s) * (x - D(x, s)) / s
    return x

def heun_sample(x, sigmas, D):
    for s, sn in zip(sigmas, sigmas[1:]):
        d = (x - D(x, s)) / s
        xe = x + (sn - s) * d                                  # Euler predictor
        if sn > 0:
            xe = x + (sn - s) * (d + (xe - D(xe, sn)) / sn) / 2   # average the two slopes
        x = xe
    return x

D = lambda x, s: x / (1 + s * s); ss = karras_sigmas(3, 1.0, 4.0, 1.0)
print(ss, round(euler_sample(5.0, ss, D), 4), round(heun_sample(5.0, ss, D), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 2.5, 1.0, 0.0] 0.7809 0.9192",
          "[4.0, 2.5, 1.0] 0.7809 0.9192",
          "[4.0, 2.5, 1.0, 0.0] 0.9192 0.7809",
          "[4.0, 2.0, 1.0, 0.0] 0.7809 0.9192",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>edm_coeffs(sigma, sd)</C> returning <C>(c_skip, c_out, c_in, c_noise)</C>,{" "}
          <C>edm_denoise(F, x, sigma, sd)</C> for a raw network <C>F(y, c_noise)</C>, and <C>edm_weight(sigma, sd)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def edm_coeffs(sigma, sd):
    return 0.0, 1.0, 1.0, sigma

def edm_denoise(F, x, sigma, sd):
    return F(x, sigma)

def edm_weight(sigma, sd):
    return 1.0
`,
        solution: PRECOND,
        tests: [
          { name: "coeffs", code: `import math\ncs, co, ci, cn = edm_coeffs(3.0, 4.0)\nassert abs(cs - 0.64) < 1e-12 and abs(co - 2.4) < 1e-12 and abs(ci - 0.2) < 1e-12 and abs(cn - 0.25 * math.log(3.0)) < 1e-12` },
          { name: "denoise", code: `F = lambda y, c: y + 1\nassert abs(edm_denoise(F, 10.0, 3.0, 4.0) - (6.4 + 2.4 * 3.0)) < 1e-12 and abs(edm_weight(3.0, 4.0) - 25 / 144) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>karras_sigmas(n, smin, smax, rho)</C> returning the n levels followed by 0.0, and{" "}
          <C>euler_sample(x, sigmas, D)</C> and <C>heun_sample(x, sigmas, D)</C> for the ODE{" "}
          <M>{"dx/d\\sigma = (x - D(x; \\sigma))/\\sigma"}</M>, with no correction on a step to σ = 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def karras_sigmas(n, smin, smax, rho):
    return [smax, smin]

def euler_sample(x, sigmas, D):
    return D(x, sigmas[0])

def heun_sample(x, sigmas, D):
    return euler_sample(x, sigmas, D)
`,
        solution: SAMPLERS,
        tests: [
          { name: "levels", code: `s = karras_sigmas(3, 1.0, 9.0, 2.0)\nassert len(s) == 4 and abs(s[1] - 4.0) < 1e-12 and s[3] == 0.0 and abs(s[2] - 1.0) < 1e-12\nD = lambda x, s: x / (1 + s * s)\nassert abs(euler_sample(4.0, [2.0, 1.0], D) - 2.4) < 1e-12` },
          { name: "heun", code: `D = lambda x, s: x / (1 + s * s)\nassert abs(heun_sample(4.0, [2.0, 1.0], D) - 2.6) < 1e-12 and abs(heun_sample(4.0, [2.0, 0.0], D) - 0.8) < 1e-12` },
        ],
      },
    },
    {
      key: "heunq",
      rung: "stretch",
      prompt: (
        <p>
          The data are <M>{"\\mathcal{N}(0, 1)"}</M>, so <M>{"D(x; \\sigma) = x/(1 + \\sigma^2)"}</M>. One Heun step from σ = 3 to
          σ = 1 starts at x = 7. Where does it land? (The exact flow would give 3.1305.)
        </p>
      ),
      answer: { kind: "numeric", value: 3.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The ODE of this lesson moves samples along curved paths, and curvature is what forces many steps. Flow matching,
        next, starts from the other end: choose straight paths between noise and data, and train a network to follow them.
      </p>
    </>
  ),
};
