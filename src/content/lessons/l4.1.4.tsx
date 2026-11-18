import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OrientationTuningViz } from "@/components/viz/OrientationTuningViz";
import type { LessonContent } from "@/lib/types";

const GABOR = `import numpy as np

def coords(size):
    r = np.arange(size) - (size - 1) / 2
    return np.meshgrid(r, r, indexing="xy")

def grating(size, theta, freq, phase=0.0):
    X, Y = coords(size)
    return np.cos(2 * np.pi * freq * (X * np.cos(theta) + Y * np.sin(theta)) + phase)

def gabor(size, theta, freq, sigma):
    X, Y = coords(size)
    g = np.exp(-(X ** 2 + Y ** 2) / (2 * sigma ** 2)) * grating(size, theta, freq)
    return g - g.mean()

def tuning(kernel, thetas, freq):
    phases = np.linspace(0, 2 * np.pi, 8, endpoint=False)
    return np.array([max(np.sum(kernel * grating(len(kernel), t, freq, p)) for p in phases) for t in thetas])`;

const OCC = `import numpy as np

def occlusion_map(score, x, patch, stride, fill=0.0):
    base = score(x); H, W = x.shape
    rows = range(0, H - patch + 1, stride); cols = range(0, W - patch + 1, stride)
    out = np.zeros((len(rows), len(cols)))
    for a, i in enumerate(rows):
        for b, j in enumerate(cols):
            z = x.copy(); z[i:i + patch, j:j + patch] = fill
            out[a, b] = base - score(z)
    return out

def template_score(template):
    def score(x):
        h, w = template.shape
        return max(float(np.sum(x[i:i + h, j:j + w] * template)) for i in range(x.shape[0] - h + 1) for j in range(x.shape[1] - w + 1))
    return score`;

