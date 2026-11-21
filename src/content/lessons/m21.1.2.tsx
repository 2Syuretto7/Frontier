import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OrbitStabiliserViz } from "@/components/viz/OrbitStabiliserViz";
import type { LessonContent } from "@/lib/types";

const IMAGES = `import numpy as np

def d4(img):
    return [np.rot90(f, k) for f in (img, img[:, ::-1]) for k in range(4)]   # the eight images r^k s^f (img)

def orbit(img):
    return {tuple(a.flatten().tolist()) for a in d4(img)}            # distinct images, as hashable tuples

def stabiliser_size(img):
    return sum(np.array_equal(a, img) for a in d4(img))`;

const COUNT = `import itertools

def fixed_points(g, X, act):
    return sum(act(g, x) == x for x in X)

def burnside(G, X, act):
    return sum(fixed_points(g, X, act) for g in G) // len(G)        # exact, by Burnside's lemma

def orbits(G, X, act):
    seen, out = set(), []
    for x in X:
        if x not in seen:
            O = {act(g, x) for g in G}
            seen |= O
            out.append(O)
    return out`;

export const lesson: LessonContent = {
  id: "m21.1.2",
  minutes: 50,
  links: {
    requires: ["m21.1.1", "m1.6.2"],
    revisits: ["m1.7.2", "l4.5.1"],
    foreshadows: ["m21.1.3"],
  },

  puzzle: (
    <>
      <p>
        Augmenting a dataset of small binary images with the eight symmetries of the square should multiply it by eight, yet some
        images produce fewer than eight distinct copies. If two images that differ only by a rotation or reflection count as the
        same, how many genuinely different 3 × 3 binary images are there? Listing all 512 and comparing them pair by pair works,
        but there is a formula that counts the classes without listing them.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A group acts on a set when each group element moves the points of the set around, consistently with the group&apos;s
        multiplication. The orbit of a point is everywhere the group can move it; its stabiliser is the set of group elements that
        leave it alone. A point with more symmetry has a larger stabiliser and a smaller orbit, and the two trade off exactly: their
        sizes multiply to the size of the group.
      </p>
      <OrbitStabiliserViz />
    </>
  ),

  theory: (
    <>
      <Definition title="group action">
        <p>
          An action of a group G on a set X assigns to each g and x a point <M>{"g \\cdot x"}</M> in X so that{" "}
          <M>{"e \\cdot x = x"}</M> and <M>{"g \\cdot (h \\cdot x) = (gh) \\cdot x"}</M>. Each map{" "}
          <M>{"x \\mapsto g \\cdot x"}</M> is then a bijection (m1.7.2), with inverse given by <M>{"g^{-1}"}</M>. The orbit of x
          is <M>{"G \\cdot x = \\{g \\cdot x : g \\in G\\}"}</M> and its stabiliser is{" "}
          <M>{"G_x = \\{g : g \\cdot x = x\\}"}</M>, a subgroup. <M>{"D_4"}</M> acts on square images (<C>d4</C>, <C>orbit</C>,{" "}
          <C>stabiliser_size</C>), <M>{"S_n"}</M> on the rows of a feature matrix and on the vertices of a graph (l4.5.1), and{" "}
          <M>{"\\mathbb{Z}_n"}</M> on sequences by cyclic shift.
        </p>
        <Code>{IMAGES}</Code>
      </Definition>

      <Theorem title="orbits partition the set">
        <p>
          The relation <M>{"x \\sim y"}</M> if <M>{"y = g \\cdot x"}</M> for some g is an equivalence relation, and its classes are
          the orbits.
        </p>
      </Theorem>
      <Proof>
        <p>
          Reflexive: <M>{"x = e \\cdot x"}</M>. Symmetric: if <M>{"y = g \\cdot x"}</M> then{" "}
          <M>{"g^{-1} \\cdot y = (g^{-1}g) \\cdot x = x"}</M>. Transitive: if <M>{"y = g \\cdot x"}</M> and{" "}
          <M>{"z = h \\cdot y"}</M> then <M>{"z = (hg) \\cdot x"}</M>. Equivalence classes partition X (m1.6.2), and the class of x
          is its orbit. Each of the three group axioms was used once.
        </p>
      </Proof>

      <Theorem title="orbit-stabiliser">
        <p>For a finite group, <M>{"|G \\cdot x| \\cdot |G_x| = |G|"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"g \\cdot x = h \\cdot x"}</M> exactly when <M>{"h^{-1}g \\cdot x = x"}</M>, that is, when{" "}
          <M>{"h^{-1}g \\in G_x"}</M>, which says g and h lie in the same left coset of <M>{"G_x"}</M>. So the map{" "}
          <M>{"gG_x \\mapsto g \\cdot x"}</M> is a well-defined bijection from the cosets of <M>{"G_x"}</M> onto the orbit. By the
          proof of Lagrange&apos;s theorem (m21.1.1) there are <M>{"|G| / |G_x|"}</M> cosets.
        </p>
      </Proof>

      <Theorem title="Burnside's lemma">
        <p>
          Let <M>{"\\mathrm{Fix}(g) = \\{x : g \\cdot x = x\\}"}</M>. For a finite group acting on a finite set, the number of orbits
          is
        </p>
        <MD>{"\\frac{1}{|G|} \\sum_{g \\in G} |\\mathrm{Fix}(g)| ."}</MD>
      </Theorem>
      <Proof>
        <p>
          Count the pairs (g, x) with <M>{"g \\cdot x = x"}</M> in two ways. By g the count is{" "}
          <M>{"\\sum_g |\\mathrm{Fix}(g)|"}</M>; by x it is <M>{"\\sum_x |G_x| = \\sum_x |G| / |G \\cdot x|"}</M> by
          orbit-stabiliser. Within one orbit O, each of its |O| points contributes <M>{"|G|/|O|"}</M>, a total of |G| per orbit. So
          the count is |G| times the number of orbits (<C>fixed_points</C>, <C>burnside</C>, and <C>orbits</C> for the direct
          enumeration).
        </p>
        <Code>{COUNT}</Code>
      </Proof>

      <Example title="binary necklaces">
        <p>
          Cyclic shifts of binary strings of length 4 form an action of <M>{"\\mathbb{Z}_4"}</M> on 16 strings. The identity fixes
          all 16; shifts by 1 and 3 fix only 0000 and 1111; the shift by 2 fixes the 4 strings with period 2. Burnside gives{" "}
          <M>{"(16 + 2 + 4 + 2)/4 = 6"}</M> classes: 0000, 0001, 0011, 0101, 0111 and 1111.
        </p>
      </Example>

      <Definition title="the action on functions">
        <p>
          If G acts on X, it acts on functions <M>{"f : X \\to \\mathbb{R}"}</M>, such as images, signals or node features, by{" "}
          <M>{"(g \\cdot f)(x) = f(g^{-1} \\cdot x)"}</M>. The inverse is needed: then{" "}
          <M>{"(g \\cdot (h \\cdot f))(x) = (h \\cdot f)(g^{-1} \\cdot x) = f(h^{-1}g^{-1} \\cdot x) = f((gh)^{-1} \\cdot x) = ((gh) \\cdot f)(x)"}</M>
          , whereas without it the order of g and h would be reversed. Moving an image to the right means the new pixel at x shows
          what the old image had at <M>{"g^{-1} \\cdot x"}</M>, to its left.
        </p>
      </Definition>

      <Remark title="orbits in learning">
        <p>
          A function that is constant on orbits is called invariant, and the orbits are what an invariant model can distinguish at
          best. One way to build such a model is canonicalisation: map every input to a fixed representative of its orbit, such as
          the lexicographically smallest image in it, before anything else. Its weakness is that the representative can jump
          abruptly as the input changes slightly, which is one reason the next lessons build symmetry into the layers instead.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cube",
      rung: "check",
      prompt: (
        <p>
          The rotation group of a cube has 24 elements and can carry any vertex to any other. How many rotations fix a given vertex?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "neck",
      rung: "check",
      prompt: (
        <p>How many binary strings of length 6 are there up to cyclic shift, that is, how many orbits does <M>{"\\mathbb{Z}_6"}</M> have?</p>
      ),
      answer: { kind: "numeric", value: 14, tolerance: 0 },
    },
    {
      key: "canon",
      rung: "apply",
      prompt: (
        <p>
          Why does replacing each input image by the smallest image in its <M>{"D_4"}</M> orbit, in a fixed ordering, make any
          model applied afterwards invariant to the eight symmetries?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "An image and any transformed copy have the same orbit, hence the same representative, so the model sees identical inputs",
          "Because the smallest image is always symmetric",
          "Because the model is trained on all eight copies",
          "Because the stabiliser of the representative is the whole group",
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

def d4(img):
    return [np.rot90(f, k) for f in (img, img[:, ::-1]) for k in range(4)]   # the eight images r^k s^f (img)

def orbit(img):
    return {tuple(a.flatten().tolist()) for a in d4(img)}            # distinct images, as hashable tuples

def stabiliser_size(img):
    return sum(np.array_equal(a, img) for a in d4(img))

img = np.array([[1, 0], [0, 0]]); band = np.array([[1, 1], [0, 0]])
print(len(orbit(img)), stabiliser_size(img), len(orbit(np.eye(2, dtype=int))), stabiliser_size(band))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4 2 2 2", "4 1 2 2", "4 2 1 2", "8 2 2 2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools

def fixed_points(g, X, act):
    return sum(act(g, x) == x for x in X)

def burnside(G, X, act):
    return sum(fixed_points(g, X, act) for g in G) // len(G)        # exact, by Burnside's lemma

def orbits(G, X, act):
    seen, out = set(), []
    for x in X:
        if x not in seen:
            O = {act(g, x) for g in G}
            seen |= O
            out.append(O)
    return out

rot = lambda k, x: x[k:] + x[:k]; X = list(itertools.product((0, 1), repeat=4))
print(fixed_points(2, X, rot), burnside(range(4), X, rot), len(orbits(range(4), X, rot)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4 6 6", "2 6 6", "4 5 6", "4 6 4"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>d4(img)</C>, the list of the eight images of a square array under quarter turns and mirroring,{" "}
          <C>orbit(img)</C>, the set of distinct images as tuples of the flattened entries, and <C>stabiliser_size(img)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def d4(img):
    return [np.rot90(img, k) for k in range(4)]

def orbit(img):
    return [tuple(a.flatten().tolist()) for a in d4(img)]

def stabiliser_size(img):
    return 1
`,
        solution: IMAGES,
        tests: [
          { name: "orb", code: `a = np.array([[1, 1], [0, 1]])\nassert len(d4(a)) == 8 and len(orbit(a)) == 4 and len(orbit(np.array([[1, 0], [1, 0]]))) == 4` },
          { name: "stab", code: `assert stabiliser_size(np.array([[1, 0], [0, 1]])) == 4 and stabiliser_size(np.ones((3, 3))) == 8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a finite group G acting on a finite set X through <C>act(g, x)</C>, write <C>fixed_points(g, X, act)</C>,{" "}
          <C>burnside(G, X, act)</C>, the number of orbits by Burnside&apos;s lemma, and <C>orbits(G, X, act)</C>, the list of
          orbits as sets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def fixed_points(g, X, act):
    return len(X)

def burnside(G, X, act):
    return len(X) // len(G)

def orbits(G, X, act):
    return [{x} for x in X]
`,
        solution: COUNT,
        tests: [
          { name: "count", code: `rot = lambda k, x: x[k:] + x[:k]\nX = list(itertools.product((0, 1, 2), repeat=3))\nassert fixed_points(1, X, rot) == 3 and burnside(range(3), X, rot) == 11` },
          { name: "orbits", code: `O = orbits([0, 1], [0, 1, 2, 3], lambda g, x: x ^ g)\nassert sorted(sorted(o) for o in O) == [[0, 1], [2, 3]]` },
        ],
      },
    },
    {
      key: "grid",
      rung: "stretch",
      prompt: (
        <p>
          How many 3 × 3 binary images are there up to the eight symmetries of the square, that is, how many <M>{"D_4"}</M> orbits?
        </p>
      ),
      answer: { kind: "numeric", value: 102, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Invariant functions are constant on orbits. The next lesson makes this precise for models, together with the more useful
        notion of equivariance, where the output moves with the input, and shows how to turn any function into an invariant or
        equivariant one by averaging over the group.
      </p>
    </>
  ),
};
