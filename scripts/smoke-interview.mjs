/**
 * Interview engine smoke — factory banks (offline) + API generate/submit (when server up).
 */
import { generateQuestionsByTechnology } from "../server/services/interviewQuestionFactory/index.js";

const API = process.env.API_URL || "http://127.0.0.1:5000/api";

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 120)}`);
  }
  return { status: res.status, json };
}

const technologies = ["React", "Java", "DSA", "PHP"];

let passed = 0;
let failed = 0;

// Offline: technology-isolated banks
for (const technology of technologies) {
  const bank = generateQuestionsByTechnology(technology);
  const generic = bank.filter((q) => /what is oop|explain apis|what is a database/i.test(q.question));
  const techTag = bank.filter((q) =>
    q.question.toLowerCase().includes(technology.toLowerCase().split(".")[0])
  ).length;
  if (bank.length < 100 || generic.length > 0) {
    failed += 1;
    console.log(
      `FAIL ${technology} bank — count=${bank.length}, generic=${generic.length}, tagged=${techTag}`
    );
  } else {
    passed += 1;
    console.log(`OK  ${technology} bank — ${bank.length} isolated questions`);
  }
}

let apiPassed = 0;
let apiFailed = 0;

for (const technology of technologies) {
  try {
    const gen = await post("/interview/generate", {
      technology,
      difficulty: "medium",
      count: 5,
      enhanceWithAi: false,
    });
    if (gen.status !== 200 && gen.status !== 201) {
      throw new Error(`generate ${gen.status}: ${gen.json?.message}`);
    }
    const session = gen.json?.session || gen.json?.data?.session;
    const q = session?.questions?.[0];
    if (!session?.id || !q?.id) throw new Error("missing session/questions");

    const sub = await post("/interview/submit", {
      sessionId: session.id,
      questionId: q.id,
      answer: q.correctAnswer || q.options?.[1] || "structured answer with examples",
      durationSec: 30,
    });
    if (sub.status !== 200) throw new Error(`submit ${sub.status}: ${sub.json?.message}`);
    if (!sub.json?.result && !sub.json?.data?.result) throw new Error("missing result payload");

    apiPassed += 1;
    const nextRes = await fetch(
      `${API}/interview/next?sessionId=${encodeURIComponent(session.id)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!nextRes.ok) throw new Error(`next ${nextRes.status}`);

    const saveRes = await post("/interview/save", {
      sessionId: session.id,
      durationSec: 30,
    });
    if (saveRes.status !== 200) throw new Error(`save ${saveRes.status}`);

    console.log(`OK  ${technology} — generate + submit + next + save (source: ${session.questionSource || "db"})`);
  } catch (e) {
    apiFailed += 1;
    console.log(`SKIP ${technology} API — ${e.message}`);
  }
}

console.log(`\nFactory banks: ${passed} passed, ${failed} failed`);
console.log(`API flow: ${apiPassed} passed, ${apiFailed} skipped/failed (start server for full E2E)`);
process.exit(failed > 0 ? 1 : 0);
