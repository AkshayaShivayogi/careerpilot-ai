import { InterviewQuestion } from "../models/InterviewQuestion.js";
import {
  generateQuestionsByTechnology,
  resolveFactoryTechnology,
  listFactoryTechnologies,
  CONTENT_VERSION,
} from "./interviewQuestionFactory/index.js";

const POINTS = { easy: 5, medium: 10, hard: 20 };
const EXPECTED_TIME = { easy: 60, medium: 120, hard: 180 };

/** Primary technologies shown in UI + seeded with 100+ questions each */
export const CORE_TECHNOLOGIES = [
  "Java",
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
  "SQL",
  "DSA",
  "PHP",
  "OOPs",
  "Operating Systems",
  "DBMS",
  "Computer Networks",
  "cybersecurity",
  "Spring Boot",
];

export const TECHNOLOGIES = [
  ...CORE_TECHNOLOGIES,
  "HTML",
  "CSS",
  "TypeScript",
  "Express",
  "Express.js",
  "C",
  "C++",
  "Next.js",
  "Redux",
  "Express.js",
  "Django",
  "Flask",
  "MySQL",
  "PostgreSQL",
  "Redis",
  "AWS",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "C",
  "C++",
  "System Design",
  "MERN",
  "MEAN",
  "PERN",
  "DevOps",
  "AI/ML",
];

/** Resolve user selection → DB stream names */
export const TECH_ALIASES = {
  java: ["Java", "Core Java", "Advanced Java"],
  python: ["Python", "Python Full Stack"],
  javascript: ["JavaScript", "JS"],
  react: ["React", "frontend"],
  "node.js": ["Node.js", "Nodejs", "backend"],
  mongodb: ["MongoDB", "mern"],
  sql: ["SQL", "MySQL", "PostgreSQL"],
  dsa: ["DSA", "data structures"],
  oops: ["OOPs", "OOP", "OOPS"],
  "operating systems": ["Operating Systems", "OS"],
  dbms: ["DBMS", "database"],
  "computer networks": ["Computer Networks", "CN", "networking"],
  cybersecurity: ["cybersecurity", "security"],
  "spring boot": ["Spring Boot", "SpringBoot"],
  php: ["PHP"],
  express: ["Express", "Express.js", "Node.js"],
  html: ["HTML"],
  css: ["CSS"],
  c: ["C"],
  "c++": ["C++"],
  typescript: ["TypeScript", "JavaScript"],
  "machine learning": ["Machine Learning", "ML", "AI/ML"],
  "ai/ml": ["AI/ML", "Machine Learning", "AI"],
  "mern stack": ["MERN Stack", "MERN", "MongoDB", "React"],
  "express.js": ["Express.js", "Node.js"],
  "system design": ["System Design"],
  "data science": ["Data Science", "Machine Learning"],
  go: ["Go", "Golang"],
  rust: ["Rust"],
  kubernetes: ["Kubernetes", "K8s", "DevOps"],
  docker: ["Docker", "DevOps"],
  aws: ["AWS", "Cloud"],
  azure: ["Azure", "Cloud"],
  "next.js": ["Next.js", "React"],
  typescript: ["TypeScript", "JavaScript"],
};

const TOPICS = [
  "fundamentals",
  "syntax",
  "data structures",
  "algorithms",
  "architecture",
  "security",
  "performance",
  "testing",
  "deployment",
  "best practices",
  "design patterns",
  "APIs",
  "databases",
  "networking",
  "concurrency",
  "optimization",
  "debugging",
  "output prediction",
  "real-world scenarios",
  "memory management",
];

const COMPANIES = ["FAANG", "product startups", "enterprise IT", "fintech", "consulting"];

function pickCompany(i) {
  return COMPANIES[i % COMPANIES.length];
}

function baseFields(stream, topic, difficulty, i, type, question, options, correctAnswer, explanation, tags) {
  return {
    stream,
    technology: stream,
    type,
    difficulty,
    topic,
    category: topic.replace(/\b\w/g, (c) => c.toUpperCase()),
    companyRelevance: pickCompany(i),
    question,
    options: options || [],
    correctAnswer,
    explanation,
    whyItMatters: `${topic} is frequently tested in ${stream} interviews at ${pickCompany(i)}.`,
    realWorldExample: `Production ${stream} teams apply ${topic} during incidents, releases, and design reviews.`,
    commonMistake: `Hand-waving ${topic} without metrics, trade-offs, or a concrete ${stream} example.`,
    interviewTip: `Structure answers: context → approach → example → result for ${topic}.`,
    codeSnippet: type === "coding" || type === "output" ? `// ${stream}: ${topic} sample\n` : "",
    timeComplexity: type === "coding" ? "O(n) typical; state yours" : "",
    spaceComplexity: type === "coding" ? "O(1)–O(n) depending on approach" : "",
    expectedTime: EXPECTED_TIME[difficulty] || 120,
    tags: tags || [topic, stream.toLowerCase(), difficulty],
    points: POINTS[difficulty],
  };
}

