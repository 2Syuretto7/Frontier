import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DihedralViz } from "@/components/viz/DihedralViz";
import type { LessonContent } from "@/lib/types";

const PERMS = `def compose(p, q):
    return tuple(p[q[i]] for i in range(len(q)))         # (p ∘ q)(i) = p(q(i)): apply q first

def inverse(p):
    inv = [0] * len(p)
    for i, j in enumerate(p):
        inv[j] = i                                      # p sends i to j, so the inverse sends j to i
    return tuple(inv)

def is_group(elements, op):
    S = set(elements)
    if any(op(a, b) not in S for a in S for b in S):
        return False                                    # closure
    if any(op(op(a, b), c) != op(a, op(b, c)) for a in S for b in S for c in S):
        return False                                    # associativity
    ids = [e for e in S if all(op(e, a) == a == op(a, e) for a in S)]
    return bool(ids) and all(any(op(a, b) == ids[0] for b in S) for a in S)   # identity and inverses`;

const SUB = `def generate(gens, op, e):
    G, frontier = {e}, [e]
    while frontier:
        new = {op(g, s) for g in frontier for s in gens}
        frontier = [x for x in new if x not in G]       # only products not seen before
        G |= set(frontier)
    return G

def order(g, op, e):
    k, x = 1, g
    while x != e:
        x, k = op(x, g), k + 1
    return k

def cosets(G, H, op):
    return {frozenset(op(g, h) for h in H) for g in G}  # the left cosets gH`;

