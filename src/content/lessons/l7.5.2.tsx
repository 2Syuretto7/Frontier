import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GameDynamicsViz } from "@/components/viz/GameDynamicsViz";
import type { LessonContent } from "@/lib/types";

const PLAY = `def simultaneous(x, y, lr):
    return x - lr * y, y + lr * x

def alternating(x, y, lr):
    x = x - lr * y
    return x, y + lr * x

def extragradient(x, y, lr):
    xh, yh = x - lr * y, y + lr * x
    return x - lr * yh, y + lr * xh`;

const MODES = `def nearest_mode(x, modes):
    return min(range(len(modes)), key=lambda k: abs(x - modes[k]))

def modes_covered(samples, modes, radius):
    hit = set(nearest_mode(s, modes) for s in samples if min(abs(s - m) for m in modes) <= radius)
    return len(hit)

def r1_penalty(grad_norms_sq, gamma):
    return gamma / 2 * sum(grad_norms_sq) / len(grad_norms_sq)`;

export const lesson: LessonContent = {
  id: "l7.5.2",
  minutes: 45,
  links: {
    requires: ["l7.5.1", "l7.1.3"],
    revisits: ["m10.5.1", "m11.4.1"],
    foreshadows: ["l7.5.3", "l12.3.3"],
  },

  puzzle: (
    <>
      <p>
        A GAN trained on handwritten digits produces beautiful sevens, only sevens, a few hundred iterations later only ones,
        then sevens again. Its losses go up and down without settling. The theory of the previous lesson promised a unique
        equilibrium at the data distribution. What does gradient descent on a two-player game actually do, and why does it
        chase its own tail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient descent on one loss always goes downhill. In a game, each player goes downhill on its own loss, and the
        combined motion need not go anywhere in particular: it can rotate around the equilibrium instead of approaching it.
        The simplest game, in which one player wants xy small and the other wants it large, already shows rotation, and
        discrete steps turn rotation into an outward spiral.
      </p>
      <p>
        <em>Mode collapse</em> is the same rotation seen in sample space. The generator moves its mass to wherever the
        discriminator is currently fooled; the discriminator learns to reject that place; the generator jumps elsewhere. A
        generator that covers only one mode at a time is never punished for the modes it ignores.
      </p>
      <GameDynamicsViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="gradient play on a bilinear game">
        <p>
          For <M>{"\\min_x \\max_y xy"}</M> with step η, simultaneous gradient descent-ascent multiplies the distance from the
          equilibrium by <M>{"\\sqrt{1 + \\eta^2}"}</M> every step; alternating updates keep it bounded for η &lt; 2; extragradient
          multiplies it by <M>{"\\sqrt{1 - \\eta^2 + \\eta^4}"}</M>, which is less than 1 for 0 &lt; η &lt; 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Simultaneous play is the linear map <M>{"(x, y) \\mapsto (x - \\eta y, y + \\eta x)"}</M> (<C>simultaneous</C>), a rotation
          scaled by <M>{"\\sqrt{1 + \\eta^2}"}</M>: its matrix <M>{"\\begin{pmatrix} 1 & -\\eta \\\\ \\eta & 1 \\end{pmatrix}"}</M> has
          orthogonal columns of that length. Alternating play (<C>alternating</C>) has matrix{" "}
          <M>{"\\begin{pmatrix} 1 & -\\eta \\\\ \\eta & 1 - \\eta^2 \\end{pmatrix}"}</M> with determinant 1 and trace{" "}
          <M>{"2 - \\eta^2"}</M>; for η &lt; 2 the eigenvalues are complex of modulus 1, so orbits are bounded ellipses that never
          shrink. Extragradient evaluates the gradient at the look-ahead point (<C>extragradient</C>), giving{" "}
          <M>{"x' = (1 - \\eta^2) x - \\eta y"}</M>, <M>{"y' = \\eta x + (1 - \\eta^2) y"}</M>, a rotation scaled by{" "}
          <M>{"\\sqrt{(1 - \\eta^2)^2 + \\eta^2}"}</M>.
        </p>
        <Code>{PLAY}</Code>
      </Proof>

      <Remark title="the general picture">
        <p>
          Near an equilibrium, gradient play is governed by the Jacobian of the joint update field. For a minimisation problem
          it is symmetric with real eigenvalues; for a game it has an antisymmetric part, whose imaginary eigenvalues produce
          rotation (m11.4.1). Gradient descent converges on minimisation problems with small steps (m10.5.1); in games, purely
          rotational components are never damped by small steps, only by extra terms, such as the look-ahead of extragradient
          and optimistic methods, or the damping of a penalty on the discriminator.
        </p>
      </Remark>

      <Definition title="mode collapse">
        <p>
          A generator <em>collapses</em> when its samples cover only a few of the data&apos;s modes. With a set of known modes, each
          sample is attributed to its nearest mode (<C>nearest_mode</C>), and a mode is covered if some sample lies within a
          radius of it (<C>modes_covered</C>). Collapse is a recall failure (l7.1.3): precision can stay high. Mitigations
          include minibatch discrimination, which lets the discriminator compare samples and spot a lack of diversity;
          unrolling the discriminator&apos;s updates inside the generator&apos;s loss; and objectives with useful gradients
          everywhere (l7.5.3).
        </p>
      </Definition>

      <Definition title="stabilisers">
        <p>
          The <em>R1 penalty</em> (Mescheder, Geiger and Nowozin, 2018) adds{" "}
          <M>{"\\tfrac{\\gamma}{2}\\mathbb{E}_{p_d}\\|\\nabla_x D(x)\\|^2"}</M> to the discriminator&apos;s loss (<C>r1_penalty</C>), damping its
          response near the data, the counterpart of the penalty in the viz. <em>Spectral normalisation</em> divides each weight
          matrix of D by its largest singular value, bounding D&apos;s Lipschitz constant. Separate learning rates for the two
          players, an exponential moving average of the generator&apos;s weights for evaluation, and data augmentation applied to
          both real and fake inputs to keep a small-data discriminator from memorising complete the standard recipe.
        </p>
        <Code>{MODES}</Code>
      </Definition>

      <Remark title="vanishing gradients and disjoint supports">
        <p>
          Real images lie near a low-dimensional set, and so do a generator&apos;s outputs. Two such sets in a high-dimensional
          space almost never overlap, and then a perfect discriminator exists. The JSD is pinned at log 2 (l7.5.1), and a
          discriminator trained to optimality gives the generator no useful gradient. Training only works while D is kept
          imperfect, which is fragile; the Wasserstein GAN changes the objective instead.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "spiral",
      rung: "check",
      prompt: <p>Simultaneous gradient play on min over x, max over y of xy starts at distance 1 from the equilibrium with step 0.1. What is the distance after 200 steps? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.7048, tolerance: 0.0001 },
    },
    {
      key: "extra",
      rung: "check",
      prompt: <p>By what factor does one extragradient step with step size 0.1 shrink the distance from the equilibrium of that game? Give five decimals.</p>,
      answer: { kind: "numeric", value: 0.99504, tolerance: 0.00001 },
    },
    {
      key: "collapse",
      rung: "apply",
      prompt: <p>Why does the standard GAN objective allow mode collapse?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each generator update moves samples to where the current discriminator is fooled; nothing in that update rewards covering modes it ignores",
          "The discriminator is always optimal, so the generator receives exact gradients",
          "The generator's likelihood penalises dropping modes too weakly",
          "Mode collapse only happens with the non-saturating loss",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def simultaneous(x, y, lr):
    return x - lr * y, y + lr * x

def alternating(x, y, lr):
    x = x - lr * y
    return x, y + lr * x

def extragradient(x, y, lr):
    xh, yh = x - lr * y, y + lr * x
    return x - lr * yh, y + lr * xh

print(simultaneous(1.0, 0.0, 0.1), alternating(1.0, 0.0, 0.1), extragradient(1.0, 0.0, 0.1))
import math; from functools import reduce; end = lambda f: reduce(lambda p, _: f(*p, 0.1), range(100), (1.0, 0.0)); print([round(math.hypot(*end(f)), 4) for f in (simultaneous, alternating, extragradient)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1.0, 0.1) (1.0, 0.1) (0.99, 0.1)\n[1.6446, 1.0234, 0.6081]",
          "(1.0, 0.1) (1.0, 0.1) (1.0, 0.1)\n[1.6446, 1.0234, 0.6081]",
          "(1.0, 0.1) (1.0, 0.1) (0.99, 0.1)\n[1.6446, 1.6446, 0.6081]",
          "(1.0, 0.1) (1.0, 0.1) (0.99, 0.1)\n[1.0, 1.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def nearest_mode(x, modes):
    return min(range(len(modes)), key=lambda k: abs(x - modes[k]))

def modes_covered(samples, modes, radius):
    hit = set(nearest_mode(s, modes) for s in samples if min(abs(s - m) for m in modes) <= radius)
    return len(hit)

def r1_penalty(grad_norms_sq, gamma):
    return gamma / 2 * sum(grad_norms_sq) / len(grad_norms_sq)

modes = [0, 4, 8]; print(nearest_mode(5.9, modes), nearest_mode(6.0, modes), modes_covered([0.1, 0.2, 3.9, 4.3], modes, 0.5), modes_covered([2.0, 6.0], modes, 1.0))
print(r1_penalty([1.0, 3.0], 10), r1_penalty([0.0], 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 1 2 0\n10.0 0.0",
          "1 2 2 0\n10.0 0.0",
          "1 1 3 0\n10.0 0.0",
          "1 1 2 2\n20.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For min over x, max over y of xy, write one step of <C>simultaneous(x, y, lr)</C>, <C>alternating(x, y, lr)</C> (x moves
          first and y responds to the new x) and <C>extragradient(x, y, lr)</C>, each returning the new pair.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def simultaneous(x, y, lr):
    return x, y

def alternating(x, y, lr):
    return x, y

def extragradient(x, y, lr):
    return x, y
`,
        solution: PLAY,
        tests: [
          { name: "plain steps", code: `assert simultaneous(2.0, 1.0, 0.5) == (1.5, 2.0) and alternating(2.0, 1.0, 0.5) == (1.5, 1.75)` },
          { name: "extragradient", code: `x, y = extragradient(2.0, 1.0, 0.5); assert abs(x - 1.0) < 1e-12 and abs(y - 1.75) < 1e-12
import math
p = (1.0, 0.0)
for _ in range(10): p = extragradient(*p, 0.5)
assert abs(math.hypot(*p) - (1 - 0.25 + 0.0625) ** 5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For one-dimensional samples, write <C>nearest_mode(x, modes)</C>, taking the first on ties; <C>modes_covered(samples, modes, radius)</C>;
          and <C>r1_penalty(grad_norms_sq, gamma)</C>, γ/2 times the mean squared gradient norm on real data.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def nearest_mode(x, modes):
    return 0

def modes_covered(samples, modes, radius):
    return len(modes)

def r1_penalty(grad_norms_sq, gamma):
    return 0.0
`,
        solution: MODES,
        tests: [
          { name: "modes", code: `assert nearest_mode(2.0, [0, 4]) == 0 and nearest_mode(3.1, [0, 4]) == 1 and nearest_mode(-9, [5, -1, 2]) == 1
assert modes_covered([0.0, 0.1, 9.9], [0, 5, 10], 0.2) == 2 and modes_covered([2.5], [0, 5], 2.0) == 0 and modes_covered([], [1], 1.0) == 0` },
          { name: "penalty", code: `assert r1_penalty([2.0, 4.0, 6.0], 1.0) == 2.0 and r1_penalty([1.0], 0.1) == 0.05` },
        ],
      },
    },
    {
      key: "halve",
      rung: "stretch",
      prompt: <p>Extragradient with step 0.1 is run on min over x, max over y of xy. What is the smallest number of steps after which the distance from the equilibrium is at most half its starting value?</p>,
      answer: { kind: "numeric", value: 140, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Many of these troubles trace back to a divergence that saturates when distributions do not overlap. The Wasserstein
        distance does not: it measures how far mass must move, and keeps giving gradients however far apart the distributions
        are.
      </p>
    </>
  ),
};
