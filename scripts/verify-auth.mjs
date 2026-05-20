/**
 * End-to-end auth verification against real MongoDB.
 * Usage: node scripts/verify-auth.mjs [baseUrl]
 */
const base = (process.argv[2] || "http://127.0.0.1:5000").replace(/\/$/, "");
const email = `verify_${Date.now()}@careerpilot.test`;
const password = "TestPass123!";
const fullName = "Verify User";

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

console.log("[verify] API:", base);
console.log("[verify] email:", email);

const health = await req("/api/health");
if (!health.data?.database?.connected) {
  console.error("[verify] FAIL — MongoDB not connected", health.data);
  process.exit(1);
}
console.log("[verify] MongoDB connected:", health.data.database.name);

const signup = await req("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ fullName, email, password }),
});
if (signup.status !== 201 || !signup.data.success || !signup.data.token) {
  console.error("[verify] FAIL signup", signup.status, signup.data);
  process.exit(1);
}
console.log("[verify] signup OK — user id:", signup.data.user?.id);

const token = signup.data.token;
const me1 = await req("/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
if (me1.status !== 200 || !me1.data.success) {
  console.error("[verify] FAIL /me after signup", me1.status, me1.data);
  process.exit(1);
}
console.log("[verify] GET /me OK —", me1.data.user.email);

const login = await req("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
if (login.status !== 200 || !login.data.success) {
  console.error("[verify] FAIL login", login.status, login.data);
  process.exit(1);
}
console.log("[verify] login OK");

const bad = await req("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password: "wrongpassword" }),
});
if (bad.status !== 401) {
  console.error("[verify] FAIL — expected 401 for bad password", bad.status);
  process.exit(1);
}
console.log("[verify] invalid password rejected OK");

const dup = await req("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ fullName, email, password }),
});
if (dup.status !== 409) {
  console.error("[verify] FAIL — expected 409 duplicate email", dup.status, dup.data);
  process.exit(1);
}
console.log("[verify] duplicate email rejected OK");

console.log("\n[verify] ALL AUTH CHECKS PASSED");
console.log("[verify] Confirm in MongoDB Compass: database careerpilot → users →", email);
