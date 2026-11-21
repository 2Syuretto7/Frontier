import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradCheckViz } from "@/components/viz/GradCheckViz";
import type { LessonContent } from "@/lib/types";

const CONFIG = `import hashlib, json

def flatten(cfg, prefix=""):
    out = {}
    for k, v in cfg.items():
        key = prefix + k
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))              # nested settings become dotted keys
        else:
            out[key] = v
    return out

def config_hash(cfg):
    text = json.dumps(flatten(cfg), sort_keys=True)        # canonical: key order does not matter
    return hashlib.sha256(text.encode()).hexdigest()[:8]

def diff_configs(a, b):
    fa, fb = flatten(a), flatten(b)
    return sorted(k for k in set(fa) | set(fb) if fa.get(k) != fb.get(k))`;

const GRADCHECK = `def numeric_grad(f, x, eps=1e-6):
    g = []
    for i in range(len(x)):
        up = list(x); up[i] += eps
        dn = list(x); dn[i] -= eps
        g.append((f(up) - f(dn)) / (2 * eps))              # central difference
    return g

def rel_error(a, b):
    return max(abs(u - v) / max(abs(u) + abs(v), 1e-12) for u, v in zip(a, b))

def grad_check(f, grad, x, tol=1e-6):
    return rel_error(grad(x), numeric_grad(f, x)) < tol`;

