import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HedgeWeightsViz } from "@/components/viz/HedgeWeightsViz";
import type { LessonContent } from "@/lib/types";

const HEDGE = `import math

def hedge_weights(cum, eta):
    lo = min(cum)
    w = [math.exp(-eta * (c - lo)) for c in cum]
    s = sum(w)
    return [v / s for v in w]

def hedge(losses, eta):
    cum, paid = [0.0] * len(losses[0]), []
    for row in losses:
        p = hedge_weights(cum, eta)
        paid.append(sum(a * b for a, b in zip(p, row)))
        cum = [c + l for c, l in zip(cum, row)]
    return paid

def hedge_bound(N, T, eta):
    return math.log(N) / eta + eta * T / 8`;

const MAJORITY = `import math

def weighted_majority(preds, labels, beta):
    w, mistakes = [1.0] * len(preds[0]), 0
    for p, y in zip(preds, labels):
        ones = sum(wi for wi, pi in zip(w, p) if pi == 1)
        guess = 1 if 2 * ones > sum(w) else 0
        mistakes += guess != y
        w = [wi * beta if pi != y else wi for wi, pi in zip(w, p)]
    return mistakes, w

def tuned_eta(N, T):
    return math.sqrt(8 * math.log(N) / T)

def wm_bound(m_star, N, beta):
    return (m_star * math.log(1 / beta) + math.log(N)) / math.log(2 / (1 + beta))`;

