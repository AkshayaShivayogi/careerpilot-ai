/**
 * Smoke test — API health + key routes return non-5xx or expected auth codes.
 */
const API = process.env.API_URL || "http://127.0.0.1:5000/api";

const routes = [
  { path: "/health", expect: [200] },
  { path: "/planner/status", expect: [200] },
  { path: "/interview/technologies", expect: [200] },
  { path: "/trending", expect: [200, 401] },
  { path: "/dashboard", expect: [401] },
  { path: "/saved", expect: [401] },
  { path: "/dsa", expect: [401] },
  { path: "/guidance", expect: [401, 200] },
];

let passed = 0;
let failed = 0;

for (const { path, expect } of routes) {
  try {
    const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(8000) });
    const ok = expect.includes(res.status);
    if (ok) {
      passed += 1;
      console.log(`OK  ${path} → ${res.status}`);
    } else {
      failed += 1;
      console.log(`FAIL ${path} → ${res.status} (expected ${expect.join("|")})`);
    }
  } catch (e) {
    failed += 1;
    console.log(`FAIL ${path} → ${e.message}`);
  }
}

console.log(`\nSmoke: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
