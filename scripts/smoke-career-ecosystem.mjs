/**
 * Career ecosystem smoke — roadmap uniqueness, DSA catalog, local engines.
 */
import { buildTechnologyRoadmap, getRoadmapDefinition } from "../server/data/technologyRoadmapCatalog.js";
import { DSA_TOPIC_CATALOG } from "../server/data/dsaTopics.js";
import { ACHIEVEMENT_DEFINITIONS } from "../server/data/achievementDefinitions.js";

let failed = 0;

const react = getRoadmapDefinition("React");
const java = getRoadmapDefinition("Java");
const dsa = getRoadmapDefinition("DSA");

if (react.phases.length < 4) {
  console.log("FAIL React phases < 4");
  failed++;
} else {
  console.log("OK  React 4-phase roadmap");
}

const reactMods = react.phases.flatMap((p) => p.modules).join(" ");
if (!/hook|jsx|useEffect/i.test(reactMods) || /JVM|aggregation/i.test(reactMods)) {
  console.log("FAIL React modules not unique");
  failed++;
} else {
  console.log("OK  React unique modules");
}

const javaMods = java.phases.flatMap((p) => p.modules).join(" ");
if (!/Spring|JVM|multithread/i.test(javaMods)) {
  console.log("FAIL Java modules");
  failed++;
} else {
  console.log("OK  Java unique modules");
}

if (DSA_TOPIC_CATALOG.length < 19) {
  console.log(`FAIL DSA topics ${DSA_TOPIC_CATALOG.length}`);
  failed++;
} else {
  console.log(`OK  DSA ${DSA_TOPIC_CATALOG.length} topics`);
}

if (ACHIEVEMENT_DEFINITIONS.length < 15) {
  console.log("FAIL achievements count");
  failed++;
} else {
  console.log(`OK  ${ACHIEVEMENT_DEFINITIONS.length} achievements with tiers`);
}

console.log(failed ? `\nCareer smoke: ${failed} failed` : "\nCareer smoke: all passed");
process.exit(failed > 0 ? 1 : 0);
