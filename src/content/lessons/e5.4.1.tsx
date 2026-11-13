import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradCheckReluViz } from "@/components/viz/GradCheckReluViz";
import type { LessonContent } from "@/lib/types";

const ENGINE = `import numpy as np

def unbroadcast(g, shape):
    while g.ndim > len(shape):
        g = g.sum(axis=0)
    for i, n in enumerate(shape):
        if n == 1:
            g = g.sum(axis=i, keepdims=True)
    return g

class Tensor:
    def __init__(self, data, _prev=()):
        self.data = np.asarray(data, dtype=float)
        self.grad = np.zeros_like(self.data)
        self._prev = _prev
        self._backward = lambda: None

    def _make(self, data, prev, backward):
        out = Tensor(data, prev)
        out._backward = lambda: backward(out.grad)
        return out

    def __add__(self, o):
        def bw(g):
            self.grad += unbroadcast(g, self.data.shape)
            o.grad += unbroadcast(g, o.data.shape)
        return self._make(self.data + o.data, (self, o), bw)

    def __mul__(self, o):
        def bw(g):
            self.grad += unbroadcast(o.data * g, self.data.shape)
            o.grad += unbroadcast(self.data * g, o.data.shape)
        return self._make(self.data * o.data, (self, o), bw)

    def __matmul__(self, o):
        def bw(g):
            self.grad += g @ o.data.T
            o.grad += self.data.T @ g
        return self._make(self.data @ o.data, (self, o), bw)

    def sum(self):
        def bw(g):
            self.grad += np.ones_like(self.data) * g
        return self._make(self.data.sum(), (self,), bw)

    def relu(self):
        def bw(g):
            self.grad += (self.data > 0) * g
        return self._make(np.maximum(self.data, 0), (self,), bw)

    def backward(self):
        topo, seen, stack = [], set(), [(self, False)]
        while stack:
            v, done = stack.pop()
            if done:
                topo.append(v)
            elif v not in seen:
                seen.add(v)
                stack.append((v, True))
                stack.extend((p, False) for p in v._prev)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

def cross_entropy(logits, y):
    z, n = logits.data, len(y)
    m = z.max(axis=1, keepdims=True)
    lse = m[:, 0] + np.log(np.exp(z - m).sum(axis=1))
    def bw(g):
        p = np.exp(z - lse[:, None])
        p[np.arange(n), y] -= 1
        logits.grad += p / n * g
    return logits._make((lse - z[np.arange(n), y]).mean(), (logits,), bw)
`;

const CHECK = `def rel_error(a, b):
    return np.abs(a - b) / np.maximum(np.maximum(np.abs(a), np.abs(b)), 1e-12)

def numeric_grad(f, p, h=1e-6):
    g = np.zeros_like(p.data)
    for i in np.ndindex(p.data.shape):
        old = p.data[i]
        p.data[i] = old + h
        up = f().data
        p.data[i] = old - h
        down = f().data
        p.data[i] = old
        g[i] = (up - down) / (2 * h)
    return g

def gradcheck(f, params, h=1e-6, tol=1e-6):
    for p in params:
        p.grad = np.zeros_like(p.data)
    f().backward()
    worst = 0.0
    for p in params:
        worst = max(worst, float(rel_error(p.grad, numeric_grad(f, p, h)).max()))
    return worst, worst < tol
`;

const CHECKOP = `def check_op(op, shapes, seed=0):
    rng = np.random.default_rng(seed)
    ins = [Tensor(rng.normal(size=s)) for s in shapes]
    R = Tensor(rng.normal(size=op(*ins).data.shape))
    worst, ok = gradcheck(lambda: (op(*ins) * R).sum(), ins)
    return ok
`;

