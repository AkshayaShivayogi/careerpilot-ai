import { q } from "./utils.js";

function pickDiff(i) {
  const levels = ["Beginner", "Intermediate", "Advanced"];
  return levels[i % 3];
}

export function createConceptBank(technology, concepts) {
  const questions = [];

  concepts.forEach((c, idx) => {
    const diffTheory = pickDiff(idx);
    const diffPractical = pickDiff(idx + 1);

    questions.push(
      q(technology, {
        category: "Fundamentals",
        difficulty: diffTheory,
        type: "theory",
        topic: c.name,
        question: `(${technology}) Explain ${c.name} as you would in a ${diffTheory.toLowerCase()} developer interview.`,
        answer: c.beginner || c.answer,
        explanation: c.explanation || c.beginner,
        whyItMatters: c.why,
        realWorldExample: c.example,
        commonMistake: c.mistake,
        interviewTip: c.tip,
      })
    );

    if (c.intermediate) {
      questions.push(
        q(technology, {
          category: "Conceptual",
          difficulty: "Intermediate",
          type: "theory",
          topic: c.name,
          question: `(${technology}) How does ${c.name} impact scalability and maintainability in production systems?`,
          answer: c.intermediate,
          explanation: c.intermediate,
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.advanced) {
      questions.push(
        q(technology, {
          category: "Deep Dive",
          difficulty: "Advanced",
          type: "theory",
          topic: c.name,
          question: `(${technology}) Advanced interview: trade-offs, pitfalls, and alternatives when using ${c.name}.`,
          answer: c.advanced,
          explanation: c.advanced,
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.mcq) {
      questions.push(
        q(technology, {
          category: "FAQ",
          difficulty: c.mcq.difficulty || "Intermediate",
          type: "mcq",
          topic: c.name,
          question: c.mcq.question,
          options: c.mcq.options,
          answer: c.mcq.answer,
          explanation: c.mcq.explanation,
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.scenario) {
      questions.push(
        q(technology, {
          category: "Scenario",
          difficulty: c.scenario.difficulty || diffPractical,
          type: "scenario",
          topic: c.name,
          question: c.scenario.question,
          answer: c.scenario.answer,
          explanation: c.scenario.explanation,
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.coding) {
      questions.push(
        q(technology, {
          category: "Coding Challenge",
          difficulty: c.coding.difficulty || "Intermediate",
          type: "coding",
          topic: c.name,
          question: c.coding.question,
          answer: c.coding.answer,
          explanation: c.coding.explanation,
          codeSnippet: c.coding.code || "",
          timeComplexity: c.coding.time || "",
          spaceComplexity: c.coding.space || "",
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.output) {
      questions.push(
        q(technology, {
          category: "Output Prediction",
          difficulty: c.output.difficulty || "Intermediate",
          type: "output",
          topic: c.name,
          question: c.output.question,
          options: c.output.options,
          answer: c.output.answer,
          explanation: c.output.explanation,
          codeSnippet: c.output.code || "",
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.debug) {
      questions.push(
        q(technology, {
          category: "Debugging",
          difficulty: c.debug.difficulty || "Advanced",
          type: "debugging",
          topic: c.name,
          question: c.debug.question,
          options: c.debug.options,
          answer: c.debug.answer,
          explanation: c.debug.explanation,
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    if (c.bestPractice) {
      questions.push(
        q(technology, {
          category: "Best Practices",
          difficulty: "Intermediate",
          type: "best_practices",
          topic: c.name,
          question: c.bestPractice.question,
          answer: c.bestPractice.answer,
          explanation: c.bestPractice.explanation,
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }

    const practicalAnswer = c.intermediate || c.beginner || c.advanced || "";
    const pitfalls = c.mistake || `Treating ${c.name} as a buzzword without concrete examples.`;

    questions.push(
      q(technology, {
        category: "Problem Solving",
        difficulty: diffPractical,
        type: "scenario",
        topic: c.name,
        question: `(${technology}) You must ship a feature relying on ${c.name} in two weeks. How do you de-risk design, implementation, and rollout?`,
        answer: practicalAnswer,
        explanation: `Break work into spikes, define acceptance tests for ${c.name}, instrument metrics, and plan a feature flag rollback.`,
        whyItMatters: c.why,
        realWorldExample: c.example,
        commonMistake: pitfalls,
        interviewTip: c.tip,
      }),
      q(technology, {
        category: "Tricky",
        difficulty: "Advanced",
        type: "theory",
        topic: c.name,
        question: `(${technology}) Tricky interview: what subtle bugs or misconceptions about ${c.name} fool even experienced developers?`,
        answer: pitfalls,
        explanation: c.advanced || practicalAnswer,
        whyItMatters: c.why,
        realWorldExample: c.example,
        commonMistake: pitfalls,
        interviewTip: "State one misconception, then how you verified the correct mental model.",
      }),
      q(technology, {
        category: "FAQ",
        difficulty: "Intermediate",
        type: "theory",
        topic: c.name,
        question: `(${technology}) Frequently asked: when should you NOT use ${c.name}?`,
        answer: c.advanced || `Skip ${c.name} when a simpler approach meets requirements with lower operational cost.`,
        explanation: practicalAnswer,
        whyItMatters: c.why,
        realWorldExample: c.example,
        commonMistake: pitfalls,
        interviewTip: c.tip,
      }),
      q(technology, {
        category: "Optimization",
        difficulty: "Advanced",
        type: "theory",
        topic: c.name,
        question: `(${technology}) How would you optimize systems where ${c.name} is on the critical path?`,
        answer: c.advanced || practicalAnswer,
        explanation: `Profile first, reduce allocations/round-trips, cache safely, and validate with benchmarks tied to ${c.name}.`,
        whyItMatters: c.why,
        realWorldExample: c.example,
        commonMistake: "Optimizing before measuring.",
        interviewTip: "Mention metrics: latency p95, error rate, throughput.",
      })
    );

    if (c.coding?.code) {
      questions.push(
        q(technology, {
          category: "Code Analysis",
          difficulty: "Intermediate",
          type: "code_analysis",
          topic: c.name,
          question: `(${technology}) Analyze this snippet related to ${c.name}. What does it do and what could go wrong?\n${c.coding.code}`,
          answer: c.coding.answer,
          explanation: c.coding.explanation,
          codeSnippet: c.coding.code,
          timeComplexity: c.coding.time || "",
          spaceComplexity: c.coding.space || "",
          whyItMatters: c.why,
          realWorldExample: c.example,
          commonMistake: c.mistake,
          interviewTip: c.tip,
        })
      );
    }
  });

  return questions;
}