export const lesson: LessonContent = {
  id: "l4.1.4",
  minutes: 50,
  links: {
    requires: ["l4.1.3"],
    revisits: ["l4.1.1", "m6.6.3"],
    foreshadows: ["l11.1.4", "l11.1.2"],
  },

  puzzle: (
    <>
      <p>
        Train a convolutional network on photographs from random initial weights, then look at its first-layer kernels. They
        are not random any more: nearly all of them have become little oriented stripes and colour blobs, strikingly like the
        receptive fields neuroscientists recorded in the visual cortex of cats in the 1960s. Nobody told the network about
        edges. Why does it end up with these filters, and how can we find out what deeper units respond to, where looking at
        the weights no longer helps?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A first-layer unit is a template matched against every patch, so its weights are literally the pattern it responds to
        most. Natural images are dominated by edges at all orientations and scales, and a bank of oriented filters is an
        efficient way to describe them, which is why training discovers it. Deeper units combine earlier ones nonlinearly, so
        we must probe them indirectly: find inputs that excite them, or remove parts of an image and see which removals hurt.
        Each probe answers a narrower question than it seems to.
      </p>
      <OrientationTuningViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gabor filters">
        <p>
          A Gabor filter with orientation θ, spatial frequency f and width σ is{" "}
          <M>{"g(x, y) = e^{-(x^2 + y^2)/2\\sigma^2}\\cos(2\\pi f(x\\cos\\theta + y\\sin\\theta))"}</M>, a plane wave under a
          Gaussian window, usually shifted to have zero mean so that it ignores uniform brightness. It is localised in both
          space and frequency, about as well as the uncertainty principle allows.
        </p>
      </Definition>

      <Theorem title="a linear unit prefers its own weights">
        <p>
          Among inputs with <M>{"\\lVert x\\rVert = r"}</M>, the response <M>{"w^\\top x"}</M> is maximised by{" "}
          <M>{"x = rw/\\lVert w\\rVert"}</M>, with value <M>{"r\\lVert w\\rVert"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Cauchy-Schwarz, <M>{"w^\\top x \\le \\lVert w\\rVert\\,\\lVert x\\rVert"}</M>, with equality exactly when x is a
          positive multiple of w. So displaying first-layer kernels as images is a faithful picture of what those units
          detect. For a deeper unit, feature visualisation runs gradient ascent on the input to maximise the activation; there
          is no closed form, and without regularisation (blurring, jitter, a prior over images) the optimum is high-frequency
          noise that says more about the optimiser than about the unit.
        </p>
      </Proof>

      <Theorem title="orientation tuning">
        <p>
          For a Gabor filter at frequency f and a grating at the same frequency whose orientation differs by Δθ, the response
          maximised over phase is approximately proportional to{" "}
          <M>{"\\exp\\bigl(-4\\pi^2\\sigma^2f^2(1 - \\cos\\Delta\\theta)\\bigr)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The response is the inner product of the grating with the filter, which is the Fourier transform of the Gaussian
          window evaluated at the difference of the two wave vectors, plus a second term at their sum that is negligible unless
          Δθ is near 180°. The Gaussian&apos;s transform is <M>{"\\exp(-2\\pi^2\\sigma^2\\lVert\\Delta k\\rVert^2)"}</M>, and two
          vectors of length f at angle Δθ differ by <M>{"\\lVert\\Delta k\\rVert^2 = 2f^2(1 - \\cos\\Delta\\theta)"}</M>. A wider
          window, larger σ, gives sharper tuning: the familiar trade-off between localisation in space and in frequency. On a
          finite pixel grid the formula is only approximate, as the code shows.
        </p>
        <Code>{GABOR}</Code>
      </Proof>

      <Example title="occlusion sensitivity">
        <p>
          To ask which parts of an image a prediction depends on, slide a grey patch across it and record how much the class
          score drops at each position. Unlike a gradient, which measures sensitivity to infinitesimal changes, occlusion
          measures the effect of actually removing evidence. Its answers depend on the patch size, the fill value and the
          alignment of the patch grid with the object, and it needs one forward pass per position: 729 passes for a 224 × 224
          image with 16-pixel patches and stride 8.
        </p>
        <Code>{OCC}</Code>
      </Example>

      <Remark title="what deeper layers learn, and how sure we can be">
        <p>
          Visualising the image patches that most excite each unit suggests a hierarchy: edges and colours, then textures
          and repeated patterns, then object parts such as eyes and wheels, then whole objects. Yet ImageNet CNNs rely on
          texture more than shape, classifying a cat-shaped silhouette filled with elephant skin as an elephant, and
          imperceptible adversarial perturbations can flip their predictions. Saliency maps can look convincing even for
          randomly initialised networks. These cautions are the starting point of the interpretability course.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lin",
      rung: "check",
      prompt: <p>A unit computes <M>{"\\mathrm{ReLU}(w^\\top x)"}</M> with w = (1, 2, 2). What is its largest activation over inputs of norm 3?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.0001 },
    },
    {
      key: "tune",
      rung: "check",
      prompt: (
        <p>
          Using the approximation in the lesson, what relative response does a Gabor filter with f = 0.25 and σ = 2 give to a
          grating rotated 45° from its preferred orientation?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0555, tolerance: 0.001 },
    },
    {
      key: "occ",
      rung: "apply",
      prompt: <p>How does occlusion sensitivity differ from a gradient saliency map?</p>,
      answer: {
        kind: "choice",
        options: [
          "Occlusion measures the drop in score when a region is actually removed; the gradient measures sensitivity to infinitesimal changes at the current input",
          "They are the same quantity computed two ways",
          "Occlusion needs the network's weights, gradients do not",
          "Gradients can only be computed for linear models",
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

def coords(size):
    r = np.arange(size) - (size - 1) / 2
    return np.meshgrid(r, r, indexing="xy")

def grating(size, theta, freq, phase=0.0):
    X, Y = coords(size)
    return np.cos(2 * np.pi * freq * (X * np.cos(theta) + Y * np.sin(theta)) + phase)

def gabor(size, theta, freq, sigma):
    X, Y = coords(size)
    g = np.exp(-(X ** 2 + Y ** 2) / (2 * sigma ** 2)) * grating(size, theta, freq)
    return g - g.mean()

def tuning(kernel, thetas, freq):
    phases = np.linspace(0, 2 * np.pi, 8, endpoint=False)
    return np.array([max(np.sum(kernel * grating(len(kernel), t, freq, p)) for p in phases) for t in thetas])

k = gabor(9, 0.0, 0.25, 2.0); t = tuning(k, np.array([0.0, np.pi / 8, np.pi / 4, np.pi / 2]), 0.25); print((t / t[0]).round(2).tolist(), round(float(k.sum()), 6) + 0.0)
print(int(np.argmax(tuning(gabor(9, np.pi / 3, 0.25, 2.0), np.linspace(0, np.pi, 6, endpoint=False), 0.25))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.51, 0.05, 0.0] 0.0\n2",
          "[1.0, 0.51, 0.05, 0.0] 0.0\n1",
          "[1.0, 0.92, 0.71, 0.0] 0.0\n2",
          "[0.0, 0.05, 0.51, 1.0] 0.0\n2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def occlusion_map(score, x, patch, stride, fill=0.0):
    base = score(x); H, W = x.shape
    rows = range(0, H - patch + 1, stride); cols = range(0, W - patch + 1, stride)
    out = np.zeros((len(rows), len(cols)))
    for a, i in enumerate(rows):
        for b, j in enumerate(cols):
            z = x.copy(); z[i:i + patch, j:j + patch] = fill
            out[a, b] = base - score(z)
    return out

def template_score(template):
    def score(x):
        h, w = template.shape
        return max(float(np.sum(x[i:i + h, j:j + w] * template)) for i in range(x.shape[0] - h + 1) for j in range(x.shape[1] - w + 1))
    return score

x = np.zeros((8, 8)); T = np.array([[1.0, -1.0], [-1.0, 1.0]]); x[4:6, 2:4] = T; s = template_score(T); m = occlusion_map(s, x, 2, 2)
print(s(x), m.shape, np.argwhere(m == m.max()).tolist(), float(m.max()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 (4, 4) [[2, 1]] 4.0",
          "4.0 (7, 7) [[4, 2]] 4.0",
          "4.0 (4, 4) [[1, 2]] 4.0",
          "0.0 (4, 4) [[2, 1]] 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>coords(size)</C>, <C>grating(size, theta, freq, phase)</C>, <C>gabor(size, theta, freq, sigma)</C> (zero mean)
          and <C>tuning(kernel, thetas, freq)</C>, the response to a grating at each orientation maximised over eight phases.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def coords(size):
    r = np.arange(size) - (size - 1) / 2
    return np.meshgrid(r, r, indexing="xy")

def grating(size, theta, freq, phase=0.0):
    return np.zeros((size, size))

def gabor(size, theta, freq, sigma):
    return np.zeros((size, size))

def tuning(kernel, thetas, freq):
    return np.zeros(len(thetas))
`,
        solution: GABOR,
        tests: [
          { name: "filters", code: `g = gabor(7, np.pi / 2, 0.2, 1.5); X, Y = coords(7)
assert g.shape == (7, 7) and abs(g.sum()) < 1e-9 and np.allclose(g, g[::-1, ::-1]) and abs(grating(5, 0.0, 0.25)[0, 2] - np.cos(2 * np.pi * 0.25 * 0)) < 1e-12 and abs(grating(5, 0.0, 0.25)[2, 0] - np.cos(-np.pi)) < 1e-12` },
          { name: "tuning", code: `th = np.linspace(0, np.pi, 8, endpoint=False)
assert all(int(np.argmax(tuning(gabor(11, t, 0.2, 2.4), th, 0.2))) == i for i, t in enumerate(th)) and tuning(gabor(11, 0.0, 0.2, 2.4), [0.0], 0.2)[0] > 10` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>occlusion_map(score, x, patch, stride, fill)</C>, returning the drop in score for each patch position, and{" "}
          <C>template_score(template)</C>, returning a function that scores an image by its best template match over all
          positions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def occlusion_map(score, x, patch, stride, fill=0.0):
    return np.zeros((1, 1))

def template_score(template):
    return lambda x: 0.0
`,
        solution: OCC,
        tests: [
          { name: "score", code: `T = np.array([[2.0, 0.0], [0.0, 1.0]]); x = np.zeros((5, 5)); x[1, 3] = 1.0; x[2, 4] = 1.0; x[0, 0] = 1.0
assert template_score(T)(x) == 3.0 and template_score(np.ones((5, 5)))(x) == 3.0` },
          { name: "map", code: `x = np.zeros((6, 6)); x[2:4, 2:4] = 1.0; m = occlusion_map(lambda z: float(z.sum()), x, 2, 2)
assert m.shape == (3, 3) and m[1, 1] == 4.0 and m.sum() == 4.0 and occlusion_map(lambda z: float(z.sum()), x, 3, 1).shape == (4, 4) and occlusion_map(lambda z: float(z.sum()), x, 3, 1).max() == 4.0` },
        ],
      },
    },
    {
      key: "passes",
      rung: "stretch",
      prompt: <p>How many forward passes does occlusion sensitivity need for a 224 × 224 image with 16 × 16 patches and stride 8?</p>,
      answer: { kind: "numeric", value: 729, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        CNNs turn pixels into feature vectors. The next section turns discrete symbols, words and items and users, into
        vectors too, and asks what geometry those vectors should have.
      </p>
    </>
  ),
};
