"use client";

import { useState } from "react";

const PROMPT = "How do I make my bread rise more?";
const STAGES = [
  {
    name: "Pretrained base model",
    short: "Base model",
    reply: "How do I make my bread rise more? How long should I knead? Why is my crust so hard? These are the questions we hear most often at the bakery, and in this guide we answer all three…",
    note: "Trained only to predict the next word of internet text, it continues the document. A question followed by more questions is a common pattern in web pages, so that is what it writes.",
  },
  {
    name: "After supervised fine-tuning",
    short: "Fine-tuned",
    reply: "Here are a few ways to get a better rise: use fresh yeast, let the dough prove somewhere warm, knead long enough to build gluten, and do not add too much flour.",
    note: "Fine-tuned on thousands of example conversations written by people, it has learnt the format of an assistant: answer the question that was asked.",
  },
  {
    name: "After reinforcement learning from feedback",
    short: "Feedback-trained",
    reply: "The usual culprits are tired yeast, a cold kitchen, or too little kneading. Check the yeast first: put a pinch in warm water with sugar, and if it has not foamed in ten minutes, replace it. If the yeast is fine, prove the dough somewhere around 25°C until it has doubled. Which kind of bread are you making? The fix differs a little for sourdough.",
    note: "Trained further on which answers people (or models acting for them) preferred, it learns qualities that are hard to demonstrate but easy to judge: being specific, putting the likeliest cause first, and asking when it needs to.",
  },
];

/** One prompt, answered by the same network at three stages of its training. Illustrative replies. */
export function PipelineViz() {
  const [s, setS] = useState(0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {STAGES.map((st, i) => <button key={st.name} type="button" className={s === i ? "btn btn-primary" : "btn"} aria-pressed={s === i} onClick={() => setS(i)}>{i + 1}. {st.short}</button>)}
      </div>
      <div className="tagger-row" style={{ marginTop: 12 }}>
        <p className="tagger-why" style={{ marginTop: 0 }}>Prompt</p>
        <p className="tagger-text">{PROMPT}</p>
        <p className="tagger-why">Reply · {STAGES[s].name}</p>
        <p className="tagger-text" style={{ marginBottom: 0 }}>{STAGES[s].reply}</p>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{STAGES[s].note} These replies are written to illustrate the stages, not taken from a real model.</figcaption>
    </figure>
  );
}