export const lesson: LessonContent = {
  id: "l15.2.3",
  minutes: 45,
  links: {
    requires: ["l15.2.2"],
    revisits: ["l15.1.2"],
    foreshadows: ["l15.4.2"],
  },

  puzzle: (
    <>
      <p>
        Three weeks into a project, your best run is 2 points ahead of the rest. You cannot remember which of a dozen
        small code changes it used, the config file has since been edited, and when you rerun what you think was the
        setting you get a different number. Separately, a custom layer you wrote trains, but slightly worse than
        expected, and you wonder whether its backward pass is right. Which habits would have made both questions easy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Research code is written fast and changed often, so most errors in research are not in the ideas but in the
        bookkeeping and the code. A few habits remove most of them: every run is identified by its full configuration
        and code version, so any result can be traced and rerun; configurations are compared mechanically, so you know
        exactly what differs between two runs; and every piece of hand-written mathematics is tested, for instance by
        checking an analytic gradient against a finite difference. The habits cost minutes and save weeks.
      </p>
      <GradCheckViz />
    </>
  ),

  theory: (
    <>
      <Definition title="identifying a run">
        <p>
          A run is determined by its code version, its configuration, its data and its random seeds. Record all four
          with the result. Flatten nested configurations into dotted keys (<C>flatten</C>), serialise them canonically
          with sorted keys, and hash the result (<C>config_hash</C>), so two runs with the same settings get the same
          identifier whatever order the settings were written in; comparing flattened configurations lists exactly the
          settings that differ (<C>diff_configs</C>). Commit before every run, or record the uncommitted diff, so the
          code version is exact.
        </p>
        <Code>{CONFIG}</Code>
      </Definition>

      <Theorem title="short hashes and collisions">
        <p>
          If n distinct configurations receive independent uniform identifiers from N possible values, the probability
          that two share an identifier is
        </p>
        <MD>{"P(\\text{collision}) = 1 - \\prod_{i=0}^{n-1}\\left(1 - \\frac{i}{N}\\right) \\approx 1 - e^{-n(n-1)/(2N)},"}</MD>
        <p>
          and the approximation is accurate when <M>{"n \\ll N^{2/3}"}</M>. Eight hexadecimal digits give <M>{"N = 16^8 \\approx 4.3 \\times 10^9"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Assign identifiers one at a time. The i-th avoids the i earlier ones with probability <M>{"1 - i/N"}</M>, so no
          collision occurs with probability <M>{"\\prod_i(1 - i/N)"}</M>. Since <M>{"\\ln(1 - u) = -u - u^2/2 - \\dots"}</M>,
          the logarithm of the product is <M>{"-\\sum_i i/N - O(\\sum_i i^2/N^2) = -n(n-1)/(2N) - O(n^3/N^2)"}</M>, and
          the error term is negligible when <M>{"n \\ll N^{2/3}"}</M>. A collision matters only if you use the short hash
          alone as a key; storing the full configuration alongside it removes the risk.
        </p>
      </Proof>

      <Theorem title="choosing the step of a gradient check">
        <p>
          Let <M>{"|f^{(3)}| \\le M"}</M> near x, and let each evaluation of f carry a rounding error of at most δ. The
          central difference <M>{"(f(x+h) - f(x-h))/(2h)"}</M> (<C>numeric_grad</C>) differs from <M>{"f'(x)"}</M> by at
          most
        </p>
        <MD>{"E(h) = \\frac{Mh^2}{6} + \\frac{\\delta}{h},"}</MD>
        <p>
          which is smallest at <M>{"h^* = (3\\delta/M)^{1/3}"}</M>. A gradient check compares the analytic gradient with
          the numerical one by relative error (<C>rel_error</C>) and passes below a tolerance (<C>grad_check</C>).
        </p>
        <Code>{GRADCHECK}</Code>
      </Theorem>
      <Proof>
        <p>
          By Taylor&apos;s theorem,{" "}
          <M>{"f(x \\pm h) = f(x) \\pm hf'(x) + \\tfrac{h^2}{2}f''(x) \\pm \\tfrac{h^3}{6}f^{(3)}(\\xi_\\pm)"}</M>.
          Subtracting and dividing by 2h, the even terms cancel and the difference quotient equals{" "}
          <M>{"f'(x) + \\tfrac{h^2}{12}(f^{(3)}(\\xi_+) + f^{(3)}(\\xi_-))"}</M>, within <M>{"Mh^2/6"}</M> of{" "}
          <M>{"f'(x)"}</M>. The two computed values of f are each off by at most δ, adding at most{" "}
          <M>{"2\\delta/(2h) = \\delta/h"}</M>. Setting <M>{"E'(h) = Mh/3 - \\delta/h^2"}</M> to zero gives{" "}
          <M>{"h^3 = 3\\delta/M"}</M>, and E is convex for h &gt; 0, so this is the minimum. For f of order one in double
          precision, δ is near <M>{"10^{-16}"}</M>, and the best step is a few times <M>{"10^{-6}"}</M>.
        </p>
      </Proof>

      <Example title="what the viz shows">
        <p>
          The viz computes a real gradient check in double precision. Its right arm has slope 2 on log scales, the{" "}
          <M>{"h^2"}</M> truncation error; its left arm rises like <M>{"1/h"}</M> with rounding noise. A correct gradient
          reaches about <M>{"10^{-10}"}</M> at the bottom, while a gradient with a dropped factor stays near{" "}
          <M>{"10^{-1}"}</M> at every step, so the check separates them clearly only when the step is well chosen.
        </p>
      </Example>

      <Remark title="habits that pay">
        <p>
          Use version control and commit before runs. Keep configuration in files, never only in command-line history. Set
          and record every seed, and know which operations are nondeterministic on your hardware. Log the full loss
          curve, not only the final number. Write small tests for data processing and for every piece of hand-written
          mathematics, including gradient checks in double precision. Keep a dated lab notebook of what you tried and
          why, including failures. Plot results with a script that reads the logs, so every figure can be regenerated.
          These are the habits that make the reproduction of l15.1.2 possible for your own work.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "collide",
      rung: "check",
      prompt: (
        <p>
          A group logs 10,000 distinct runs, identified by the first eight hexadecimal digits of a hash. Using{" "}
          <M>{"1 - e^{-n(n-1)/(2N)}"}</M>, what is the probability that two runs share an identifier? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0116, tolerance: 0.0002 },
    },
    {
      key: "step",
      rung: "check",
      prompt: (
        <p>
          With <M>{"M = 1"}</M> and <M>{"\\delta = 10^{-16}"}</M>, what is the best central-difference step{" "}
          <M>{"h^*"}</M>? Give it in units of <M>{"10^{-6}"}</M>, to three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.694, tolerance: 0.002 },
    },
    {
      key: "trace",
      rung: "apply",
      prompt: <p>Which record lets you rerun a past result exactly?</p>,
      answer: {
        kind: "choice",
        options: [
          "The code version, the full configuration, the data version and the random seeds",
          "The final metric and the date of the run",
          "The configuration hash alone, without the configuration",
          "The name of the person who ran it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib, json

def flatten(cfg, prefix=""):
    out = {}
    for k, v in cfg.items():
        key = prefix + k
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))              # nested settings become dotted keys
        else:
            out[key] = v
    return out

def config_hash(cfg):
    text = json.dumps(flatten(cfg), sort_keys=True)        # canonical: key order does not matter
    return hashlib.sha256(text.encode()).hexdigest()[:8]

def diff_configs(a, b):
    fa, fb = flatten(a), flatten(b)
    return sorted(k for k in set(fa) | set(fb) if fa.get(k) != fb.get(k))

a = {"lr": 0.1, "model": {"width": 64, "depth": 2}}; b = {"model": {"depth": 2, "width": 128}, "lr": 0.1}
print(flatten(a), config_hash(a) == config_hash(dict(reversed(list(a.items())))), diff_configs(a, b))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'lr': 0.1, 'model.width': 64, 'model.depth': 2} True ['model.width']",
          "{'lr': 0.1, 'model.width': 64, 'model.depth': 2} False ['model.width']",
          "{'lr': 0.1, 'model': {'width': 64, 'depth': 2}} True ['model']",
          "{'lr': 0.1, 'model.width': 64, 'model.depth': 2} True ['model.depth', 'model.width']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def numeric_grad(f, x, eps=1e-6):
    g = []
    for i in range(len(x)):
        up = list(x); up[i] += eps
        dn = list(x); dn[i] -= eps
        g.append((f(up) - f(dn)) / (2 * eps))              # central difference
    return g

def rel_error(a, b):
    return max(abs(u - v) / max(abs(u) + abs(v), 1e-12) for u, v in zip(a, b))

def grad_check(f, grad, x, tol=1e-6):
    return rel_error(grad(x), numeric_grad(f, x)) < tol

f = lambda x: x[0] ** 2 + 3 * x[1]
print([round(g, 4) for g in numeric_grad(f, [1.0, 2.0])], rel_error([1.0, 3.0], [1.0, 3.0]), grad_check(f, lambda x: [2 * x[0], 3.0], [1.0, 2.0]), grad_check(f, lambda x: [x[0], 3.0], [1.0, 2.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 3.0] 0.0 True False",
          "[2.0, 3.0] 0.0 True True",
          "[1.0, 3.0] 0.0 False True",
          "[2.0, 0.0] 0.0 True False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>flatten(cfg, prefix=&quot;&quot;)</C>, joining nested keys with dots;{" "}
          <C>config_hash(cfg)</C>, the first eight hex digits of the SHA-256 of the flattened config dumped as JSON with
          sorted keys; and <C>diff_configs(a, b)</C>, the sorted flattened keys whose values differ, counting a missing key
          as different.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib, json

def flatten(cfg, prefix=""):
    return dict(cfg)

def config_hash(cfg):
    return hashlib.sha256(json.dumps(cfg).encode()).hexdigest()[:8]

def diff_configs(a, b):
    return []
`,
        solution: CONFIG,
        tests: [
          { name: "flat", code: `assert flatten({"a": {"b": {"c": 1}}, "d": 2}) == {"a.b.c": 1, "d": 2} and config_hash({"x": 1, "y": {"z": 2}}) == config_hash({"y": {"z": 2}, "x": 1}) and len(config_hash({})) == 8` },
          { name: "diff", code: `assert diff_configs({"a": 1, "b": {"c": 2}}, {"a": 1, "b": {"c": 3}, "e": 0}) == ["b.c", "e"] and diff_configs({"a": 1}, {"a": 1}) == [] and config_hash({"a": 1}) != config_hash({"a": 2})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>numeric_grad(f, x, eps=1e-6)</C> by central differences, <C>rel_error(a, b)</C>, the largest
          coordinate-wise <M>{"|u - v| / \\max(|u| + |v|, 10^{-12})"}</M>, and{" "}
          <C>grad_check(f, grad, x, tol=1e-6)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def numeric_grad(f, x, eps=1e-6):
    return [(f([v + eps if j == i else v for j, v in enumerate(x)]) - f(x)) / eps for i in range(len(x))]

def rel_error(a, b):
    return 0.0

def grad_check(f, grad, x, tol=1e-6):
    return True
`,
        solution: GRADCHECK,
        tests: [
          { name: "numgrad", code: `g = numeric_grad(lambda x: x[0] ** 3, [1.0], 0.1)\nassert abs(g[0] - 3.01) < 1e-9 and abs(rel_error([1, 2], [1, 1]) - 1 / 3) < 1e-12 and rel_error([0], [0]) == 0` },
          { name: "check", code: `import math\nf = lambda x: math.sin(x[0]) * x[1]\nassert grad_check(f, lambda x: [math.cos(x[0]) * x[1], math.sin(x[0])], [0.3, 2.0]) and not grad_check(f, lambda x: [math.cos(x[0]), math.sin(x[0])], [0.3, 2.0])` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          With <M>{"M = 1"}</M> and <M>{"\\delta = 10^{-16}"}</M>, what is the error bound <M>{"E(h^*)"}</M> at the best
          step? Give it in units of <M>{"10^{-11}"}</M>, to three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.241, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        With results that can be trusted, the next step is to tell others about them. The next chapter is about writing,
        beginning with the structure of a research paper.
      </p>
    </>
  ),
};
