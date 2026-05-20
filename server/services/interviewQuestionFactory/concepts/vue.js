import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Vue";

export const vueConcepts = buildTechConcepts(T, [
  { name: "Composition API ref reactive", beginner: "ref for primitives; reactive for objects.", intermediate: "computed cached derived; watch side effects.", advanced: "script setup syntactic sugar.", mcq: builders.mcq(T, "vue", "Unwrap ref in script setup template?", [".value always", "auto-unwrapped in template", "never"], "auto-unwrapped in template", "Script still uses .value.") },
  { name: "Vue reactivity system", beginner: "Proxy-based tracking dependencies.", intermediate: "shallowRef for large objects.", advanced: "markRaw to opt-out reactivity.", scenario: builders.scenario(T, "reactivity", "Deep object mutation not updating UI.", "Use reactive or immutable patterns; check shallow.", "Vue 3 proxies.") },
  { name: "Vue Router", beginner: "routes array path component meta.", intermediate: "Navigation guards beforeEnter.", advanced: "Lazy routes () => import('./Page.vue').", coding: builders.coding(T, "Protect route requires auth?", "router.beforeEach check store; redirect login.", "meta fields.", "", "—", "—") },
  { name: "Pinia state management", beginner: "defineStore id state getters actions.", intermediate: "Setup stores with Composition API.", advanced: "Plugins persist to localStorage.", why: "Official store replacement Vuex." },
  { name: "components props emits", beginner: "defineProps defineEmits in script setup.", intermediate: "v-model is prop + update:event.", advanced: "Multiple v-models Vue 3.", debug: builders.debug(T, "props", "Prop mutation warning.", ["Emit event to parent", "Mutate prop directly", "Ignore"], "Emit event to parent", "One-way data flow.") },
  { name: "Vue lifecycle hooks", beginner: "onMounted fetch data.", intermediate: "onUnmounted cleanup listeners.", advanced: "KeepAlive activated/deactivated.", why: "Side effect timing." },
  { name: "directives v-if v-for", beginner: "v-if lazy; v-for needs :key.", intermediate: "v-memo performance micro-optimization.", advanced: "Custom directives mounted/updated.", scenario: builders.scenario(T, "lists", "List render glitch on update.", "Use stable unique keys not index.", "Reconciliation.") },
  { name: "Vue testing Vitest", beginner: "@vue/test-utils mount shallow.", intermediate: "Mock Pinia store.", advanced: "Component testing library style queries.", bestPractice: { question: "Test behavior not implementation?", answer: "Query by role/label; avoid testing internal state.", explanation: "RTL philosophy." } },
  { name: "SSR Nuxt", beginner: "Nuxt file-based routing auto imports.", intermediate: "useFetch server-friendly data.", advanced: "Hydration mismatch debugging.", coding: builders.coding(T, "Client-only chart in Nuxt?", "<ClientOnly> or dynamic import ssr:false.", "Window undefined on server.", "", "—", "—") },
  { name: "performance and bundle", beginner: "Async components defineAsyncComponent.", intermediate: "Tree-shaking ESM builds.", advanced: "Vapor mode future perf (awareness).", why: "Frontend leads." },
  { name: "Vue 2 vs 3 migration", beginner: "Composition API optional in 3.", intermediate: "Breaking filters $on removed.", advanced: "Migration build compat mode temporary.", scenario: builders.scenario(T, "migration", "Legacy plugin incompatible.", "Find Vue 3 fork or replace.", "Plan incremental.") },
  { name: "forms and validation", beginner: "v-model two-way binding.", intermediate: "VeeValidate/Zod schema.", advanced: "Accessible error messages aria.", why: "Product forms." },
]);