function mcqTemplate(stream, topic, difficulty, i) {
  const correct = `Apply ${topic} with validated patterns and monitoring`;
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "mcq",
    `[${stream}] (${difficulty}) Which approach best handles ${topic} in production?`,
    [`Ignore ${topic}`, correct, `Use globals only`, `Skip testing`],
    correct,
    `Strong ${stream} engineers prioritize ${topic} with clear trade-offs, tests, and observability.`,
    [topic, stream.toLowerCase(), "mcq"]
  );
}

function theoryTemplate(stream, topic, difficulty, i) {
  const ans = `Define ${topic}, explain trade-offs, and give a ${stream} example.`;
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "theory",
    `[${stream}] (${difficulty}) Explain ${topic} and its role in ${stream} systems.`,
    [],
    ans,
    `Use definition → use case → example → pitfalls for ${topic}.`,
    [topic, "theory"]
  );
}

function codingTemplate(stream, topic, difficulty, i) {
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "coding",
    `[${stream}] (${difficulty}) Solve ${topic} problem #${i}: state approach and complexity.`,
    [],
    `Optimal solution with edge cases covered for ${topic}.`,
    `Discuss brute force → optimal → complexity → test cases.`,
    [topic, "coding"]
  );
}

function debuggingTemplate(stream, topic, difficulty, i) {
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "debugging",
    `[${stream}] (${difficulty}) Debug: ${topic} fails under load. First step?`,
    ["Restart blindly", "Check logs, metrics, repro, recent deploys", "Disable feature", "Ignore errors"],
    "Check logs, metrics, repro, recent deploys",
    `Systematic debugging: reproduce → logs → isolate → fix → regression test.`,
    [topic, "debugging"]
  );
}

function outputTemplate(stream, topic, difficulty, i) {
  const correct = "Trace execution step-by-step for the given snippet";
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "output",
    `[${stream}] (${difficulty}) Predict output for code involving ${topic} (variant ${i}).`,
    ["undefined", correct, "null", "always throws"],
    correct,
    `Consider hoisting, closures, async order, and type coercion in ${stream}.`,
    [topic, "output"]
  );
}

function scenarioTemplate(stream, topic, difficulty, i) {
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "scenario",
    `[${stream}] (${difficulty}) Scenario: scale ${topic} for 10x traffic.`,
    [],
    `Caching, DB tuning, async workers, monitoring, rollback plan for ${topic}.`,
    `Tests system design thinking for ${stream} interviews.`,
    [topic, "scenario"]
  );
}

function hrTemplate(stream, topic, difficulty, i) {
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "hr",
    `[${stream}] (${difficulty}) Tell me about a time you used ${topic} under pressure.`,
    [],
    `STAR format: Situation, Task, Action, Result with measurable impact.`,
    `Highlight collaboration, ownership, and learning from the ${topic} experience.`,
    [topic, "hr", "behavioral"]
  );
}

function systemDesignTemplate(stream, topic, difficulty, i) {
  return baseFields(
    stream,
    topic,
    difficulty,
    i,
    "system_design",
    `[${stream}] (${difficulty}) Design a system component handling ${topic} at scale.`,
    [],
    `Requirements, API design, data model, scaling, failure modes, and monitoring for ${topic}.`,
    `Cover trade-offs, CAP, caching, and sharding where relevant.`,
    [topic, "system_design"]
  );
}

export function generateForStream(stream) {
  const out = [];
  let n = 0;
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const topic of TOPICS) {
      for (let i = 1; i <= 2; i += 1) {
        out.push(mcqTemplate(stream, topic, difficulty, ++n));
        out.push(theoryTemplate(stream, topic, difficulty, ++n));
        out.push(debuggingTemplate(stream, topic, difficulty, ++n));
        out.push(outputTemplate(stream, topic, difficulty, ++n));
        out.push(codingTemplate(stream, topic, difficulty, ++n));
        out.push(scenarioTemplate(stream, topic, difficulty, ++n));
        out.push(hrTemplate(stream, topic, difficulty, ++n));
        out.push(systemDesignTemplate(stream, topic, difficulty, ++n));
      }
    }
  }
  return out;
}

