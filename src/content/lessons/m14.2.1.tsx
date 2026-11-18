import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SparseAdagradViz } from "@/components/viz/SparseAdagradViz";
import type { LessonContent } from "@/lib/types";

const ADA = `import numpy as np

def adagrad(grad, x0, lr, steps, eps=1e-12):
    x = np.asarray(x0, float).copy()
    G = np.zeros_like(x)
    path = [x.copy()]
    for _ in range(steps):
        g = grad(x)
        G += g * g
        x = x - lr * g / (np.sqrt(G) + eps)
        path.append(x.copy())
    return path

def effective_lr(grads, lr, eps=1e-12):
    G = np.cumsum(np.asarray(grads, float) ** 2, axis=0)
    return lr / (np.sqrt(G) + eps)

def lemma_sides(a):
    a = np.asarray(a, float)
    A = np.cumsum(a)
    return float(np.sum(a / np.sqrt(A))), float(2 * np.sqrt(A[-1]))`;

const ONLINE = `import numpy as np

def online_adagrad(gs, D, lr):
    gs = np.asarray(gs, float)
    x = np.zeros(gs.shape[1])
    G = np.zeros_like(x)
    loss = 0.0
    for g in gs:
        loss += float(g @ x)
        G += g * g
        x = np.clip(x - lr * g / np.sqrt(np.where(G > 0, G, 1.0)), -D / 2, D / 2)
    return loss

def regret(gs, D, lr):
    gs = np.asarray(gs, float)
    best = -D / 2 * float(np.sum(np.abs(gs.sum(axis=0))))
    return online_adagrad(gs, D, lr) - best

def adagrad_bound(gs, D):
    gs = np.asarray(gs, float)
    return float(np.sqrt(2) * D * np.sum(np.sqrt(np.sum(gs ** 2, axis=0))))`;

