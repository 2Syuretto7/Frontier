import { M } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BroadcastPairViz } from "@/components/viz/BroadcastPairViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.1.4",
  minutes: 55,
  links: {
    requires: ["e4.1.1", "e1.5.3"],
    revisits: ["e1.5.1", "e1.5.5", "e1.3.5"],
    foreshadows: ["e4.2.1", "e4.4.2"],
  },

  puzzle: (
    <>
      <p>
        Your regression model trains without a single error, and the loss falls to a value that looks plausible. Yet the
        predictions are useless. The cause is one line: the predictions have shape (100, 1), the targets have shape (100,), and{" "}
        <C>((pred - y) ** 2).mean()</C> quietly averaged ten thousand differences instead of one hundred.
      </p>
      <p>No test of the loss value would have caught this. What would?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most array bugs do not crash. NumPy and PyTorch broadcast shapes that do not match, so a missing or extra axis turns a
        sum of n numbers into a sum of n² numbers, and the program carries on. The cure is to state what you expect, the shape
        of each array and the facts that must stay true, and to check it in code, so that a wrong program stops at the first
        line where it goes wrong.
      </p>
      <p>Pick two shapes and see how broadcasting lines them up, from the right.</p>
      <BroadcastPairViz />
      <p>
        An error in red is the good outcome: the program stops. The dangerous case is a result bigger than either input, which
        is almost never what you meant.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="broadcasting">
        <p>
          To combine arrays of shapes a and b elementwise, NumPy pads the shorter shape with 1s on the left until both have the
          same length, then compares sizes position by position. Two sizes are compatible if they are equal or one of them is
          1, and the result takes the larger. If any pair is incompatible, NumPy raises <C>ValueError</C>.
        </p>
      </Definition>

      <Example title="the silent bug">
        <Code>{`pred = model(x)          # (100, 1)
y = targets              # (100,)
loss = ((pred - y) ** 2).mean()   # pred - y has shape (100, 100)`}</Code>
        <p>
          The fix is one line, <C>pred = pred[:, 0]</C> or <C>pred.squeeze(1)</C>, but finding it took a day. One assertion
          finds it in a second:
        </p>
        <Code>{`assert pred.shape == y.shape, f"pred {pred.shape} and y {y.shape} differ"`}</Code>
      </Example>

      <Definition title="invariants">
        <p>
          An <em>invariant</em> is a fact that must hold whenever the program reaches a certain point. A{" "}
          <em>precondition</em> holds when a function is called, a <em>postcondition</em> when it returns. Useful ones in
          machine learning code:
        </p>
        <ul>
          <li>shapes, written with named axes: x is (B, T, D), the weight is (D, K), so the output is (B, T, K);</li>
          <li>each row of a probability matrix is non-negative and sums to 1;</li>
          <li>a mask contains only 0 and 1, and an attention mask hides the future;</li>
          <li>a loss is finite: <C>np.isfinite(loss).all()</C>;</li>
          <li>indices are in range: <C>0 &lt;= labels.min()</C> and <C>labels.max() &lt; num_classes</C>.</li>
        </ul>
      </Definition>

      <Example title="named shapes">
        <Code>{`def attention(q, k, v):
    B, T, D = q.shape
    assert k.shape == (B, T, D) and v.shape == (B, T, D), (q.shape, k.shape, v.shape)
    s = np.einsum("btd,bsd->bts", q, k) / np.sqrt(D)     # (B, T, T)
    p = softmax(s, axis=-1)
    assert np.allclose(p.sum(-1), 1.0)
    return np.einsum("bts,bsd->btd", p, v)               # (B, T, D)`}</Code>
        <p>
          Unpacking <C>B, T, D = q.shape</C> already checks that q has three axes. Comments with the shape after each line cost
          nothing and make the next reader&rsquo;s job easy. Einsum strings name the axes, so a mismatch is an error rather
          than a broadcast.
        </p>
      </Example>

      <Proposition title="what broadcasting can hide">
        <p>
          If arrays of shapes a and b broadcast to a result r with <M>{"|r| > \\max(|a|, |b|)"}</M> numbers, then some axis was
          stretched in both directions: one array had size 1 there and the other did not, and at a different axis the roles
          were swapped. An elementwise operation between two arrays that are meant to describe the same items never needs this,
          so an assertion that the result has the shape of one input catches every such bug.
        </p>
      </Proposition>

      <Remark title="assert or raise">
        <p>
          Python removes <C>assert</C> statements when run with <C>python -O</C>. Use <C>assert</C> for facts about your own
          code that should never fail, and <C>raise ValueError(...)</C> for checking input that a user can get wrong. Either
          way, the message should print the actual values. Checks of shapes cost nothing next to the arithmetic; leave them on.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "broadcast",
      rung: "check",
      prompt: <p>What is the shape of <C>a + b</C> when a has shape (3, 1) and b has shape (4,)?</p>,
      answer: { kind: "choice", options: ["(3, 4)", "(3, 1)", "(4, 3)", "It raises ValueError"], correct: [0] },
    },
    {
      key: "size",
      rung: "apply",
      prompt: <p>Arrays of shapes (8, 1, 5) and (7, 1) are added. How many numbers does the result hold?</p>,
      answer: { kind: "numeric", value: 280, tolerance: 0 },
    },
    {
      key: "catch",
      rung: "apply",
      prompt: (
        <p>
          pred has shape (100, 1), y has shape (100,), and <C>loss = ((pred - y) ** 2).mean()</C>. Which of these checks fail,
          and so catch the bug?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "assert np.isfinite(loss)",
          "assert pred.shape == y.shape",
          "assert loss >= 0",
          "assert (pred - y).shape == y.shape",
        ],
        correct: [1, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.ones((4, 3))
w = np.ones((3,))
b = np.ones((4, 1))
print((x * w).shape, (x + b).shape, (x @ w).shape, (b - w).shape)`}</Code>
          <p>Four operations on three arrays. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 3) (4, 3) (4,) (4, 3)",
          "(4, 3) (4, 3) (4, 1) (4, 1)",
          "(4, 3) (4, 1) (4,) (4, 3)",
          "(3,) (4, 3) (4,) (4, 3)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def check(probs):
    errors = []
    for i, row in enumerate(probs):
        if any(p < 0 for p in row):
            errors.append((i, 'negative'))
        elif abs(sum(row) - 1) > 1e-9:
            errors.append((i, 'sum'))
    return errors

print(check([[0.5, 0.5], [0.7, 0.4], [-0.1, 1.1], [1.0, 0.0]]))`}</Code>
          <p>An invariant check on the rows of a probability matrix. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1, 'sum'), (2, 'negative')]",
          "[(1, 'sum'), (2, 'negative'), (2, 'sum')]",
          "[(2, 'negative')]",
          "[(1, 'sum'), (2, 'sum')]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>broadcast_shape(a, b)</C>, which takes two shapes as tuples and returns the broadcast shape as a tuple, or
          raises <C>ValueError</C> if they are incompatible. Do not call NumPy; the checks compare you with{" "}
          <C>np.broadcast_shapes</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def broadcast_shape(a, b):
    return a