export function resolveStreamNames(technology) {
  const key = String(technology || "").trim().toLowerCase();
  const aliases = TECH_ALIASES[key] || [technology];
  return [...new Set([technology, ...aliases].filter(Boolean))];
}

function streamRegex(name) {
  return new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

export async function countForTechnology(technology) {
  const names = resolveStreamNames(technology);
  return InterviewQuestion.countDocuments({
    $or: names.flatMap((n) => [{ stream: streamRegex(n) }, { technology: streamRegex(n) }]),
  });
}

function canonicalTechQuery(technology) {
  const stream = String(technology || "").trim();
  return {
    $or: [{ technology: streamRegex(stream) }, { stream: streamRegex(stream) }],
  };
}

async function countV2ForTechnology(technology) {
  return InterviewQuestion.countDocuments({
    ...canonicalTechQuery(technology),
    contentVersion: CONTENT_VERSION,
  });
}

async function deleteLegacyForTechnology(technology) {
  const result = await InterviewQuestion.deleteMany({
    $and: [
      canonicalTechQuery(technology),
      {
        $or: [{ contentVersion: { $ne: CONTENT_VERSION } }, { contentVersion: { $exists: false } }],
      },
    ],
  });
  return result.deletedCount || 0;
}

async function deleteAllForTechnology(technology) {
  const result = await InterviewQuestion.deleteMany(canonicalTechQuery(technology));
  return result.deletedCount || 0;
}

async function insertQuestionBatch(batch) {
  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    try {
      const res = await InterviewQuestion.insertMany(batch.slice(i, i + CHUNK), {
        ordered: false,
      });
      inserted += res.length;
    } catch (err) {
      if (err?.code !== 11000 && !err?.writeErrors?.every((e) => e.code === 11000)) {
        throw err;
      }
      inserted += err.insertedDocs?.length || 0;
    }
  }
  return inserted;
}

export async function ensureTechnologyQuestions(technology) {
  const stream = String(technology || "").trim();
  if (!stream) return 0;

  const canonical = resolveFactoryTechnology(stream) || stream;
  const factoryTechs = listFactoryTechnologies();
  const useFactory = factoryTechs.includes(canonical);
  const v2Count = useFactory ? await countV2ForTechnology(stream) : 0;
  const total = await countForTechnology(stream);

  if (useFactory && v2Count >= 100) return total;

  if (useFactory && v2Count < 100) {
    console.log(`[seed] Upgrading ${canonical} question bank to v${CONTENT_VERSION}…`);
    if (total > 0 && v2Count === 0) {
      await deleteAllForTechnology(technology);
    } else {
      await deleteLegacyForTechnology(technology);
    }
    const batch = generateQuestionsByTechnology(canonical);
    if (batch.length < 100) {
      console.warn(`[seed] Factory produced only ${batch.length} for ${stream}`);
    }
    await insertQuestionBatch(batch);
    const after = await countForTechnology(stream);
    console.log(`[seed] ${stream} now has ${after} questions (${await countV2ForTechnology(stream)} v${CONTENT_VERSION})`);
    return after;
  }

  if (total >= 100) return total;

  console.log(`[seed] Seeding ${stream} (${total} found, need 100+)…`);
  const batch = useFactory
    ? generateQuestionsByTechnology(canonical)
    : generateQuestionsByTechnology(canonical).length
      ? generateQuestionsByTechnology(canonical)
      : generateForStream(stream);
  await insertQuestionBatch(batch);
  const after = await countForTechnology(stream);
  console.log(`[seed] ${stream} now has ${after} questions`);
  return after;
}

export async function seedInterviewQuestions() {
  let total = await InterviewQuestion.countDocuments();

  for (const tech of CORE_TECHNOLOGIES) {
    await ensureTechnologyQuestions(tech);
  }

  for (const tech of TECHNOLOGIES) {
    if (!CORE_TECHNOLOGIES.includes(tech)) {
      await ensureTechnologyQuestions(tech);
    }
  }

  total = await InterviewQuestion.countDocuments();
  console.log(`[seed] Interview bank ready: ${total} total questions`);
  return total;
}
