import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MdlPolyViz } from "@/components/viz/MdlPolyViz";
import type { LessonContent } from "@/lib/types";

const TP = `import math

def elias_gamma(n):
    b = format(n, "b")
    return "0" * (len(b) - 1) + b

def two_part_bits(x, m):
    n, k = len(x), sum(x)
    costs = []
    for j in range(m):
        th = (j + 0.5) / m
        costs.append(math.log2(m) - k * math.log2(th) - (n - k) * math.log2(1 - th))
    return min(costs)

def best_grid(x, sizes):
    return min(sizes, key=lambda m: two_part_bits(x, m))`;

const PD = `import numpy as np

def mdl_score(x, y, d):
    n, coef = len(x), np.polyfit(x, y, d)
    rss = float(np.sum((np.polyval(coef, x) - y) ** 2))
    return 0.5 * n * np.log2(rss / n) + 0.5 * (d + 1) * np.log2(n)

def choose_degree(x, y, max_d):
    return min(range(max_d + 1), key=lambda d: mdl_score(x, y, d))`;

export const lesson: LessonContent = {
  id: "m12.4.3",
  minutes: 55,
  links: {
    requires: ["m12.4.2"],
    revisits: ["m12.3.4", "m12.4.1"],
    foreshadows: ["m12.6.4"],
  },

  puzzle: (
    <>
      <p>
        A polynomial of degree 29 passes exactly through 30 noisy points, so it explains the data perfectly. A straight line
        explains them badly. We all feel the right answer is in between, but on what principle? &quot;Prefer simple
        models&quot; is a slogan, not a rule. Can compression turn it into a calculation, with an exchange rate between
        model complexity and fit measured in the same unit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Imagine sending the data to a friend. You may first send a model and then the data coded with it. A complex model
        makes the second part short, but the model itself costs bits to describe. The best explanation is the one with the
        shortest total message. A parameter estimated from n points is only known to about <M>{"1/\\sqrt n"}</M>, so it is
        worth sending to that precision and no further, which costs about <M>{"\\tfrac12 \\log_2 n"}</M> bits per parameter.
      </p>
      <MdlPolyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="two-part code">
        <p>
          For a class of hypotheses H, each with a prefix code length L(H), the two-part code length of data D is{" "}
          <M>{"\\min_H \\, [L(H) + L(D \\mid H)]"}</M>, where <M>{"L(D \\mid H) = -\\log_2 P_H(D)"}</M>. The minimum description
          length principle selects the minimising H.
        </p>
      </Definition>

      <Definition title="a code for the integers">
        <p>
          To send a model index or a parameter count with no upper bound we need a prefix code for all positive integers.
          The Elias gamma code writes n in binary (b digits, the first being 1) after b − 1 zeros, so its length is{" "}
          <M>{"2\\lfloor \\log_2 n \\rfloor + 1"}</M>. The decoder counts zeros to learn how many digits follow.
        </p>
      </Definition>

      <Theorem title="a parameter costs about ½ log₂ n bits">
        <p>
          For n independent Bernoulli(θ) observations with MLE <M>{"\\hat\\theta"}</M> strictly between 0 and 1, sending θ on a
          grid of spacing δ and then the data costs, at the best grid point,
        </p>
        <MD>{"\\log_2 \\tfrac1\\delta + n\\,h(\\hat\\theta) + O\\Bigl(\\frac{n\\delta^2}{\\hat\\theta(1-\\hat\\theta)}\\Bigr)"}</MD>
        <p>
          bits, where h is the binary entropy. Choosing <M>{"\\delta \\propto 1/\\sqrt n"}</M> makes the total{" "}
          <M>{"n h(\\hat\\theta) + \\tfrac12 \\log_2 n + O(1)"}</M>, and no other scaling of δ does better. With k parameters
          the cost is <M>{"\\tfrac k2 \\log_2 n"}</M>, which is the Bayesian information criterion measured in bits.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sketch. The data cost at θ is <M>{"-\\log_2 P_\\theta(D) = n h(\\hat\\theta) + n\\, D(\\hat\\theta \\,\\|\\, \\theta)"}</M>, since
          the log-likelihood depends on the data only through <M>{"\\hat\\theta"}</M>. The divergence is zero with zero
          derivative at <M>{"\\theta = \\hat\\theta"}</M>, so by Taylor&apos;s theorem it is about{" "}
          <M>{"(\\theta - \\hat\\theta)^2 / (2\\hat\\theta(1-\\hat\\theta)\\ln 2)"}</M>. Some grid point is within δ/2 of the MLE,
          which gives the error term. Balancing <M>{"\\log_2(1/\\delta)"}</M> against <M>{"n\\delta^2"}</M>: if{" "}
          <M>{"\\delta \\gg 1/\\sqrt n"}</M> the quadratic term grows without bound, and if <M>{"\\delta \\ll 1/\\sqrt n"}</M> the
          first term exceeds <M>{"\\tfrac12\\log_2 n"}</M> by an unbounded amount.
        </p>
        <Code>{TP}</Code>
      </Proof>

      <Remark title="regression and the Gaussian code">
        <p>
          For regression with Gaussian errors of variance <M>{"\\hat\\sigma^2 = \\mathrm{RSS}/n"}</M>, the data part is{" "}
          <M>{"\\tfrac n2 \\log_2 \\hat\\sigma^2"}</M> plus terms that do not depend on the model, so the two-part length of a
          degree-d polynomial is <M>{"\\tfrac n2 \\log_2(\\mathrm{RSS}/n) + \\tfrac{d+1}2\\log_2 n"}</M> up to a constant. Adding
          a parameter is worth it only if it cuts the RSS by a factor of about <M>{"n^{-1/n}"}</M>, roughly{" "}
          <M>{"1 - \\ln n / n"}</M>.
        </p>
        <Code>{PD}</Code>
      </Remark>

      <Remark title="other codes, same idea">
        <p>
          A two-part code is not the only option. The mixture codes of the last two lessons spread their bets over all
          parameters at once, and the Krichevsky–Trofimov code also pays about <M>{"\\tfrac12\\log_2 n"}</M> bits for a coin.
          The prequential or online code, which predicts each point from a model trained on the points before it, needs no
          parameter code at all; Blier and Ollivier (2018) used it to show that deep networks, despite millions of
          parameters, give genuinely short descriptions of their training labels. If L(H) is read as −log₂ of a prior, the
          two-part code is the MAP estimate, so MDL and Bayes agree on many answers. The critical points: the result depends
          on the codes chosen, the constants matter for small n, and a short description is evidence of regularity, not a
          proof that the model is true.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gamma",
      rung: "check",
      prompt: <p>How many bits does the Elias gamma code use for the integer 100?</p>,
      answer: { kind: "numeric", value: 13, tolerance: 0 },
    },
    {
      key: "bic",
      rung: "check",
      prompt: <p>A model with 5 real parameters is fitted to n = 1024 points. What is its parameter cost in bits under the ½ log₂ n rule?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0 },
    },
    {
      key: "precision",
      rung: "apply",
      prompt: <p>Why is a parameter sent to precision about 1/√n rather than to full machine precision?</p>,
      answer: {
        kind: "choice",
        options: [
          "The estimate itself is only accurate to about 1/√n, so extra digits cost bits without shortening the data part noticeably",
          "Machine precision numbers cannot be coded with a prefix code",
          "The data part is shortest when the parameter is rounded coarsely",
          "The Kraft inequality forbids codes for more than √n grid points",
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

def elias_gamma(n):
    b = format(n, "b")
    return "0" * (len(b) - 1) + b

def two_part_bits(x, m):
    n, k = len(x), sum(x)
    costs = []
    for j in range(m):
        th = (j + 0.5) / m
        costs.append(math.log2(m) - k * math.log2(th) - (n - k) * math.log2(1 - th))
    return min(costs)

def best_grid(x, sizes):
    return min(sizes, key=lambda m: two_part_bits(x, m))

print([elias_gamma(n) for n in (1, 2, 5)], len(elias_gamma(1000)))
x = [1] * 30 + [0] * 70; print(round(two_part_bits(x, 1), 1), round(two_part_bits(x, 8), 1), best_grid(x, [1, 2, 4, 8, 16, 32, 64]))
x = [1] * 300 + [0] * 700; print(best_grid(x, [1, 2, 4, 8, 16, 32, 64]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['1', '010', '00101'] 19\n100.0 91.2 2\n8",
          "['1', '10', '101'] 10\n100.0 91.2 2\n8",
          "['1', '010', '00101'] 19\n100.0 88.1 2\n8",
          "['1', '010', '00101'] 19\n100.0 91.2 8\n8",
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

def mdl_score(x, y, d):
    n, coef = len(x), np.polyfit(x, y, d)
    rss = float(np.sum((np.polyval(coef, x) - y) ** 2))
    return 0.5 * n * np.log2(rss / n) + 0.5 * (d + 1) * np.log2(n)

def choose_degree(x, y, max_d):
    return min(range(max_d + 1), key=lambda d: mdl_score(x, y, d))

rng = np.random.default_rng(2); x = np.linspace(-1, 1, 40); y = 1 - 2 * x + 3 * x ** 2 + 0.3 * rng.normal(size=40)
print(choose_degree(x, y, 8), mdl_score(x, y, 2) < mdl_score(x, y, 1), mdl_score(x, y, 2) < mdl_score(x, y, 8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 True True", "8 False True", "8 True False", "1 False True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>elias_gamma(n)</C>; <C>two_part_bits(x, m)</C>, the shortest two-part length of a 0/1 list when θ is sent
          as one of the m grid midpoints (j + ½)/m at a cost of log₂ m bits; and <C>best_grid(x, sizes)</C>, the grid size
          that minimises it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def elias_gamma(n):
    return format(n, "b")

def two_part_bits(x, m):
    return 0.0

def best_grid(x, sizes):
    return sizes[0]
`,
        solution: TP,
        tests: [
          { name: "gamma", code: `codes = [elias_gamma(n) for n in range(1, 65)]; assert elias_gamma(9) == "0001001"
assert not any(a != b and b.startswith(a) for a in codes for b in codes)` },
          { name: "twopart", code: `assert abs(two_part_bits([1, 0], 1) - 2.0) < 1e-12 and abs(two_part_bits([1] * 10, 4) - (2 - 10 * math.log2(0.875))) < 1e-9
assert best_grid([1] * 10 + [0] * 10, [1, 2, 4]) == 1 and best_grid([1] * 90 + [0] * 10, [1, 8]) == 8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mdl_score(x, y, d)</C>, equal to <M>{"\\tfrac n2 \\log_2(\\mathrm{RSS}/n) + \\tfrac{d+1}2 \\log_2 n"}</M> for a
          least-squares polynomial of degree d, and <C>choose_degree(x, y, max_d)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mdl_score(x, y, d):
    return 0.0

def choose_degree(x, y, max_d):
    return max_d
`,
        solution: PD,
        tests: [
          { name: "score", code: `x = np.linspace(0, 1, 8); y = x ** 2
assert np.isclose(mdl_score(x, y, 0), 4 * np.log2(np.mean((y - y.mean()) ** 2)) + 1.5)` },
          { name: "choose", code: `x = np.linspace(0, 1, 50); y = 2 * x + 0.1 * np.sin(37 * x); assert choose_degree(x, y, 5) == 1
x = np.linspace(-1, 1, 30); y = x ** 3 - x + 0.05 * np.cos(41 * x); assert choose_degree(x, y, 6) == 3` },
        ],
      },
    },
    {
      key: "coin",
      rung: "stretch",
      prompt: (
        <p>
          A coin is flipped 1000 times and lands heads 300 times. Using the plug-in data cost <M>{"n\\,h(\\hat\\theta)"}</M> and
          a parameter cost of <M>{"\\tfrac12\\log_2 n"}</M>, what is the two-part code length in bits? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 886.3, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far information has been about describing data. The next section turns to sending it: a noisy channel corrupts
        symbols, and the question becomes how many bits per use can still get through reliably.
      </p>
    </>
  ),
};
