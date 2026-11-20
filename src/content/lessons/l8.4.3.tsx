import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AllocationViz } from "@/components/viz/AllocationViz";
import type { LessonContent } from "@/lib/types";

const PARAMETRIC = `E, A, B, ALPHA, BETA = 1.69, 406.4, 410.7, 0.34, 0.28

def chinchilla_loss(N, D):
    return E + A / N ** ALPHA + B / D ** BETA

def optimal_split(C):
    G = (ALPHA * A / (BETA * B)) ** (1 / (ALPHA + BETA))
    N = G * (C / 6) ** (BETA / (ALPHA + BETA))
    return N, C / (6 * N)

def isoflop_losses(C, Ns):
    return [chinchilla_loss(N, C / (6 * N)) for N in Ns]`;

const ISOFLOP = `import math

def solve3(M, v):
    M = [row[:] + [b] for row, b in zip(M, v)]
    for i in range(3):
        p = max(range(i, 3), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(i + 1, 3):
            f = M[r][i] / M[i][i]
            M[r] = [a - f * b for a, b in zip(M[r], M[i])]
    x = [0.0] * 3
    for i in (2, 1, 0):
        x[i] = (M[i][3] - sum(M[i][j] * x[j] for j in range(i + 1, 3))) / M[i][i]
    return x

def quad_fit(xs, ys):
    S = [sum(x ** k for x in xs) for k in range(5)]
    T = [sum(y * x ** k for x, y in zip(xs, ys)) for k in range(3)]
    c, b, a = solve3([[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]], T)
    return a, b, c

def isoflop_min(Ns, losses):
    a, b, c = quad_fit([math.log10(n) for n in Ns], losses)
    return 10 ** (-b / (2 * a))`;

