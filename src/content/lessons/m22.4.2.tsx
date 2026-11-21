import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AnmViz } from "@/components/viz/AnmViz";
import type { LessonContent } from "@/lib/types";

const SCORE = `import numpy as np

def local_bic(X, j, pa):
    n = len(X)
    A = np.column_stack([np.ones(n)] + [X[:, p] for p in pa])
    rss = np.sum((X[:, j] - A @ np.linalg.lstsq(A, X[:, j], rcond=None)[0]) ** 2)
    return n * np.log(rss / n) + (len(pa) + 2) * np.log(n)    # lower is better: fit plus complexity

def dag_bic(X, parents):
    return float(sum(local_bic(X, j, pa) for j, pa in parents.items()))   # decomposes over vertices

def best_dag(X, candidates):
    return min(candidates, key=lambda g: dag_bic(X, g))`;

const SHAPE = `import numpy as np

def notears_h(W):
    A, term, total = W * W, np.eye(len(W)), 0.0
    for k in range(1, 30):
        term = term @ A / k
        total += np.trace(term)                                # tr(exp(W o W)) - d, as a series
    return float(total)

def residual_dependence(x, y):
    b = np.cov(x, y)[0, 1] / np.var(x, ddof=1)
    r = (y - y.mean()) - b * (x - x.mean())                    # least-squares residual: uncorrelated with x
    return float(abs(np.corrcoef(x ** 2, r ** 2)[0, 1]) + abs(np.corrcoef(np.abs(x), np.abs(r))[0, 1]))

def anm_direction(x, y):
    return "x->y" if residual_dependence(x, y) < residual_dependence(y, x) else "y->x"`;

