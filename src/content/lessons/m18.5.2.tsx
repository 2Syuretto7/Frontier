import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UrnPathsViz } from "@/components/viz/UrnPathsViz";
import type { LessonContent } from "@/lib/types";

const FAIR = `from itertools import product

def check_martingale(M, n, tol=1e-12):
    for k in range(n):
        for path in product((1, -1), repeat=k):
            up, down = M(path + (1,)), M(path + (-1,))
            if abs((up + down) / 2 - M(path)) > tol:
                return False
    return True

def transform(H, path):
    return sum(H(path[:k]) * path[k] for k in range(len(path)))

def mean_transform(H, n):
    paths = list(product((1, -1), repeat=n))
    return sum(transform(H, p) for p in paths) / len(paths)`;

const URN = `def polya_step(r, b, u):
    return (r + 1, b) if u < r / (r + b) else (r, b + 1)

def sequence_prob(colours, r, b):
    p = 1.0
    for c in colours:
        if c == 'R':
            p *= r / (r + b)
            r += 1
        else:
            p *= b / (r + b)
            b += 1
    return p

def reds_dist(n, r=1, b=1):
    dist = {0: 1.0}
    for t in range(n):
        new = {}
        for k, p in dist.items():
            total = r + b + t
            new[k + 1] = new.get(k + 1, 0) + p * (r + k) / total
            new[k] = new.get(k, 0) + p * (b + t - k) / total
        dist = new
    return dist`;

