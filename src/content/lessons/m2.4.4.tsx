import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ExpSlopeViz } from "@/components/viz/ExpSlopeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.4.4",
  minutes: 70,
  links: {
    requires: ["m2.4.3"],
    revisits: ["m0.4.5", "m0.4.3"],
    foreshadows: ["l3.1.3", "m5.4.4", "l3.5.1"],
  },

  puzzle: (
    <>
      <p>
        A colony of bacteria doubles every hour, so its size is <M>{"2^t"}</M>. How fast is it growing at the moment it
        reaches 1,000 cells? The answer turns out to be proportional to 1,000, with a constant that is neither 1 nor 2.
      </p>
      <p>
        The sigmoid function <M>{"\\sigma(x) = 1/(1 + e^{-x})"}</M> squashes every real number into the interval (0, 1), and
        was the standard activation in early neural networks. Its slope is never more than 1/4. Why that number, and why did
        it make deep networks of sigmoids so hard to train?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An exponential grows in proportion to its own size: twice as many bacteria make twice as many new ones. So the slope
        of <M>{"b^x"}</M> should be a constant multiple of its height, the same at every point. Check this below, then change
        the base and find the one base where the multiple is exactly 1.
      </p>
      <ExpSlopeViz />
      <p>
        That base is e. Its exponential is its own derivative, and every other exponential, logarithm and the sigmoid can be
        differentiated from that one fact and the chain rule.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the number e">
        <p>
          For any base <M>{"b > 0"}</M>, the difference quotient of <M>{"b^x"}</M> at x factors as
        </p>
        <MD>{"\\frac{b^{x+h} - b^x}{h} = b^x \\cdot \\frac{b^h - 1}{h}."}</MD>
        <p>
          So everything depends on <M>{"L(b) = \\lim_{h \\to 0} (b^h - 1)/h"}</M>, the slope at 0. We take as known that this
          limit exists; Real Analysis proves it. It grows continuously with b, from below 1 at b = 2 to above 1 at b = 3, so
          some base between them gives exactly 1. That base is <strong>e</strong> = 2.71828…, the same number as the limit of
          compound interest.
        </p>
      </Definition>

      <Theorem title="derivatives of exponentials and logarithms">
        <ol>
          <li><M>{"\\dfrac{d}{dx} e^x = e^x"}</M>;</li>
          <li><M>{"\\dfrac{d}{dx} b^x = (\\ln b)\\, b^x"}</M> for every <M>{"b > 0"}</M>;</li>
          <li><M>{"\\dfrac{d}{dx} \\ln x = \\dfrac{1}{x}"}</M> for <M>{"x > 0"}</M>.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          1 is the factorisation above with <M>{"L(e) = 1"}</M>. For 2, write <M>{"b^x = e^{x \\ln b}"}</M> and use the chain
          rule. For 3, differentiate <M>{"e^{\\ln x} = x"}</M> with the chain rule: <M>{"e^{\\ln x} \\cdot (\\ln x)' = 1"}</M>,
          so <M>{"(\\ln x)' = 1/x"}</M>. This assumes ln is differentiable; the next lesson&rsquo;s theorem on inverse functions
          supplies that.
        </p>
      </Proof>

      <Example title="the logarithmic derivative">
        <p>
          For any positive differentiable f, the chain rule gives <M>{"(\\ln f)' = f'/f"}</M>, the <strong>relative</strong>{" "}
          rate of change. It turns products into sums: for <M>{"y = x^x"}</M>, <M>{"\\ln y = x \\ln x"}</M>, so{" "}
          <M>{"y'/y = \\ln x + 1"}</M> and <M>{"y' = x^x(\\ln x + 1)"}</M>. Machine learning maximises log-likelihoods for the
          same reason: the logarithm of a product of probabilities is a sum, which is far easier to differentiate.
        </p>
      </Example>

      <Theorem title="the sigmoid">
        <p>
          The <strong>sigmoid</strong> <M>{"\\sigma(x) = \\dfrac{1}{1 + e^{-x}}"}</M> satisfies
        </p>
        <MD>{"\\sigma'(x) = \\sigma(x)\\,\\bigl(1 - \\sigma(x)\\bigr) \\le \\tfrac14,"}</MD>
        <p>with equality only at <M>{"x = 0"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule, <M>{"\\sigma'(x) = \\dfrac{e^{-x}}{(1 + e^{-x})^2} = \\dfrac{1}{1 + e^{-x}} \\cdot \\dfrac{e^{-x}}{1 + e^{-x}}"}</M>,
          and the second factor is <M>{"1 - \\sigma(x)"}</M>. Writing <M>{"s = \\sigma(x)"}</M>, the product{" "}
          <M>{"s(1 - s) = \\tfrac14 - (s - \\tfrac12)^2"}</M> is at most 1/4, with equality when <M>{"s = \\tfrac12"}</M>, that
          is, at <M>{"x = 0"}</M>.
        </p>
      </Proof>

      <Remark title="why this mattered for deep learning">
        <p>
          Backpropagation multiplies one derivative per layer, by the chain rule. Through ten sigmoid layers the gradient picks
          up ten factors of at most 1/4, a shrinkage of at least a million. Gradients for the early layers all but vanish, and
          those layers barely learn. This is one reason the ReLU, whose slope is 1 wherever it is active, replaced the sigmoid
          inside networks. The sigmoid survives at the output, where it turns a score into a probability, and in the gates of
          recurrent networks.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "e3x",
      rung: "check",
      prompt: <p>What is the derivative of <M>{"e^{3x}"}</M> at <M>{"x = 0"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "sig0",
      rung: "check",
      prompt: <p>What is <M>{"\\sigma'(0)"}</M>, the slope of the sigmoid at 0?</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>What is the derivative of <M>{"2^x"}</M> at <M>{"x = 0"}</M>? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.693, tolerance: 0.001 },
    },
    {
      key: "lnsq",
      rung: "apply",
      prompt: <p>What is the derivative of <M>{"\\ln(x^2 + 1)"}</M> at <M>{"x = 1"}</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "sig09",
      rung: "apply",
      prompt: <p>At a point where <M>{"\\sigma(x) = 0.9"}</M>, what is <M>{"\\sigma'(x)"}</M>?</p>,
      answer: { kind: "numeric", value: 0.09, tolerance: 0.001 },
    },
    {
      key: "softplus",
      rung: "prove",
      prompt: (
        <p>
          The softplus function is <M>{"s(x) = \\ln(1 + e^x)"}</M>. Show that <M>{"s'(x) = \\sigma(x)"}</M>, and that{" "}
          <M>{"\\sigma(-x) = 1 - \\sigma(x)"}</M>. Then explain why a chain of n sigmoid layers can shrink a gradient by a
          factor of at least <M>{"4^n"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates ln(1 + eˣ) by the chain rule to get eˣ/(1 + eˣ).",
          "Divides top and bottom by eˣ to obtain 1/(1 + e⁻ˣ) = σ(x).",
          "Shows σ(−x) = 1/(1 + eˣ) = 1 − σ(x) by putting the two fractions over a common denominator.",
          "Explains that the chain rule multiplies one factor σ′ ≤ 1/4 per layer, so the product is at most (1/4)ⁿ.",
        ],
      },
    },
    {
      key: "xx",
      rung: "stretch",
      prompt: <p>What is the derivative of <M>{"x^x"}</M> at <M>{"x = 2"}</M>? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 6.773, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend why eˣ is its own derivative, how that gives the derivatives of bˣ and ln x, and why the sigmoid's slope is never above 1/4.",

  glimpse: (
    <p>
      Next, implicit differentiation, which finds slopes of curves that are not graphs of functions, and the theorem on
      inverse functions that makes the derivative of ln x fully rigorous. The sigmoid&rsquo;s cousin, the softmax, turns a
      whole vector of scores into probabilities; Multivariable and Matrix Calculus differentiates it, and Neural Networks
      from Scratch meets the vanishing gradients this lesson predicted.
    </p>
  ),
};
