import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IvSpreadViz } from "@/components/viz/IvSpreadViz";
import type { LessonContent } from "@/lib/types";

const LINEAR = `import numpy as np

def ols_slope(x, y):
    return float(np.cov(x, y)[0, 1] / np.var(x, ddof=1))      # biased when X and Y share a hidden cause

def wald(z, x, y):
    return float(np.cov(z, y)[0, 1] / np.cov(z, x)[0, 1])     # the instrument moves Y only through X

def tsls(Z, X, y):
    Xhat = Z @ np.linalg.lstsq(Z, X, rcond=None)[0]           # first stage: project X onto the instruments
    return np.linalg.solve(Xhat.T @ X, Xhat.T @ y)            # second stage`;

const LATE = `import numpy as np

def complier_shares(px_z0, px_z1):
    return {"always": px_z0, "never": 1 - px_z1, "complier": px_z1 - px_z0}   # under monotonicity

def wald_binary(z, x, y):
    return float((y[z == 1].mean() - y[z == 0].mean()) / (x[z == 1].mean() - x[z == 0].mean()))

def complier_treated_mean(z, x, y):
    xy = x * y
    return float((xy[z == 1].mean() - xy[z == 0].mean()) / (x[z == 1].mean() - x[z == 0].mean()))`;

export const lesson: LessonContent = {
  id: "m22.2.2",
  minutes: 55,
  links: {
    requires: ["m22.2.1", "m9.6.1"],
    revisits: ["m7.5.2", "m9.6.3"],
    foreshadows: ["m22.3.1"],
  },

  puzzle: (
    <>
      <p>
        Does military service lower later earnings? Those who serve differ from those who do not in ways no survey records, so
        no adjustment set exists. But during the Vietnam war, American men were drafted by a lottery on birth dates. The lottery
        number affected who served and, as far as anyone can tell, had no other route to earnings. How can a coin that only
        nudges the treatment reveal its effect, and for whom?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An instrument Z moves the treatment X but reaches the outcome Y only through X, and shares no causes with Y. Any
        association between Z and Y must then be carried by X, and dividing it by the association between Z and X rescales it
        into the effect of X. The price is precision: when Z barely moves X, the division amplifies noise, as the figure shows.
        Without linearity the ratio still means something, but only for the people whose treatment the instrument actually
        changes.
      </p>
      <IvSpreadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="instrumental variable">
        <p>
          Z is an instrument for the effect of X on Y if Z is associated with X (relevance), and Z is d-separated from Y in{" "}
          <M>{"G_{\\underline{X}}"}</M>, the graph with arrows out of X removed. The second condition combines exclusion (every
          directed path from Z to Y passes through X) and independence (Z shares no unblocked backdoor path with Y, typically
          because Z is randomised). With a hidden U pointing into X and Y, the canonical graph is{" "}
          <M>{"Z \\to X \\to Y"}</M>, <M>{"X \\leftarrow U \\to Y"}</M>.
        </p>
      </Definition>

      <Theorem title="the linear instrumental variable estimand">
        <p>
          If <M>{"Y = \\beta X + V"}</M> where V collects every other cause of Y, Z is uncorrelated with V and{" "}
          <M>{"\\mathrm{Cov}(Z, X) \\ne 0"}</M>, then{" "}
          <M>{"\\beta = \\mathrm{Cov}(Z, Y)/\\mathrm{Cov}(Z, X)"}</M> (<C>wald</C>), while the least-squares slope (<C>ols_slope</C>)
          is <M>{"\\beta + \\mathrm{Cov}(X, V)/\\mathrm{Var}(X)"}</M>.
        </p>
        <Code>{LINEAR}</Code>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{Cov}(Z, Y) = \\beta\\,\\mathrm{Cov}(Z, X) + \\mathrm{Cov}(Z, V) = \\beta\\,\\mathrm{Cov}(Z, X)"}</M>; divide.
          The same computation with X in place of Z gives the least-squares slope (m7.5.2), whose second term is the confounding
          bias. In the figure, V = 2U + noise and <M>{"\\mathrm{Cov}(X, V)/\\mathrm{Var}(X) = 2/3"}</M> at strength 1.
        </p>
      </Proof>

      <Definition title="two-stage least squares">
        <p>
          With several instruments and covariates in a matrix Z (including a column of ones) and regressors X, the first stage
          projects X onto the instruments, <M>{"\\hat X = Z(Z^\\top Z)^{-1}Z^\\top X"}</M>, and the second solves{" "}
          <M>{"\\hat X^\\top X\\,\\beta = \\hat X^\\top y"}</M> (<C>tsls</C>), which is least squares of y on{" "}
          <M>{"\\hat X"}</M>. Since <M>{"\\hat X"}</M> is a function of the instruments only, it is uncorrelated with V in the
          population, and the argument of the theorem applies; with one instrument and one regressor it reduces to the ratio.
          Its standard errors differ from those of m9.6.3 and are large when the first stage is weak: the denominator{" "}
          <M>{"\\mathrm{Cov}(Z, X)"}</M> is estimated with error and appears in a ratio, so a near-zero first stage produces a
          heavy-tailed estimate that is biased towards least squares in finite samples.
        </p>
      </Definition>

      <Remark title="beyond linearity">
        <p>
          Without a model for how X and V combine, an instrument does not identify the average causal effect. For binary Z, X, Y,
          Balke and Pearl derived the sharp bounds on it implied by the instrument conditions, which can be wide. Identification
          needs an extra assumption, and the most useful one is about how the instrument acts on the treatment.
        </p>
      </Remark>

      <Theorem title="the local average treatment effect (Imbens and Angrist)">
        <p>
          Let Z and X be binary, and write <M>{"X(z)"}</M> for the treatment a unit would take with instrument z, and{" "}
          <M>{"Y(x)"}</M> for its outcome under <M>{"\\mathrm{do}(X = x)"}</M>. Units are always-takers, never-takers, compliers
          (<M>{"X(1) = 1, X(0) = 0"}</M>) or defiers. If Z is independent of the potential values, Z affects Y only through X,
          there are no defiers (monotonicity), and some compliers exist, then the shares of the types are identified{" "}
          (<C>complier_shares</C>) and
        </p>
        <MD>{"\\frac{\\mathbb{E}[Y \\mid Z = 1] - \\mathbb{E}[Y \\mid Z = 0]}{\\mathbb{E}[X \\mid Z = 1] - \\mathbb{E}[X \\mid Z = 0]} = \\mathbb{E}[Y(1) - Y(0) \\mid \\text{complier}]"}</MD>
        <p>(<C>wald_binary</C>).</p>
        <Code>{LATE}</Code>
      </Theorem>
      <Proof>
        <p>
          By independence, <M>{"\\mathbb{E}[X \\mid Z = z] = P(X(z) = 1)"}</M>. Always-takers have X = 1 for both z and
          never-takers X = 0, so with no defiers{" "}
          <M>{"P(X = 1 \\mid Z = 0)"}</M> is the always-taker share and the difference is the complier share. For the numerator,{" "}
          <M>{"Y = Y(X(Z))"}</M>, and switching Z from 0 to 1 changes X only for compliers. Always-takers and never-takers
          contribute the same outcome under both values of Z, so their contributions cancel, and the difference is the complier
          share times <M>{"\\mathbb{E}[Y(1) - Y(0) \\mid \\text{complier}]"}</M>. Divide. Replacing Y by XY in the numerator
          keeps only the treated outcomes and gives <M>{"\\mathbb{E}[Y(1) \\mid \\text{complier}]"}</M> (<C>complier_treated_mean</C>).
        </p>
      </Proof>

      <Example title="instruments in practice">
        <p>
          The draft lottery identifies the effect of service for men whose service depended on their number, not for volunteers
          or for those exempt either way. Mendelian randomisation uses gene variants, assigned at conception, as instruments for
          exposures such as cholesterol levels; its exclusion restriction fails when a variant affects the outcome through
          another route. In experiments with imperfect take-up, random assignment is the instrument and the complier effect is
          the effect of the treatment on those who take it because they were offered it.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ols",
      rung: "check",
      prompt: (
        <p>
          In the linear model <M>{"X = 0.5Z + U + e_1"}</M>, <M>{"Y = 2X - U + e_2"}</M> with Z, U, <M>{"e_1"}</M>, <M>{"e_2"}</M>{" "}
          independent with variance 1, what is the population least-squares slope of Y on X? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.556, tolerance: 0.0006 },
    },
    {
      key: "late",
      rung: "check",
      prompt: (
        <p>
          In an experiment, 70% of those offered a treatment take it and 20% of those not offered take it anyway. The offer
          raises the recovery rate by 0.1. Under the conditions of the theorem, what is the average effect of treatment on
          compliers?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0005 },
    },
    {
      key: "excl",
      rung: "apply",
      prompt: <p>A study uses distance to the nearest hospital as an instrument for receiving surgery. Which finding would most directly violate the exclusion restriction?</p>,
      answer: {
        kind: "choice",
        options: [
          "Patients far from hospitals also receive slower emergency care, which affects survival regardless of surgery",
          "Distance predicts surgery only weakly",
          "Some patients near hospitals decline surgery",
          "Distance is measured in kilometres rather than travel time",
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

def ols_slope(x, y):
    return float(np.cov(x, y)[0, 1] / np.var(x, ddof=1))      # biased when X and Y share a hidden cause

def wald(z, x, y):
    return float(np.cov(z, y)[0, 1] / np.cov(z, x)[0, 1])     # the instrument moves Y only through X

def tsls(Z, X, y):
    Xhat = Z @ np.linalg.lstsq(Z, X, rcond=None)[0]           # first stage: project X onto the instruments
    return np.linalg.solve(Xhat.T @ X, Xhat.T @ y)            # second stage

z = np.array([0.0, 1, 2, 3]); x = np.array([1.0, 2, 2, 4]); y = 3 * x + np.array([1.0, -1, 0, 0])
print(round(ols_slope(x, y), 3), round(wald(z, x, y), 3), np.round(tsls(np.column_stack([np.ones(4), z]), np.column_stack([np.ones(4), x]), y), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.789 2.778 [0.5, 2.778]",
          "2.778 2.789 [0.5, 2.778]",
          "2.789 2.778 [0.0, 3.0]",
          "3.0 2.778 [0.5, 2.778]",
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

def complier_shares(px_z0, px_z1):
    return {"always": px_z0, "never": 1 - px_z1, "complier": px_z1 - px_z0}   # under monotonicity

def wald_binary(z, x, y):
    return float((y[z == 1].mean() - y[z == 0].mean()) / (x[z == 1].mean() - x[z == 0].mean()))

def complier_treated_mean(z, x, y):
    xy = x * y
    return float((xy[z == 1].mean() - xy[z == 0].mean()) / (x[z == 1].mean() - x[z == 0].mean()))

z, x, y = np.array([1, 1, 1, 1, 0, 0, 0, 0]), np.array([1, 1, 1, 0, 1, 0, 0, 0]), np.array([1, 1, 0, 0, 1, 0, 0, 1])
print(complier_shares(0.25, 0.75), wald_binary(z, x, y), complier_treated_mean(z, x, y))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'always': 0.25, 'never': 0.25, 'complier': 0.5} 0.0 0.5",
          "{'always': 0.25, 'never': 0.75, 'complier': 0.5} 0.0 0.5",
          "{'always': 0.25, 'never': 0.25, 'complier': 0.5} 0.5 0.5",
          "{'always': 0.25, 'never': 0.25, 'complier': 0.5} 0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ols_slope(x, y)</C>, <C>wald(z, x, y)</C> and <C>tsls(Z, X, y)</C>, where Z and X are matrices whose columns
          include any intercept.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ols_slope(x, y):
    return float(np.cov(x, y)[0, 1])

def wald(z, x, y):
    return float(np.cov(x, y)[0, 1] / np.var(x, ddof=1))

def tsls(Z, X, y):
    return np.linalg.lstsq(X, y, rcond=None)[0]
`,
        solution: LINEAR,
        tests: [
          { name: "slopes", code: `r = np.random.default_rng(0); n = 100000; u, z = r.normal(size=n), r.normal(size=n)\nx = z + u + r.normal(size=n); y = x + 2 * u + r.normal(size=n)\nassert abs(wald(z, x, y) - 1) < 0.03 and abs(ols_slope(x, y) - 5 / 3) < 0.03` },
          { name: "tsls", code: `r = np.random.default_rng(1); n = 100000; u, z1, z2 = r.normal(size=(3, n))\nx = 0.5 * z1 + 0.5 * z2 + u + r.normal(size=n); y = 2 + x + 2 * u + r.normal(size=n)\nb = tsls(np.column_stack([np.ones(n), z1, z2]), np.column_stack([np.ones(n), x]), y)\nassert np.allclose(b, [2, 1], atol=0.05)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For binary arrays z, x, y, write <C>complier_shares(px_z0, px_z1)</C> returning a dict with keys always, never and
          complier, <C>wald_binary(z, x, y)</C> and <C>complier_treated_mean(z, x, y)</C>, the mean of Y(1) among compliers.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def complier_shares(px_z0, px_z1):
    return {"always": px_z0, "never": 1 - px_z0, "complier": px_z1}

def wald_binary(z, x, y):
    return float(y[z == 1].mean() - y[z == 0].mean())

def complier_treated_mean(z, x, y):
    return float(y[x == 1].mean())
`,
        solution: LATE,
        tests: [
          { name: "shares", code: `s = complier_shares(0.1, 0.6)\nassert abs(s["always"] - 0.1) < 1e-12 and abs(s["never"] - 0.4) < 1e-12 and abs(s["complier"] - 0.5) < 1e-12` },
          { name: "late", code: `r = np.random.default_rng(2); n = 200000; t = r.choice(3, size=n, p=[0.2, 0.3, 0.5]); z = r.integers(0, 2, n)\nx = np.where(t == 0, 1, np.where(t == 1, 0, z))\np = np.where(t == 0, 0.9, np.where(t == 1, 0.1, np.where(x == 1, 0.7, 0.3))); y = (r.random(n) < p).astype(int)\nassert abs(wald_binary(z, x, y) - 0.4) < 0.03 and abs(complier_treated_mean(z, x, y) - 0.7) < 0.03` },
        ],
      },
    },
    {
      key: "y1",
      rung: "stretch",
      prompt: (
        <p>
          Under the conditions of the theorem, P(X = 1 | Z = 1) = 0.7, P(X = 1 | Z = 0) = 0.2, P(X = 1, Y = 1 | Z = 1) = 0.45 and
          P(X = 1, Y = 1 | Z = 0) = 0.15. What is the recovery rate under treatment among compliers, <M>{"\\mathbb{E}[Y(1) \\mid \\text{complier}]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The last theorem used potential outcomes, Y(1) and Y(0), quantities defined for each unit, of which at most one is ever
        seen. The next chapter makes this language precise, connects it to structural causal models, and uses it to answer
        questions about what would have happened to a particular individual.
      </p>
    </>
  ),
};
