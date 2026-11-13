import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HypothesisViz } from "@/components/viz/HypothesisViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.2.1",
  minutes: 60,
  links: {
    requires: ["e0.6.1", "e4.1.4"],
    revisits: ["e0.5.3", "e0.6.3"],
    foreshadows: ["e4.2.2", "e4.3.4"],
  },

  puzzle: (
    <>
      <p>
        Your classifier&rsquo;s loss starts at 2.30 and stays there for a thousand steps. You try a smaller learning rate, then
        a bigger one, then a different optimiser, then a wider model. Nothing changes, and an afternoon is gone.
      </p>
      <p>Each change was a reasonable guess. What was wrong with the afternoon?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Changing things and hoping is not an experiment, because it does not tell you which of your ideas was wrong. A
        debugging experiment is chosen so that its result rules out some causes whatever that result is. List the causes that
        would explain what you see, then pick the measurement that splits the list best.
      </p>
      <HypothesisViz />
      <p>
        &ldquo;Parameter change after one step&rdquo; splits the five causes into two and three, whatever the truth. Checking
        the inputs first rules out only one cause, unless you are lucky. Good experiments are cheap, decisive, and chosen
        before you look at the answer.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the debugging loop">
        <p>
          Observe the failure precisely, write down every hypothesis that would explain it, and for each candidate experiment
          predict its result under each hypothesis. Run the experiment whose predictions differ most across the hypotheses
          still standing, strike out those it contradicts, and repeat. Keep the list written down; it stops you testing the
          same idea twice and shows when you have run out of ideas and need to observe more.
        </p>
      </Definition>

      <Proposition title="choosing experiments">
        <p>
          If an experiment has two possible results, then in the worst case it leaves at least half of n hypotheses standing,
          so at least <M>{"\\lceil \\log_2 n \\rceil"}</M> experiments are needed to single one out. An experiment whose
          predictions are the same under every remaining hypothesis tells you nothing, however interesting its output looks.
        </p>
      </Proposition>

      <Definition title="sanity checks for training">
        <p>A few cheap experiments split the common causes of a model that will not learn:</p>
        <ul>
          <li>
            <strong>Loss at initialisation.</strong> With small random weights, a K-class classifier predicts nearly uniform
            probabilities, so its cross-entropy is about <M>{"\\ln K"}</M>: 2.30 for ten classes. A very different first loss
            means a bug in the loss or the labels.
          </li>
          <li>
            <strong>Overfit one batch.</strong> A working model and optimiser can memorise eight examples, driving the loss
            near 0. If they cannot, the bug is in the model, the loss or the optimiser step, not in the data or the
            hyperparameters.
          </li>
          <li>
            <strong>Look at the data</strong> as the model sees it, after every transform: shapes, ranges, and a few examples
            with their labels.
          </li>
          <li>
            <strong>Check that things change.</strong> Gradient norms are non-zero and every parameter moves after a step.
          </li>
        </ul>
      </Definition>

      <Proposition title="the loss of a model that has learned nothing">
        <p>
          If a classifier outputs the same probability vector p for every input, and labels occur with frequencies q, then its
          average cross-entropy <M>{"-\\sum_k q_k \\ln p_k"}</M> is smallest at p = q, where it equals the entropy{" "}
          <M>{"H(q) = -\\sum_k q_k \\ln q_k"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>The difference from the entropy is a Kullback-Leibler divergence:</p>
        <MD>{"-\\sum_k q_k \\ln p_k - H(q) = \\sum_k q_k \\ln \\frac{q_k}{p_k} \\ge -\\ln \\sum_k q_k \\frac{p_k}{q_k} \\ge -\\ln 1 = 0,"}</MD>
        <p>by Jensen&rsquo;s inequality for the convex function <M>{"-\\ln"}</M>, with equality when p = q.</p>
      </Proof>
      <p>
        So a loss stuck at <M>{"H(q)"}</M>, which is <M>{"\\ln K"}</M> for balanced classes, means the model is ignoring its
        input. That is a precise observation, and it already rules out many causes.
      </p>

      <Example title="comparing against a trusted version">
        <p>
          When a reference implementation exists, the most decisive experiment is to feed both the same input and compare
          intermediate values layer by layer. Give each layer the reference&rsquo;s input, not your own, so an early bug does not
          make every later layer look guilty.
        </p>
        <Code>{`a = x
for i, (mine, ref) in enumerate(zip(my_layers, ref_layers)):
    if not np.allclose(mine(a), ref(a), rtol=1e-5):
        print("layer", i, "differs")
    a = ref(a)`}</Code>
      </Example>

      <Remark title="read the error">
        <p>
          When the program does crash, the traceback is the cheapest observation there is. Read the last line, then find the
          deepest frame in your own code. Most of an afternoon of guessing is usually spent not reading it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "falsify",
      rung: "check",
      prompt: <p>Which of these is a useful debugging hypothesis?</p>,
      answer: {
        kind: "choice",
        options: [
          "The data loader returns labels shifted by one, so batch i gets the labels of batch i + 1",
          "Something is wrong with the data",
          "The model is not good enough",
          "Training is unstable",
        ],
        correct: [0],
      },
    },
    {
      key: "init",
      rung: "apply",
      prompt: <p>A freshly initialised 10-class classifier predicts nearly uniform probabilities. What cross-entropy loss should it report? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 2.303, tolerance: 0.001 },
    },
    {
      key: "split",
      rung: "apply",
      prompt: (
        <p>
          In the viz above, all five causes are possible. Which single experiment leaves at most three causes standing,
          whatever its result?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["Parameter change after one step", "Input mean and std", "Overfit one batch of 8", "Gradient norm"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`hyps = {
    'lr':       {'step': 0, 'grad': 1, 'input': 1},
    'detached': {'step': 0, 'grad': 0, 'input': 1},
    'zeros':    {'step': 1, 'grad': 1, 'input': 0},
    'labels':   {'step': 1, 'grad': 1, 'input': 1},
}
observed = {'step': 0}
alive = [h for h, pred in hyps.items() if all(pred[k] == v for k, v in observed.items())]
print(alive)
observed['grad'] = 1
print([h for h in alive if all(hyps[h][k] == v for k, v in observed.items())])`}</Code>
          <p>Striking out hypotheses that contradict what was observed. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['lr', 'detached']\n['lr']",
          "['zeros', 'labels']\n['zeros', 'labels']",
          "['lr', 'detached']\n['detached']",
          "['lr', 'detached']\n['lr', 'zeros', 'labels']",
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
def ce(logits, y):
    m = max(logits)
    z = sum(math.exp(l - m) for l in logits)
    return -(logits[y] - m - math.log(z))

print(round(ce([0.0] * 4, 2), 3), round(ce([0.0, 0.0, 10.0, 0.0], 2), 3), round(ce([0.0, 0.0, 10.0, 0.0], 0), 2))`}</Code>
          <p>Cross-entropy for uniform logits, a confident right answer, and a confident wrong one. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.386 0.0 10.0", "0.25 1.0 0.0", "1.386 0.0 0.0", "2.303 0.0 10.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Automate the loop. <C>hyps</C> maps each hypothesis to a dict of predicted results, one per experiment name.
          </p>
          <ul>
            <li>
              <C>best_experiment(hyps, experiments)</C> returns the experiment in the list that minimises the largest number of
              hypotheses that could survive it (group the hypotheses by predicted result and take the biggest group). Break
              ties by list order. Return None if no experiment splits the hypotheses.
            </li>
            <li>
              <C>diagnose(hyps, experiments, run)</C> repeatedly picks the best experiment among those not yet run, calls{" "}
              <C>run(name)</C> to get its actual result, and keeps the hypotheses that predicted it. Stop when one hypothesis
              remains or no experiment splits them, and return the list of survivors in their original order.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def best_experiment(hyps, experiments):
    return experiments[0]

def diagnose(hyps, experiments, run):
    return list(hyps)
`,
        solution: `def best_experiment(hyps, experiments):
    best, best_worst = None, len(hyps)
    for e in experiments:
        groups = {}
        for h in hyps:
            groups[hyps[h][e]] = groups.get(hyps[h][e], 0) + 1
        worst = max(groups.values())
        if worst < best_worst:
            best, best_worst = e, worst
    return best

def diagnose(hyps, experiments, run):
    alive, left = list(hyps), list(experiments)
    while len(alive) > 1:
        e = best_experiment({h: hyps[h] for h in alive}, left)
        if e is None:
            break
        result = run(e)
        alive = [h for h in alive if hyps[h][e] == result]
        left.remove(e)
    return alive
`,
        tests: [
          { name: "best experiment", code: `H = {
    'lr':     {'overfit': 'high', 'step': 0, 'grad': 1, 'input': 'ok', 'curve': 'flat'},
    'detach': {'overfit': 'high', 'step': 0, 'grad': 0, 'input': 'ok', 'curve': 'flat'},
    'zeros':  {'overfit': 'high', 'step': 1, 'grad': 1, 'input': 'zero', 'curve': 'flat'},
    'labels': {'overfit': 'low', 'step': 1, 'grad': 1, 'input': 'ok', 'curve': 'flat'},
    'blowup': {'overfit': 'high', 'step': 1, 'grad': 1, 'input': 'ok', 'curve': 'jump'},
}
E = ['overfit', 'input', 'step', 'grad', 'curve']
assert best_experiment(H, E) == 'step', best_experiment(H, E)
assert best_experiment(H, ['overfit', 'grad']) == 'overfit', 'Ties go to the earlier experiment.'
assert best_experiment({'a': {'x': 1}, 'b': {'x': 1}}, ['x']) is None, 'An experiment that predicts the same for all splits nothing.'` },
          { name: "diagnose", code: `H = {
    'lr':     {'overfit': 'high', 'step': 0, 'grad': 1, 'input': 'ok', 'curve': 'flat'},
    'detach': {'overfit': 'high', 'step': 0, 'grad': 0, 'input': 'ok', 'curve': 'flat'},
    'zeros':  {'overfit': 'high', 'step': 1, 'grad': 1, 'input': 'zero', 'curve': 'flat'},
    'labels': {'overfit': 'low', 'step': 1, 'grad': 1, 'input': 'ok', 'curve': 'flat'},
    'blowup': {'overfit': 'high', 'step': 1, 'grad': 1, 'input': 'ok', 'curve': 'jump'},
}
E = ['overfit', 'input', 'step', 'grad', 'curve']
for truth in H:
    calls = []
    def run(e):
        calls.append(e)
        return H[truth][e]
    got = diagnose(H, E, run)
    assert got == [truth], f'With {truth} true, got {got}'
    assert len(calls) <= 3 and calls[0] == 'step', f'With {truth} true you ran {calls}; three well-chosen experiments are enough.'
same = {'a': {'x': 1, 'y': 0}, 'b': {'x': 1, 'y': 0}, 'c': {'x': 0, 'y': 0}}
assert diagnose(same, ['x', 'y'], lambda e: same['b'][e]) == ['a', 'b']` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>guilty_layers(mine, ref, x, tol=1e-6)</C>. <C>mine</C> and <C>ref</C> are lists of functions of the same
          length, each mapping a list of floats to a list of floats. Feed the reference input to both versions of each layer, as
          in the example above, and return the indices of the layers whose outputs differ from the reference anywhere by more
          than tol (absolute difference) or have a different length.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def guilty_layers(mine, ref, x, tol=1e-6):
    return []
`,
        solution: `def guilty_layers(mine, ref, x, tol=1e-6):
    guilty, a = [], x
    for i, (f, g) in enumerate(zip(mine, ref)):
        got, want = f(a), g(a)
        if len(got) != len(want) or any(abs(u - v) > tol for u, v in zip(got, want)):
            guilty.append(i)
        a = want
    return guilty
`,
        tests: [
          { name: "one bug", code: `import math
relu = lambda v: [max(0.0, t) for t in v]
double = lambda v: [2 * t for t in v]
shift = lambda v: [t - 1 for t in v]
softmax = lambda v: [math.exp(t) / sum(math.exp(s) for s in v) for t in v]
ref = [double, shift, relu, softmax]
assert guilty_layers(ref, ref, [0.5, -1.0, 2.0]) == []
bad_relu = lambda v: [max(0.0, t) + 0.01 for t in v]
got = guilty_layers([double, shift, bad_relu, softmax], ref, [0.5, -1.0, 2.0])
assert got == [2], f'Only the ReLU is wrong, and the softmax after it must not be blamed; got {got}'` },
          { name: "several bugs", code: `relu = lambda v: [max(0.0, t) for t in v]
double = lambda v: [2 * t for t in v]
shift = lambda v: [t - 1 for t in v]
drop = lambda v: v[:-1]
ref = [double, shift, relu, double]
mine = [lambda v: [t + t for t in v], lambda v: [t + 1 for t in v], relu, drop]
assert guilty_layers(mine, ref, [1.0, -2.0, 3.0]) == [1, 3]
slightly = lambda v: [2 * t + 1e-9 for t in v]
assert guilty_layers([slightly, shift, relu, double], ref, [1.0]) == []
assert guilty_layers([slightly, shift, relu, double], ref, [1.0], tol=1e-12) == [0]` },
        ],
      },
    },
    {
      key: "nothing",
      rung: "prove",
      prompt: (
        <p>
          Prove that a classifier that outputs the same probability vector p for every input has average cross-entropy at least{" "}
          <M>{"H(q)"}</M>, where q holds the label frequencies, with equality at p = q. Conclude what a loss stuck at{" "}
          <M>{"\\ln K"}</M> on balanced data suggests.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the average loss as minus the sum over k of q_k ln p_k.",
          "Shows that the loss minus H(q) is the sum of q_k ln(q_k / p_k) and that this is non-negative, by Jensen's inequality, Gibbs' inequality or a Lagrange multiplier argument, with equality at p = q.",
          "Notes that for balanced classes H(q) = ln K, so a loss stuck there is what a model that ignores its input achieves.",
        ],
      },
    },
    {
      key: "freq",
      rung: "stretch",
      prompt: (
        <p>
          A three-class dataset has label frequencies 0.5, 0.25 and 0.25. What loss does a model reach if it learns the label
          frequencies and nothing else? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.04, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why changing hyperparameters until a stuck loss moves is a poor way to debug, and how listing hypotheses and choosing experiments that split them is faster.",

  glimpse: (
    <p>
      Experiments are fast only when the failure is fast to reproduce. Next, minimal reproductions: cutting a failing run down
      to the smallest program and input that still fail, so each experiment takes seconds instead of hours.
    </p>
  ),
};