export const lesson: LessonContent = {
  id: "m18.5.2",
  minutes: 45,
  links: {
    requires: ["m18.5.1"],
    revisits: ["m7.8.4", "m18.4.2"],
    foreshadows: ["m18.5.3", "m18.5.4"],
  },

  puzzle: (
    <>
      <p>
        A gambler at a fair coin-toss game doubles the stake after every loss and stops after the first win. Each round
        the expected gain is zero, yet the strategy seems to guarantee a profit of one unit. Separately, an urn starts with
        one red and one blue ball; each draw returns the ball together with another of the same colour. The fraction of red
        wanders at first and then freezes, at a different value on every run. What single notion explains both?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A martingale is a process whose best forecast of tomorrow, given everything known today, is today&apos;s value. It
        is the mathematical form of a fair game. Fairness constrains expectations at every step, but not individual paths:
        paths may wander, settle at random limits, or, with unbounded stakes and time, appear to beat the game.
      </p>
      <UrnPathsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="filtrations and martingales">
        <p>
          A filtration is an increasing sequence of σ-algebras <M>{"\\mathcal F_0 \\subseteq \\mathcal F_1 \\subseteq \\cdots \\subseteq \\mathcal F"}</M>, the
          information available at each time. A process <M>{"(M_n)"}</M> is adapted if each <M>{"M_n"}</M> is <M>{"\\mathcal F_n"}</M>-measurable. It is a
          martingale if each <M>{"M_n"}</M> is integrable and
        </p>
        <MD>{"\\mathbb E[M_{n+1} \\mid \\mathcal F_n] = M_n \\quad \\text{almost surely,}"}</MD>
        <p>
          a submartingale with ≥ and a supermartingale with ≤. By the tower property (m18.5.1),{" "}
          <M>{"\\mathbb E[M_m \\mid \\mathcal F_n] = M_n"}</M> for all m ≥ n and <M>{"\\mathbb E M_n = \\mathbb E M_0"}</M>. For coin tosses the condition
          says the two continuations of every path average to the current value (<C>check_martingale</C>).
        </p>
      </Definition>

      <Example title="the standard examples">
        <ul>
          <li>Sums of independent mean-zero variables, such as the simple random walk <M>{"S_n"}</M> of m7.8.4.</li>
          <li><M>{"S_n^2 - n"}</M>, and products of independent mean-one variables.</li>
          <li>
            Doob martingales <M>{"M_n = \\mathbb E[X \\mid \\mathcal F_n]"}</M> for integrable X: predictions that sharpen as information
            arrives, as in the cell averages of m18.5.1.
          </li>
          <li>
            Likelihood ratios: if Q ≪ P on each <M>{"\\mathcal F_n"}</M>, then <M>{"L_n = dQ|_{\\mathcal F_n} / dP|_{\\mathcal F_n}"}</M> is a P-martingale
            (m18.4.2).
          </li>
          <li>
            The Pólya urn: with <M>{"R_n"}</M> red among <M>{"T_n"}</M> balls, <M>{"\\mathbb E[R_{n+1} \\mid \\mathcal F_n] = R_n + R_n/T_n"}</M>, so{" "}
            <M>{"R_{n+1}/T_{n+1}"}</M> has conditional mean <M>{"(R_n + R_n/T_n)/(T_n + 1) = R_n/T_n"}</M>.
          </li>
        </ul>
      </Example>

      <Theorem title="you cannot beat a fair game in finite time">
        <p>
          Let <M>{"(M_n)"}</M> be a martingale and <M>{"(H_n)_{n \\ge 1}"}</M> predictable, meaning <M>{"H_n"}</M> is <M>{"\\mathcal F_{n-1}"}</M>-measurable, and bounded.
          Then the transform
        </p>
        <MD>{"(H \\cdot M)_n = \\sum_{k=1}^{n} H_k (M_k - M_{k-1})"}</MD>
        <p>is a martingale with mean zero.</p>
      </Theorem>
      <Proof>
        <p>
          Taking out what is known: <M>{"\\mathbb E[H_{n+1}(M_{n+1} - M_n) \\mid \\mathcal F_n] = H_{n+1}\\, \\mathbb E[M_{n+1} - M_n \\mid \\mathcal F_n] = 0"}</M>.
          Boundedness makes every term integrable. The stakes <M>{"H_n"}</M> are the gambler&apos;s bets, chosen from the past (
          <C>transform</C>); averaged over all paths of a fixed length, every strategy gains exactly zero (<C>mean_transform</C>).
          The doubling strategy wins one unit on most paths and loses <M>{"2^n - 1"}</M> on the one path of n straight losses.
        </p>
        <Code>{FAIR}</Code>
      </Proof>

      <Theorem title="Doob decomposition">
        <p>
          Every adapted integrable process splits uniquely as <M>{"X_n = X_0 + M_n + A_n"}</M>, with M a martingale, <M>{"M_0 = A_0 = 0"}</M>, and A
          predictable. X is a submartingale exactly when A is increasing.
        </p>
      </Theorem>
      <Proof>
        <p>
          Set <M>{"A_n = \\sum_{k \\le n} \\mathbb E[X_k - X_{k-1} \\mid \\mathcal F_{k-1}]"}</M>, predictable by construction, and <M>{"M_n = X_n - X_0 - A_n"}</M>,
          whose increments have conditional mean zero. Uniqueness: a predictable martingale starting at 0 is constant, since{" "}
          <M>{"D_n = \\mathbb E[D_n \\mid \\mathcal F_{n-1}] = D_{n-1}"}</M>. For <M>{"S_n^2"}</M> the compensator is <M>{"A_n = n"}</M>.
        </p>
      </Proof>

      <Remark title="exchangeability in the urn">
        <p>
          In the Pólya urn every colour sequence with the same number of reds has the same probability (<C>sequence_prob</C>):
          the numerators are the same factors in a different order. From one ball of each colour, the number of reds after
          n draws is uniform on 0, …, n (<C>reds_dist</C>), so the limiting fraction, which exists by m18.5.4, is uniform on
          [0, 1].
        </p>
        <Code>{URN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "urn",
      rung: "check",
      prompt: <p>A Pólya urn starts with one red and one blue ball. What is the probability that the first two draws are both red?</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "drift",
      rung: "check",
      prompt: (
        <p>
          A walk steps +1 with probability 0.6 and −1 with probability 0.4. Its Doob decomposition is{" "}
          <M>{"S_n = M_n + A_n"}</M>. What is <M>{"A_{25}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "convex",
      rung: "apply",
      prompt: <p>M is a martingale and φ is convex with φ(Mₙ) integrable. What is φ(Mₙ)?</p>,
      answer: {
        kind: "choice",
        options: [
          "A submartingale, by conditional Jensen",
          "A martingale",
          "A supermartingale",
          "Nothing in general",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def check_martingale(M, n, tol=1e-12):
    for k in range(n):
        for path in product((1, -1), repeat=k):
            up, down = M(path + (1,)), M(path + (-1,))
            if abs((up + down) / 2 - M(path)) > tol:
                return False
    return True

def transform(H, path):
    return sum(H(path[:k]) * path[k] for k in range(len(path)))

def mean_transform(H, n):
    paths = list(product((1, -1), repeat=n))
    return sum(transform(H, p) for p in paths) / len(paths)

S = lambda p: sum(p); print(check_martingale(S, 4), check_martingale(lambda p: S(p) ** 2, 3), check_martingale(lambda p: S(p) ** 2 - len(p), 4), check_martingale(lambda p: 2 ** S(p), 2))
double = lambda h: 2 ** len(h) if all(x == -1 for x in h) else 0; print(transform(double, (-1, -1, 1)), transform(double, (1, 1, 1)), mean_transform(double, 3), mean_transform(lambda h: 1 if h[-1:] == (1,) else 0, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False True False\n1 1 0.0 0.0",
          "True True True False\n1 1 0.0 0.0",
          "True False True True\n-3 1 0.0 0.0",
          "True False True False\n1 3 1.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def polya_step(r, b, u):
    return (r + 1, b) if u < r / (r + b) else (r, b + 1)

def sequence_prob(colours, r, b):
    p = 1.0
    for c in colours:
        if c == 'R':
            p *= r / (r + b)
            r += 1
        else:
            p *= b / (r + b)
            b += 1
    return p

def reds_dist(n, r=1, b=1):
    dist = {0: 1.0}
    for t in range(n):
        new = {}
        for k, p in dist.items():
            total = r + b + t
            new[k + 1] = new.get(k + 1, 0) + p * (r + k) / total
            new[k] = new.get(k, 0) + p * (b + t - k) / total
        dist = new
    return dist

print(polya_step(1, 1, 0.3), polya_step(1, 1, 0.7), round(sequence_prob('RRB', 1, 1), 4), round(sequence_prob('BRR', 1, 1), 4))
print(sorted((k, round(v, 4)) for k, v in reds_dist(3).items()), round(reds_dist(2, 2, 1)[2], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 1) (1, 2) 0.0833 0.0833\n[(0, 0.25), (1, 0.25), (2, 0.25), (3, 0.25)] 0.5",
          "(2, 1) (1, 2) 0.0833 0.0417\n[(0, 0.25), (1, 0.25), (2, 0.25), (3, 0.25)] 0.5",
          "(2, 1) (1, 2) 0.125 0.125\n[(0, 0.125), (1, 0.375), (2, 0.375), (3, 0.125)] 0.4444",
          "(1, 2) (2, 1) 0.0833 0.0833\n[(0, 0.25), (1, 0.25), (2, 0.25), (3, 0.25)] 0.6667",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Processes on fair ±1 coin tosses are functions of the tuple of tosses so far. Write <C>check_martingale(M, n)</C>,
          testing the martingale property at every path of length below n; <C>transform(H, path)</C>, the gain from betting{" "}
          H(history) on each toss; and <C>mean_transform(H, n)</C>, its average over all paths of length n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def check_martingale(M, n, tol=1e-12):
    return False

def transform(H, path):
    return 0

def mean_transform(H, n):
    return 0.0
`,
        solution: FAIR,
        tests: [
          { name: "martingale", code: `assert check_martingale(lambda p: sum(p) ** 3 - 3 * len(p) * sum(p), 4) and not check_martingale(lambda p: len(p), 2)` },
          { name: "transform", code: `assert transform(lambda h: 2, (1, -1, 1)) == 2 and transform(lambda h: len(h), (1, 1, -1)) == -1 and abs(mean_transform(lambda h: len(h) + 1, 3)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>polya_step(r, b, u)</C>, adding a red ball when u &lt; r/(r + b) and a blue one otherwise;{" "}
          <C>sequence_prob(colours, r, b)</C> for a string of &apos;R&apos; and &apos;B&apos;; and <C>reds_dist(n, r, b)</C>, the distribution
          of the number of red draws among the first n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def polya_step(r, b, u):
    return r, b

def sequence_prob(colours, r, b):
    return 0.0

def reds_dist(n, r=1, b=1):
    return {}
`,
        solution: URN,
        tests: [
          { name: "steps", code: `assert polya_step(2, 3, 0.39) == (3, 3) and polya_step(2, 3, 0.41) == (2, 4)
assert abs(sequence_prob('RB', 1, 1) - 1 / 6) < 1e-12 and abs(sequence_prob('RRR', 1, 1) - 0.25) < 1e-12` },
          { name: "distribution", code: `d = reds_dist(2, 1, 2)
assert abs(d[2] - 1 / 6) < 1e-12 and abs(d[0] - 0.5) < 1e-12 and abs(sum(reds_dist(5, 2, 3).values()) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "beta",
      rung: "stretch",
      prompt: (
        <p>
          A Pólya urn starts with two red balls and one blue. Find the law of the number of reds in n draws, deduce that the
          limiting fraction of red has density 2x on [0, 1], and compute the probability that the limit exceeds 1/2.
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The doubling strategy fails only because it may need unbounded time and credit. Optional stopping makes this precise:
        it says exactly when stopping a martingale at a random time preserves its mean.
      </p>
    </>
  ),
};