export const lesson: LessonContent = {
  id: "l8.4.3",
  minutes: 55,
  links: {
    requires: ["l8.4.2", "m17.5.3", "m5.5.5"],
    revisits: ["l8.4.1", "l8.1.3"],
    foreshadows: ["l8.4.4", "l8.5.3"],
  },

  puzzle: (
    <>
      <p>
        Hoffmann and colleagues trained over four hundred models, from 70 million to 16 billion parameters, each with a
        learning-rate schedule matched to its own length. Then they trained Chinchilla, 70 billion parameters on 1.4 trillion
        tokens, with the same compute as the 280-billion-parameter Gopher, and it beat Gopher across the board. Their laws said
        parameters and tokens should grow in equal proportion. How did they reach that answer, and how robust is the number of
        about twenty tokens per parameter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At a fixed compute budget, a bigger model sees fewer tokens. Too big, and it is undertrained; too small, and it runs
        out of capacity while data are still teaching it. Somewhere between lies the best split. Measure it at many budgets and
        the optimum traces a line: if parameters and tokens both grow like the square root of compute, the ratio between them
        stays fixed, and the models of 2020 and 2021 were several times too large for their budgets.
      </p>
      <AllocationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the parametric law">
        <p>
          Chinchilla&apos;s third approach fits
        </p>
        <MD>{"L(N, D) = E + \\frac{A}{N^{\\alpha}} + \\frac{B}{D^{\\beta}}"}</MD>
        <p>
          with the published values E = 1.69, A = 406.4, B = 410.7, α = 0.34 and β = 0.28 (<C>chinchilla_loss</C>). E is the entropy of
          text, the second term the cost of finite capacity, the third the cost of finite data. Along a fixed budget{" "}
          <M>{"C = 6ND"}</M> the loss traces an isoFLOP profile (<C>isoflop_losses</C>).
        </p>
        <Code>{PARAMETRIC}</Code>
      </Definition>

      <Theorem title="the optimal split">
        <p>
          Minimising <M>{"L(N, D)"}</M> subject to <M>{"6ND = C"}</M> gives
        </p>
        <MD>{"N^* = G\\left(\\frac{C}{6}\\right)^{a}, \\quad D^* = G^{-1}\\left(\\frac{C}{6}\\right)^{b}, \\quad a = \\frac{\\beta}{\\alpha + \\beta}, \; b = \\frac{\\alpha}{\\alpha + \\beta}, \; G = \\left(\\frac{\\alpha A}{\\beta B}\\right)^{1/(\\alpha + \\beta)}"}</MD>
        <p>
          (<C>optimal_split</C>). With the fitted exponents, a ≈ 0.45 and b ≈ 0.55: both grow roughly as the square root of compute.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substitute <M>{"D = C/(6N)"}</M>, so the data term becomes <M>{"B (C/6)^{-\\beta} N^{\\beta}"}</M>. Setting the derivative in N to zero gives{" "}
          <M>{"\\alpha A N^{-\\alpha - 1} = \\beta B (C/6)^{-\\beta} N^{\\beta - 1}"}</M>, so{" "}
          <M>{"N^{\\alpha + \\beta} = \\frac{\\alpha A}{\\beta B}(C/6)^{\\beta}"}</M>, which is the formula for <M>{"N^*"}</M>; then{" "}
          <M>{"D^* = (C/6)/N^*"}</M>. The objective is convex in <M>{"\\log N"}</M>, a sum of two exponentials of it, so this stationary point is the
          minimum, as in m5.5.5.
        </p>
      </Proof>

      <Definition title="the isoFLOP approach">
        <p>
          The second approach avoids assuming a functional form in N. For each of several budgets, train models of different
          sizes, fit a parabola to loss against <M>{"\\log_{10} N"}</M> by least squares (<C>solve3</C>, <C>quad_fit</C>), and take its vertex as the
          optimal size (<C>isoflop_min</C>). A power law through the optima across budgets gives the exponent directly.
        </p>
        <Code>{ISOFLOP}</Code>
      </Definition>

      <Remark title="how robust is twenty?">
        <p>
          The first two approaches both gave exponents near 0.5 and about 20 tokens per parameter at the scales studied. The
          parametric fit, taken at face value, gives exponent 0.45 and a ratio that drifts from about 60 to 100 tokens per
          parameter across realistic budgets; Besiroglu and colleagues traced this to a fitting problem and their refit agreed
          with 20. Later studies with different data, tokenisers and architectures found ratios anywhere from about 15 to 40.
          The robust lessons are that N and D should grow at similar rates and that the optimum is flat, so being off by a
          factor of two in model size costs little.
        </p>
      </Remark>

      <Example title="Chinchilla against Gopher">
        <p>
          Gopher used 280 billion parameters and 300 billion tokens, about 1 token per parameter; Chinchilla used 70 billion and
          1.4 trillion, 20 per parameter, at roughly the same compute. Chinchilla had lower loss and higher scores on almost
          every benchmark, and as a bonus it was four times cheaper to run, a point the next lesson makes central.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "nopt",
      rung: "check",
      prompt: <p>Using the parametric law and the formula for N*, what is the compute-optimal model size for C = 10²² FLOPs, in billions of parameters? Give two decimals.</p>,
      answer: { kind: "numeric", value: 5.16, tolerance: 0.01 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>Using the same formula, how many tokens per parameter does the compute-optimal model have at C = 10²⁴ FLOPs? Give one decimal.</p>,
      answer: { kind: "numeric", value: 97.7, tolerance: 0.1 },
    },
    {
      key: "flat",
      rung: "apply",
      prompt: <p>Why does training a model somewhat larger or smaller than N* cost little?</p>,
      answer: {
        kind: "choice",
        options: [
          "The isoFLOP profile is smooth with a minimum, so near the optimum the loss changes only quadratically with the error in log N",
          "Because all models trained on the same compute reach the same loss",
          "Because the irreducible loss E dominates at every size",
          "Because larger models always compensate by learning faster",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`E, A, B, ALPHA, BETA = 1.69, 406.4, 410.7, 0.34, 0.28

def chinchilla_loss(N, D):
    return E + A / N ** ALPHA + B / D ** BETA

def optimal_split(C):
    G = (ALPHA * A / (BETA * B)) ** (1 / (ALPHA + BETA))
    N = G * (C / 6) ** (BETA / (ALPHA + BETA))
    return N, C / (6 * N)

def isoflop_losses(C, Ns):
    return [chinchilla_loss(N, C / (6 * N)) for N in Ns]

N, D = optimal_split(6e23); print(round(chinchilla_loss(1e40, 1e40), 2), round(6 * N * D / 6e23, 6), N < 1e11 < D)
print(min(range(3), key=lambda i: isoflop_losses(6e23, [1e10, 7e10, 3e11])[i]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.69 1.0 True\n1",
          "1.69 6.0 True\n1",
          "0.0 1.0 True\n1",
          "1.69 1.0 False\n2",
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

def solve3(M, v):
    M = [row[:] + [b] for row, b in zip(M, v)]
    for i in range(3):
        p = max(range(i, 3), key=lambda r: abs(M[r][i]))
        M[i], M[p] = M[p], M[i]
        for r in range(i + 1, 3):
            f = M[r][i] / M[i][i]
            M[r] = [a - f * b for a, b in zip(M[r], M[i])]
    x = [0.0] * 3
    for i in (2, 1, 0):
        x[i] = (M[i][3] - sum(M[i][j] * x[j] for j in range(i + 1, 3))) / M[i][i]
    return x

def quad_fit(xs, ys):
    S = [sum(x ** k for x in xs) for k in range(5)]
    T = [sum(y * x ** k for x, y in zip(xs, ys)) for k in range(3)]
    c, b, a = solve3([[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]], T)
    return a, b, c

def isoflop_min(Ns, losses):
    a, b, c = quad_fit([math.log10(n) for n in Ns], losses)
    return 10 ** (-b / (2 * a))

print([round(v, 6) for v in quad_fit([0, 1, 2, 3], [5, 2, 1, 2])], solve3([[2, 0, 0], [0, 4, 0], [0, 0, 1]], [2, 2, 3]))
print(round(isoflop_min([1e9, 1e10, 1e11], [3.0, 2.0, 3.0]), 3), round(math.log10(isoflop_min([1e8, 1e9, 1e10, 1e11], [4.0, 2.5, 2.0, 2.5])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, -4.0, 5.0] [1.0, 0.5, 3.0]\n10000000000.0 10.0",
          "[5.0, -4.0, 1.0] [1.0, 0.5, 3.0]\n10000000000.0 10.0",
          "[1.0, -4.0, 5.0] [2.0, 2.0, 3.0]\n10000000000.0 10.0",
          "[1.0, -4.0, 5.0] [1.0, 0.5, 3.0]\n10.0 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chinchilla_loss(N, D)</C>, <C>optimal_split(C)</C>, returning (N*, D*), and <C>isoflop_losses(C, Ns)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `E, A, B, ALPHA, BETA = 1.69, 406.4, 410.7, 0.34, 0.28

def chinchilla_loss(N, D):
    return E + A / N ** ALPHA + B / D ** BETA

def optimal_split(C):
    N = (C / 6) ** 0.5
    return N, N

def isoflop_losses(C, Ns):
    return [chinchilla_loss(N, C / N) for N in Ns]
`,
        solution: PARAMETRIC,
        tests: [
          { name: "split", code: `N, D = optimal_split(1e21)\nassert abs(N - 1824217696.9) < 1e3 and abs(6 * N * D - 1e21) < 1e9` },
          { name: "isoflop", code: `Ns = [1e9, 2e9, 4e9]\nL = isoflop_losses(1e21, Ns)\nassert all(abs(l - chinchilla_loss(n, 1e21 / (6 * n))) < 1e-12 for l, n in zip(L, Ns)) and L[1] < L[0] and L[1] < L[2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve3(M, v)</C>, solving a 3 × 3 linear system by Gaussian elimination with partial pivoting, <C>quad_fit(xs, ys)</C>,
          returning (a, b, c) for the least-squares parabola <M>{"ax^2 + bx + c"}</M>, and <C>isoflop_min(Ns, losses)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def solve3(M, v):
    return [v[i] / M[i][i] for i in range(3)]

def quad_fit(xs, ys):
    return 0.0, 0.0, sum(ys) / len(ys)

def isoflop_min(Ns, losses):
    return Ns[min(range(len(Ns)), key=lambda i: losses[i])]
`,
        solution: ISOFLOP,
        tests: [
          { name: "solve", code: `x = solve3([[0.0, 2.0, 1.0], [1.0, 1.0, 0.0], [2.0, 0.0, 3.0]], [5.0, 3.0, 11.0])\nassert all(abs(a - b) < 1e-12 for a, b in zip(x, [1.75, 1.25, 2.5]))` },
          { name: "fit", code: `a, b, c = quad_fit([0, 1, 2, 3, 4], [x * x - 4 * x + 7 + 0.0 for x in range(5)])\nassert abs(a - 1) < 1e-9 and abs(b + 4) < 1e-9 and abs(c - 7) < 1e-9\nassert abs(math.log10(isoflop_min([1e8, 1e9, 1e10, 1e11], [4.0, 2.5, 2.0, 2.5])) - 10.0) < 0.05 and abs(isoflop_min([1e9, 1e10, 1e12], [2.0, 1.0, 2.0]) / 10 ** 10.5 - 1) < 1e-9` },
        ],
      },
    },
    {
      key: "gopher",
      rung: "stretch",
      prompt: (
        <p>
          Under the parametric law, how much higher is the loss of Gopher (280 billion parameters, 300 billion tokens) than that of
          the compute-optimal model for the same budget? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0575, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Compute-optimal means cheapest to train. But a model is trained once and run billions of times, and a smaller model
        trained longer is cheaper to run. The next lesson adds inference to the budget.
      </p>
    </>
  ),
};
