import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ClickTargetViz } from "@/components/viz/ClickTargetViz";
import type { LessonContent } from "@/lib/types";

const GROUND = `import math

def to_screen(x, y, img_w, img_h, scr_w, scr_h):
    return round(x * scr_w / img_w), round(y * scr_h / img_h)   # the model sees a resized screenshot

def center_of(box):
    x0, y0, x1, y1 = box
    return (x0 + x1) / 2, (y0 + y1) / 2

def hit_prob(w, h, sigma):
    return math.erf(w / (2 * math.sqrt(2) * sigma)) * math.erf(h / (2 * math.sqrt(2) * sigma))`;

const TREE = `def find_element(tree, role, name):
    if tree.get("role") == role and tree.get("name") == name:
        return tree.get("box")
    for child in tree.get("children", []):
        box = find_element(child, role, name)
        if box is not None:
            return box
    return None

def set_of_marks(elements):
    order = sorted(elements, key=lambda e: (e["box"][1], e["box"][0]))   # top to bottom, then left to right
    return {i: e["box"] for i, e in enumerate(order, 1)}

def needs_confirmation(name, words=("buy", "pay", "delete", "send", "submit")):
    return any(w in name.lower() for w in words)`;

export const lesson: LessonContent = {
  id: "l13.3.3",
  minutes: 50,
  links: {
    requires: ["l13.3.1"],
    revisits: ["l13.2.1"],
    foreshadows: ["l13.4.1", "l13.5.2"],
  },

  puzzle: (
    <>
      <p>
        Much useful work happens in software that has no programming interface: a spreadsheet, a government form, an old
        accounting package. People use these through a screen, a mouse and a keyboard. An agent that can do the same could
        work with any software at all. It must look at pixels, decide that the small grey icon in the corner is the export
        button, and click within a few pixels of it. How is an agent connected to a computer, and why is clicking the right
        place harder than it sounds?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A computer-use agent runs the usual loop with a screenshot as the observation and mouse and keyboard events as
        actions. The hard part is grounding: turning &quot;click Export&quot; into coordinates. If the agent&apos;s estimate
        of a location is off by a few pixels at random, its chance of hitting a target falls quickly as the target shrinks,
        so small buttons fail far more often than large ones, independently of how well the agent understands the task.
      </p>
      <ClickTargetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the interface">
        <p>
          The harness gives the model a screenshot, often downscaled to save tokens, and accepts actions such as{" "}
          <C>click(x, y)</C>, <C>type(text)</C>, <C>key(combination)</C> and <C>scroll</C>. Coordinates the model predicts in
          the resized image must be mapped back to the real screen (<C>to_screen</C>), and an error in that mapping, such as a
          forgotten scale factor on a high-resolution display, sends every click to the wrong place. The screen is a partial
          observation: a menu that has not been opened, or a page below the fold, is invisible until the agent acts.
        </p>
      </Definition>

      <Definition title="grounding">
        <p>
          Grounding maps a description to a location. Models trained on large sets of screenshots with element annotations
          predict coordinates directly. Alternatively, the harness reads the accessibility tree, the structured description
          of on-screen elements that screen readers use, or the page&apos;s DOM, and either gives it to the model as text{" "}
          (<C>find_element</C>) or draws numbered marks on the screenshot so the model answers with a number rather than
          coordinates, set-of-mark prompting (<C>set_of_marks</C>). Trees are cheaper and exact but miss content drawn on a
          canvas, such as images, charts and many games; pixels work everywhere.
        </p>
        <Code>{TREE}</Code>
      </Definition>

      <Theorem title="the chance of hitting a target">
        <p>
          Let a click aimed at the centre of a w × h target land with independent Gaussian errors of standard deviation σ in
          each coordinate. It falls inside with probability
        </p>
        <MD>{"\\operatorname{erf}\\Big(\\frac{w}{2\\sqrt2\\,\\sigma}\\Big)\\, \\operatorname{erf}\\Big(\\frac{h}{2\\sqrt2\\,\\sigma}\\Big)"}</MD>
        <p>(<C>hit_prob</C>).</p>
      </Theorem>
      <Proof>
        <p>
          The horizontal error X is N(0, σ²), and the click is inside horizontally when |X| ≤ w/2. For a normal variable,{" "}
          <M>{"P(|X| \\le a) = \\operatorname{erf}(a / (\\sqrt2\\,\\sigma))"}</M>, which with a = w/2 gives the first factor;
          the vertical factor is the same with h, and independence multiplies them. For a target much larger than σ each
          factor is close to 1, and for one much smaller it is about <M>{"a\\sqrt{2/\\pi}/\\sigma"}</M>, so the hit rate of a
          small square falls as the square of its size. Zooming into a region before clicking enlarges targets relative to the
          error, and clicking the centre of a known box (<C>center_of</C>) removes the error altogether when a tree is
          available.
        </p>
        <Code>{GROUND}</Code>
      </Proof>

      <Example title="measuring computer use">
        <p>
          OSWorld poses 369 tasks in real desktop applications, such as editing a spreadsheet or changing a setting, each
          checked by a script that inspects the final state of the machine. When it was released, people completed about 72%
          of the tasks and the best model about 12%, with most failures in grounding and in operating unfamiliar
          applications. Scores have risen quickly since, as models were trained specifically on computer-use data. Web
          benchmarks such as WebArena do the same for websites hosted in a sandbox.
        </p>
      </Example>

      <Remark title="safety">
        <p>
          An agent with a mouse can do anything its user can, including buying, deleting and sending. Text on a web page can
          try to instruct the agent, so screen content is untrusted input. Common defences are running the agent in a
          separate virtual machine or browser profile with only the access the task needs, asking the user before
          irreversible actions (<C>needs_confirmation</C> is a crude version), and letting the user watch and take over.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hit",
      rung: "check",
      prompt: (
        <p>
          A 24 × 24 pixel button is clicked with Gaussian error of 8 pixels in each coordinate, aimed at its centre. What
          is the probability of a hit?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7506, tolerance: 0.001 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: (
        <p>
          A 1920 × 1080 screen is shown to the model as a 1280 × 720 image. The model clicks at (640, 300) in the image. What
          is the x-coordinate on the screen?
        </p>
      ),
      answer: { kind: "numeric", value: 960, tolerance: 0 },
    },
    {
      key: "tree",
      rung: "apply",
      prompt: <p>When does reading the accessibility tree fail where screenshots succeed?</p>,
      answer: {
        kind: "choice",
        options: [
          "When content is drawn on a canvas, such as charts, images or games, and so has no elements in the tree",
          "When the page has many buttons",
          "When the screen resolution is high",
          "Never: the tree always contains everything visible",
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

def to_screen(x, y, img_w, img_h, scr_w, scr_h):
    return round(x * scr_w / img_w), round(y * scr_h / img_h)   # the model sees a resized screenshot

def center_of(box):
    x0, y0, x1, y1 = box
    return (x0 + x1) / 2, (y0 + y1) / 2

def hit_prob(w, h, sigma):
    return math.erf(w / (2 * math.sqrt(2) * sigma)) * math.erf(h / (2 * math.sqrt(2) * sigma))

print(to_screen(512, 384, 1024, 768, 2560, 1600), center_of((10, 20, 30, 60)))
print(round(hit_prob(20, 20, 10), 4), round(hit_prob(80, 20, 10), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1280, 800) (20.0, 40.0)\n0.4661 0.6826",
          "(205, 492) (20.0, 40.0)\n0.4661 0.6826",
          "(1280, 800) (20.0, 40.0)\n0.6827 0.6826",
          "(1280, 800) (10.0, 20.0)\n0.4661 0.9999",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def find_element(tree, role, name):
    if tree.get("role") == role and tree.get("name") == name:
        return tree.get("box")
    for child in tree.get("children", []):
        box = find_element(child, role, name)
        if box is not None:
            return box
    return None

def set_of_marks(elements):
    order = sorted(elements, key=lambda e: (e["box"][1], e["box"][0]))   # top to bottom, then left to right
    return {i: e["box"] for i, e in enumerate(order, 1)}

def needs_confirmation(name, words=("buy", "pay", "delete", "send", "submit")):
    return any(w in name.lower() for w in words)

t = {"role": "window", "name": "", "children": [{"role": "button", "name": "Cancel", "box": (0, 0, 10, 10)}, {"role": "button", "name": "Pay now", "box": (20, 0, 40, 10)}]}; print(find_element(t, "button", "Pay now"), find_element(t, "link", "x"))
print(set_of_marks([{"box": (50, 10, 60, 20)}, {"box": (5, 10, 15, 20)}, {"box": (0, 40, 9, 50)}]), needs_confirmation("Pay now"), needs_confirmation("Cancel"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(20, 0, 40, 10) None\n{1: (5, 10, 15, 20), 2: (50, 10, 60, 20), 3: (0, 40, 9, 50)} True False",
          "(20, 0, 40, 10) None\n{1: (0, 40, 9, 50), 2: (5, 10, 15, 20), 3: (50, 10, 60, 20)} True False",
          "(0, 0, 10, 10) None\n{1: (5, 10, 15, 20), 2: (50, 10, 60, 20), 3: (0, 40, 9, 50)} True False",
          "(20, 0, 40, 10) None\n{1: (5, 10, 15, 20), 2: (50, 10, 60, 20), 3: (0, 40, 9, 50)} True True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_screen(x, y, img_w, img_h, scr_w, scr_h)</C>, rounding to whole pixels; <C>center_of(box)</C> for a box
          (x0, y0, x1, y1); and <C>hit_prob(w, h, sigma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def to_screen(x, y, img_w, img_h, scr_w, scr_h):
    return x, y

def center_of(box):
    return box[0], box[1]

def hit_prob(w, h, sigma):
    return 1.0
`,
        solution: GROUND,
        tests: [
          { name: "screen", code: `assert to_screen(100, 50, 200, 100, 1000, 300) == (500, 150) and center_of((0, 0, 4, 2)) == (2.0, 1.0)` },
          { name: "hit", code: `import math\nassert abs(hit_prob(2, 1e6, 1.0) - math.erf(1 / math.sqrt(2))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Accessibility nodes are dictionaries with role, name, an optional box and optional children. Write{" "}
          <C>find_element(tree, role, name)</C> returning the box of the first match in depth-first order, or None;{" "}
          <C>set_of_marks(elements)</C> numbering elements from 1, top to bottom and then left to right; and{" "}
          <C>needs_confirmation(name)</C> for names containing buy, pay, delete, send or submit in any case.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def find_element(tree, role, name):
    return None

def set_of_marks(elements):
    return {i: e["box"] for i, e in enumerate(elements, 1)}

def needs_confirmation(name, words=("buy", "pay", "delete", "send", "submit")):
    return False
`,
        solution: TREE,
        tests: [
          { name: "find", code: `t = {"role": "a", "name": "x", "children": [{"role": "b", "name": "y", "box": (1, 2, 3, 4), "children": []}]}\nassert find_element(t, "b", "y") == (1, 2, 3, 4)` },
          { name: "marks", code: `assert set_of_marks([{"box": (9, 0, 10, 1)}, {"box": (1, 0, 2, 1)}]) == {1: (1, 0, 2, 1), 2: (9, 0, 10, 1)} and needs_confirmation("Delete file") is True` },
        ],
      },
    },
    {
      key: "sigma",
      rung: "stretch",
      prompt: (
        <p>
          What is the largest Gaussian pointing error σ, in pixels, for which a 30 × 30 pixel target is hit at least 95% of
          the time?
        </p>
      ),
      answer: { kind: "numeric", value: 6.707, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        One agent can only do one thing at a time and holds one context. Splitting work among several agents, each with its
        own context and role, can parallelise and specialise, at a cost in coordination that the next lesson weighs.
      </p>
    </>
  ),
};
