import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

export const ppo: Drill = {
  id: "ppo",
  title: "A basic PPO step",
  summary: "Generalised advantage estimation, the clipped surrogate loss and its gradient, and one policy update.",
  minutes: 30,
  skills: ["Reinforcement learning", "Policy gradients", "Backpropagation"],
  lessons: ["l3.2.3", "l6.6.4", "l6.7.3"],
  testLessons: {
    "GAE matches the reference within one episode": ["l6.6.4"],
    "GAE resets at episode boundaries": ["l6.6.4"],
    "the loss matches the reference": ["l6.7.3"],
    "the gradient matches finite differences": ["l3.2.3", "l3.2.4"],
    "clipped samples contribute no gradient": ["l6.7.3"],
    "a PPO step improves the objective without changing its input": ["l6.7.3"],
  },
  brief: (
    <>
      <p>Write the core of proximal policy optimisation for a categorical policy, in NumPy.</p>
      <ol>
        <li>
          <C>gae(rewards, values, dones, last_value, gamma=0.99, lam=0.95)</C> returns <C>(advantages, returns)</C>,
          both of shape <C>(T,)</C>. <C>dones[t] = 1</C> means the episode ended after step <C>t</C>, so nothing
          after it is bootstrapped or accumulated. With <C>V[T] = last_value</C>:
          <Code>{`
delta[t] = rewards[t] + gamma * V[t+1] * (1 - dones[t]) - V[t]
A[t]     = delta[t] + gamma * lam * (1 - dones[t]) * A[t+1]      # A[T] = 0
returns  = A + values
`}</Code>
        </li>
        <li>
          <C>ppo_loss(logits, actions, old_log_probs, advantages, clip=0.2)</C> returns <C>(loss, d_logits)</C>.{" "}
          <C>logits</C> is <C>(N, n_actions)</C>, <C>actions</C> holds integers <C>(N,)</C>. With{" "}
          <C>ratio = exp(log_prob_new - old_log_probs)</C>, the loss is{" "}
          <C>-mean(min(ratio * A, clip(ratio, 1 - clip, 1 + clip) * A))</C>, a float. <C>d_logits</C> is its
          gradient with respect to <C>logits</C>, the same shape. Use a stable log-softmax. Do not normalise the
          advantages.
        </li>
        <li>
          <C>ppo_step(W, obs, actions, old_log_probs, advantages, lr=0.1, clip=0.2)</C>: the policy is linear,{" "}
          <C>logits = obs @ W</C> with <C>W</C> of shape <C>(obs_dim, n_actions)</C>. Return a new <C>W</C> after one
          gradient-descent step on <C>ppo_loss</C>. Do not change the <C>W</C> passed in.
        </li>
      </ol>
      <p>The hidden tests check GAE across episode boundaries, the loss, its gradient against a reference, that clipped samples give no gradient, and that a step improves the objective.</p>
    </>
  ),
  starter: `import numpy as np


def gae(rewards, values, dones, last_value, gamma=0.99, lam=0.95):
    raise NotImplementedError


def ppo_loss(logits, actions, old_log_probs, advantages, clip=0.2):
    raise NotImplementedError


def ppo_step(W, obs, actions, old_log_probs, advantages, lr=0.1, clip=0.2):
    raise NotImplementedError


if __name__ == "__main__":
    adv, ret = gae(np.array([1.0, 0.0, 1.0]), np.array([0.5, 0.4, 0.3]), np.array([0, 0, 1]), last_value=0.0)
    print(adv, ret)
`,
  solution: `import numpy as np


def gae(rewards, values, dones, last_value, gamma=0.99, lam=0.95):
    T = len(rewards)
    advantages = np.zeros(T)
    next_value = last_value
    running = 0.0
    for t in reversed(range(T)):
        live = 1.0 - dones[t]
        delta = rewards[t] + gamma * next_value * live - values[t]
        running = delta + gamma * lam * live * running
        advantages[t] = running
        next_value = values[t]
    return advantages, advantages + values


def log_softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    return z - np.log(np.exp(z).sum(axis=1, keepdims=True))


def ppo_loss(logits, actions, old_log_probs, advantages, clip=0.2):
    n = len(actions)
    log_probs = log_softmax(logits)
    new = log_probs[np.arange(n), actions]
    ratio = np.exp(new - old_log_probs)
    unclipped = ratio * advantages
    clipped = np.clip(ratio, 1 - clip, 1 + clip) * advantages
    loss = -np.minimum(unclipped, clipped).mean()

    d_new = np.where(unclipped <= clipped, -ratio * advantages / n, 0.0)
    d_logits = -np.exp(log_probs) * d_new[:, None]
    d_logits[np.arange(n), actions] += d_new
    return float(loss), d_logits


def ppo_step(W, obs, actions, old_log_probs, advantages, lr=0.1, clip=0.2):
    _, d_logits = ppo_loss(obs @ W, actions, old_log_probs, advantages, clip)
    return W - lr * obs.T @ d_logits
`,
  prelude: `import numpy as _ref_np

_ref_rng = _ref_np.random.default_rng(2024)


def _ref_gae(r, v, d, last, g, l):
    T = len(r)
    vals = _ref_np.append(v, last)
    A = _ref_np.zeros(T + 1)
    for t in range(T - 1, -1, -1):
        live = 1 - d[t]
        A[t] = r[t] + g * vals[t + 1] * live - vals[t] + g * l * live * A[t + 1]
    return A[:T], A[:T] + v


def _ref_lsm(z):
    z = z - z.max(axis=1, keepdims=True)
    return z - _ref_np.log(_ref_np.exp(z).sum(axis=1, keepdims=True))


def _ref_loss(logits, a, old, adv, c):
    ratio = _ref_np.exp(_ref_lsm(logits)[_ref_np.arange(len(a)), a] - old)
    return -_ref_np.minimum(ratio * adv, _ref_np.clip(ratio, 1 - c, 1 + c) * adv).mean()


def _ref_numgrad(logits, a, old, adv, c):
    g = _ref_np.zeros_like(logits)
    for idx in _ref_np.ndindex(*logits.shape):
        up = logits.copy()
        up[idx] += 1e-6
        down = logits.copy()
        down[idx] -= 1e-6
        g[idx] = (_ref_loss(up, a, old, adv, c) - _ref_loss(down, a, old, adv, c)) / 2e-6
    return g


def _ref_batch(n=12, k=4, spread=0.1):
    logits = _ref_rng.normal(size=(n, k))
    a = _ref_rng.integers(0, k, size=n)
    old = _ref_lsm(logits)[_ref_np.arange(n), a] + _ref_rng.uniform(-spread, spread, size=n)
    adv = _ref_rng.normal(size=n)
    return logits, a, old, adv
`,
  tests: [
    {
      name: "GAE matches the reference within one episode",
      code: `r = _ref_rng.normal(size=8)
v = _ref_rng.normal(size=8)
d = _ref_np.zeros(8)
adv, ret = gae(r, v, d, 0.7, gamma=0.9, lam=0.8)
want_a, want_r = _ref_gae(r, v, d, 0.7, 0.9, 0.8)
assert _ref_np.shape(adv) == (8,) and _ref_np.shape(ret) == (8,), "advantages and returns should both have shape (T,)"
assert _ref_np.allclose(adv, want_a), "advantages differ from the reference: check delta and the backward recursion, including last_value"
assert _ref_np.allclose(ret, want_r), "returns should be advantages + values"`,
    },
    {
      name: "GAE resets at episode boundaries",
      code: `r = _ref_rng.normal(size=10)
v = _ref_rng.normal(size=10)
d = _ref_np.array([0, 0, 1, 0, 0, 0, 1, 0, 0, 0], dtype=float)
adv, _ = gae(r, v, d, 1.3)
want, _ = _ref_gae(r, v, d, 1.3, 0.99, 0.95)
assert _ref_np.isclose(adv[2], r[2] - v[2]), "at a terminal step the advantage is just reward minus value"
assert _ref_np.allclose(adv, want), "advantages leak across an episode boundary: neither bootstrap nor accumulate past a done"`,
    },
    {
      name: "the loss matches the reference",
      code: `logits, a, old, adv = _ref_batch(spread=0.5)
loss, _ = ppo_loss(logits.copy(), a, old, adv, clip=0.2)
want = _ref_loss(logits, a, old, adv, 0.2)
assert _ref_np.isclose(float(loss), want), f"loss should be {want:.6f}, got {float(loss):.6f}"
logits, a, _, adv = _ref_batch()
same = _ref_lsm(logits)[_ref_np.arange(len(a)), a]
loss, _ = ppo_loss(logits, a, same, adv)
assert _ref_np.isclose(float(loss), -adv.mean()), "when the policy has not changed, the ratio is 1 and the loss is -mean(advantages)"`,
    },
    {
      name: "the gradient matches finite differences",
      code: `logits, a, old, adv = _ref_batch(n=10, k=3, spread=0.1)
_, g = ppo_loss(logits.copy(), a, old, adv, clip=0.2)
assert _ref_np.shape(g) == logits.shape, f"d_logits should have shape {logits.shape}"
assert _ref_np.allclose(g, _ref_numgrad(logits, a, old, adv, 0.2), atol=1e-6), "d_logits differs from a finite-difference gradient: remember the chain rule through the ratio and the softmax"`,
    },
    {
      name: "clipped samples contribute no gradient",
      code: `logits, a, old, adv = _ref_batch(n=6, k=3)
adv = _ref_np.abs(adv) + 0.5
old = _ref_lsm(logits)[_ref_np.arange(6), a] - 1.0
_, g = ppo_loss(logits, a, old, adv, clip=0.2)
assert _ref_np.allclose(g, 0), "every ratio is far above 1 + clip with a positive advantage, so the gradient should be zero"
_, g = ppo_loss(logits, a, old, -adv, clip=0.2)
assert not _ref_np.allclose(g, 0), "with a negative advantage the unclipped term is the minimum, so the gradient should not vanish"`,
    },
    {
      name: "a PPO step improves the objective without changing its input",
      code: `obs = _ref_rng.normal(size=(32, 5))
W = _ref_rng.normal(size=(5, 3)) * 0.1
lp = _ref_lsm(obs @ W)
a = _ref_rng.integers(0, 3, size=32)
old = lp[_ref_np.arange(32), a]
adv = _ref_rng.normal(size=32)
W0 = W.copy()
W1 = ppo_step(W, obs, a, old, adv, lr=0.05)
assert _ref_np.array_equal(W, W0), "ppo_step should return a new W and leave the one passed in unchanged"
assert _ref_np.shape(W1) == W.shape, "the new W should have the same shape"
assert _ref_loss(obs @ W1, a, old, adv, 0.2) < _ref_loss(obs @ W, a, old, adv, 0.2), "the loss did not go down after a step"
_, g = ppo_loss(obs @ W, a, old, adv)
assert _ref_np.allclose(W1, W - 0.05 * obs.T @ _ref_np.asarray(g)), "the step should be W - lr * obs.T @ d_logits"`,
    },
  ],
};