export const lesson: LessonContent = {
  id: "e5.4.1",
  minutes: 50,
  links: {
    requires: ["e5.3.4", "e4.1.3"],
    revisits: ["m5.3.3", "e5.2.3"],
    foreshadows: ["e5.4.2", "e5.4.3"],
  },

  puzzle: (
    <>
      <p>
        A closure with a transposed matrix or a missing mask still runs, still returns arrays of the right shape, and still
        lets the loss go down a little. Nothing crashes. How can a framework prove to itself that every closure computes the
        true derivative, using nothing but the forward pass?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Nudge one parameter up by h, then down by h, and see how the loss moves: (L(p + h) − L(p − h)) / 2h is an estimate of
        ∂L/∂p that never touches a closure. Compare it with the backward pass, entry by entry, as a relative error. Correct
        closures agree to about 10⁻¹⁰ in float64; a wrong one is off by something like 10⁻¹ to 1, with nothing in between.
      </p>
      <GradCheckReluViz />
      <p>
        The one honest failure is a kink. If a ReLU input lies within h of 0, the two nudges land on different sides and the
        estimate averages the two slopes. Check at random points, and re-check before believing a failure at one entry.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="central differences are second-order accurate">
        <p>
          If f is three times continuously differentiable near x, then (f(x + h) − f(x − h)) / 2h = f′(x) + h²f‴(ξ)/6 for some
          ξ in (x − h, x + h).
        </p>
      </Theorem>
      <Proof>
        <p>
          By Taylor&rsquo;s theorem, f(x ± h) = f(x) ± hf′(x) + h²f″(x)/2 ± h³f‴(ξ±)/6. Subtracting, the even terms cancel:
          f(x + h) − f(x − h) = 2hf′(x) + h³(f‴(ξ₊) + f‴(ξ₋))/6. Dividing by 2h, and using the intermediate value theorem to
          write the average of f‴(ξ₊) and f‴(ξ₋) as f‴(ξ), gives the claim. The one-sided difference (f(x + h) − f(x)) / h
          keeps the f″ term and is only first-order accurate.
        </p>
      </Proof>

      <Definition title="gradcheck">
        <p>
          Run one backward pass for the analytic gradients. Then, for every entry of every parameter, perturb it in place,
          evaluate the loss twice, restore it, and form the central difference. Report the worst relative error |a − n| /
          max(|a|, |n|).
        </p>
        <Code>{CHECK}</Code>
      </Definition>

      <Remark title="choosing h">
        <p>
          Truncation error falls like h², but the two loss values agree in more and more leading digits as h shrinks, and
          their difference loses precision: rounding error grows like ε/h, with ε ≈ 2.2 × 10⁻¹⁶ in float64. The total is
          smallest near h ≈ ε^(1/3), about 10⁻⁵, and h = 10⁻⁶ is a common choice. In float32, ε ≈ 1.2 × 10⁻⁷ and the best
          achievable agreement is only around 10⁻⁵, which is why gradient checks run in float64.
        </p>
      </Remark>

      <Example title="checking one operation">
        <p>
          To test a single operation, feed it random inputs and reduce its output to a scalar with random weights R, so that
          every output entry gets a different, nonzero incoming gradient. A plain <C>.sum()</C> would send the same gradient
          to every entry and can hide a transposition.
        </p>
        <Code>{CHECKOP}</Code>
      </Example>

      <Remark title="cost">
        <p>
          A full check costs two forward passes per parameter entry. That is fine for an operation on a few dozen numbers and
          hopeless for a whole model, so frameworks check each operation on small random inputs, as PyTorch&rsquo;s{" "}
          <C>torch.autograd.gradcheck</C> does, and trust the chain rule to compose them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "why",
      rung: "check",
      prompt: <p>Why use the central difference rather than (f(x + h) − f(x)) / h?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its error is O(h²) rather than O(h), so it is far more accurate for the same h",
          "It needs only one evaluation of f",
          "It has no rounding error",
          "It works at kinks",
        ],
        correct: [0],
      },
    },
    {
      key: "h",
      rung: "check",
      prompt: <p>In float64 the best step for central differences is about ε^(1/3). Written as roughly 10ᵏ, what is k?</p>,
      answer: { kind: "numeric", value: -5 },
    },
    {
      key: "relative",
      rung: "apply",
      prompt: <p>Why compare analytic and numeric gradients by relative rather than absolute error?</p>,
      answer: {
        kind: "choice",
        options: [
          "Gradients vary in size by orders of magnitude, so one absolute threshold is too strict for large ones and too loose for small ones",
          "Absolute error cannot be computed for arrays",
          "Relative error is always smaller",
          "It removes rounding error",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x = 1.0
h = 1e-3
d = ((x + h) ** 3 - (x - h) ** 3) / (2 * h)
print(round(d, 8))`}</Code>
          <p>A central difference of x³ at 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.000001", "3.0", "3.003001", "2.999999"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x, h = 1e-9, 1e-6
relu = lambda v: max(v, 0.0)
numeric = (relu(x + h) - relu(x - h)) / (2 * h)
analytic = 1.0 if x > 0 else 0.0
print(round(numeric, 4), analytic)`}</Code>
          <p>A gradient check right next to a kink. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5005 1.0", "1.0 1.0", "0.0 1.0", "0.5 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The engine is already defined. Write <C>rel_error(a, b)</C> (elementwise, with a floor of 1e-12 on the denominator),{" "}
          <C>numeric_grad(f, p, h=1e-6)</C>, which perturbs each entry of <C>p.data</C> in place, calls the loss function{" "}
          <C>f()</C> twice and restores the entry, and <C>gradcheck(f, params, h=1e-6, tol=1e-6)</C>, which zeroes the grads,
          runs one backward and returns (worst relative error as a float, whether it is below tol).
        </p>
      ),
      answer: {
        kind: "code",
        setup: ENGINE,
        starter: `# Tensor (with +, *, @, sum(), relu(), backward()) and cross_entropy are already defined.

def rel_error(a, b):
    return np.abs(a - b)

def numeric_grad(f, p, h=1e-6):
    return np.zeros_like(p.data)

def gradcheck(f, params, h=1e-6, tol=1e-6):
    return 0.0, True
`,
        solution: CHECK,
        tests: [
          { name: "passes correct gradients", code: `rng = np.random.default_rng(0)
W, b = Tensor(rng.normal(size=(4, 3))), Tensor(rng.normal(size=3))
X = Tensor(rng.normal(size=(5, 4)))
y = np.array([0, 1, 2, 1, 0])
worst, ok = gradcheck(lambda: cross_entropy(X @ W + b, y), [W, b])
assert ok and worst < 1e-7, worst
assert np.allclose(numeric_grad(lambda: (W * W).sum(), W), 2 * W.data, atol=1e-6)
before = W.data.copy()
numeric_grad(lambda: (W * W).sum(), W)
assert np.array_equal(W.data, before), 'Restore every entry after perturbing it.'` },
          { name: "catches a wrong closure", code: `def bad_square(a):
    def bw(g):
        a.grad += a.data * g
    return a._make(a.data * a.data, (a,), bw)
t = Tensor(np.array([0.5, -1.0, 2.0]))
worst, ok = gradcheck(lambda: bad_square(t).sum(), [t])
assert not ok and abs(worst - 0.5) < 1e-6, worst
assert np.allclose(rel_error(np.array([1.0, 0.0]), np.array([1.0, 0.0])), 0.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>gradcheck</C> defined too, write <C>check_op(op, shapes, seed=0)</C>: build one random Tensor per shape with{" "}
          <C>np.random.default_rng(seed)</C>, draw a random weight tensor R of the output&rsquo;s shape, and return whether
          gradcheck passes on the loss <C>(op(*inputs) * R).sum()</C>.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${ENGINE}
${CHECK}`,
        starter: `# The engine and gradcheck are already defined.

def check_op(op, shapes, seed=0):
    return True
`,
        solution: CHECKOP,
        tests: [
          { name: "correct operations pass", code: `assert check_op(lambda a, b: a @ b, [(3, 4), (4, 2)])
assert check_op(lambda a, b: a * b + a, [(4, 3), (3,)])
assert check_op(lambda a: a.relu(), [(6,)], seed=1)` },
          { name: "a transposition bug fails", code: `def bad_matmul(a, b):
    def bw(g):
        a.grad += g @ b.data.T
        b.grad += g.T @ a.data
    return a._make(a.data @ b.data, (a, b), bw)
assert not check_op(bad_matmul, [(3, 3), (3, 3)])
assert check_op(lambda a, b: a @ b, [(3, 3), (3, 3)])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Show that for f three times continuously differentiable, (f(x + h) − f(x − h)) / 2h − f′(x) is O(h²), while (f(x + h)
          − f(x)) / h − f′(x) is in general only O(h).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands f(x ± h) by Taylor's theorem to third order with remainder.",
          "Shows the f(x) and f″ terms cancel in f(x + h) − f(x − h), leaving 2hf′(x) + O(h³), so the central quotient is f′(x) + O(h²).",
          "Shows the one-sided quotient equals f′(x) + hf″(x)/2 + O(h²), which is O(h) when f″(x) ≠ 0.",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: <p>A full central-difference gradient check of a model with one million parameters needs how many forward passes (not counting the one backward pass)?</p>,
      answer: { kind: "numeric", value: 2000000 },
    },
  ],

  teachBack:
    "Explain to a friend how a gradient check works, why it uses central differences, relative errors and float64, and why a failure next to a ReLU kink may not be a bug.",

  glimpse: (
    <p>
      A gradient check proves the framework agrees with calculus. The next lesson holds it to a stricter standard: agreeing
      with PyTorch itself, on the same inputs, to the last digit that floating point allows.
    </p>
  ),
};
