import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TicketModeViz } from "@/components/viz/TicketModeViz";
import type { LessonContent } from "@/lib/types";

const PRUNE = `def magnitude_mask(weights, sparsity):
    k = int(sparsity * len(weights))
    order = sorted(range(len(weights)), key=lambda i: (abs(weights[i]), i))
    mask = [1] * len(weights)
    for i in order[:k]:
        mask[i] = 0
    return mask

def rewind(init, mask):
    return [w * m for w, m in zip(init, mask)]

def iterative_sparsity(rate, rounds):
    return 1 - (1 - rate) ** rounds`;

const CONNECT = `from itertools import permutations

def interpolate(wa, wb, alpha):
    return [(1 - alpha) * a + alpha * b for a, b in zip(wa, wb)]

def barrier(losses):
    return max(losses) - (losses[0] + losses[-1]) / 2

def best_permutation(units_a, units_b):
    return min(
        permutations(range(len(units_b))),
        key=lambda perm: sum((x - y) ** 2 for i, j in enumerate(perm) for x, y in zip(units_a[i], units_b[j])),
    )`;

export const lesson: LessonContent = {
  id: "l10.6.4",
  minutes: 55,
  links: {
    requires: ["l10.6.3", "l3.4.1"],
    revisits: ["l1.5.1", "m14.6.4", "l10.6.2"],
    foreshadows: ["l10.7.1", "l10.7.2", "l11.1.1"],
  },

  puzzle: (
    <>
      <p>
        Trained networks can usually have most of their weights removed with little loss of accuracy. Frankle and Carbin (2019) asked
        why, if a small subnetwork suffices, we cannot train that small network from the start. Their answer, the lottery ticket
        hypothesis, is that a large random network contains small subnetworks which, reset to their original initial values, train to
        full accuracy, while the same subnetworks with fresh random values do not. A second question concerns the many solutions
        training can find: are they isolated valleys, or parts of one connected region?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Over-parameterisation gives training many ways to succeed. Some of the evidence suggests that a large network works partly by
        offering many candidate subnetworks, one of which happens to be well initialised. And the many solutions are less separate
        than they look: networks have symmetries, such as reordering hidden units, that change the weights without changing the
        function, and once those are accounted for, independently trained networks often lie in a single connected low-loss basin.
        The figure shows both effects, in a small experiment run for this lesson.
      </p>
      <TicketModeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="finding tickets">
        <p>
          Train the network, keep the weights of largest magnitude (<C>magnitude_mask</C>), reset the survivors to their initial values
          (<C>rewind</C>) and retrain with the others held at zero. Iterative magnitude pruning repeats this, removing a fraction r of the
          remaining weights each round, so after k rounds the sparsity is <M>{"1 - (1-r)^k"}</M> (<C>iterative_sparsity</C>). Frankle and
          Carbin found winning tickets at 80 to 90% sparsity in small vision networks that matched or beat the dense network, while the
          same masks with random reinitialisation fell short.
        </p>
        <Code>{PRUNE}</Code>
      </Definition>

      <Remark title="what later work found">
        <p>
          For larger networks, rewinding to the exact initial values failed; rewinding to the values after a few hundred or thousand
          steps of training worked (Frankle et al., 2020). Liu et al. (2019) found that for structured pruning, randomly reinitialised
          subnetworks trained just as well, so the mask can matter more than the initial values. In the small experiment in the figure,
          the ticket&apos;s advantage is a point or two. The robust lesson is that pruning masks found after training encode useful
          structure, and that very sparse networks are trainable when started in the right place, not that small networks can generally
          be trained from scratch.
        </p>
      </Remark>

      <Theorem title="hidden-unit permutation symmetry">
        <p>
          For a network with a hidden layer of width H, permuting the hidden units, together with the rows of the incoming weights and
          biases and the columns of the outgoing weights, leaves the function unchanged. A network whose hidden layers have widths{" "}
          <M>{"H_1, \\dots, H_L"}</M> therefore has at least <M>{"\\prod_l H_l!"}</M> weight settings computing the same function.
        </p>
      </Theorem>
      <Proof>
        <p>
          The layer computes <M>{"W_2\\,\\phi(W_1 x + b_1)"}</M>, with φ applied elementwise. For a permutation matrix P,{" "}
          <M>{"\\phi(P W_1 x + P b_1) = P\\phi(W_1 x + b_1)"}</M> because φ acts on each coordinate separately, and{" "}
          <M>{"W_2 P^\\top P = W_2"}</M>, so the output is unchanged. Each layer&apos;s permutation can be chosen independently, giving the
          product. Averaging two networks whose units are in different orders mixes unrelated units, which is why the straight line
          between them crosses high loss.
        </p>
      </Proof>

      <Definition title="linear mode connectivity">
        <p>
          Along the line <M>{"\\theta(\\alpha) = (1-\\alpha)\\theta_A + \\alpha\\theta_B"}</M> (<C>interpolate</C>), the barrier is the
          highest loss minus the mean of the end losses (<C>barrier</C>). Two solutions are linearly mode connected if the barrier is
          near zero. Garipov et al. and Draxler et al. (2018) found that independently trained networks are joined by curved low-loss
          paths. Entezari et al. (2022) conjectured that, after the right permutation, the straight line works too, and Ainsworth et al.
          (2023) found such permutations by matching weights, as in the figure; for tiny layers the best permutation can be found by
          brute force (<C>best_permutation</C>). Networks fine-tuned from the same pretrained model are often linearly connected without
          any permutation, which is why averaging their weights, as in model soups (Wortsman et al., 2022), can work.
        </p>
        <Code>{CONNECT}</Code>
      </Definition>

      <Example title="instability to noise">
        <p>
          Frankle et al. (2020) trained two copies of a network from the same starting point with different data orders and measured
          the barrier between the results. Copies split at initialisation had large barriers, but copies split after a little training
          ended in the same linearly connected basin, and this was the same point from which rewinding produced winning tickets. Early
          training settles which basin a network ends up in.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "imp",
      rung: "check",
      prompt: (
        <p>
          Iterative magnitude pruning removes 20% of the remaining weights in each round. What is the sparsity after 10 rounds? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.893, tolerance: 0.001 },
    },
    {
      key: "barrier",
      rung: "check",
      prompt: (
        <p>
          Test loss along the line between two networks is 0.30 at one end, 0.34 at the other and peaks at 0.90 in between. What is the
          barrier? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.58, tolerance: 0.005 },
    },
    {
      key: "average",
      rung: "apply",
      prompt: (
        <p>
          Averaging the weights of two networks trained from different random initialisations gives a useless model, but averaging two
          fine-tuned versions of the same pretrained model works well. Why?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Fine-tuned models from one pretrained start stay in the same basin with matching units, while independent runs have their units in unrelated orders",
          "Fine-tuned models have fewer parameters",
          "Averaging only works for models with the same training data order",
          "Independently trained networks compute different functions, so they cannot both be accurate",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def magnitude_mask(weights, sparsity):
    k = int(sparsity * len(weights))
    order = sorted(range(len(weights)), key=lambda i: (abs(weights[i]), i))
    mask = [1] * len(weights)
    for i in order[:k]:
        mask[i] = 0
    return mask

def rewind(init, mask):
    return [w * m for w, m in zip(init, mask)]

def iterative_sparsity(rate, rounds):
    return 1 - (1 - rate) ** rounds

print(magnitude_mask([0.5, -0.1, 2.0, 0.3], 0.5), rewind([1.0, 2.0, 3.0], [1, 0, 1]))
print(magnitude_mask([1.0, -1.0, 1.0], 0.34), round(iterative_sparsity(0.5, 3), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 1, 0] [1.0, 0.0, 3.0]\n[0, 1, 1] 0.875",
          "[1, 0, 1, 1] [1.0, 0.0, 3.0]\n[0, 1, 1] 0.875",
          "[1, 0, 1, 0] [1.0, 0.0, 3.0]\n[1, 1, 0] 0.875",
          "[1, 0, 1, 0] [1.0, 0.0, 3.0]\n[0, 1, 1] 0.125",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import permutations

def interpolate(wa, wb, alpha):
    return [(1 - alpha) * a + alpha * b for a, b in zip(wa, wb)]

def barrier(losses):
    return max(losses) - (losses[0] + losses[-1]) / 2

def best_permutation(units_a, units_b):
    return min(
        permutations(range(len(units_b))),
        key=lambda perm: sum((x - y) ** 2 for i, j in enumerate(perm) for x, y in zip(units_a[i], units_b[j])),
    )

print(interpolate([0.0, 2.0], [4.0, 0.0], 0.25), round(barrier([0.2, 0.5, 0.4]), 3))
print(best_permutation([[1, 0], [0, 1]], [[0, 1], [1, 0]]), barrier([0.3, 0.3]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.5] 0.2\n(1, 0) 0.0",
          "[3.0, 0.5] 0.2\n(1, 0) 0.0",
          "[1.0, 1.5] 0.3\n(1, 0) 0.0",
          "[1.0, 1.5] 0.2\n(0, 1) 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>magnitude_mask(weights, sparsity)</C>, zeroing the <C>int(sparsity * n)</C> weights of smallest magnitude, breaking ties
          by lower index, <C>rewind(init, mask)</C>, and <C>iterative_sparsity(rate, rounds)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def magnitude_mask(weights, sparsity):
    return [1] * len(weights)

def rewind(init, mask):
    return list(init)

def iterative_sparsity(rate, rounds):
    return rate * rounds
`,
        solution: PRUNE,
        tests: [
          { name: "mask", code: `assert magnitude_mask([3, -1, 0.2, -4, 0.5, 1], 0.5) == [1, 0, 0, 1, 0, 1] and rewind([2.0, -1.0], [0, 1]) == [0.0, -1.0]` },
          { name: "rounds", code: `assert abs(iterative_sparsity(0.5, 2) - 0.75) < 1e-12 and iterative_sparsity(0.3, 0) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interpolate(wa, wb, alpha)</C>, <C>barrier(losses)</C> and <C>best_permutation(units_a, units_b)</C>, returning the
          tuple perm, as given by <C>itertools.permutations</C> and taking the first best, that minimises the total squared distance
          between unit i of A and unit perm[i] of B.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import permutations

def interpolate(wa, wb, alpha):
    return list(wa)

def barrier(losses):
    return 0.0

def best_permutation(units_a, units_b):
    return tuple(range(len(units_b)))
`,
        solution: CONNECT,
        tests: [
          { name: "line", code: `assert interpolate([1, 1], [3, -1], 0.5) == [2.0, 0.0] and abs(barrier([0.1, 0.15, 0.12, 0.1]) - 0.05) < 1e-12` },
          { name: "perm", code: `assert best_permutation([[1, 2], [3, 4], [0, 0]], [[0, 0.1], [3, 4], [1, 2]]) == (2, 1, 0)` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          A network has two hidden layers of 4 units each. Counting only hidden-unit permutations, how many weight settings compute
          exactly the same function as a given one, including itself?
        </p>
      ),
      answer: { kind: "numeric", value: 576, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Grokking, double descent and lottery tickets were all discovered by careful experiments on small models. The final module turns
        to how such experiments are designed, run and reported.
      </p>
    </>
  ),
};
