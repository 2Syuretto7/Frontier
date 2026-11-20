import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FtlRegretViz } from "@/components/viz/FtlRegretViz";
import type { LessonContent } from "@/lib/types";

const LEADER = `def follow_the_leader(losses):
    n = len(losses[0])
    cum, out = [0.0] * n, []
    for row in losses:
        i = min(range(n), key=lambda j: cum[j])
        out.append(row[i])
        cum = [c + l for c, l in zip(cum, row)]
    return out

def best_in_hindsight(losses):
    return min(sum(row[i] for row in losses) for i in range(len(losses[0])))

def regret(alg_losses, losses):
    return sum(alg_losses) - best_in_hindsight(losses)`;

const MISTAKES = `def halving(preds, labels):
    alive, mistakes = list(range(len(preds[0]))), 0
    for p, y in zip(preds, labels):
        ones = sum(p[i] for i in alive)
        guess = 1 if 2 * ones > len(alive) else 0
        mistakes += guess != y
        alive = [i for i in alive if p[i] == y]
    return mistakes

def adversary(predict, T):
    labels = []
    for _ in range(T):
        labels.append(1 - predict(labels))
    return labels

def best_constant(labels):
    ones = sum(labels)
    return min(ones, len(labels) - ones)`;

export const lesson: LessonContent = {
  id: "m16.6.1",
  minutes: 40,
  links: {
    requires: ["m16.1.2", "m7.4.2"],
    revisits: ["m16.1.3", "l6.1.1"],
    foreshadows: ["m16.6.2", "m16.6.3"],
  },

  puzzle: (
    <>
      <p>
        Everything so far assumed the data were drawn independently from a fixed distribution. Drop that assumption: the
        examples arrive one at a time and may be chosen by an opponent who watches what you do. Error rates mean nothing now,
        since the opponent can make every label a surprise. Is there still something a learner can promise?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Compare yourself not with perfection but with the best single rule from a fixed set, judged in hindsight on the
        sequence that actually happened. The gap is the regret. If it grows more slowly than the number of rounds, then on
        average you do as well as the best rule, whatever the sequence. Greedily following whichever rule is ahead fails
        against an opponent; a little randomness rescues it.
      </p>
      <FtlRegretViz />
    </>
  ),

  theory: (
    <>
      <Definition title="online learning and regret">
        <p>
          In each round t = 1, …, T the learner picks <M>{"x_t"}</M> from a set X, the environment reveals a loss function{" "}
          <M>{"f_t"}</M>, and the learner pays <M>{"f_t(x_t)"}</M>. The regret against a comparator set U ⊆ X is
        </p>
        <MD>{"\\mathrm{Regret}_T = \\sum_{t=1}^T f_t(x_t) - \\min_{u \\in U} \\sum_{t=1}^T f_t(u)."}</MD>
        <p>
          With N experts, X is the set of experts and <M>{"f_t(i)"}</M> is expert i&apos;s loss in round t. The environment may be{" "}
          <em>oblivious</em> (the sequence is fixed in advance) or <em>adaptive</em> (each <M>{"f_t"}</M> may depend on the
          learner&apos;s past choices). The aim is sublinear regret, <M>{"\\mathrm{Regret}_T / T \\to 0"}</M>.
        </p>
      </Definition>

      <Theorem title="follow the leader can fail">
        <p>
          Follow the leader plays <M>{"x_t \\in \\arg\\min_x \\sum_{s < t} f_s(x)"}</M>. With two experts and losses (½, 0), then
          alternately (0, 1) and (1, 0), its regret after T rounds is about T/2.
        </p>
      </Theorem>
      <Proof>
        <p>
          After the first round expert 2 leads, and it then loses 1. Now expert 1 leads by ½, and it loses 1, and so on: the
          leader always changes just in time to pay. Follow the leader pays about T while each expert pays about T/2. The
          functions <C>follow_the_leader</C>, <C>best_in_hindsight</C> and <C>regret</C> make the computation exact.
        </p>
        <Code>{LEADER}</Code>
      </Proof>

      <Theorem title="be the leader">
        <p>
          The cheating rule that plays <M>{"x_{t+1}"}</M> in round t has no regret:{" "}
          <M>{"\\sum_t f_t(x_{t+1}) \\le \\sum_t f_t(u)"}</M> for all u. Hence follow the leader satisfies
        </p>
        <MD>{"\\mathrm{Regret}_T \\le \\sum_{t=1}^T \\big(f_t(x_t) - f_t(x_{t+1})\\big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Induction on T. For T = 1 it is the definition of <M>{"x_2"}</M>. If it holds for T − 1 then, applying it with{" "}
          <M>{"u = x_{T+1}"}</M>, <M>{"\\sum_{t \\le T} f_t(x_{t+1}) \\le \\sum_{t < T} f_t(x_{T+1}) + f_T(x_{T+1}) = \\min_u \\sum_{t \\le T} f_t(u)"}</M>.
          So regret is controlled by how much the leader moves between rounds: stability again, as in m16.4.1. Every method in
          the next two lessons works by keeping the leader from jumping, through a regulariser or through randomness.
        </p>
      </Proof>

      <Theorem title="deterministic learners lose to adaptive opponents">
        <p>
          For binary labels with mistake loss and the two constant experts &quot;always 0&quot; and &quot;always 1&quot;, every deterministic
          learner has regret at least T/2 against some adaptive sequence.
        </p>
      </Theorem>
      <Proof>
        <p>
          The opponent can simulate the learner, so it sets each label to the opposite of the prediction (<C>adversary</C>).
          The learner errs T times, while one of the constant experts is right at least half the time (<C>best_constant</C>).
          This is Cover&apos;s argument. The cure is to randomise and measure expected regret, the subject of m16.6.3.
        </p>
      </Proof>

      <Theorem title="halving">
        <p>
          If one of N experts never errs, predicting with the majority of the experts not yet wrong makes at most{" "}
          <M>{"\\lfloor \\log_2 N \\rfloor"}</M> mistakes.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each mistake means at least half the surviving experts were wrong, so it at least halves the set, which never loses
          the perfect expert. After k mistakes <M>{"1 \\le N / 2^k"}</M>. The bound needs no assumption on the order of the
          examples (<C>halving</C>).
        </p>
        <Code>{MISTAKES}</Code>
      </Proof>

      <Theorem title="online to batch">
        <p>
          Suppose <M>{"f_t = \\ell(\\cdot, z_t)"}</M> with <M>{"z_t"}</M> independent draws from D and <M>{"\\ell"}</M> convex in its first
          argument, and let <M>{"L(x) = \\mathbb E_z \\ell(x, z)"}</M>. Then the average <M>{"\\bar x = \\tfrac1T \\sum_t x_t"}</M> satisfies
        </p>
        <MD>{"\\mathbb E\\, L(\\bar x) - \\min_u L(u) \\le \\frac{\\mathbb E\\, \\mathrm{Regret}_T}{T}."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"x_t"}</M> depends only on <M>{"z_1, \\dots, z_{t-1}"}</M>, so <M>{"\\mathbb E f_t(x_t) = \\mathbb E L(x_t)"}</M>. By Jensen&apos;s inequality
          (m7.4.2), <M>{"\\mathbb E L(\\bar x) \\le \\tfrac1T \\sum_t \\mathbb E L(x_t) = \\tfrac1T \\mathbb E \\sum_t f_t(x_t)"}</M>. Also{" "}
          <M>{"\\mathbb E \\min_u \\sum_t f_t(u) \\le \\min_u \\mathbb E \\sum_t f_t(u) = T \\min_u L(u)"}</M>. Subtracting gives the claim.
          A regret bound of order √T thus yields an excess-risk bound of order <M>{"1/\\sqrt T"}</M>, matching the statistical
          rates of earlier parts with no uniform convergence argument at all.
        </p>
      </Proof>

      <Remark title="bandits">
        <p>
          Here the learner sees every expert&apos;s loss. If it sees only the loss of its own choice, the problem is a bandit
          (l6.1.1), and it must explore to learn about the others. Regret is still the measure; the rates become worse by a
          factor of about √N, as m16.6.4 shows.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "halve",
      rung: "check",
      prompt: <p>There are 1000 experts and one of them is always right. What is the largest number of mistakes the halving algorithm can make?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0 },
    },
    {
      key: "batch",
      rung: "check",
      prompt: <p>An online algorithm has expected regret at most 3√T on convex losses. With T = 900 independent examples, what bound does online-to-batch conversion give on the excess risk of the averaged iterate?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "cover",
      rung: "apply",
      prompt: <p>Why can no deterministic learner guarantee sublinear regret against an adaptive opponent with two constant experts?</p>,
      answer: {
        kind: "choice",
        options: [
          "The opponent can compute the next prediction and make it wrong every round, while one constant expert is right half the time",
          "Deterministic learners cannot represent the constant experts",
          "Regret is undefined when the opponent is adaptive",
          "The halving algorithm needs randomness to break ties",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def follow_the_leader(losses):
    n = len(losses[0])
    cum, out = [0.0] * n, []
    for row in losses:
        i = min(range(n), key=lambda j: cum[j])
        out.append(row[i])
        cum = [c + l for c, l in zip(cum, row)]
    return out

def best_in_hindsight(losses):
    return min(sum(row[i] for row in losses) for i in range(len(losses[0])))

def regret(alg_losses, losses):
    return sum(alg_losses) - best_in_hindsight(losses)

L = [[0.5, 0.0], [0.0, 1.0], [1.0, 0.0], [0.0, 1.0]]; a = follow_the_leader(L); print(a, best_in_hindsight(L), regret(a, L))
print(follow_the_leader([[1.0, 2.0], [3.0, 0.0], [0.0, 0.0]]), regret([2.0, 2.0], [[1.0, 0.0], [0.0, 3.0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.0, 1.0, 1.0] 1.5 2.0\n[1.0, 3.0, 0.0] 3.0",
          "[0.5, 1.0, 1.0, 1.0] 1.5 2.0\n[1.0, 0.0, 0.0] 3.0",
          "[0.5, 0.0, 0.0, 0.0] 1.5 -1.0\n[1.0, 3.0, 0.0] 3.0",
          "[0.5, 1.0, 1.0, 1.0] 2.0 1.5\n[1.0, 3.0, 0.0] 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def halving(preds, labels):
    alive, mistakes = list(range(len(preds[0]))), 0
    for p, y in zip(preds, labels):
        ones = sum(p[i] for i in alive)
        guess = 1 if 2 * ones > len(alive) else 0
        mistakes += guess != y
        alive = [i for i in alive if p[i] == y]
    return mistakes

def adversary(predict, T):
    labels = []
    for _ in range(T):
        labels.append(1 - predict(labels))
    return labels

def best_constant(labels):
    ones = sum(labels)
    return min(ones, len(labels) - ones)

P = [[0, 0, 1, 1], [0, 1, 0, 1], [1, 1, 1, 1]]; print(halving(P, [1, 1, 1]), halving(P, [0, 0, 1]))
y = adversary(lambda h: h[-1] if h else 0, 5); print(y, best_constant(y), len(y) - best_constant(y))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 0\n[1, 0, 1, 0, 1] 2 3",
          "1 0\n[1, 0, 1, 0, 1] 2 3",
          "2 0\n[0, 1, 0, 1, 0] 2 3",
          "2 1\n[1, 1, 1, 1, 1] 0 5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The argument <C>losses</C> is a list of rounds, each a list of the N experts&apos; losses. Write{" "}
          <C>follow_the_leader(losses)</C> returning the loss paid each round (ties go to the lowest index),{" "}
          <C>best_in_hindsight(losses)</C> and <C>regret(alg_losses, losses)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def follow_the_leader(losses):
    return [row[0] for row in losses]

def best_in_hindsight(losses):
    return 0.0

def regret(alg_losses, losses):
    return sum(alg_losses)
`,
        solution: LEADER,
        tests: [
          { name: "leader", code: `assert follow_the_leader([[0.0, 0.0, 0.0], [5.0, 1.0, 2.0], [0.0, 3.0, 9.0], [1.0, 0.0, 0.0]]) == [0.0, 5.0, 3.0, 0.0] and follow_the_leader([[2.0, 1.0]]) == [2.0]` },
          { name: "regret", code: `L = [[1.0, 0.0], [1.0, 2.0], [0.0, 0.5]]
assert best_in_hindsight(L) == 2.0 and abs(regret([0.5, 0.5, 0.5], L) + 0.5) < 1e-12 and regret(follow_the_leader(L), L) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>halving(preds, labels)</C>, where <C>preds[t][i]</C> is expert i&apos;s 0/1 prediction in round t, predicting 1 only
          when more than half the surviving experts say 1, and returning the number of mistakes;{" "}
          <C>adversary(predict, T)</C>, where <C>predict(history)</C> maps the labels so far to a prediction; and{" "}
          <C>best_constant(labels)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def halving(preds, labels):
    return 0

def adversary(predict, T):
    return [0] * T

def best_constant(labels):
    return 0
`,
        solution: MISTAKES,
        tests: [
          { name: "halving", code: `P = [[1, 1, 0, 0, 0, 0, 0, 0], [1, 0, 1, 1, 0, 0, 0, 0], [0, 0, 1, 0, 1, 0, 0, 0]]
assert halving(P, [1, 0, 0]) == 1 and halving(P, [1, 1, 0]) == 2 and halving(P, [0, 0, 0]) == 0 and halving([[1, 1, 0]], [0]) == 1` },
          { name: "adversary", code: `y = adversary(lambda h: 1, 4); z = adversary(lambda h: sum(h) % 2, 5)
assert y == [0, 0, 0, 0] and z == [1, 0, 0, 0, 0] and best_constant([1, 1, 0, 1, 0, 1]) == 2 and best_constant(z) == 1` },
        ],
      },
    },
    {
      key: "coins",
      rung: "stretch",
      prompt: (
        <p>
          The labels are ten independent fair coin flips, so any learner makes 5 mistakes in expectation. What is its expected
          regret against the better of the two constant experts, judged in hindsight? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.2305, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Follow the leader fails because its choice jumps. The next lesson keeps it steady with a step size: online gradient
        descent on convex losses, whose regret grows only like √T.
      </p>
    </>
  ),
};
