import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GroupConvViz } from "@/components/viz/GroupConvViz";
import type { LessonContent } from "@/lib/types";

const LIFT = `import numpy as np

def rot(f):
    n = len(f)
    return f.T[(-np.arange(n)) % n]                          # (R f)(x) = f(R^{-1} x): a quarter turn about 0 on the torus

def lift(f, psi):
    out = []
    for r in range(4):
        out.append(sum(w * np.roll(f, (-a, -b), axis=(0, 1)) for (a, b), w in np.ndenumerate(psi)))   # correlate with R^r psi
        psi = rot(psi)
    return np.array(out)                                     # shape (4, n, n): one map per orientation

def rotation_pool(F):
    return F.max(axis=0)                                     # invariant to cycling the orientation channels`;

const GCONV = `def gconv(F, psi, G, mul, inv):
    return {h: sum(F[g] * psi[mul(inv(h), g)] for g in G) for h in G}   # (F * psi)(h) = sum_g F(g) psi(h^{-1} g)

def translate(F, u, G, mul, inv):
    return {g: F[mul(inv(u), g)] for g in G}                            # (L_u F)(g) = F(u^{-1} g)

def pool(F):
    return max(F.values())`;

export const lesson: LessonContent = {
  id: "m21.3.2",
  minutes: 55,
  links: {
    requires: ["m21.3.1", "m21.1.3"],
    revisits: ["m21.2.3", "l4.1.4"],
    foreshadows: ["m21.3.3"],
  },

  puzzle: (
    <>
      <p>
        In histology slides, satellite images and microscope images there is no preferred up: a cell rotated by 90° is the same
        cell. A standard CNN must learn every rotated version of every feature separately, and its first layers do so
        visibly, with many filters that are rotated copies of each other (l4.1.4). Can rotation be built into the layers the way
        translation is, so that a pattern learned in one orientation is recognised in all of them, without giving up the
        weight sharing and locality that make convolution work?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Convolve the image with a filter and with its three quarter-turn rotations. The result has an extra axis, the
        orientation, and it is a function on the group of translations and rotations rather than on the plane. Rotating the input
        rotates each map and also cycles the orientation axis, which is a translation of the group variable. Further layers then
        convolve over the group itself, using the same formula as ordinary convolution with group multiplication in place of
        addition, and stay equivariant by the theorem of the previous lesson.
      </p>
      <GroupConvViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the group p4 and its action">
        <p>
          The group p4 consists of the maps <M>{"x \\mapsto R^r x + t"}</M> of the grid <M>{"\\mathbb{Z}^2"}</M>, with R a quarter turn
          and t a translation; write such an element (t, r). It acts on images by{" "}
          <M>{"(L_{(t, r)}f)(x) = f(R^{-r}(x - t))"}</M>. Every element is a translation after a rotation, but the two do not
          commute: rotating then translating differs from translating then rotating. Here R acts on a torus by{" "}
          <M>{"(i, j) \\mapsto (-j, i)"}</M> modulo n (<C>rot</C>).
        </p>
      </Definition>

      <Definition title="lifting and group convolution">
        <p>
          The lifting correlation of an image f with a filter ψ is the function on p4
        </p>
        <MD>{"(f \\star \\psi)(t, r) = \\sum_x f(x)\\, \\psi\\big(R^{-r}(x - t)\\big) ,"}</MD>
        <p>
          the correlation of f with the rotated filter <M>{"R^r\\psi"}</M>, stored as four orientation channels (<C>lift</C>). For
          functions F and ψ on a group G, the group correlation is{" "}
          <M>{"(F \\star \\psi)(h) = \\sum_g F(g)\\,\\psi(h^{-1}g)"}</M> (<C>gconv</C>); on p4 it mixes both the spatial and the
          orientation axes.
        </p>
        <Code>{LIFT}</Code>
      </Definition>

      <Theorem title="lifting is equivariant">
        <p>
          For every element u = (s, q) of p4, <M>{"(L_uf) \\star \\psi = L_u(f \\star \\psi)"}</M>, where on the right p4 acts on
          functions on p4 by <M>{"(L_uF)(h) = F(u^{-1}h)"}</M>. In particular, rotating the input by R rotates each orientation
          channel and moves channel r − 1 to channel r.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write h = (t, r), so that <M>{"\\psi(R^{-r}(x - t)) = \\psi(h^{-1}x)"}</M> with h acting on points. Then{" "}
          <M>{"((L_uf) \\star \\psi)(h) = \\sum_x f(u^{-1}x)\\psi(h^{-1}x) = \\sum_y f(y)\\psi(h^{-1}uy) = (f \\star \\psi)(u^{-1}h)"}</M>
          , substituting x = uy, which runs over the grid as y does. For u a pure rotation by R,{" "}
          <M>{"u^{-1}h = (R^{-1}t, r - 1)"}</M>, so the new channel r at t is the old channel r − 1 at <M>{"R^{-1}t"}</M>.
        </p>
      </Proof>

      <Theorem title="group correlation is equivariant">
        <p>
          On any group, <M>{"(L_uF) \\star \\psi = L_u(F \\star \\psi)"}</M> (<C>translate</C>), and every linear map on functions
          on G commuting with all <M>{"L_u"}</M> is a group correlation.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum_g F(u^{-1}g)\\psi(h^{-1}g) = \\sum_w F(w)\\psi(h^{-1}uw) = (F \\star \\psi)(u^{-1}h)"}</M> with g = uw. The
          converse is the theorem of m21.3.1, which held for any finite group; correlation and convolution differ by replacing ψ
          with <M>{"g \\mapsto \\psi(g^{-1})"}</M>.
        </p>
        <Code>{GCONV}</Code>
      </Proof>

      <Example title="invariance and cost">
        <p>
          Pooling over the orientation axis, by a maximum or a sum (<C>rotation_pool</C>, <C>pool</C>), gives maps that rotate with
          the input but are otherwise unchanged; pooling over everything gives full p4 invariance. A p4 layer between features
          with c_in and c_out channels and 3 × 3 spatial filters has <M>{"4 \\cdot 9 \\cdot c_{\\mathrm{in}} c_{\\mathrm{out}}"}</M>{" "}
          weights and produces 4 orientation channels per output channel. Cohen and Welling found p4 networks more accurate than
          comparable CNNs on rotated MNIST and CIFAR-10, with the gain coming from sharing each learned feature across orientations.
        </p>
      </Example>

      <Remark title="beyond ninety degrees">
        <p>
          The grid is symmetric only under quarter turns and reflections. Finer rotations need interpolation, which breaks exact
          equivariance, or a change of representation: steerable CNNs store, at each point, coefficients on the irreducible
          representations of the rotation group (m21.2.3), and constrain filters so that each maps one irreducible type to another.
          For the full rotation group SO(2) this is the harmonic basis <M>{"e^{im\\theta}"}</M>; for SO(3), the spherical harmonics
          used by the networks of Chapter 5.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: (
        <p>
          A p4 group-convolution layer maps 8 channels to 16 channels, each a function on p4, with 3 × 3 spatial filters. How many
          weights does it have, not counting biases?
        </p>
      ),
      answer: { kind: "numeric", value: 4608, tolerance: 0 },
    },
    {
      key: "p4m",
      rung: "check",
      prompt: (
        <p>
          The group p4m adds reflections to p4. How many transformed copies of each filter does a lifting layer to p4m compute?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "cycle",
      rung: "apply",
      prompt: <p>Why does rotating the input image move the orientation channels of a lifting layer, instead of leaving them in place?</p>,
      answer: {
        kind: "choice",
        options: [
          "A rotated feature now matches the filter rotated one step further, so its response appears in the next orientation channel",
          "Because the filters themselves are rotated during training",
          "Because the lifting layer is invariant to rotations",
          "Because the channels are sorted by response strength",
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

def rot(f):
    n = len(f)
    return f.T[(-np.arange(n)) % n]                          # (R f)(x) = f(R^{-1} x): a quarter turn about 0 on the torus

def lift(f, psi):
    out = []
    for r in range(4):
        out.append(sum(w * np.roll(f, (-a, -b), axis=(0, 1)) for (a, b), w in np.ndenumerate(psi)))   # correlate with R^r psi
        psi = rot(psi)
    return np.array(out)                                     # shape (4, n, n): one map per orientation

def rotation_pool(F):
    return F.max(axis=0)                                     # invariant to cycling the orientation channels

f = np.zeros((4, 4)); f[1, 0] = 1.0; psi = np.zeros((4, 4)); psi[0, 0], psi[1, 0] = 1.0, 2.0; F = lift(f, psi)
print(rot(f)[0, 1], F[:, 0, 0].tolist(), np.allclose(rotation_pool(lift(rot(f), psi)), rot(rotation_pool(F))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 [2.0, 0.0, 0.0, 0.0] True",
          "0.0 [2.0, 0.0, 0.0, 0.0] True",
          "1.0 [2.0, 2.0, 2.0, 2.0] True",
          "1.0 [2.0, 0.0, 0.0, 0.0] False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gconv(F, psi, G, mul, inv):
    return {h: sum(F[g] * psi[mul(inv(h), g)] for g in G) for h in G}   # (F * psi)(h) = sum_g F(g) psi(h^{-1} g)

def translate(F, u, G, mul, inv):
    return {g: F[mul(inv(u), g)] for g in G}                            # (L_u F)(g) = F(u^{-1} g)

def pool(F):
    return max(F.values())

add = lambda a, b: (a + b) % 4; neg = lambda a: (-a) % 4; F = {0: 1.0, 1: 0.0, 2: 0.0, 3: 0.0}; psi = {0: 1.0, 1: 2.0, 2: 0.0, 3: 0.0}
print(gconv(F, psi, range(4), add, neg), translate(F, 1, range(4), add, neg), pool(gconv(translate(F, 2, range(4), add, neg), psi, range(4), add, neg)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: 1.0, 1: 0.0, 2: 0.0, 3: 2.0} {0: 0.0, 1: 1.0, 2: 0.0, 3: 0.0} 2.0",
          "{0: 1.0, 1: 2.0, 2: 0.0, 3: 0.0} {0: 0.0, 1: 1.0, 2: 0.0, 3: 0.0} 2.0",
          "{0: 1.0, 1: 0.0, 2: 0.0, 3: 2.0} {0: 0.0, 1: 0.0, 2: 0.0, 3: 1.0} 2.0",
          "{0: 1.0, 1: 0.0, 2: 0.0, 3: 2.0} {0: 0.0, 1: 1.0, 2: 0.0, 3: 0.0} 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          On an n × n torus, write <C>rot(f)</C> with <M>{"(Rf)(x) = f(R^{-1}x)"}</M> for <M>{"R(i, j) = (-j, i)"}</M>,{" "}
          <C>lift(f, psi)</C> returning the four correlations with <M>{"R^r\\psi"}</M> as an array of shape (4, n, n), and{" "}
          <C>rotation_pool(F)</C>, the maximum over orientations.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rot(f):
    return f.T

def lift(f, psi):
    return np.array([f] * 4)

def rotation_pool(F):
    return F[0]
`,
        solution: LIFT,
        tests: [
          { name: "rot", code: `f = np.arange(9.0).reshape(3, 3)\nassert np.allclose(rot(rot(rot(rot(f)))), f) and not np.allclose(rot(rot(f)), f) and rot(f)[0, 1] == f[1, 0]` },
          { name: "lift", code: `r = np.random.default_rng(0); f, psi = r.normal(size=(5, 5)), r.normal(size=(5, 5)); F = lift(f, psi)\nassert F.shape == (4, 5, 5) and np.isclose(F[0, 0, 0], np.sum(f * psi))\nassert np.allclose(lift(rot(f), psi), np.array([rot(c) for c in np.roll(F, 1, axis=0)]))\nassert np.allclose(rotation_pool(lift(rot(f), psi)), rot(rotation_pool(F)))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Functions on a finite group are dictionaries. Write <C>gconv(F, psi, G, mul, inv)</C>, the group correlation,{" "}
          <C>translate(F, u, G, mul, inv)</C> and <C>pool(F)</C>, the maximum over the group.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gconv(F, psi, G, mul, inv):
    return {h: F[h] * psi[h] for h in G}

def translate(F, u, G, mul, inv):
    return dict(F)

def pool(F):
    return sum(F.values())
`,
        solution: GCONV,
        tests: [
          { name: "conv", code: `add = lambda a, b: (a + b) % 3; neg = lambda a: (-a) % 3\nF = {0: 1.0, 1: 2.0, 2: 0.0}; psi = {0: 0.0, 1: 1.0, 2: 0.0}\nassert gconv(F, psi, range(3), add, neg) == {0: 2.0, 1: 0.0, 2: 1.0}` },
          { name: "equi", code: `add = lambda a, b: (a + b) % 3; neg = lambda a: (-a) % 3\nF = {0: 1.0, 1: 2.0, 2: 0.0}; psi = {0: 0.5, 1: 1.0, 2: 0.0}\nT = translate(F, 1, range(3), add, neg)\nassert T == {0: 0.0, 1: 1.0, 2: 2.0} and pool({0: 1.0, 1: 3.0}) == 3.0\nassert gconv(T, psi, range(3), add, neg) == translate(gconv(F, psi, range(3), add, neg), 1, range(3), add, neg)` },
        ],
      },
    },
    {
      key: "invfilt",
      rung: "stretch",
      prompt: (
        <p>
          On the 5 × 5 torus, with quarter turns about the origin as in the code, how many free values does a full-size filter ψ
          have if it must satisfy <M>{"R\\psi = \\psi"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Grids have few symmetries; graphs have many. The next lesson turns to permutations of the nodes of a graph, where the
        group is huge and the only equivariant linear layers are of a very restricted form, which explains the design of message
        passing.
      </p>
    </>
  ),
};
