import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SearchViz } from "@/components/viz/SearchViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.5.4",
  minutes: 45,
  links: {
    requires: ["l1.5.2"],
    revisits: ["l1.5.3", "l1.2.4"],
    parallels: ["m4.1.1", "m4.6.2"],
    foreshadows: ["l3.6.3"],
  },

  puzzle: (
    <>
      <p>
        You can afford nine training runs to tune two settings, a learning rate and a second setting. You suspect, but do not
        know, that only the learning rate really matters.
      </p>
      <p>
        A neat 3 by 3 grid covers the square evenly. Nine random points look messy. Which tests more learning rates? Which
        would you choose?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The grid tests only three learning rates, each three times, with the unimportant setting varying. Nine random points
        almost surely test nine different learning rates. When only some settings matter, which is the usual case, random
        search explores the ones that matter far more thoroughly for the same cost.
      </p>
      <SearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="hyperparameters">
        <p>
          <strong>Parameters</strong> are learned from training data, like the weights of a model. <strong>Hyperparameters</strong>{" "}
          are chosen before training and control it: <M>k</M> in nearest neighbours, the depth of a tree, the penalty{" "}
          <M>{"\\lambda"}</M>, the learning rate. They are chosen by validation or cross-validation.
        </p>
      </Definition>

      <Definition title="grid and random search">
        <p>
          <strong>Grid search</strong> tries every combination of a few values per hyperparameter. With <M>m</M> values for each
          of <M>h</M> hyperparameters it costs <M>{"m^h"}</M> runs, which grows exponentially in <M>h</M>.{" "}
          <strong>Random search</strong> draws each trial&rsquo;s settings independently from chosen distributions, for as many
          trials as the budget allows.
        </p>
      </Definition>

      <Theorem title="how many random trials">
        <p>
          If each random trial independently lands in the best fraction <M>q</M> of the search space with probability{" "}
          <M>q</M>, then <M>N</M> trials include at least one such trial with probability
        </p>
        <MD>{"1 - (1 - q)^N ."}</MD>
      </Theorem>
      <Proof>
        <p>
          A single trial misses with probability <M>{"1 - q"}</M>. By independence, all <M>N</M> miss with probability{" "}
          <M>{"(1 - q)^N"}</M>, and the complement is the claim.
        </p>
      </Proof>

      <Example title="sixty trials">
        <p>
          With <M>{"q = 0.05"}</M>, 20 trials succeed with probability <M>{"1 - 0.95^{20} \\approx 0.64"}</M>. To reach 0.95 we
          need <M>{"0.95^N \\le 0.05"}</M>, that is <M>{"N \\ge \\ln 0.05 / \\ln 0.95 \\approx 58.4"}</M>, so 59 trials. The
          count does not depend on how many hyperparameters there are.
        </p>
      </Example>

      <Remark title="search on the right scale">
        <p>
          A learning rate of 0.001 differs from 0.01 as much as 0.01 differs from 0.1. So sample such settings{" "}
          <strong>log-uniformly</strong>: draw the exponent uniformly. Sampling uniformly between 0.00001 and 0.1 would put
          about 90% of trials above 0.01.
        </p>
      </Remark>

      <Remark title="spending the budget wisely">
        <p>
          Many bad settings reveal themselves early. <strong>Successive halving</strong> starts many trials with a small budget,
          keeps the best fraction, and gives the survivors more. <strong>Bayesian optimisation</strong> fits a model of the
          score as a function of the settings and chooses the next trial where improvement looks likely. Whatever the method,
          the more settings you try, the more the best validation score flatters the winner, so the final test set stays
          untouched.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hyper",
      rung: "check",
      prompt: <p>Which of these are hyperparameters? Select all that apply.</p>,
      answer: { kind: "choice", options: ["The learning rate", "The depth limit of a decision tree", "The fitted weights of a linear model"], correct: [0, 1] },
    },
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does random search tend to beat grid search for the same number of trials?</p>,
      answer: { kind: "choice", options: ["It tests more distinct values of each hyperparameter, which matters when only a few hyperparameters are important", "Random numbers are better than evenly spaced ones in every problem", "It needs no validation set"], correct: [0] },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p>A grid uses 5 values for each of 4 hyperparameters. How many runs is that?</p>,
      answer: { kind: "numeric", value: 625 },
    },
    {
      key: "p20",
      rung: "apply",
      prompt: <p>What is the probability that at least one of 20 random trials lands in the best 5% of the space? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.642, tolerance: 0.0006 },
    },
    {
      key: "n95",
      rung: "apply",
      prompt: <p>What is the smallest number of random trials that gives at least a 95% chance of hitting the best 5%?</p>,
      answer: { kind: "numeric", value: 59 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product
grid = {"depth": [2, 4, 8], "lr": [0.1, 0.01], "n": [100, 200]}
print(len(list(product(*grid.values()))))`}</Code>
          <p>A grid search tries every combination. How many?</p>
        </>
      ),
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product
grid = {"lr": [0.1, 0.01], "depth": [2, 4, 8], "l2": [0, 1]}
combos = list(product(*grid.values()))
print(len(combos), combos[0], combos[-1])`}</Code>
          <p>Counting the points of a hyperparameter grid. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["12 (0.1, 2, 0) (0.01, 8, 1)", "7 (0.1, 2, 0) (0.01, 8, 1)", "12 (0.01, 8, 1) (0.1, 2, 0)", "12 (0.1, 2, 0) (0.1, 8, 1)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>grid_search(model_fn, grid, X, y)</C>, which tries every combination in the dict of lists <C>grid</C>, passing it as keyword arguments to <C>model_fn</C>, scores each by 3-fold <C>cross_val_score</C>, and returns (best parameter dict, best mean score).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def grid_search(model_fn, grid, X, y):
    params = {k: v[0] for k, v in grid.items()}
    return params, 0.0
`,
        solution: `from itertools import product
from sklearn.model_selection import cross_val_score

def grid_search(model_fn, grid, X, y):
    best = (None, -float('inf'))
    keys = list(grid)
    for values in product(*grid.values()):
        params = dict(zip(keys, values))
        s = cross_val_score(model_fn(**params), X, y, cv=3).mean()
        if s > best[1]:
            best = (params, s)
    return best
`,
        tests: [
          { name: "search", code: `from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV
from sklearn.datasets import make_classification
X, y = make_classification(300, random_state=0)
grid = {'max_depth': [1, 3, 6], 'min_samples_leaf': [1, 10]}
params, score = grid_search(lambda **kw: DecisionTreeClassifier(random_state=0, **kw), grid, X, y)
ref = GridSearchCV(DecisionTreeClassifier(random_state=0), grid, cv=3).fit(X, y)
assert params == ref.best_params_ and abs(score - ref.best_score_) < 1e-9, 'Try every combination and keep the best cross-validated score.'` },
          { name: "every combination", code: `from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import make_classification
X, y = make_classification(90, random_state=1)
seen = []
def make(**kw):
    seen.append(tuple(sorted(kw.items())))
    return DecisionTreeClassifier(random_state=0, **kw)
params, score = grid_search(make, {'max_depth': [1, 2], 'min_samples_leaf': [1, 5, 9]}, X, y)
assert sorted(set(seen)) == sorted(set(tuple(sorted({'max_depth': a, 'min_samples_leaf': b}.items())) for a in [1, 2] for b in [1, 5, 9])) and set(params) == {'max_depth', 'min_samples_leaf'}, 'All six combinations, passed as keyword arguments.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>random_search(objective, space, n, seed)</C>, which minimises <C>objective(params)</C> over n random draws: <C>space</C> maps each name, in order, to (<C>"log"</C>, lo, hi) (draw 10^u with u uniform between log₁₀ lo and log₁₀ hi), (<C>"int"</C>, lo, hi) (<C>rng.integers(lo, hi + 1)</C>) or (<C>"choice"</C>, options) (<C>options[rng.integers(len(options))]</C>), all from one <C>np.random.default_rng(seed)</C>. Return (best params, best value), the first on ties. Then write <C>successive_halving(configs, evaluate, budget, eta)</C>: evaluate every config with <C>evaluate(config, budget)</C> (lower is better), keep the best len/eta (at least 1, ties in input order), multiply the budget by eta, and repeat until one remains. Return (winner, total budget spent).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def random_search(objective, space, n, seed):
    return {}, float('inf')

def successive_halving(configs, evaluate, budget, eta):
    return configs[0], 0
`,
        solution: `import numpy as np

def random_search(objective, space, n, seed):
    rng = np.random.default_rng(seed)
    best = (None, float('inf'))
    for _ in range(n):
        params = {}
        for name, spec in space.items():
            if spec[0] == 'log':
                params[name] = float(10 ** rng.uniform(np.log10(spec[1]), np.log10(spec[2])))
            elif spec[0] == 'int':
                params[name] = int(rng.integers(spec[1], spec[2] + 1))
            else:
                params[name] = spec[1][rng.integers(len(spec[1]))]
        v = objective(params)
        if v < best[1]:
            best = (params, v)
    return best

def successive_halving(configs, evaluate, budget, eta):
    alive = list(configs)
    spent = 0
    while len(alive) > 1:
        scores = [evaluate(c, budget) for c in alive]
        spent += budget * len(alive)
        order = sorted(range(len(alive)), key=lambda i: (scores[i], i))
        alive = [alive[i] for i in order[:max(1, len(alive) // eta)]]
        budget *= eta
    return alive[0], spent
`,
        tests: [
          { name: "draws", code: `import numpy as np
space = {'lr': ('log', 1e-4, 1e-1), 'depth': ('int', 2, 5), 'act': ('choice', ['relu', 'tanh'])}
seen = []
def obj(p):
    seen.append(p)
    return (np.log10(p['lr']) + 2) ** 2 + (p['depth'] - 3) ** 2
best, v = random_search(obj, space, 200, 0)
assert len(seen) == 200 and all(1e-4 <= p['lr'] <= 1e-1 and 2 <= p['depth'] <= 5 and p['act'] in ('relu', 'tanh') for p in seen), 'Every draw is inside the space.'
assert best['depth'] == 3 and abs(np.log10(best['lr']) + 2) < 0.1 and v == min(obj(p) for p in list(seen)), 'The best of the draws.'
rng = np.random.default_rng(0)
assert abs(seen[0]['lr'] - 10 ** rng.uniform(-4, -1)) < 1e-15 and seen[0]['depth'] == rng.integers(2, 6), 'Draw the parameters in order from one generator.'` },
          { name: "log scale", code: `import numpy as np
space = {'c': ('log', 1e-6, 1.0)}
vals = []
random_search(lambda p: vals.append(p['c']) or 0, space, 3000, 1)
assert 0.45 < np.mean(np.array(vals) < 1e-3) < 0.55, 'Half the orders of magnitude lie below 10⁻³.'` },
          { name: "halving", code: `calls = []
def ev(c, b):
    calls.append((c, b))
    return abs(c - 7) + 1 / b
win, spent = successive_halving(list(range(16)), ev, 1, 2)
assert win == 7 and spent == 16 + 16 + 16 + 16 and [b for c, b in calls if c == 7] == [1, 2, 4, 8], 'Halve the field and double the budget each round.'
assert successive_halving(['only'], ev, 1, 3) == ('only', 0)` },
          { name: "ties", code: `win, spent = successive_halving(['a', 'b', 'c'], lambda c, b: 0, 1, 3)
assert win == 'a' and spent == 3, 'Ties keep the earlier configuration.'` },
        ],
      },
    },
    {
      key: "argue",
      rung: "prove",
      prompt: (
        <p>
          Suppose a score depends on hyperparameter <M>a</M> only, and you have a budget of <M>{"m^2"}</M> runs over two
          hyperparameters <M>{"a, b"}</M>. Compare how many distinct values of <M>a</M> an <M>{"m \\times m"}</M> grid and{" "}
          <M>{"m^2"}</M> uniform random trials test, and use the theorem above to explain what this means for finding a good{" "}
          <M>a</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the grid tests only m distinct values of a, each repeated m times.",
          "Notes that m² independent uniform draws are distinct with probability 1, so random search tests m² values of a.",
          "Applies the theorem: the chance of a value in the best fraction q is 1 − (1 − q)^(m²) for random search, while the grid succeeds only if one of its m fixed values happens to lie in the good region.",
          "Concludes that random search wastes none of its budget on the irrelevant hyperparameter.",
        ],
      },
    },
    {
      key: "halving",
      rung: "stretch",
      prompt: <p>Successive halving starts 81 configurations and keeps the best third after each round until one remains. Counting a configuration once in each round it takes part in, how many runs is that in total?</p>,
      answer: { kind: "numeric", value: 121 },
    },
  ],

  teachBack:
    "Explain to a friend why random search usually beats grid search, why learning rates are searched on a log scale, and why tuning hard can fool you.",

  glimpse: (
    <p>
      Next, learning without labels, starting with k-means. Neural Networks from Scratch tunes learning rates and their schedules
      in earnest, and at frontier scale labs tune on small models and extrapolate, because a single large run is too expensive
      to repeat.
    </p>
  ),
};
