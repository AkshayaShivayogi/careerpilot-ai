export const CONTENT_VERSION = 3;
export const POINTS = { easy: 5, medium: 10, hard: 20 };
export const EXPECTED_TIME = { easy: 90, medium: 150, hard: 210 };

export const CATEGORIES = [
  "Fundamentals",
  "Conceptual",
  "Scenario",
  "Problem Solving",
  "Debugging",
  "Output Prediction",
  "Code Analysis",
  "Best Practices",
  "Optimization",
  "Coding Challenge",
  "Tricky",
  "FAQ",
  "Deep Dive",
];

export function mapDifficulty(level) {
  const k = String(level || "").toLowerCase();
  if (k.startsWith("begin") || k === "easy") return "easy";
  if (k.startsWith("adv") || k === "hard") return "hard";
  return "medium";
}

export function hashQuestion(text) {
  const s = String(text).trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, "0").repeat(3).slice(0, 24);
}

export function q(technology, spec) {
  const difficulty = mapDifficulty(spec.difficulty || "Intermediate");
  const question = String(spec.question || "").trim();
  return {
    stream: technology,
    technology,
    contentVersion: CONTENT_VERSION,
    category: spec.category || "Fundamentals",
    type: spec.type || "theory",
    topic: spec.topic || spec.category || "general",
    companyRelevance: spec.companyRelevance || "Product companies, startups, internships",
    difficulty,
    question,
    questionHash: hashQuestion(`${technology}::${question}`),
    options: spec.options || [],
    correctAnswer: spec.answer || spec.correctAnswer || "",
    explanation: spec.explanation || "",
    whyItMatters: spec.whyItMatters || spec.why || "",
    realWorldExample: spec.realWorldExample || spec.example || "",
    commonMistake: spec.commonMistake || spec.mistake || "",
    interviewTip: spec.interviewTip || spec.tip || "",
    codeSnippet: spec.codeSnippet || spec.code || "",
    timeComplexity: spec.timeComplexity || "",
    spaceComplexity: spec.spaceComplexity || "",
    expectedTime: spec.expectedTime || EXPECTED_TIME[difficulty],
    tags: spec.tags || [technology.toLowerCase(), spec.category, difficulty],
    points: spec.points || POINTS[difficulty],
  };
}

export function dedupeQuestions(questions) {
  const seen = new Set();
  const out = [];
  for (const item of questions) {
    const h = item.questionHash || hashQuestion(item.question);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push({ ...item, questionHash: h });
  }
  return out;
}

export function numberQuestions(questions) {
  return questions.map((item, i) => ({ ...item, questionNumber: i + 1 }));
}