export const lesson: LessonContent = {
  id: "m22.4.2",
  minutes: 55,
  links: {
    requires: ["m22.4.1", "m9.6.1"],
    revisits: ["m22.1.2", "m9.7.3"],
    foreshadows: ["m22.5.1"],
  },

  puzzle: (
    <>
      <p>
        Altitude and average temperature of weather stations are strongly correlated. Physics says altitude causes
        temperature and not the reverse, but with only two variables there are no conditional independencies to test, and
        Chapter 1 proved that a linear Gaussian model fits both directions equally well. Is there anything in the data itself
        that points the arrow? And when there are many variables, can we search over graphs by fit rather than by tests?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A score rates a whole graph by how well its best-fitting model explains the data, minus a penalty for complexity, and
        a search looks for the best-rated graph. For linear Gaussian models the score cannot distinguish Markov equivalent
        graphs, so the best one can do is the equivalence class again. But the Gaussian case is special. If the noise is not
        Gaussian, regressing the cause on the effect leaves a residual that is uncorrelated with the regressor yet still
        depends on it, while the causal direction leaves a residual that is truly independent. The figure shows the asymmetry.
      </p>
      <AnmViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the BIC score of a linear Gaussian DAG">
        <p>
          For data X with n rows and a DAG with parent sets <M>{"\\mathrm{pa}(j)"}</M>, regress each <M>{"X_j"}</M> on an intercept
          and its parents with residual sum of squares <M>{"\\mathrm{RSS}_j"}</M>. Up to an additive constant, minus twice the
          maximised log-likelihood plus the Bayesian information penalty is
        </p>
        <MD>{"\\mathrm{BIC}(G) = \\sum_j \\Big[n \\log\\frac{\\mathrm{RSS}_j}{n} + (|\\mathrm{pa}(j)| + 2)\\log n\\Big],"}</MD>
        <p>
          counting an intercept and a variance per vertex; lower is better (<C>local_bic</C>, <C>dag_bic</C>, <C>best_dag</C>). It
          is a sum of local terms, so changing one parent set changes one term.
        </p>
        <Code>{SCORE}</Code>
      </Definition>

      <Theorem title="score equivalence">
        <p>Markov equivalent DAGs have the same BIC on every data set.</p>
      </Theorem>
      <Proof>
        <p>
          The set of Gaussian distributions that factorise over a DAG is the set satisfying its d-separations, which equivalent
          DAGs share, so the maximised likelihood is the same. Equivalent DAGs have the same skeleton, hence the same number of
          edges and so of parameters. Both terms agree. The figure in m22.1.2 is the two-vertex case.
        </p>
      </Proof>

      <Remark title="searching">
        <p>
          The number of DAGs grows faster than exponentially, so exhaustive search stops at about five or six variables. Greedy
          equivalence search (Chickering, 2002) moves between equivalence classes by adding and then deleting edges and, with a
          consistent score such as BIC, finds the true class in the large-sample limit. Decomposability makes each move cheap:
          only the local scores of vertices whose parents change are recomputed.
        </p>
      </Remark>

      <Theorem title="a smooth characterisation of acyclicity (NOTEARS)">
        <p>
          For a weighted adjacency matrix W, <M>{"h(W) = \\operatorname{tr}\\, e^{W \\circ W} - d"}</M> is zero if and only if the
          graph of W is acyclic, and positive otherwise (<C>notears_h</C>). Zheng and colleagues used it as a constraint for
          gradient-based structure learning.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"A = W \\circ W"}</M>, which has nonnegative entries,{" "}
          <M>{"\\operatorname{tr}\\, e^{A} - d = \\sum_{k \\ge 1} \\operatorname{tr}(A^k)/k!"}</M>. The trace of <M>{"A^k"}</M> is the
          sum over closed walks of length k of the products of their weights, each positive. It vanishes for every k exactly
          when there is no closed walk, that is, no cycle.
        </p>
      </Proof>

      <Theorem title="non-Gaussian noise identifies the direction">
        <p>
          Suppose <M>{"Y = bX + N"}</M> with X and N independent and <M>{"b \\ne 0"}</M>. If X or N is non-Gaussian, there is no
          backward model <M>{"X = cY + E"}</M> with E independent of Y. Consequently, for linear models with non-Gaussian
          independent noises (LiNGAM, Shimizu and colleagues), the whole DAG is identifiable from the distribution, not just its
          equivalence class.
        </p>
        <Code>{SHAPE}</Code>
      </Theorem>
      <Proof>
        <p>
          The backward residual is <M>{"E = X - cY = (1 - cb)X - cN"}</M>, and Y = bX + N, both linear combinations of the
          independent X and N. If <M>{"1 - cb = 0"}</M>, then <M>{"\\mathrm{Cov}(E, Y) = -c\\,\\mathrm{Var}(N) \\ne 0"}</M> (c = 1/b is
          nonzero), so E and Y are not even uncorrelated. Otherwise X has nonzero coefficients in both combinations, and so
          does N (−c and 1, with c ≠ 0 because X and Y are correlated). The Darmois–Skitovich theorem says that if two linear
          combinations of independent variables are independent, every variable with nonzero coefficients in both is Gaussian.
          So independence of E and Y would force both X and N to be Gaussian. Hoyer and colleagues extended the idea to nonlinear additive
          noise models.
        </p>
      </Proof>

      <Example title="a practical test">
        <p>
          In practice one regresses in both directions and measures how strongly each residual depends on its regressor. A
          proper kernel independence test (HSIC) is the standard choice; the code uses a crude stand-in, correlations between
          squares and between absolute values (<C>residual_dependence</C>), and picks the direction with the less dependent
          residual (<C>anm_direction</C>). In the figure, uniform noise gives a backward residual whose spread shrinks at the
          ends.
        </p>
      </Example>

      <Remark title="caveats">
        <p>
          Benchmarks for continuous methods have been criticised because simulated variances tend to grow along the causal
          order, so sorting variables by variance recovers much of the graph (Reisach and colleagues, 2021), and rescaling the
          data destroys this. Noise shape, measurement error and hidden confounders all affect the asymmetries these methods
          rely on. Discovery methods give hypotheses for experiments, not substitutes for them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dags",
      rung: "check",
      prompt: <p>An exhaustive score-based search over all DAGs on three labelled variables scores how many graphs?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0 },
    },
    {
      key: "h",
      rung: "check",
      prompt: (
        <p>
          What is <M>{"h(W) = \\operatorname{tr}\\, e^{W \\circ W} - d"}</M> for <M>{"W = \\begin{pmatrix}0 & 1\\\\ 2 & 0\\end{pmatrix}"}</M>?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.524, tolerance: 0.0006 },
    },
    {
      key: "gauss",
      rung: "apply",
      prompt: <p>Why can no method recover the direction of X → Y from observational data when the model is linear with Gaussian noise?</p>,
      answer: {
        kind: "choice",
        options: [
          "Both directions describe exactly the same set of joint Gaussian distributions, with independent residuals either way",
          "Because Gaussian data have no correlation",
          "Because BIC penalises the true direction more",
          "Because Gaussian noise violates faithfulness",
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

def local_bic(X, j, pa):
    n = len(X)
    A = np.column_stack([np.ones(n)] + [X[:, p] for p in pa])
    rss = np.sum((X[:, j] - A @ np.linalg.lstsq(A, X[:, j], rcond=None)[0]) ** 2)
    return n * np.log(rss / n) + (len(pa) + 2) * np.log(n)    # lower is better: fit plus complexity

def dag_bic(X, parents):
    return float(sum(local_bic(X, j, pa) for j, pa in parents.items()))   # decomposes over vertices

def best_dag(X, candidates):
    return min(candidates, key=lambda g: dag_bic(X, g))

r = np.random.default_rng(1); a = r.normal(size=500); X = np.column_stack([a, 2 * a + r.normal(size=500), r.normal(size=500)])
print(round(dag_bic(X, {0: [], 1: [0], 2: []}) - dag_bic(X, {0: [1], 1: [], 2: []}), 6), best_dag(X, [{0: [], 1: [], 2: []}, {0: [], 1: [0], 2: []}, {0: [], 1: [0], 2: [0, 1]}]), round(local_bic(X, 2, [0]) - local_bic(X, 2, []), 1) > 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 {0: [], 1: [0], 2: []} True",
          "0.0 {0: [], 1: [0], 2: [0, 1]} True",
          "0.0 {0: [], 1: [0], 2: []} False",
          "6.2 {0: [], 1: [0], 2: []} True",
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

def notears_h(W):
    A, term, total = W * W, np.eye(len(W)), 0.0
    for k in range(1, 30):
        term = term @ A / k
        total += np.trace(term)                                # tr(exp(W o W)) - d, as a series
    return float(total)

def residual_dependence(x, y):
    b = np.cov(x, y)[0, 1] / np.var(x, ddof=1)
    r = (y - y.mean()) - b * (x - x.mean())                    # least-squares residual: uncorrelated with x
    return float(abs(np.corrcoef(x ** 2, r ** 2)[0, 1]) + abs(np.corrcoef(np.abs(x), np.abs(r))[0, 1]))

def anm_direction(x, y):
    return "x->y" if residual_dependence(x, y) < residual_dependence(y, x) else "y->x"

print(notears_h(np.zeros((3, 3))), round(notears_h(np.array([[0, 1.0], [1, 0]])), 3), round(residual_dependence(np.array([-1.0, 0, 1]), np.array([1.0, 0, 1])), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 1.086 2.0",
          "0.0 0.0 2.0",
          "3.0 1.086 2.0",
          "0.0 1.086 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>local_bic(X, j, pa)</C> as <M>{"n\\log(\\mathrm{RSS}/n) + (|\\mathrm{pa}| + 2)\\log n"}</M> with an intercept in
          the regression, <C>dag_bic(X, parents)</C> and <C>best_dag(X, candidates)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def local_bic(X, j, pa):
    return float(np.var(X[:, j]))

def dag_bic(X, parents):
    return float(sum(local_bic(X, j, pa) for j, pa in parents.items()))

def best_dag(X, candidates):
    return candidates[0]
`,
        solution: SCORE,
        tests: [
          { name: "local", code: `assert abs(local_bic(np.array([[1.0], [2], [3], [4]]), 0, []) - (4 * np.log(1.25) + 2 * np.log(4))) < 1e-9` },
          { name: "equiv", code: `r = np.random.default_rng(2); a = r.normal(size=300); X = np.column_stack([a, a + r.normal(size=300)])\nassert abs(dag_bic(X, {0: [], 1: [0]}) - dag_bic(X, {0: [1], 1: []})) < 1e-8\nassert best_dag(X, [{0: [], 1: []}, {0: [], 1: [0]}]) == {0: [], 1: [0]}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>notears_h(W)</C>, <C>residual_dependence(x, y)</C>, which regresses y on x by least squares and returns the
          sum of the absolute correlations between <M>{"x^2"}</M> and <M>{"r^2"}</M> and between |x| and |r|, and{" "}
          <C>anm_direction(x, y)</C> returning &quot;x-&gt;y&quot; or &quot;y-&gt;x&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def notears_h(W):
    return float(np.trace(W * W))

def residual_dependence(x, y):
    return 0.0

def anm_direction(x, y):
    return "x->y"
`,
        solution: SHAPE,
        tests: [
          { name: "h", code: `assert abs(notears_h(np.triu(np.ones((3, 3)), 1))) < 1e-12 and abs(notears_h(np.array([[0, 1.0], [1, 0]])) - (np.e + 1 / np.e - 2)) < 1e-9` },
          { name: "anm", code: `r = np.random.default_rng(7); x = r.uniform(-1, 1, 3000); y = x + r.uniform(-1, 1, 3000)\nassert residual_dependence(y, x) > 0.3 and residual_dependence(x, y) < 0.15\nassert anm_direction(x, y) == "x->y" and anm_direction(y, x) == "y->x"` },
        ],
      },
    },
    {
      key: "bic",
      rung: "stretch",
      prompt: (
        <p>
          With n = 100 samples, regressing <M>{"X_j"}</M> on an intercept gives RSS 200, and adding one parent gives RSS 150. By how
          much does adding the parent change the local BIC? Give three decimals, with sign.
        </p>
      ),
      answer: { kind: "numeric", value: -24.163, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Causal models describe how the world responds to actions. The last chapter asks how an agent should choose among
        actions, starting with expected utility, then the puzzles where conditioning and intervening give different advice,
        and finally the incentives of learning agents seen through causal graphs.
      </p>
    </>
  ),
};
