import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ModelExploitViz } from "@/components/viz/ModelExploitViz";
import type { LessonContent } from "@/lib/types";

const LATENT = `import math

def unroll(h0, actions, g):
    hs, rs, h = [], [], h0
    for a in actions:
        h, r = g(h, a)
        hs.append(h)
        rs.append(r)
    return hs, rs

def value_target(rewards, values, gamma, n, t):
    n = min(n, len(rewards) - t)
    return sum(gamma ** k * rewards[t + k] for k in range(n)) + gamma ** n * values[t + n]

def muzero_loss(pred_r, target_r, pred_v, target_v, pred_p, target_p):
    loss = sum((a - b) ** 2 for a, b in zip(pred_r, target_r)) + sum((a - b) ** 2 for a, b in zip(pred_v, target_v))
    return loss - sum(t * math.log(p) for ps, ts in zip(pred_p, target_p) for p, t in zip(ps, ts) if t > 0)`;

const ENSEMBLE = `import math

def fit_poly(xs, ys, deg):
    k = deg + 1
    M = [[sum(x ** (i + j) for x in xs) for j in range(k)] + [sum(y * x ** i for x, y in zip(xs, ys))] for i in range(k)]
    for c in range(k):
        p = max(range(c, k), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(k):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [M[i][k] / M[i][i] for i in range(k)]

def ensemble_stats(models, a):
    preds = [sum(c * a ** p for p, c in enumerate(w)) for w in models]
    mean = sum(preds) / len(preds)
    return mean, math.sqrt(sum((x - mean) ** 2 for x in preds) / len(preds))

def pessimistic_choice(models, actions, lam):
    def score(a):
        mean, sd = ensemble_stats(models, a)
        return mean - lam * sd
    return max(actions, key=score)`;

