/** Build rich unique concept objects from technology-specific topic specs */
export function buildTechConcepts(technology, specs) {
  return specs.map((s) => ({
    name: s.name,
    beginner: s.beginner,
    intermediate: s.intermediate,
    advanced: s.advanced,
    why: s.why || `Critical for ${technology} roles in product companies.`,
    example: s.example || `Used in production ${technology} systems at scale.`,
    mistake: s.mistake || `Confusing ${s.name} with unrelated concepts during interviews.`,
    tip: s.tip || `Relate ${s.name} to a project you shipped with ${technology}.`,
    mcq: s.mcq,
    scenario: s.scenario,
    coding: s.coding,
    output: s.output,
    debug: s.debug,
    bestPractice: s.bestPractice,
  }));
}

function mcq(technology, name, question, options, answer, explanation) {
  return { question: `(${technology}) ${question}`, options, answer, explanation };
}

function scenario(technology, name, question, answer, explanation) {
  return { question: `(${technology}) ${question}`, answer, explanation };
}

function coding(technology, question, answer, explanation, code, time, space) {
  return { question: `(${technology}) ${question}`, answer, explanation, code, time, space };
}

function output(technology, question, code, options, answer, explanation) {
  return { question: `(${technology}) ${question}`, code, options, answer, explanation };
}

function debug(technology, question, options, answer, explanation) {
  return { question: `(${technology}) ${question}`, options, answer, explanation };
}

export const builders = { mcq, scenario, coding, output, debug };

export function spec(name, core, extras = {}) {
  return { name, ...core, ...extras };
}
