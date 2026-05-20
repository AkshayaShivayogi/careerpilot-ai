import { q, dedupeQuestions } from "./utils.js";

const MIN_BANK_SIZE = 100;

/** Industry-style supplements — always scoped to technology + existing topic */
const TEMPLATES = [
  (tech, topic) => ({
    category: "Production",
    type: "scenario",
    difficulty: "Advanced",
    question: `(${tech}) On-call: ${topic} is implicated in a p95 latency regression after a deploy. How do you triage and mitigate?`,
    answer: `Rollback or feature-flag; compare metrics pre/post deploy; inspect logs/traces for ${topic}; reproduce in staging; root-cause and add guardrails.`,
    explanation: `Structured incident response: mitigate first, then diagnose ${topic} with evidence.`,
  }),
  (tech, topic) => ({
    category: "System Design",
    type: "system_design",
    difficulty: "Advanced",
    question: `(${tech}) Design a multi-tenant SaaS feature where ${topic} must scale to 10M daily active users.`,
    answer: `Partition data; cache hot paths; async workers; idempotent APIs; observability on ${topic} SLOs; capacity plan and load test.`,
    explanation: `Cover data model, bottlenecks around ${topic}, failure modes, and cost trade-offs.`,
  }),
  (tech, topic) => ({
    category: "Security",
    type: "scenario",
    difficulty: "Intermediate",
    question: `(${tech}) Security review: what abuse cases exist if ${topic} is misconfigured?`,
    answer: `Threat-model authz, injection, secrets exposure, rate limits; least privilege; audit logging for ${topic} changes.`,
    explanation: `Interviewers expect concrete threats tied to ${topic}, not generic OWASP lists only.`,
  }),
  (tech, topic) => ({
    category: "Optimization",
    type: "optimization",
    difficulty: "Advanced",
    question: `(${tech}) Profiling shows ${topic} on the hot path. What is your optimization playbook?`,
    answer: `Baseline metrics; profile CPU/IO; reduce round-trips; cache with TTL/invalidation; batch work; verify with benchmarks.`,
    explanation: `Measure before optimizing; tie wins to ${topic} and business metrics.`,
  }),
  (tech, topic) => ({
    category: "Debugging",
    type: "debugging",
    difficulty: "Intermediate",
    question: `(${tech}) Intermittent bug only in production related to ${topic}. How do you debug without full repro?`,
    answer: `Structured logs, correlation IDs, sampling traces, feature flags, compare canary vs stable, postmortem hypotheses.`,
    explanation: `Production debugging discipline for ${topic}-related flakes.`,
  }),
  (tech, topic) => ({
    category: "Behavioral",
    type: "hr",
    difficulty: "Intermediate",
    question: `(${tech}) Tell me about a project where ${topic} was critical to delivery. What was your role?`,
    answer: `STAR format: situation, task, actions on ${topic}, measurable result, retrospective learnings.`,
    explanation: `Behavioral answers should still demonstrate ${tech} depth on ${topic}.`,
  }),
  (tech, topic) => ({
    category: "Coding Challenge",
    type: "coding",
    difficulty: "Intermediate",
    question: `(${tech}) Implement or extend a module for ${topic} with clear interfaces and tests.`,
    answer: `Define API contract, handle edge cases for ${topic}, unit tests, error handling, documentation.`,
    explanation: `Live coding around ${topic} should show clean ${tech} idioms.`,
  }),
  (tech, topic) => ({
    category: "Deployment",
    type: "scenario",
    difficulty: "Intermediate",
    question: `(${tech}) A deployment failed rollback because of ${topic}. How do you make the next release safer?`,
    answer: `Canary, automated smoke tests, migration compatibility, observability alerts on ${topic}, documented rollback runbook.`,
    explanation: `Release engineering tied to ${topic}.`,
  }),
  (tech, topic) => ({
    category: "Code Review",
    type: "code_analysis",
    difficulty: "Intermediate",
    question: `(${tech}) In code review, a teammate's change to ${topic} increases complexity. What feedback do you give?`,
    answer: `Ask for tests, naming, separation of concerns, performance impact, docs; suggest simpler design if YAGNI.`,
    explanation: `Senior signal: constructive review on ${topic}.`,
  }),
  (tech, topic) => ({
    category: "Migration",
    type: "scenario",
    difficulty: "Advanced",
    question: `(${tech}) Migrate legacy usage of ${topic} to a modern approach with zero downtime.`,
    answer: `Dual-write/dual-read, feature flags, backfill job, validate parity, cutover, deprecate old path.`,
    explanation: `Expand-contract pattern for ${topic}.`,
  }),
  (tech, topic) => ({
    category: "Testing",
    type: "theory",
    difficulty: "Intermediate",
    question: `(${tech}) How do you test behavior involving ${topic} at unit, integration, and e2e layers?`,
    answer: `Unit pure logic; integration with real ${tech} deps or testcontainers; e2e critical paths; contract tests.`,
    explanation: `Test pyramid applied to ${topic}.`,
  }),
  (tech, topic) => ({
    category: "Architecture",
    type: "system_design",
    difficulty: "Advanced",
    question: `(${tech}) Microservices boundary: should ${topic} live in its own service? Justify.`,
    answer: `Cohesion, team ownership, scaling profile, data consistency needs; avoid premature split.`,
    explanation: `Bounded context reasoning for ${topic}.`,
  }),
];

/**
 * Pad isolated technology banks to MIN_BANK_SIZE using topic-derived supplements (never generic OOP/API).
 */
export function expandBankToMinimum(technology, questions, min = MIN_BANK_SIZE) {
  if (!Array.isArray(questions) || questions.length >= min) return questions;

  const topics = [
    ...new Set(
      questions
        .map((item) => item.topic)
        .filter((t) => t && String(t).toLowerCase() !== "general")
    ),
  ];
  if (!topics.length) topics.push(`${technology} platform fundamentals`);

  const extras = [];
  let i = 0;
  while (questions.length + extras.length < min) {
    const topic = topics[i % topics.length];
    const tpl = TEMPLATES[i % TEMPLATES.length];
    extras.push(q(technology, { ...tpl(technology, topic), topic }));
    i += 1;
  }

  return dedupeQuestions([...questions, ...extras]);
}

export { MIN_BANK_SIZE };
