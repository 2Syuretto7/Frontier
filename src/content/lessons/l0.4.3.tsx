import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { ImageNetViz } from "@/components/viz/ImageNetViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.4.3",
  minutes: 45,
  links: {
    revisits: ["l0.4.2"],
    foreshadows: ["l4.1.1", "e7.1.1"],
  },

  puzzle: (
    <>
      <p>
        Backpropagation was popularised in 1986, and multi-layer neural networks could in principle learn almost anything. Yet
        for the next twenty years most researchers preferred other methods, and neural networks were often considered a dead
        end.
      </p>
      <p>
        Then, around 2012, they suddenly beat everything else at recognising images, then speech, then translation. The core
        algorithm had barely changed. What do you think had?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two things outside the algorithm had changed enormously. The internet had produced vast collections of data: ImageNet,
        assembled from web images and labelled by thousands of paid workers, held over a million training images in a
        thousand categories. And graphics cards, built to draw video games, turned out to be very fast at exactly the
        arithmetic that neural networks need.
      </p>
      <p>
        In 2012 a network called AlexNet, trained on ImageNet with two gaming graphics cards, entered the annual ImageNet
        competition. Click through the years below.
      </p>
      <ImageNetViz />
      <p>
        AlexNet did not edge ahead; it cut the error by about ten percentage points in one year, when progress had been one
        or two. Within three years, every leading entry was a deep network, and the best had fallen below the error of a
        trained human on this task.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="deep learning">
        <p>
          <strong>Deep learning</strong> is machine learning with neural networks of many layers. Each layer transforms the
          output of the one before, so the network builds up its own <strong>features</strong>: early layers of an image
          network respond to edges and colours, middle layers to textures and parts, late layers to whole objects.
        </p>
      </Definition>

      <p>
        Before deep learning, features were designed by hand: researchers spent years engineering ways to describe edges,
        corners and textures, and a simple classifier was trained on top. Deep learning replaced that engineering with
        learning, which is the same move as the first lesson of this course, from rules to examples, applied one level down.
      </p>

      <Definition title="the three ingredients">
        <ul>
          <li><strong>Data:</strong> large labelled collections, such as ImageNet (2009).</li>
          <li><strong>Compute:</strong> graphics processing units, or GPUs, doing thousands of multiplications in parallel.</li>
          <li><strong>Algorithms:</strong> backpropagation, plus practical improvements such as simpler activation functions and ways to stop networks overfitting.</li>
        </ul>
        <p>None of the three was enough on its own.</p>
      </Definition>

      <Example title="beyond images">
        <p>
          Deep networks cut speech recognition errors sharply around 2010 to 2012, and by 2016 they powered the main online
          translation services. In 2016, AlphaGo, combining deep networks with search and reinforcement learning, beat Lee
          Sedol, one of the strongest Go players in the world, a feat many experts had expected to be a decade away. In 2018,
          Geoffrey Hinton, Yann LeCun and Yoshua Bengio received the Turing Award, computing&rsquo;s highest honour, for their
          decades of work on neural networks.
        </p>
      </Example>

      <Remark title="benchmarks drive progress, and mislead">
        <p>
          ImageNet gave the field a shared target, so that improvements were measurable and comparable. That is a large part
          of why progress was so fast. But a benchmark is a narrow slice of a task: models that beat humans on ImageNet could
          still be fooled by a photo taken at an unusual angle. Beating a benchmark and solving a problem are not the same
          thing, a theme of the last lesson in this course.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "year",
      rung: "check",
      prompt: <p>In what year did AlexNet win the ImageNet competition?</p>,
      answer: { kind: "numeric", value: 2012 },
    },
    {
      key: "drop",
      rung: "check",
      prompt: <p>In the visualisation, by how many percentage points did the winning error fall from 2011 to 2012?</p>,
      answer: { kind: "numeric", value: 10.5 },
    },
    {
      key: "ingredients",
      rung: "apply",
      prompt: <p>Select the three ingredients that together made deep learning work around 2012.</p>,
      answer: {
        kind: "choice",
        options: ["Large labelled data sets", "Fast parallel hardware such as GPUs", "Hand-designed image features", "Training algorithms such as backpropagation, with practical improvements"],
        correct: [0, 1, 3],
      },
    },
    {
      key: "features",
      rung: "apply",
      prompt: <p>What did deep learning replace in computer vision?</p>,
      answer: { kind: "choice", options: ["Hand-designed features", "Labelled data", "Computers"], correct: [0] },
    },
    {
      key: "fraction",
      rung: "apply",
      prompt: <p>From 28.2% in 2010 to 3.6% in 2015, by what factor did the winning error fall? Give one decimal place.</p>,
      answer: { kind: "numeric", value: 7.8, tolerance: 0.01 },
    },
    {
      key: "why-now",
      rung: "prove",
      prompt: (
        <p>
          Backpropagation was known in 1986, but deep learning took off only around 2012. Give a careful explanation of why,
          naming what changed and why each change mattered.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that large networks need large data to avoid overfitting, and that large labelled data sets such as ImageNet appeared only around 2009.",
          "Notes that training large networks needs enormous amounts of arithmetic, and that GPUs made this fast and cheap.",
          "Mentions algorithmic and practical improvements that made deep networks easier to train.",
          "Concludes that the combination, not any one change, was decisive.",
        ],
      },
    },
    {
      key: "errors",
      rung: "stretch",
      prompt: (
        <p>
          The ImageNet test set used in the competition had 100,000 images. At the 2015 error of 3.6%, how many more images
          per 100,000 did the winner get wrong than a human with an error of 5.1%? Give a negative number if it got fewer
          wrong.
        </p>
      ),
      answer: { kind: "numeric", value: -1500 },
    },
  ],

  teachBack:
    "Explain to a friend why neural networks, known since the 1980s, suddenly took over around 2012, naming the three ingredients that came together.",

  glimpse: (
    <p>
      Next, transformers and scale: the architecture behind today&rsquo;s language models, and the discovery that performance
      improves predictably as models grow. In Deep Learning Architectures you will build the convolutional networks that won
      ImageNet, and in Computer Architecture and Accelerators you will see exactly why GPUs suit neural networks so well.
    </p>
  ),
};