`,
        solution: `def broadcast_shape(a, b):
    n = max(len(a), len(b))
    a = (1,) * (n - len(a)) + tuple(a)
    b = (1,) * (n - len(b)) + tuple(b)
    out = []
    for x, y in zip(a, b):
        if x != y and x != 1 and y != 1:
            raise ValueError(f'cannot broadcast {a} and {b}')
        out.append(y if x == 1 else x)
    return tuple(out)
`,
        tests: [
          { name: "examples", code: `for a, b, want in [((3, 1), (4,), (3, 4)), ((), (5,), (5,)), ((8, 1, 5), (7, 1), (8, 7, 5)), ((2, 3), (2, 3), (2, 3)), ((1,), (1, 1, 1), (1, 1, 1)), ((0,), (1,), (0,))]:
    got = broadcast_shape(a, b)
    assert got == want, f'broadcast_shape({a}, {b}) should be {want}, got {got}'
for a, b in [((3,), (4,)), ((2, 3), (3, 2)), ((0,), (2,))]:
    try:
        broadcast_shape(a, b)
    except ValueError:
        pass
    else:
        assert False, f'{a} and {b} should raise ValueError'` },
          { name: "random", code: `import random
import numpy as np
rng = random.Random(4)
for _ in range(500):
    a = tuple(rng.choice([1, 1, 2, 3]) for _ in range(rng.randint(0, 4)))
    b = tuple(rng.choice([1, 1, 2, 3]) for _ in range(rng.randint(0, 4)))
    try:
        want = np.broadcast_shapes(a, b)
    except ValueError:
        want = None
    try:
        got = broadcast_shape(a, b)
    except ValueError:
        got = None
    assert got == want, f'{a} and {b}: expected {want}, got {got}'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>check_shapes(shapes, specs)</C>. Both arguments are dicts keyed by array name: <C>shapes[name]</C> is a
            tuple and <C>specs[name]</C> is a string of axis names such as <C>{"'b t d'"}</C>. An axis written as digits must
            have exactly that size; an axis written as a name must have the same size everywhere it appears. Go through{" "}
            <C>specs</C> in order. On the first problem raise <C>AssertionError</C> with a message containing the array name;
            otherwise return a dict from axis name to size.
          </p>
          <Code>{`check_shapes({'x': (2, 5, 8), 'w': (8, 3)}, {'x': 'b t d', 'w': 'd k'})
# {'b': 2, 't': 5, 'd': 8, 'k': 3}`}</Code>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def check_shapes(shapes, specs):
    return {}
