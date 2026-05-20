import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "TypeScript";

export const typescriptConcepts = buildTechConcepts(T, [
  {
    name: "structural typing",
    beginner: "TS compares shape of types, not nominal names.",
    intermediate: "Excess property checks on object literals.",
    advanced: "Duck typing enables flexible APIs but surprises with optional fields.",
    mcq: builders.mcq(T, "types", "interface vs type alias — common difference?", ["types can't union", "interfaces merge declarations", "interfaces are slower"], "interfaces merge declarations", "Both mostly interchangeable."),
  },
  {
    name: "generics",
    beginner: "Type parameters like function<T> reuse logic with type safety.",
    intermediate: "Constraints extends T; keyof T for safe property access.",
    advanced: "Conditional types and infer for library typings.",
    coding: builders.coding(T, "Type a generic pick<T,K> — explain.", "type Pick<T,K extends keyof T> = { [P in K]: T[P] }", "Mapped types.", "", "—", "—"),
  },
  {
    name: "union and intersection types",
    beginner: "A | B is either; A & B combines.",
    intermediate: "Discriminated unions with kind/tag for narrowing.",
    advanced: "Exhaustive switch with never check.",
    scenario: builders.scenario(T, "unions", "API returns error or data union — handle?", "Narrow on success flag or status field before accessing data.", "Type guards."),
  },
  {
    name: "type narrowing",
    beginner: "typeof, instanceof, in checks refine types in branches.",
    intermediate: "User-defined type predicates isFoo(x): x is Foo.",
    advanced: "Control flow analysis across assignments.",
    debug: builders.debug(T, "narrow", "Property does not exist on type union.", ["Narrow before access", "Use any everywhere", "Disable strict"], "Narrow before access", "Enable strictNullChecks."),
  },
  {
    name: "utility types Partial Pick Omit",
    beginner: "Partial<T> all optional; Pick/Omit select keys.",
    intermediate: "Record<K,V> for maps; ReturnType for inference.",
    advanced: "Readonly and deep readonly patterns.",
    why: "Daily TS patterns.",
  },
  {
    name: "strict mode and tsconfig",
    beginner: "strict enables null checks, implicit any off, etc.",
    intermediate: "strictNullChecks catches undefined access.",
    advanced: "Project references for monorepos.",
    bestPractice: { question: "First tsconfig change for legacy JS codebase?", answer: "allowJs + incremental strict flags gradually.", explanation: "Avoid big-bang migration." },
  },
  {
    name: "TypeScript with React",
    beginner: "Props interfaces; React.FC optional; children typing.",
    intermediate: "ComponentProps<typeof Button> reuse.",
    advanced: "Generic components with constraints.",
    coding: builders.coding(T, "Type a useSelect<T> hook return.", "Return selected T | null, handlers typed.", "Generics + union.", "", "—", "—"),
  },
  {
    name: "enums vs const objects",
    beginner: "enum creates runtime object; const enum inlined.",
    intermediate: "Prefer as const objects + union types for tree-shaking.",
    advanced: "const enum breaks across package boundaries sometimes.",
    why: "Bundle size debates.",
  },
  {
    name: "declaration files and DefinitelyTyped",
    beginner: ".d.ts describes JS libraries without implementation.",
    intermediate: "@types/* packages from DefinitelyTyped.",
    advanced: "declare module for untyped packages.",
    scenario: builders.scenario(T, "types", "Cannot find module 'legacy-lib'.", "Create ambient module declaration or contribute @types.", "shims last resort."),
  },
  {
    name: "async typing",
    beginner: "Promise<T> return types on async functions.",
    intermediate: "Awaited<T> utility unwraps promises.",
    advanced: "Avoid floating promises — eslint @typescript-eslint/no-floating-promises.",
    why: "Backend/frontend async code.",
  },
  {
    name: "never and unknown",
    beginner: "unknown safer than any — must narrow before use.",
    intermediate: "never for impossible branches exhaustiveness.",
    advanced: "unknown in catch blocks TS 4.4+.",
    mcq: builders.mcq(T, "safety", "Prefer any or unknown for external JSON?", ["any", "unknown", "object"], "unknown", "Force validation/narrowing."),
  },
  {
    name: "performance and compile time",
    beginner: "Project references split compile graph.",
    intermediate: "Avoid huge union types slowing checker.",
    advanced: "Use skipLibCheck carefully in monorepos.",
    scenario: builders.scenario(T, "build", "CI tsc takes 10 minutes.", "Project references, incremental, isolate apps.", "Measure with --extendedDiagnostics."),
  },
]);
