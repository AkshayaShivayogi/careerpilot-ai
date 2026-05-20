/**
 * Verify technology banks are isolated — React vs Java vs MongoDB must not share question text.
 */
import {
  generateQuestionsByTechnology,
} from "../server/services/interviewQuestionFactory/index.js";

const pairs = [
  ["React", "Java"],
  ["Node.js", "MongoDB"],
  ["React", "Node.js"],
  ["DSA", "Python"],
];

let failed = 0;

for (const [a, b] of pairs) {
  const bankA = generateQuestionsByTechnology(a);
  const bankB = generateQuestionsByTechnology(b);
  if (bankA.length < 100) {
    console.log(`FAIL ${a} — only ${bankA.length} questions (need 100+)`);
    failed += 1;
  }
  if (bankB.length < 100) {
    console.log(`FAIL ${b} — only ${bankB.length} questions (need 100+)`);
    failed += 1;
  }

  const textsA = new Set(bankA.map((q) => q.question.toLowerCase().slice(0, 80)));
  let overlap = 0;
  for (const q of bankB) {
    const key = q.question.toLowerCase().slice(0, 80);
    if (textsA.has(key)) overlap += 1;
  }

  const aHasTech = bankA.filter((q) => q.question.toLowerCase().includes(a.toLowerCase().split(".")[0])).length;
  const genericOop = bankA.filter((q) => /what is oop/i.test(q.question)).length;

  console.log(
    `${overlap === 0 ? "OK" : "WARN"} ${a} vs ${b}: overlap=${overlap}, ${a} tagged=${aHasTech}/${bankA.length}, generic OOP in ${a}=${genericOop}`
  );
  if (overlap > 2) failed += 1;
  if (genericOop > 0 && a !== "OOPs") failed += 1;
}

// Spot-check terminology
const react = generateQuestionsByTechnology("React");
const hasHook = react.some((q) => /hook|useEffect|jsx|reconcil/i.test(q.question));
const node = generateQuestionsByTechnology("Node.js");
const hasEventLoop = node.some((q) => /event loop|libuv|middleware/i.test(q.question));
const mongo = generateQuestionsByTechnology("MongoDB");
const hasAggregation = mongo.some((q) => /aggregat|bson|objectid/i.test(q.question));

console.log(`React-specific terms: ${hasHook ? "OK" : "FAIL"}`);
console.log(`Node-specific terms: ${hasEventLoop ? "OK" : "FAIL"}`);
console.log(`MongoDB-specific terms: ${hasAggregation ? "OK" : "FAIL"}`);
if (!hasHook || !hasEventLoop || !hasAggregation) failed += 1;

process.exit(failed > 0 ? 1 : 0);