`,
        solution: `def check_shapes(shapes, specs):
    sizes = {}
    for name, spec in specs.items():
        dims, shape = spec.split(), shapes[name]
        if len(dims) != len(shape):
            raise AssertionError(f'{name}: expected {spec!r}, got shape {shape}')
        for d, s in zip(dims, shape):
            if d.isdigit():
                if s != int(d):
                    raise AssertionError(f'{name}: axis {d} should have size {d}, got {s}')
            elif sizes.setdefault(d, s) != s:
                raise AssertionError(f'{name}: axis {d} is {s}, earlier it was {sizes[d]}')
    return sizes
`,
        tests: [
          { name: "consistent", code: `import numpy as np
got = check_shapes({'x': (2, 5, 8), 'w': (8, 3)}, {'x': 'b t d', 'w': 'd k'})
assert got == {'b': 2, 't': 5, 'd': 8, 'k': 3}, got
q = np.zeros((4, 7, 16))
assert check_shapes({'q': q.shape, 'k': q.shape, 'm': (7, 7)}, {'q': 'b t d', 'k': 'b t d', 'm': 't t'}) == {'b': 4, 't': 7, 'd': 16}
assert check_shapes({'rgb': (32, 32, 3)}, {'rgb': 'h w 3'}) == {'h': 32, 'w': 32}` },
          { name: "mismatches", code: `for shapes, specs, name in [
    ({'x': (2, 5, 8), 'w': (9, 3)}, {'x': 'b t d', 'w': 'd k'}, 'w'),
    ({'x': (2, 5), 'w': (5, 3)}, {'x': 'b t d', 'w': 'd k'}, 'x'),
    ({'img': (32, 32, 4)}, {'img': 'h w 3'}, 'img'),
    ({'m': (7, 6)}, {'m': 't t'}, 'm'),
    ({'a': (3,), 'pred': (3, 1), 'y': (3,)}, {'a': 'n', 'pred': 'n', 'y': 'n'}, 'pred'),
]:
    try:
        check_shapes(shapes, specs)
    except AssertionError as e:
        assert name in str(e), f'The message should name {name!r}; got {str(e)!r}.'
    else:
        assert False, f'{shapes} against {specs} should fail.'` },
        ],
      },
    },
    {
      key: "assoc",
      rung: "prove",
      prompt: (
        <p>
          Argue that broadcasting is associative: for shapes a, b and c, broadcasting a with b and then the result with c gives
          the same shape as broadcasting a with the result of b and c, and one way raises an error exactly when the other does.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Pads all three shapes with 1s on the left to a common length, noting that padding first does not change either grouping.",
          "Observes that each position is handled independently of the others.",
          "Shows that at one position, both groupings succeed exactly when all sizes other than 1 among the three are equal, and then give that size (or 1 if all are 1), so the results agree.",
        ],
      },
    },
    {
      key: "silent",
      rung: "stretch",
      prompt: (
        <p>
          With n = 3, let pred have shape (3, 1) with <C>pred[i, 0] = i</C>, and y have shape (3,) with <C>y[i] = i</C>, so the
          predictions are perfect. What does <C>((pred - y) ** 2).mean()</C> return? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.333, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why a shape mismatch in NumPy usually produces a wrong number rather than an error, and how a one-line assertion turns it into an error at the line where it happens.",

  glimpse: (
    <p>
      Assertions tell you where a program first goes wrong. When one fires, or when a result is wrong and no assertion fires,
      you have to find out why. Next, debugging as science: hypotheses, experiments, and the discipline of changing one thing
      at a time.
    </p>
  ),
};