export const lesson: LessonContent = {
  id: "m21.1.1",
  minutes: 50,
  links: {
    requires: ["m1.7.3", "m6.6.2"],
    revisits: ["m3.3.5", "l4.1.1"],
    foreshadows: ["m21.1.2"],
  },

  puzzle: (
    <>
      <p>
        A vision pipeline augments each training image by rotating it a quarter turn and by mirroring it. Apply two augmentations
        in a row, or ten, and you never get anything new: the result is always one of eight transformations. Shifting a sequence by
        one position, permuting the nodes of a graph and rotating a molecule share this property. What is the common structure,
        and what can be proved from nothing more than the facts that symmetries compose and can be undone?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A symmetry of an object is a transformation that leaves it looking the same. Doing one symmetry after another is again a
        symmetry, doing nothing is a symmetry, and every symmetry can be undone. A group is exactly a set with an operation having
        these properties, stated abstractly so that one theory covers rotations, shifts and permutations at once. The theory
        already has teeth: the size of a subgroup must divide the size of the group, and every finite group is secretly a group of
        permutations.
      </p>
      <DihedralViz />
    </>
  ),

  theory: (
    <>
      <Definition title="group">
        <p>
          A group is a set G with an operation <M>{"(g, h) \\mapsto gh"}</M> such that: (closure) gh is in G; (associativity){" "}
          <M>{"(gh)k = g(hk)"}</M>; (identity) there is e with <M>{"eg = ge = g"}</M> for all g; (inverses) every g has{" "}
          <M>{"g^{-1}"}</M> with <M>{"gg^{-1} = g^{-1}g = e"}</M>. A subgroup is a subset that is a group under the same operation.
          The order |G| is the number of elements, and the order of an element g is the least k ≥ 1 with{" "}
          <M>{"g^k = e"}</M>. <C>is_group</C> checks the axioms by brute force.
        </p>
      </Definition>

      <Example title="the groups of deep learning">
        <p>
          The integers modulo n under addition, <M>{"\\mathbb{Z}_n"}</M>, are the cyclic shifts of a periodic signal (l4.1.1). The
          symmetric group <M>{"S_n"}</M> of all permutations of n items, under composition (m1.7.3), acts on the nodes of a graph or
          the tokens of a set; a permutation p is stored as the tuple of images and{" "}
          <M>{"(p \\circ q)(i) = p(q(i))"}</M> (<C>compose</C>, <C>inverse</C>). The orthogonal group O(n) of matrices with{" "}
          <M>{"Q^\\top Q = I"}</M> (m6.6.2) contains the rotation group SO(n) of those with determinant 1. The dihedral group{" "}
          <M>{"D_4"}</M> of the viz has the eight elements <M>{"r^k"}</M> and <M>{"r^k s"}</M>, with relations{" "}
          <M>{"r^4 = s^2 = e"}</M> and <M>{"srs = r^{-1}"}</M>. It is not commutative: rs ≠ sr.
        </p>
        <Code>{PERMS}</Code>
      </Example>

      <Theorem title="identities and inverses are unique">
        <p>
          A group has exactly one identity, each element has exactly one inverse, and{" "}
          <M>{"(gh)^{-1} = h^{-1}g^{-1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If e and e&apos; are identities then <M>{"e = ee' = e'"}</M>. If h and k are inverses of g then{" "}
          <M>{"h = he = h(gk) = (hg)k = ek = k"}</M>. Finally{" "}
          <M>{"(gh)(h^{-1}g^{-1}) = g(hh^{-1})g^{-1} = gg^{-1} = e"}</M>, and similarly on the other side, so by uniqueness{" "}
          <M>{"h^{-1}g^{-1}"}</M> is the inverse of gh. Undoing two transformations reverses their order, as with transposes of
          products (m3.3.5).
        </p>
      </Proof>

      <Theorem title="Lagrange">
        <p>
          If H is a subgroup of a finite group G, then |H| divides |G|. In particular the order of every element divides |G|.
        </p>
      </Theorem>
      <Proof>
        <p>
          The left cosets <M>{"gH = \\{gh : h \\in H\\}"}</M> (<C>cosets</C>) each have |H| elements, because{" "}
          <M>{"h \\mapsto gh"}</M> is injective: gh = gh&apos; gives h = h&apos; after multiplying by <M>{"g^{-1}"}</M>. They cover G,
          since g lies in gH. Two cosets are equal or disjoint: if x is in both gH and g&apos;H then{" "}
          <M>{"x = gh_1 = g'h_2"}</M>, so <M>{"g' = gh_1h_2^{-1}"}</M> and <M>{"g'H \\subseteq gH"}</M>, and symmetrically. So G is
          partitioned (m1.6.2) into blocks of size |H|. For an element g of order k, the powers{" "}
          <M>{"e, g, \\dots, g^{k-1}"}</M> are distinct and form a subgroup of order k (<C>generate</C>, <C>order</C>).
        </p>
        <Code>{SUB}</Code>
      </Proof>

      <Definition title="homomorphisms">
        <p>
          A map φ between groups is a homomorphism if <M>{"\\varphi(gh) = \\varphi(g)\\varphi(h)"}</M>. Then φ sends identity to
          identity and inverses to inverses, and its kernel <M>{"\\{g : \\varphi(g) = e\\}"}</M> is a subgroup. The determinant
          from O(n) to <M>{"\\{\\pm 1\\}"}</M> under multiplication is one, with kernel SO(n). A bijective homomorphism is an
          isomorphism: the two groups are the same up to renaming.
        </p>
      </Definition>

      <Theorem title="Cayley">
        <p>Every group G is isomorphic to a group of permutations of the set G itself.</p>
      </Theorem>
      <Proof>
        <p>
          Send g to the map <M>{"L_g(x) = gx"}</M>. It is a bijection of G with inverse <M>{"L_{g^{-1}}"}</M>, and{" "}
          <M>{"L_{gh}(x) = ghx = L_g(L_h(x))"}</M>, so <M>{"g \\mapsto L_g"}</M> is a homomorphism into the permutations of G. It is
          injective because <M>{"L_g(e) = g"}</M> recovers g. Writing each <M>{"L_g"}</M> as a permutation matrix turns any finite
          group into a group of matrices, the first instance of the representations of Chapter 2.
        </p>
      </Proof>

      <Remark title="why this abstraction pays">
        <p>
          A model should often give the same answer for an input and its transformed copy, or an answer that transforms in the
          matching way. Stating this for one transformation at a time is not enough, since the requirement must hold for all their
          compositions too; the group generated by the transformations is the right object. Because it is closed, constraints
          checked on a few generators, such as r and s for <M>{"D_4"}</M>, hold for the whole group, a fact the next lessons use
          repeatedly.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "inv",
      rung: "check",
      prompt: <p>How many elements of the symmetric group <M>{"S_4"}</M> have order exactly 2?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0 },
    },
    {
      key: "ord",
      rung: "check",
      prompt: <p>In <M>{"\\mathbb{Z}_{42}"}</M> under addition, what is the order of the element 15?</p>,
      answer: { kind: "numeric", value: 14, tolerance: 0 },
    },
    {
      key: "aug",
      rung: "apply",
      prompt: (
        <p>
          A pipeline augments images with quarter-turn rotations and horizontal mirroring. Why does applying augmentations
          repeatedly never produce more than eight distinct transformations?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The transformations generate the dihedral group of the square, which is closed under composition and has eight elements",
          "Because images are square",
          "Because mirroring twice is the identity, and rotations never combine with mirroring",
          "Because the pipeline stores at most eight copies of each image",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def compose(p, q):
    return tuple(p[q[i]] for i in range(len(q)))         # (p ∘ q)(i) = p(q(i)): apply q first

def inverse(p):
    inv = [0] * len(p)
    for i, j in enumerate(p):
        inv[j] = i                                      # p sends i to j, so the inverse sends j to i
    return tuple(inv)

def is_group(elements, op):
    S = set(elements)
    if any(op(a, b) not in S for a in S for b in S):
        return False                                    # closure
    if any(op(op(a, b), c) != op(a, op(b, c)) for a in S for b in S for c in S):
        return False                                    # associativity
    ids = [e for e in S if all(op(e, a) == a == op(a, e) for a in S)]
    return bool(ids) and all(any(op(a, b) == ids[0] for b in S) for a in S)   # identity and inverses

r = (1, 2, 3, 0); s = (0, 3, 2, 1); rots = [(0, 1, 2, 3), r, compose(r, r), compose(r, compose(r, r))]
print(compose(r, s), compose(s, r), inverse(r), is_group(rots, compose))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1, 0, 3, 2) (3, 2, 1, 0) (3, 0, 1, 2) True",
          "(3, 2, 1, 0) (1, 0, 3, 2) (3, 0, 1, 2) True",
          "(1, 0, 3, 2) (3, 2, 1, 0) (1, 2, 3, 0) True",
          "(1, 0, 3, 2) (3, 2, 1, 0) (3, 0, 1, 2) False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def generate(gens, op, e):
    G, frontier = {e}, [e]
    while frontier:
        new = {op(g, s) for g in frontier for s in gens}
        frontier = [x for x in new if x not in G]       # only products not seen before
        G |= set(frontier)
    return G

def order(g, op, e):
    k, x = 1, g
    while x != e:
        x, k = op(x, g), k + 1
    return k

def cosets(G, H, op):
    return {frozenset(op(g, h) for h in H) for g in G}  # the left cosets gH

add = lambda a, b: (a + b) % 12; H = generate([4], add, 0)
print(sorted(H), order(9, add, 0), len(cosets(range(12), H, add)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 4, 8] 4 4", "[0, 4, 8] 3 4", "[4, 8] 4 4", "[0, 4, 8] 4 3"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>compose(p, q)</C> for permutations stored as tuples, applying q first, <C>inverse(p)</C>, and{" "}
          <C>is_group(elements, op)</C>, which checks closure, associativity, an identity and inverses.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def compose(p, q):
    return tuple(q[p[i]] for i in range(len(p)))

def inverse(p):
    return tuple(p)

def is_group(elements, op):
    S = set(elements)
    return all(op(a, b) in S for a in S for b in S)
`,
        solution: PERMS,
        tests: [
          { name: "perm", code: `assert compose((1, 2, 0), (0, 2, 1)) == (1, 0, 2) and inverse((1, 2, 0)) == (2, 0, 1)` },
          { name: "axioms", code: `assert is_group(range(5), lambda a, b: (a + b) % 5)\nassert not is_group(range(5), lambda a, b: (a * b) % 5) and not is_group([0, 1], lambda a, b: a)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>generate(gens, op, e)</C>, the subgroup generated by a list of elements of a finite group,{" "}
          <C>order(g, op, e)</C>, and <C>cosets(G, H, op)</C>, the set of left cosets as frozensets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def generate(gens, op, e):
    return set(gens) | {e}

def order(g, op, e):
    return 1

def cosets(G, H, op):
    return {frozenset(H)}
`,
        solution: SUB,
        tests: [
          { name: "gen", code: `add = lambda a, b: (a + b) % 30\nassert generate([6, 10], add, 0) == set(range(0, 30, 2)) and order(6, add, 0) == 5` },
          { name: "coset", code: `C = cosets(range(6), {0, 3}, lambda a, b: (a + b) % 6)\nassert len(C) == 3 and frozenset({1, 4}) in C` },
        ],
      },
    },
    {
      key: "hom",
      rung: "stretch",
      prompt: (
        <p>
          How many homomorphisms are there from <M>{"\\mathbb{Z}_{12}"}</M> to <M>{"\\mathbb{Z}_{18}"}</M>, both under addition?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A group is most useful through what it does to things: images, signals, graphs, point clouds. The next lesson studies group
        actions, the orbit of a point under all symmetries, and the counting formula that links orbits to the symmetries that fix a
        point.
      </p>
    </>
  ),
};