export const lesson: LessonContent = {
  id: "m14.2.1",
  minutes: 45,
  links: {
    requires: ["m14.1.1"],
    revisits: ["l3.6.2", "m11.5.3"],
    foreshadows: ["m14.2.2", "m14.3.3"],
  },

  puzzle: (
    <>
      <p>
        A click-through model has a million features. A handful appear in every example; most appear once in ten thousand.
        Theory for SGD on convex problems says to decay the learning rate like 1/√t. But by the time a rare feature shows up
        for the tenth time, t is in the hundreds of thousands and its weight barely moves. Can one rule give every coordinate
        the step it needs, without being told which features are rare?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The decay 1/√t is really a decay in how much gradient has been seen. For a coordinate that has received little
        gradient, nothing has been learned yet and a large step is safe; for one that has received a lot, the step should be
        small. AdaGrad makes this literal: each coordinate&apos;s rate is η divided by the square root of the sum of its own
        past squared gradients. Rare coordinates keep large rates, frequent ones shrink, and the rule needs no knowledge of
        the scale of the gradients, since multiplying every gradient by c leaves the steps unchanged.
      </p>
      <SparseAdagradViz />
    </>
  ),

  theory: (
    <>
      <Definition title="AdaGrad">
        <p>
          With gradients <M>{"g_1, g_2, \\dots"}</M>, keep <M>{"G_{t,i} = \\sum_{s \\le t} g_{s,i}^2"}</M> and step
        </p>
        <MD>{"x_{t+1,i} = \\Pi\\Big(x_{t,i} - \\frac{\\eta}{\\sqrt{G_{t,i}} + \\epsilon}\\,g_{t,i}\\Big),"}</MD>
        <p>
          where Π projects onto the feasible set, if there is one, and ε guards against division by zero. The scalar version,
          AdaGrad-norm, uses one rate <M>{"\\eta/\\sqrt{\\sum_{s\\le t}\\|g_s\\|^2}"}</M> for all coordinates.
        </p>
      </Definition>

      <Theorem title="the summation lemma">
        <p>
          For <M>{"a_t \\ge 0"}</M> with <M>{"A_t = \\sum_{s\\le t} a_s > 0"}</M>,{" "}
          <M>{"\\sum_{t=1}^T a_t/\\sqrt{A_t} \\le 2\\sqrt{A_T}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"a_t = A_t - A_{t-1} = (\\sqrt{A_t} - \\sqrt{A_{t-1}})(\\sqrt{A_t} + \\sqrt{A_{t-1}}) \\le 2\\sqrt{A_t}(\\sqrt{A_t} - \\sqrt{A_{t-1}})"}</M>,
          each term is at most <M>{"2(\\sqrt{A_t} - \\sqrt{A_{t-1}})"}</M>, and the sum telescopes to{" "}
          <M>{"2\\sqrt{A_T}"}</M>.
        </p>
      </Proof>

      <Theorem title="the regret bound">
        <p>
          Let <M>{"f_1, \\dots, f_T"}</M> be convex functions chosen in turn by an adversary, each revealed after we commit to{" "}
          <M>{"x_t"}</M> in a box whose sides have length D, and let <M>{"g_t = \\nabla f_t(x_t)"}</M>. Projected AdaGrad
          with <M>{"\\eta = D/\\sqrt{2}"}</M> has regret
        </p>
        <MD>{"\\sum_{t=1}^T f_t(x_t) - \\min_x \\sum_{t=1}^T f_t(x) \;\\le\; \\sqrt{2}\\,D\\sum_i \\sqrt{\\textstyle\\sum_{t} g_{t,i}^2}."}</MD>
      </Theorem>
      <Proof>
        <p>
          By convexity the regret is at most <M>{"\\sum_t g_t\\cdot(x_t - x^*)"}</M>, and this splits over coordinates, so fix
          one and drop the index i. Projection onto an interval does not increase the distance to <M>{"x^*"}</M>, so with{" "}
          <M>{"\\eta_t = \\eta/\\sqrt{G_t}"}</M>,
        </p>
        <MD>{"(x_{t+1}-x^*)^2 \\le (x_t - x^*)^2 - 2\\eta_t g_t(x_t - x^*) + \\eta_t^2 g_t^2."}</MD>
        <p>
          Rearranging, <M>{"g_t(x_t - x^*) \\le \\frac{(x_t-x^*)^2 - (x_{t+1}-x^*)^2}{2\\eta_t} + \\frac{\\eta_t g_t^2}{2}"}</M>.
          Because <M>{"1/\\eta_t"}</M> only grows and every squared distance is at most <M>{"D^2"}</M>, the first terms sum to
          at most <M>{"D^2/(2\\eta_T) = D^2\\sqrt{G_T}/(2\\eta)"}</M>. By the lemma, the second terms sum to at most{" "}
          <M>{"\\eta\\sqrt{G_T}"}</M>. With <M>{"\\eta = D/\\sqrt{2}"}</M> both are <M>{"D\\sqrt{G_T}/\\sqrt{2}"}</M>, giving{" "}
          <M>{"\\sqrt{2}D\\sqrt{G_T}"}</M> per coordinate. Summing over coordinates gives the bound.
        </p>
        <Code>{ADA}</Code>
      </Proof>

      <Remark title="why per coordinate">
        <p>
          AdaGrad-norm on the same box has Euclidean diameter <M>{"\\sqrt{d}\\,D"}</M> and bound{" "}
          <M>{"\\sqrt{2}\\sqrt{d}\\,D\\sqrt{\\sum_t\\|g_t\\|^2}"}</M>. By Cauchy–Schwarz,{" "}
          <M>{"\\sum_i\\sqrt{G_{T,i}} \\le \\sqrt{d}\\sqrt{\\sum_i G_{T,i}}"}</M>, so the per-coordinate bound is never worse,
          and it is far better when gradient mass is concentrated on a few coordinates, as with sparse features. The cost
          is that the rates only ever fall. In deep learning the landscape changes as training proceeds, and a rate that
          has decayed on a steep early stretch cannot recover. The next lesson replaces the sum with a moving average.
          The code below plays the online game with linear losses, where the best fixed point is a corner of the box.
        </p>
        <Code>{ONLINE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: <p>AdaGrad uses η = 0.1. One coordinate has received gradients 3 and then 4. What rate does it use for the next step?</p>,
      answer: { kind: "numeric", value: 0.02, tolerance: 0.000001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          In a box with sides of length D = 1, one coordinate receives gradient 1 on 100 rounds and another receives gradient
          1 on 4 rounds; all other gradients are zero. What is the regret bound √2 D Σᵢ √(Σₜ g²ₜ,ᵢ)? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 16.97, tolerance: 0.006 },
    },
    {
      key: "decay",
      rung: "apply",
      prompt: <p>Why is AdaGrad rarely used unchanged to train deep networks?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its rates only ever fall, because the sum of squared gradients only grows, so after a steep early phase the steps stay too small for the rest of training",
          "Its rates grow without bound and training diverges",
          "It needs the true Hessian at every step",
          "It cannot handle coordinates whose gradients have different scales",
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

def adagrad(grad, x0, lr, steps, eps=1e-12):
    x = np.asarray(x0, float).copy()
    G = np.zeros_like(x)
    path = [x.copy()]
    for _ in range(steps):
        g = grad(x)
        G += g * g
        x = x - lr * g / (np.sqrt(G) + eps)
        path.append(x.copy())
    return path

def effective_lr(grads, lr, eps=1e-12):
    G = np.cumsum(np.asarray(grads, float) ** 2, axis=0)
    return lr / (np.sqrt(G) + eps)

def lemma_sides(a):
    a = np.asarray(a, float)
    A = np.cumsum(a)
    return float(np.sum(a / np.sqrt(A))), float(2 * np.sqrt(A[-1]))

path = adagrad(lambda x: np.array([4.0, 0.25]) * x, [1.0, 1.0], 0.5, 2)
print([round(float(v), 4) for v in path[1]], [round(float(v), 4) for v in path[2]])
print(effective_lr([[3.0, 0.0], [4.0, 1.0]], 1.0)[1].round(3), [round(v, 3) for v in lemma_sides([1, 3, 5])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.5] [0.2764, 0.2764]\n[0.2 1. ] [4.167, 6.0]",
          "[-1.0, 0.875] [1.0, 0.7656]\n[0.2 1. ] [4.167, 6.0]",
          "[0.5, 0.5] [0.25, 0.25]\n[0.2 1. ] [4.167, 6.0]",
          "[0.5, 0.5] [0.2764, 0.2764]\n[0.333 1. ] [4.167, 6.0]",
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

def online_adagrad(gs, D, lr):
    gs = np.asarray(gs, float)
    x = np.zeros(gs.shape[1])
    G = np.zeros_like(x)
    loss = 0.0
    for g in gs:
        loss += float(g @ x)
        G += g * g
        x = np.clip(x - lr * g / np.sqrt(np.where(G > 0, G, 1.0)), -D / 2, D / 2)
    return loss

def regret(gs, D, lr):
    gs = np.asarray(gs, float)
    best = -D / 2 * float(np.sum(np.abs(gs.sum(axis=0))))
    return online_adagrad(gs, D, lr) - best

def adagrad_bound(gs, D):
    gs = np.asarray(gs, float)
    return float(np.sqrt(2) * D * np.sum(np.sqrt(np.sum(gs ** 2, axis=0))))

gs = [[1.0, 0.0], [1.0, 0.0], [-1.0, 2.0]]
print(round(online_adagrad(gs, 2.0, 1.0), 4), round(regret(gs, 2.0, 1.0), 4), round(adagrad_bound(gs, 2.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0 3.0 10.556", "-3.0 0.0 10.556", "0.0 3.0 7.464", "-1.0 2.0 10.556"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adagrad(grad, x0, lr, steps, eps=1e-12)</C>, returning the list of iterates including x0;{" "}
          <C>effective_lr(grads, lr, eps=1e-12)</C>, the array of per-coordinate rates after each gradient in a list; and{" "}
          <C>lemma_sides(a)</C>, returning the two sides <C>(Σ aₜ/√Aₜ, 2√A_T)</C> of the summation lemma.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adagrad(grad, x0, lr, steps, eps=1e-12):
    return [np.asarray(x0, float)]

def effective_lr(grads, lr, eps=1e-12):
    return np.full(np.shape(grads), lr)

def lemma_sides(a):
    return 0.0, 0.0
`,
        solution: ADA,
        tests: [
          { name: "steps", code: `p = adagrad(lambda x: np.array([100.0, 0.01]) * x, [2.0, 2.0], 0.5, 3)
q = adagrad(lambda x: np.array([1.0, 1.0]) * x, [2.0, 2.0], 0.5, 3)
assert len(p) == 4 and np.allclose(p[1], [1.5, 1.5]) and np.allclose(p[3], q[3]) and np.allclose(p[3][0], p[3][1])
r = effective_lr([[3.0, 0.0], [4.0, 2.0], [0.0, 0.0]], 2.0); assert r.shape == (3, 2) and np.allclose(r[1:], [[0.4, 1.0], [0.4, 1.0]]) and abs(r[0, 0] - 2 / 3) < 1e-9` },
          { name: "lemma", code: `s, t = lemma_sides([1, 3, 5]); assert abs(s - (1 + 1.5 + 5 / 3)) < 1e-9 and abs(t - 6) < 1e-9
rng = np.random.default_rng(1)
for _ in range(20):
    s, t = lemma_sides(rng.random(30) * (rng.random(30) < 0.5) + 1e-9); assert s <= t` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Play the online game with linear losses <C>fₜ(x) = gₜ·x</C> on the box <C>[−D/2, D/2]^d</C>, starting from zero.
          Write <C>online_adagrad(gs, D, lr)</C>, the total loss of projected per-coordinate AdaGrad (a coordinate with no
          gradient yet stays put); <C>regret(gs, D, lr)</C>, that loss minus the best fixed point&apos;s; and{" "}
          <C>adagrad_bound(gs, D)</C>, the bound from the theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def online_adagrad(gs, D, lr):
    return 0.0

def regret(gs, D, lr):
    return 0.0

def adagrad_bound(gs, D):
    return 0.0
`,
        solution: ONLINE,
        tests: [
          { name: "game", code: `gs = [[1.0, 0.0], [1.0, 0.0], [-1.0, 2.0]]
assert abs(online_adagrad(gs, 2.0, 1.0)) < 1e-12 and abs(regret(gs, 2.0, 1.0) - 3) < 1e-12
assert abs(online_adagrad([[2.0], [2.0], [2.0]], 1.0, 0.1) - 2 * (-0.1 - 0.1 - 0.1 / np.sqrt(2))) < 1e-12` },
          { name: "bound", code: `assert abs(adagrad_bound([[1.0, 0.0], [1.0, 0.0], [-1.0, 2.0]], 2.0) - 2 * np.sqrt(2) * (np.sqrt(3) + 2)) < 1e-9
rng = np.random.default_rng(3)
for _ in range(5):
    gs = rng.normal(size=(150, 4)) * (rng.random((150, 4)) < 0.2); r = regret(gs, 1.0, 1 / np.sqrt(2)); assert 0 < r <= adagrad_bound(gs, 1.0)` },
        ],
      },
    },
    {
      key: "dense",
      rung: "stretch",
      prompt: (
        <p>
          In d = 100 dimensions over T = 10,000 rounds, coordinate 1 receives gradient 1 on every round and each of the other
          99 coordinates receives gradient 1 on 100 rounds (other entries are zero). With box sides D, by what factor is the
          AdaGrad-norm bound √2 √d D √(Σₜ‖gₜ‖²) larger than the per-coordinate bound? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.29, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        AdaGrad never forgets: a burst of large gradients early on shrinks a coordinate&apos;s rate for good. RMSProp keeps
        the per-coordinate division but replaces the running sum with an exponential moving average, so the rate can recover
        when the gradients calm down.
      </p>
    </>
  ),
};