export const lesson: LessonContent = {
  id: "l6.8.4",
  minutes: 55,
  links: {
    requires: ["l6.8.1", "l6.8.3"],
    revisits: ["l6.6.4", "l6.5.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        AlphaZero searched with the exact rules of the game. A robot, or an agent playing a video game from pixels, has no
        rules to consult. It could learn to predict its next camera image, but most of each image is irrelevant to the task
        and hard to predict. What should a learned model of the world predict, and how can an agent plan with a model it
        knows to be imperfect without being fooled by its mistakes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Learn a compact latent state instead of predicting pixels, and roll the model forward in that latent space to imagine
        the consequences of actions. Train it, at least partly, to predict what planning needs, rewards and values, rather
        than everything. And never forget that the model is only right where it has data: an optimiser let loose on a learned
        model will find its errors and exploit them, as in the picture. Measuring the model&apos;s uncertainty, for example by the
        disagreement of an ensemble, and penalising it keeps planning honest.
      </p>
      <ModelExploitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="latent world models">
        <p>
          A latent world model has an encoder <M>{"z_t = e(o_t)"}</M> from observations to a latent state, a dynamics model{" "}
          <M>{"z_{t+1} \\sim p(z_{t+1} \\mid z_t, a_t)"}</M>, and heads predicting the reward and, often, the end of the episode; a decoder
          back to observations is optional. It is trained on sequences from a replay buffer (l6.5.2). <em>Imagination</em> means
          rolling the dynamics forward from a latent state under a sequence of actions (<C>unroll</C>, with a deterministic step
          function <C>g(h, a)</C> returning the next state and the predicted reward).
        </p>
      </Definition>

      <Remark title="learning inside the model">
        <p>
          Ha and Schmidhuber (2018) trained a small controller entirely inside a learned model of a racing game and a first-person
          shooter. The Dreamer agents (Hafner et al., 2020 to 2023) learn a recurrent state-space model whose latent state has
          a deterministic and a stochastic part, then train an actor and a critic purely on imagined trajectories of 15 or so
          steps, using λ-returns (l6.6.4) that bootstrap from the critic at the end of each imagined rollout. Gradients of the
          imagined return can flow back through the learned dynamics into the actor. DreamerV3 used one set of
          hyperparameters across many domains, and was the first agent to collect diamonds in Minecraft from scratch without
          human data.
        </p>
      </Remark>

      <Definition title="MuZero">
        <p>
          (Schrittwieser et al., 2020.) Three functions: a representation <M>{"s^0 = h_\\theta(o_{1:t})"}</M>, a dynamics function{" "}
          <M>{"(r^k, s^k) = g_\\theta(s^{k-1}, a_{t+k})"}</M> and a prediction function <M>{"(p^k, v^k) = f_\\theta(s^k)"}</M>. The model is unrolled
          K = 5 steps along the actions actually taken, and every step is trained to match the observed reward{" "}
          <M>{"u_{t+k}"}</M>, the n-step value target{" "}
          <M>{"z_{t+k} = \\sum_{j<n}\\gamma^ju_{t+k+j} + \\gamma^n\\nu_{t+k+n}"}</M> (<C>value_target</C>, cut at the end of the stored
          sequence) and the policy <M>{"\\pi_{t+k}"}</M> found by the search at that time:
        </p>
        <MD>{"\\ell = \\sum_{k=0}^K\\Bigl[(r^k - u_{t+k})^2 + (v^k - z_{t+k})^2 - \\pi_{t+k}^\\top\\log p^k\\Bigr]"}</MD>
        <p>
          (<C>muzero_loss</C>, with squared errors standing in for the categorical losses of the paper). Nothing asks the latent
          state to reconstruct the observation. Planning is the PUCT search of l6.8.3, run inside g and f instead of the real
          game. MuZero matched AlphaZero in Go, chess and shogi without being given the rules, and set new results on Atari.
        </p>
        <Code>{LATENT}</Code>
      </Definition>

      <Theorem title="value equivalence">
        <p>
          Suppose a model, for every state and every action sequence of length K, predicts the true expected rewards at each
          step and the true expected value <M>{"v(S_{t+K})"}</M> of the final state under the policy that follows. Then every K-step
          lookahead computed in the model, of the form{" "}
          <M>{"\\sum_{k<K}\\gamma^k\\hat r_k + \\gamma^K\\hat v_K"}</M>, equals the corresponding expected return in the real environment, whatever the
          model&apos;s latent states look like.
        </p>
      </Theorem>
      <Proof>
        <p>
          By linearity of expectation the real expected return of the action sequence is{" "}
          <M>{"\\sum_{k<K}\\gamma^k\\mathbb{E}[R_{t+k+1}] + \\gamma^K\\mathbb{E}[v(S_{t+K})]"}</M>. Each expectation equals the model&apos;s prediction by
          assumption, so the sums agree term by term. The latent states enter only through these predictions. This is why
          MuZero trains its model on rewards and values alone (Grimm et al., 2020, call such models value-equivalent).
        </p>
      </Proof>

      <Definition title="ensembles and pessimism">
        <p>
          Train several models on bootstrap resamples or from different initialisations; where the data pin the answer down they
          agree, and where they do not they disagree. A pessimistic planner maximises the mean prediction minus λ times the
          spread (<C>ensemble_stats</C>, <C>pessimistic_choice</C>; the picture fits cubic models with <C>fit_poly</C>, least squares by
          the normal equations). PETS, MOPO and related methods use this idea for planning and for offline reinforcement
          learning, where no new data can correct the model.
        </p>
        <Code>{ENSEMBLE}</Code>
      </Definition>

      <Theorem title="pessimism bounds the regret by the uncertainty of the best action">
        <p>
          Suppose the true reward satisfies <M>{"|r(a) - \\mu(a)| \\le \\lambda\\sigma(a)"}</M> for every action, and the planner picks{" "}
          <M>{"\\hat a = \\arg\\max_a\\mu(a) - \\lambda\\sigma(a)"}</M>. Then for every action a,{" "}
          <M>{"r(\\hat a) \\ge r(a) - 2\\lambda\\sigma(a)"}</M>; in particular the regret against the best action <M>{"a^*"}</M> is at most{" "}
          <M>{"2\\lambda\\sigma(a^*)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"r(\\hat a) \\ge \\mu(\\hat a) - \\lambda\\sigma(\\hat a) \\ge \\mu(a) - \\lambda\\sigma(a) \\ge r(a) - 2\\lambda\\sigma(a)"}</M>, using the
          confidence bound, then the choice of â, then the confidence bound again. The point is that only the uncertainty at a
          good action matters, not at the chosen one: if the data cover some near-optimal action well, the pessimistic
          planner does nearly as well, however wild the model is elsewhere. An optimistic or plain planner has no such
          guarantee, because it can be drawn to where σ is large.
        </p>
      </Proof>

      <Remark title="where this leaves us">
        <p>
          Learned models make reinforcement learning far more sample-efficient, at the cost of computation and of a new failure
          mode, exploitation of model error. Planning over short horizons, replanning often, training the model on what
          planning needs, and penalising uncertainty are the main defences. The same ideas, learning a predictive model of the
          world and acting by imagining consequences, run through much current work on agents.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "z",
      rung: "check",
      prompt: (
        <p>
          The next two rewards are 1 and 1, γ = 0.9, and the value two steps ahead is 10. What is the 2-step value target?
        </p>
      ),
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "pess",
      rung: "check",
      prompt: (
        <p>
          Three models predict rewards 1, 2 and 3 for an action. With λ = 1 and the population standard deviation, what is its
          pessimistic score? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.1835, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does MuZero not train its latent state to reconstruct the observations?</p>,
      answer: {
        kind: "choice",
        options: [
          "Planning needs only rewards, values and policies; predicting those is enough for the search, and capacity is not spent on irrelevant detail",
          "Reconstruction is impossible for board games",
          "The latent state is fixed and not trained at all",
          "Reconstruction would make the model value-equivalent, which MuZero avoids",
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

def unroll(h0, actions, g):
    hs, rs, h = [], [], h0
    for a in actions:
        h, r = g(h, a)
        hs.append(h)
        rs.append(r)
    return hs, rs

def value_target(rewards, values, gamma, n, t):
    n = min(n, len(rewards) - t)
    return sum(gamma ** k * rewards[t + k] for k in range(n)) + gamma ** n * values[t + n]

def muzero_loss(pred_r, target_r, pred_v, target_v, pred_p, target_p):
    loss = sum((a - b) ** 2 for a, b in zip(pred_r, target_r)) + sum((a - b) ** 2 for a, b in zip(pred_v, target_v))
    return loss - sum(t * math.log(p) for ps, ts in zip(pred_p, target_p) for p, t in zip(ps, ts) if t > 0)

print(unroll(1, [0, 1, -1], lambda h, a: (2 * h + a, h)), value_target([1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 4.0], 0.5, 2, 0), value_target([1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 4.0], 0.5, 3, 0))
print(value_target([1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 4.0], 0.5, 5, 1), round(muzero_loss([1.0], [0.5], [0.0, 1.0], [0.5, 1.0], [[0.5, 0.5]], [[1.0, 0.0]]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "([2, 5, 9], [1, 2, 5]) 1.0 2.0\n2.0 1.1931",
          "([2, 5, 9], [2, 5, 9]) 1.0 2.0\n2.0 1.1931",
          "([2, 5, 9], [1, 2, 5]) 1.0 1.5\n2.0 1.1931",
          "([2, 4, 8], [1, 2, 4]) 1.0 2.0\n1.0 0.5",
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

def fit_poly(xs, ys, deg):
    k = deg + 1
    M = [[sum(x ** (i + j) for x in xs) for j in range(k)] + [sum(y * x ** i for x, y in zip(xs, ys))] for i in range(k)]
    for c in range(k):
        p = max(range(c, k), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(k):
            if r != c:
                f = M[r][c] / M[c][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [M[i][k] / M[i][i] for i in range(k)]

def ensemble_stats(models, a):
    preds = [sum(c * a ** p for p, c in enumerate(w)) for w in models]
    mean = sum(preds) / len(preds)
    return mean, math.sqrt(sum((x - mean) ** 2 for x in preds) / len(preds))

def pessimistic_choice(models, actions, lam):
    def score(a):
        mean, sd = ensemble_stats(models, a)
        return mean - lam * sd
    return max(actions, key=score)

models = [[0.0, 1.0, 0.0], [0.0, 3.0, 0.0]]; print([round(c, 6) for c in fit_poly([0.0, 1.0, 2.0], [1.0, 3.0, 5.0], 1)], ensemble_stats([[0.0, 1.0], [2.0, 1.0]], 1.0))
print(ensemble_stats(models, -1.0), [pessimistic_choice(models, [-1, 0, 1, 2], lam) for lam in (0, 1, 3)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 2.0] (2.0, 1.0)\n(-2.0, 1.0) [2, 2, 0]",
          "[2.0, 1.0] (2.0, 1.0)\n(-2.0, 1.0) [2, 2, 0]",
          "[1.0, 2.0] (2.0, 1.0)\n(-2.0, 1.0) [2, 0, 0]",
          "[1.0, 2.0] (2.0, 2.0)\n(2.0, 1.0) [2, 1, -1]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>unroll(h0, actions, g)</C>, returning the lists of latent states and predicted rewards;{" "}
          <C>value_target(rewards, values, gamma, n, t)</C>, with <C>values</C> one longer than <C>rewards</C> and n cut at the end; and{" "}
          <C>muzero_loss(pred_r, target_r, pred_v, target_v, pred_p, target_p)</C>, skipping zero target probabilities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def unroll(h0, actions, g):
    return [], []

def value_target(rewards, values, gamma, n, t):
    return 0.0

def muzero_loss(pred_r, target_r, pred_v, target_v, pred_p, target_p):
    return 0.0
`,
        solution: LATENT,
        tests: [
          { name: "unroll", code: `assert unroll(1, [0, 1, -1], lambda h, a: (2 * h + a, h)) == ([2, 5, 9], [1, 2, 5]) and unroll(3, [], lambda h, a: (h, 0)) == ([], [])
r, v = [1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 4.0]
assert value_target(r, v, 0.5, 2, 0) == 1.0 and value_target(r, v, 0.5, 3, 0) == 2.0 and value_target(r, v, 0.5, 5, 1) == 2.0 and value_target(r, v, 0.5, 0, 2) == 0.0
assert abs(value_target([1.0, 1.0], [0.0, 0.0, 10.0], 0.9, 2, 0) - 10.0) < 1e-12` },
          { name: "loss", code: `assert abs(muzero_loss([1.0], [0.5], [0.0, 1.0], [0.5, 1.0], [[0.5, 0.5]], [[1.0, 0.0]]) - (0.5 + math.log(2))) < 1e-12
assert muzero_loss([2.0], [2.0], [1.0], [1.0], [[1.0, 0.0]], [[1.0, 0.0]]) == 0
assert abs(muzero_loss([], [], [], [], [[0.25, 0.75], [0.5, 0.5]], [[0.0, 1.0], [0.5, 0.5]]) - (-math.log(0.75) + math.log(2))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_poly(xs, ys, deg)</C>, the least-squares coefficients from the constant term up, solving the normal equations
          by elimination with pivoting; <C>ensemble_stats(models, a)</C>, the mean and population standard deviation of the
          predictions; and <C>pessimistic_choice(models, actions, lam)</C>, taking the first action on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fit_poly(xs, ys, deg):
    return [0.0] * (deg + 1)

def ensemble_stats(models, a):
    return 0.0, 0.0

def pessimistic_choice(models, actions, lam):
    return actions[0]
`,
        solution: ENSEMBLE,
        tests: [
          { name: "fit", code: `close = lambda u, v: all(abs(a - b) < 1e-9 for a, b in zip(u, v))
assert close(fit_poly([0.0, 1.0, 2.0], [1.0, 3.0, 5.0], 1), [1.0, 2.0]) and close(fit_poly([-1.0, 0.0, 1.0, 2.0], [2.0, 1.0, 2.0, 5.0], 2), [1.0, 0.0, 1.0])
assert close(fit_poly([0.0, 1.0, 2.0, 3.0], [0.0, 1.0, 1.0, 2.0], 1), [0.1, 0.6])` },
          { name: "pessimism", code: `models = [[0.0, 1.0, 0.0], [0.0, 3.0, 0.0]]
assert ensemble_stats([[0.0, 1.0], [2.0, 1.0]], 1.0) == (2.0, 1.0) and ensemble_stats(models, -1.0) == (-2.0, 1.0)
assert [pessimistic_choice(models, [-1, 0, 1, 2], lam) for lam in (0, 1, 3)] == [2, 2, 0]
m, s = ensemble_stats([[1.0], [2.0], [3.0]], 5.0)
assert m == 2.0 and abs(s - (2 / 3) ** 0.5) < 1e-12 and pessimistic_choice([[1.0], [1.0]], [4, 7], 2.0) == 4` },
        ],
      },
    },
    {
      key: "switch",
      rung: "stretch",
      prompt: (
        <p>
          An ensemble predicts mean 3 with spread 2 for action A and mean 1 with spread 0.2 for action B. Above which λ does the
          pessimistic planner prefer B? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.1111, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. It began with a bandit trading exploration against exploitation and ended with agents that
        imagine their futures in learned models. The thread through it is the Bellman equation, solved exactly, sampled,
        approximated, differentiated through a policy, regularised and finally planned with; the same pieces reappear when
        reinforcement learning is used to train language models (l9.4.1).
      </p>
    </>
  ),
};
