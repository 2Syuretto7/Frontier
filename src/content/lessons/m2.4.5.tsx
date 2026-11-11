import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ImplicitViz } from "@/components/viz/ImplicitViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.4.5",
  minutes: 90,
  links: {
    foreshadows: ["m5.6.2"],
  },

  puzzle: (
    <>
      <p>
        The circle <M>{"x^2 + y^2 = 25"}</M> passes through <M>{"(3, 4)"}</M>. What is the slope of its tangent there? You
        could solve for y, take the top half <M>{"y = \\sqrt{25 - x^2}"}</M>, and differentiate.
      </p>
      <p>
        Now try the curve <M>{"x^3 + y^3 = 6xy"}</M>, which passes through <M>{"(3, 3)"}</M>. Solving for y means solving a
        cubic, and the curve is not the graph of any single function. Does it still have a slope at <M>{"(3, 3)"}</M>, and
        can you find it without ever solving for y?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near most of its points, a curve looks like the graph of a function, even if the whole curve does not. So pretend
        that, near the point, y is some differentiable function of x, though you do not know its formula. The equation then
        holds for every x nearby, so both sides have the same derivative. Differentiate both sides, using the chain rule
        whenever y appears, and solve for <M>{"y'"}</M>.
      </p>
      <ImplicitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="implicit differentiation">
        <p>
          An equation in x and y defines y <strong>implicitly</strong> near a point if, near that point, the points of the
          curve form the graph of a function <M>{"y(x)"}</M>. To find <M>{"y'"}</M>: differentiate both sides of the equation
          with respect to x, treating y as a function of x, and solve the resulting equation for <M>{"y'"}</M>. By the chain
          rule, any expression in y picks up a factor of <M>{"y'"}</M>; for instance
        </p>
        <MD>{"\\frac{d}{dx}\\, y^2 = 2y\\, y', \\qquad \\frac{d}{dx}\\, \\sin y = \\cos y \\cdot y', \\qquad \\frac{d}{dx}\\, xy = y + x y'."}</MD>
      </Definition>

      <Example title="the circle">
        <p>Differentiating <M>{"x^2 + y^2 = 25"}</M> gives</p>
        <MD>{"2x + 2y\\, y' = 0, \\qquad \\text{so} \\qquad y' = -\\frac{x}{y} \\quad (y \\ne 0)."}</MD>
        <p>
          At <M>{"(3, 4)"}</M> the slope is <M>{"-3/4"}</M>. The explicit route agrees:{" "}
          <M>{"\\dfrac{d}{dx}\\sqrt{25 - x^2} = \\dfrac{-x}{\\sqrt{25 - x^2}}"}</M>, which is <M>{"-3/4"}</M> at{" "}
          <M>{"x = 3"}</M>. The implicit formula is better in one way: it serves the top and bottom halves of the circle at
          once, since y carries the sign.
        </p>
      </Example>

      <Example title="the folium of Descartes">
        <p>Differentiating <M>{"x^3 + y^3 = 6xy"}</M>, with the product rule on the right:</p>
        <MD>{"3x^2 + 3y^2 y' = 6y + 6x y', \\qquad \\text{so} \\qquad y' = \\frac{2y - x^2}{y^2 - 2x}."}</MD>
        <p>
          At <M>{"(3, 3)"}</M> this is <M>{"(6 - 9)/(9 - 6) = -1"}</M>, and the tangent is <M>{"x + y = 6"}</M>. We never
          needed a formula for y.
        </p>
      </Example>

      <Example title="a tilted ellipse">
        <p>
          For <M>{"x^2 + xy + y^2 = 12"}</M>: <M>{"2x + (y + xy') + 2y\\,y' = 0"}</M>, so{" "}
          <M>{"y' = -\\dfrac{2x + y}{x + 2y}"}</M>. At <M>{"(2, 2)"}</M>, which is on the curve since{" "}
          <M>{"4 + 4 + 4 = 12"}</M>, the slope is <M>{"-1"}</M>.
        </p>
      </Example>

      <Remark title="the hidden assumption">
        <p>
          The method assumes that y really is a differentiable function of x near the point. Where that fails, the formula
          says so by breaking down. On the circle at <M>{"(5, 0)"}</M>, the denominator y is 0: the tangent is vertical, and
          near that point the circle is not the graph of any function of x. Worse, the method can produce nonsense. Applied
          to <M>{"x^2 + y^2 = -1"}</M>, it gives <M>{"y' = -x/y"}</M> confidently, though the equation has no solutions at
          all. Implicit differentiation finds the slope if there is one; it does not prove that there is one.
        </p>
      </Remark>

      <Theorem title="powers with rational exponents">
        <p>
          For a rational number <M>{"r = p/q"}</M> and <M>{"x > 0"}</M>, <M>{"\\dfrac{d}{dx} x^{r} = r x^{r - 1}"}</M>.
        </p>
      </Theorem>
      <p>
        Let <M>{"y = x^{p/q}"}</M>, so that <M>{"y^q = x^p"}</M>. Assuming y is differentiable, which the theorem on
        inverses below proves, differentiate both sides: <M>{"q y^{q-1} y' = p x^{p-1}"}</M>. So
      </p>
      <MD>{"y' = \\frac{p}{q} \\cdot \\frac{x^{p-1}}{y^{q-1}} = \\frac{p}{q} \\cdot \\frac{x^{p-1}}{x^{p - p/q}} = \\frac{p}{q}\\, x^{p/q - 1}."}</MD>
      <p>
        The power rule, proved for whole numbers by the binomial theorem, now covers every rational power, such as{" "}
        <M>{"\\dfrac{d}{dx}\\sqrt[3]{x^2} = \\tfrac{2}{3} x^{-1/3}"}</M>.
      </p>

      <Remark title="when is it safe?">
        <p>
          Write the curve as <M>{"F(x, y) = 0"}</M>. The formula for <M>{"y'"}</M> always comes out as a fraction whose
          denominator is what you get by differentiating F in y alone, holding x fixed. The implicit function theorem says
          that when this denominator is not 0 at a point of the curve, and F is smooth enough, the curve near that point
          really is the graph of a differentiable function. It is one of the central theorems of Multivariable Calculus and
          Vector Analysis.
        </p>
      </Remark>

      <Remark title="inverse functions">
        <p>
          Implicit differentiation also finds the derivative of an inverse function: if <M>{"y = f^{-1}(x)"}</M>, then{" "}
          <M>{"f(y) = x"}</M>, and differentiating both sides gives <M>{"f'(y)\\, y' = 1"}</M>. The theorem below makes
          this exact.
        </p>
      </Remark>

      <Theorem title="the derivative of an inverse">
        <p>
          Let f be continuous and strictly monotonic on an open interval I, with inverse <M>{"f^{-1}"}</M>. If f is
          differentiable at a in I with <M>{"f'(a) \\ne 0"}</M>, and <M>{"b = f(a)"}</M>, then <M>{"f^{-1}"}</M> is
          differentiable at b and
        </p>
        <MD>{"(f^{-1})'(b) = \\frac{1}{f'(a)} = \\frac{1}{f'(f^{-1}(b))}."}</MD>
        <p>
          In Leibniz&rsquo;s notation, with <M>{"y = f(x)"}</M>: <M>{"\\dfrac{dx}{dy} = 1 \\Big/ \\dfrac{dy}{dx}"}</M>.
        </p>
      </Theorem>

      <Proof>
        <p>
          We use one fact, proved in Real Analysis: the inverse of a continuous, strictly monotonic function on an
          interval is continuous. For small <M>{"k \\ne 0"}</M>, let <M>{"h = f^{-1}(b + k) - a"}</M>. Then{" "}
          <M>{"h \\ne 0"}</M>, because <M>{"f^{-1}"}</M> is one to one, and <M>{"f(a + h) = b + k"}</M>. So
        </p>
        <MD>{"\\frac{f^{-1}(b + k) - f^{-1}(b)}{k} = \\frac{h}{f(a + h) - f(a)} = 1 \\Big/ \\frac{f(a + h) - f(a)}{h}."}</MD>
        <p>
          As <M>{"k \\to 0"}</M>, <M>{"h \\to 0"}</M> by continuity of <M>{"f^{-1}"}</M>, so the denominator tends to{" "}
          <M>{"f'(a)"}</M>, which is not 0. The quotient tends to <M>{"1/f'(a)"}</M>.
        </p>
      </Proof>

      <Remark title="a quicker argument, and its gap">
        <p>
          Differentiating <M>{"f(f^{-1}(x)) = x"}</M> with the chain rule gives{" "}
          <M>{"f'(f^{-1}(x)) \\cdot (f^{-1})'(x) = 1"}</M>, which is the same formula. This is the easy way to remember it,
          but it assumes that <M>{"f^{-1}"}</M> is differentiable, which is what needed proving. The same gap appeared above, where rational powers were
          differentiated on the assumption that they were differentiable. The theorem fills both gaps.
        </p>
      </Remark>

      <Example title="square roots and cube roots">
        <p>
          <M>{"\\sqrt{x}"}</M> is the inverse of <M>{"x^2"}</M> on <M>{"[0, \\infty)"}</M>. For <M>{"b > 0"}</M>, with{" "}
          <M>{"a = \\sqrt{b}"}</M>, the theorem gives <M>{"1/(2\\sqrt{b})"}</M>, as found from the definition in the first lesson of this chapter. The
          cube root is the inverse of <M>{"x^3"}</M>, whose derivative is 0 at 0. There the theorem does not apply, and
          indeed <M>{"\\sqrt[3]{x}"}</M> has a vertical tangent at 0 and no derivative.
        </p>
      </Example>

      <Example title="the inverse trigonometric functions">
        <p>
          arcsin is the inverse of sin on <M>{"[-\\pi/2, \\pi/2]"}</M>. For <M>{"-1 < x < 1"}</M>, let{" "}
          <M>{"\\theta = \\arcsin x"}</M>, so <M>{"\\sin\\theta = x"}</M> and <M>{"\\cos \\theta > 0"}</M>. Then
        </p>
        <MD>{"\\frac{d}{dx} \\arcsin x = \\frac{1}{\\cos \\theta} = \\frac{1}{\\sqrt{1 - \\sin^2\\theta}} = \\frac{1}{\\sqrt{1 - x^2}}."}</MD>
        <p>
          Likewise <M>{"\\dfrac{d}{dx}\\arccos x = -\\dfrac{1}{\\sqrt{1 - x^2}}"}</M>. For arctan, the inverse of tan on{" "}
          <M>{"(-\\pi/2, \\pi/2)"}</M>, use <M>{"\\tan' = 1/\\cos^2 = 1 + \\tan^2"}</M>:
        </p>
        <MD>{"\\frac{d}{dx} \\arctan x = \\frac{1}{1 + \\tan^2(\\arctan x)} = \\frac{1}{1 + x^2}."}</MD>
      </Example>

      <Remark title="a surprise">
        <p>
          The function arctan is not built from x by any algebra, yet its derivative <M>{"1/(1 + x^2)"}</M> is a plain
          fraction. Running this backwards, by integration, will produce a formula for <M>{"\\pi"}</M>. The logarithm, the
          inverse of the exponential, behaved the same way in the last lesson: its derivative is the plain fraction{" "}
          <M>{"1/x"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "circle",
      rung: "check",
      prompt: (
        <p>
          What is the slope of the tangent to <M>{"x^2 + y^2 = 25"}</M> at <M>{"(3, 4)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -0.75 },
    },
    {
      key: "basic",
      rung: "check",
      prompt: (
        <p>
          f is invertible, <M>{"f(2) = 5"}</M> and <M>{"f'(2) = 4"}</M>. What is <M>{"(f^{-1})'(5)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "hyperbola",
      rung: "apply",
      prompt: (
        <p>
          Find the slope of the curve <M>{"xy = 6"}</M> at the point <M>{"(2, 3)"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: -1.5 },
    },
    {
      key: "inv-cubic",
      rung: "apply",
      prompt: (
        <p>
          Let g be the inverse of <M>{"f(x) = x^3 + x"}</M>. What is <M>{"g'(10)"}</M>? (First find the x with{" "}
          <M>{"f(x) = 10"}</M>.)
        </p>
      ),
      answer: { kind: "numeric", value: 1 / 13, tolerance: 0.001 },
    },
    {
      key: "rational",
      rung: "apply",
      prompt: (
        <p>
          Differentiate <M>{"x^{2/3}"}</M> for <M>{"x > 0"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "(2/3) x^(-1/3)", variables: ["x"] },
    },
    {
      key: "radius",
      rung: "prove",
      prompt: (
        <p>
          Use implicit differentiation to show that at every point <M>{"(a, b)"}</M> of the circle{" "}
          <M>{"x^2 + y^2 = r^2"}</M> with <M>{"b \\ne 0"}</M>, the tangent is perpendicular to the radius from the origin.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates to get 2x + 2y y′ = 0, so the slope at (a, b) is −a/b.",
          "Notes that the radius to (a, b) has slope b/a (or handles a = 0 separately).",
          "Shows the product of the slopes is −1, or argues with direction vectors, so the lines are perpendicular.",
        ],
      },
    },
    {
      key: "second",
      rung: "stretch",
      prompt: (
        <p>
          On the circle <M>{"x^2 + y^2 = 25"}</M>, find <M>{"y''"}</M> in terms of y alone, by differentiating{" "}
          <M>{"y' = -x/y"}</M> again. What does the sign of your answer say about the shape of the top and bottom halves?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates −x/y with the quotient rule to get −(y − x y′)/y².",
          "Substitutes y′ = −x/y and uses x² + y² = 25 to reach y″ = −25/y³.",
          "Notes that y″ < 0 on the top half (bending down) and y″ > 0 on the bottom half (bending up).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how you can find the slope of a curve like x³ + y³ = 6xy without solving for y, why the chain rule is the key step, and how the same idea differentiates an inverse function.",

  glimpse: (
    <p>
      This completes the rules of differentiation. The next chapter puts derivatives to work, starting with the mean value theorem, which links the slope at a point to the change over an interval. Multivariable and Matrix Calculus turns the hidden assumption of this lesson into a theorem: the implicit function theorem says exactly when an equation defines a function.
    </p>
  ),
};