export const lesson: LessonContent = {
  id: "m16.6.3",
  minutes: 45,
  links: {
    requires: ["m16.6.2", "m15.1.2"],
    revisits: ["m10.7.4", "l2.4.3"],
    foreshadows: ["m16.6.4", "m16.7.4"],
  },

  puzzle: (
    <>
      <p>
        You follow a thousand forecasters, none of whom you trust, and each day you must commit to a mixture of their advice
        before learning who was right. A deterministic rule can be beaten every day, and online gradient descent on the
        simplex pays a factor that grows like the square root of the number of forecasters. Is there a rule whose regret
        depends on that number only logarithmically?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep a weight on every expert and multiply it by a factor below one whenever that expert loses. Good experts keep
        their weight, bad ones fade exponentially, and you follow a random expert drawn in proportion to the weights. The
        total weight can only shrink as fast as you lose, while it can never fall below the weight of the best expert. That
        sandwich gives the bound.
      </p>
      <HedgeWeightsViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Hedge">
        <p>
          N experts have losses <M>{"\\ell_{t,i} \\in [0, 1]"}</M>. Hedge plays the distribution{" "}
          <M>{"p_{t,i} \\propto e^{-\\eta L_{t-1,i}}"}</M>, where <M>{"L_{t-1,i}"}</M> is expert i&apos;s cumulative loss, and pays{" "}
          <M>{"p_t^\\top \\ell_t"}</M>. Against every sequence,
        </p>
        <MD>{"\\sum_{t=1}^T p_t^\\top \\ell_t - \\min_i L_{T,i} \\le \\frac{\\ln N}{\\eta} + \\frac{\\eta T}{8},"}</MD>
        <p>
          and <M>{"\\eta = \\sqrt{8\\ln N / T}"}</M> gives regret at most <M>{"\\sqrt{T \\ln N / 2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\Phi_t = \\sum_i e^{-\\eta L_{t,i}}"}</M>, so <M>{"\\Phi_0 = N"}</M>. Then{" "}
          <M>{"\\Phi_t / \\Phi_{t-1} = \\mathbb E_{i \\sim p_t} e^{-\\eta \\ell_{t,i}}"}</M>. Hoeffding&apos;s lemma (m15.1.2) for a variable in [0, 1]
          bounds this by <M>{"\\exp(-\\eta\\, p_t^\\top \\ell_t + \\eta^2/8)"}</M>. Multiplying over t,
        </p>
        <MD>{"e^{-\\eta \\min_i L_{T,i}} \\le \\Phi_T \\le N \\exp\\Big(-\\eta \\sum_t p_t^\\top \\ell_t + \\frac{\\eta^2 T}{8}\\Big)."}</MD>
        <p>
          Taking logarithms and dividing by η gives the bound. In code the weights are computed after subtracting the smallest
          cumulative loss, which changes nothing mathematically but stops the exponentials underflowing (<C>hedge_weights</C>).
        </p>
        <Code>{HEDGE}</Code>
      </Proof>

      <Remark title="Hedge is mirror descent">
        <p>
          The update <M>{"p_{t+1,i} \\propto p_{t,i} e^{-\\eta \\ell_{t,i}}"}</M> is exactly online mirror descent on the simplex with the
          negative entropy as mirror map (m10.7.4), or equivalently follow the regularised leader with that regulariser.
          The entropy is strongly convex in the ℓ₁ norm, and the losses have ℓ∞ norm at most 1, so the dimension enters only
          through the entropy&apos;s range, ln N. Euclidean steps would see the ℓ₂ size of the losses, √N.
        </p>
      </Remark>

      <Theorem title="weighted majority">
        <p>
          For 0/1 predictions, predict with the weighted majority and multiply the weight of each wrong expert by β ∈ (0, 1).
          If the best expert makes m* mistakes, the algorithm makes at most
        </p>
        <MD>{"\\frac{m^* \\ln(1/\\beta) + \\ln N}{\\ln\\big(2/(1+\\beta)\\big)}"}</MD>
        <p>mistakes, which for β = ½ is about <M>{"2.41(m^* + \\log_2 N)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          On a mistake at least half the total weight W was on wrong experts, so W shrinks to at most{" "}
          <M>{"W(1 + \\beta)/2"}</M>. After M mistakes <M>{"W \\le N((1+\\beta)/2)^M"}</M>, while the best expert alone keeps{" "}
          <M>{"\\beta^{m^*}"}</M>. Comparing logarithms gives the bound (<C>weighted_majority</C>, <C>wm_bound</C>). The factor 2 in
          front of m* is the price of being deterministic, as Cover&apos;s argument of m16.6.1 predicts; Hedge&apos;s randomisation
          removes it.
        </p>
        <Code>{MAJORITY}</Code>
      </Proof>

      <Theorem title="solving zero-sum games">
        <p>
          Let A be a loss matrix with entries in [0, 1]. If the row player runs Hedge and the column player runs any algorithm
          with regret <M>{"R_2"}</M> on the gains, the averaged strategies <M>{"\\bar p, \\bar q"}</M> satisfy
        </p>
        <MD>{"\\max_j (\\bar p^\\top A)_j - \\min_i (A\\bar q)_i \\le \\frac{R_1 + R_2}{T}."}</MD>
        <p>
          If both run tuned Hedge with N actions each, this is at most <M>{"\\sqrt{2\\ln N / T}"}</M>, and letting T → ∞ proves the
          minimax theorem.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"v = \\tfrac1T \\sum_t p_t^\\top A q_t"}</M>. The row player&apos;s regret bound says{" "}
          <M>{"v \\le \\min_i (A\\bar q)_i + R_1/T"}</M>; the column player&apos;s says <M>{"v \\ge \\max_j (\\bar p^\\top A)_j - R_2/T"}</M>. Subtract.
          Since always <M>{"\\min_p \\max_q \\ge \\max_q \\min_p"}</M>, the gap closing forces equality. The same argument, with
          examples as one player and weak learners as the other, is the idea behind boosting (l2.4.3).
        </p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>Tuned Hedge runs for T = 10000 rounds with N = 100 experts. What is its regret bound? Give one decimal.</p>,
      answer: { kind: "numeric", value: 151.7, tolerance: 0.1 },
    },
    {
      key: "wm",
      rung: "check",
      prompt: <p>Weighted majority with β = ½ watches 1024 experts, the best of which makes 10 mistakes. What is the mistake bound? Give two decimals.</p>,
      answer: { kind: "numeric", value: 48.19, tolerance: 0.01 },
    },
    {
      key: "entropy",
      rung: "apply",
      prompt: <p>Why does Hedge&apos;s regret grow only like √(ln N) in the number of experts, while projected gradient descent on the simplex pays about √N?</p>,
      answer: {
        kind: "choice",
        options: [
          "Hedge is mirror descent with the entropy, whose range on the simplex is ln N and which matches the ℓ∞ bound on the losses",
          "Hedge looks at only one expert per round",
          "Hedge uses a larger learning rate",
          "The Euclidean projection onto the simplex is not unique",
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

def hedge_weights(cum, eta):
    lo = min(cum)
    w = [math.exp(-eta * (c - lo)) for c in cum]
    s = sum(w)
    return [v / s for v in w]

def hedge(losses, eta):
    cum, paid = [0.0] * len(losses[0]), []
    for row in losses:
        p = hedge_weights(cum, eta)
        paid.append(sum(a * b for a, b in zip(p, row)))
        cum = [c + l for c, l in zip(cum, row)]
    return paid

def hedge_bound(N, T, eta):
    return math.log(N) / eta + eta * T / 8

print(hedge_weights([0.0, 0.0], 3.0), [round(v, 4) for v in hedge_weights([0.0, math.log(3)], 1.0)], hedge_bound(math.e, 8, 1.0))
print([round(v, 4) for v in hedge([[1.0, 0.0], [1.0, 0.0]], math.log(3))], hedge([[0.0, 1.0]] * 3, 0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.5] [0.75, 0.25] 2.0\n[0.5, 0.25] [0.5, 0.5, 0.5]",
          "[0.5, 0.5] [0.25, 0.75] 2.0\n[0.5, 0.25] [0.5, 0.5, 0.5]",
          "[0.5, 0.5] [0.75, 0.25] 2.0\n[0.5, 0.75] [0.5, 0.5, 0.5]",
          "[1.0, 1.0] [0.75, 0.25] 9.0\n[0.5, 0.25] [0.0, 1.0, 1.0]",
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

def weighted_majority(preds, labels, beta):
    w, mistakes = [1.0] * len(preds[0]), 0
    for p, y in zip(preds, labels):
        ones = sum(wi for wi, pi in zip(w, p) if pi == 1)
        guess = 1 if 2 * ones > sum(w) else 0
        mistakes += guess != y
        w = [wi * beta if pi != y else wi for wi, pi in zip(w, p)]
    return mistakes, w

def tuned_eta(N, T):
    return math.sqrt(8 * math.log(N) / T)

def wm_bound(m_star, N, beta):
    return (m_star * math.log(1 / beta) + math.log(N)) / math.log(2 / (1 + beta))

print(weighted_majority([[1, 0, 0], [1, 1, 0], [0, 1, 1]], [0, 1, 1], 0.5))
print(tuned_eta(math.e, 2), round(wm_bound(0, 2, 0.5), 3), round(wm_bound(2, 2, 0.5), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0, [0.25, 1.0, 0.5])\n2.0 2.409 7.228",
          "(1, [0.25, 1.0, 0.5])\n2.0 2.409 7.228",
          "(0, [0.5, 1.0, 0.25])\n2.0 2.409 7.228",
          "(0, [0.25, 1.0, 0.5])\n4.0 1.0 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hedge_weights(cum, eta)</C> returning the normalised weights for cumulative losses <C>cum</C>,{" "}
          <C>hedge(losses, eta)</C> returning the expected loss paid each round, and <C>hedge_bound(N, T, eta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def hedge_weights(cum, eta):
    return [1 / len(cum)] * len(cum)

def hedge(losses, eta):
    return [sum(row) / len(row) for row in losses]

def hedge_bound(N, T, eta):
    return 0.0
`,
        solution: HEDGE,
        tests: [
          { name: "weights", code: `p = hedge_weights([2.0, 2.0 + math.log(4), 5000.0], 1.0)
assert abs(p[0] - 0.8) < 1e-12 and abs(p[1] - 0.2) < 1e-12 and p[2] < 1e-300 and abs(hedge_bound(math.e ** 2, 16, 2.0) - 5.0) < 1e-12` },
          { name: "hedge", code: `q = hedge([[0.0, 1.0], [0.0, 1.0], [1.0, 0.0]], math.log(2))
assert all(abs(a - b) < 1e-12 for a, b in zip(q, [0.5, 1 / 3, 0.8]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>weighted_majority(preds, labels, beta)</C> returning the number of mistakes and the final weights (predict 1
          only when the weight on 1 is more than half the total), <C>tuned_eta(N, T)</C> and <C>wm_bound(m_star, N, beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def weighted_majority(preds, labels, beta):
    return 0, [1.0] * len(preds[0])

def tuned_eta(N, T):
    return 1.0

def wm_bound(m_star, N, beta):
    return 0.0
`,
        solution: MAJORITY,
        tests: [
          { name: "majority", code: `m, w = weighted_majority([[1, 1, 0], [0, 1, 0], [1, 0, 0]], [0, 0, 0], 0.25)
assert m == 1 and w == [0.0625, 0.0625, 1.0] and weighted_majority([[1, 0]], [1], 0.5) == (1, [1.0, 0.5])` },
          { name: "rates", code: `assert abs(tuned_eta(math.e, 8) - 1.0) < 1e-12 and abs(wm_bound(3, 1, 0.5) - 3 * math.log(2) / math.log(4 / 3)) < 1e-12 and abs(wm_bound(0, 9, 1 / 3) - math.log(9) / math.log(1.5)) < 1e-12` },
        ],
      },
    },
    {
      key: "game",
      rung: "stretch",
      prompt: (
        <p>
          Both players of a zero-sum game with three actions each and losses in [0, 1] run tuned Hedge. How many rounds T
          guarantee that the averaged strategies are within 0.01 of equilibrium, in the sense of the theorem above? Give the
          smallest integer.
        </p>
      ),
      answer: { kind: "numeric", value: 21973, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Hedge sees every expert&apos;s loss. When only the chosen arm&apos;s reward is revealed, the learner must balance trying arms
        against exploiting them. The last lesson of this part proves regret bounds for the two leading strategies, upper
        confidence bounds and Thompson sampling.
      </p>
    </>
  ),
};
