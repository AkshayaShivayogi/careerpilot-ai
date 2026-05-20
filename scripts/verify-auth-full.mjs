/**
 * Full auth verification against real MongoDB.
 */
const base = (process.argv[2] || "http://127.0.0.1:5000").replace(/\/$/, "");
const email = `verify_${Date.now()}@careerpilot.test`;
const password = "TestPass123!";
const fullName = "Verify User";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`✅ ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`❌ ${label}`, detail || "");
}

async function req(path, opts = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...extraHeaders },
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

console.log("\n=== CareerPilot Auth Verification ===\n");
console.log("API:", base);
console.log("Test email:", email, "\n");

const health = await req("/api/health");
if (!health.data?.database?.connected) {
  fail("MongoDB connected", health.data);
  process.exit(1);
}
ok(`MongoDB connected (${health.data.database.name})`);

const signup = await req("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ fullName, email, password }),
});
if (signup.status !== 201 || !signup.data.token || !signup.data.user) {
  fail("Signup", signup);
  process.exit(1);
}
ok("Signup creates user + returns token");
const token = signup.data.token;

const me1 = await req("/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
if (me1.status !== 200 || me1.data.user?.email !== email) {
  fail("GET /me after signup", me1);
} else {
  ok("GET /me restores session");
}

const profile = await req("/api/auth/profile", {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    college: "Test College",
    branch: "CSE",
    bio: "Auth verify bio",
    skills: ["React", "Node"],
    targetRole: "Full Stack",
  }),
});
if (profile.status !== 200 || profile.data.user?.college !== "Test College") {
  fail("PUT /auth/profile persists", profile);
} else {
  ok("Profile saves to MongoDB");
}

const me2 = await req("/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
if (me2.data.user?.bio !== "Auth verify bio") {
  fail("Profile persists after /me", me2.data.user);
} else {
  ok("Profile data survives refresh (/me)");
}

const login = await req("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
if (login.status !== 200 || !login.data.token) {
  fail("Login", login);
} else {
  ok("Login works");
}

const badPass = await req("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password: "wrong" }),
});
if (badPass.status !== 401) {
  fail("Invalid password rejected", badPass.status);
} else {
  ok("Invalid password returns 401");
}

const dup = await req("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ fullName, email, password }),
});
if (dup.status !== 409) {
  fail("Duplicate email rejected", dup);
} else {
  ok("Duplicate email returns 409");
}

const logout = await req("/api/auth/logout", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
if (logout.status !== 200) {
  fail("Logout", logout);
} else {
  ok("Logout works");
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
console.log("All auth checks passed. Verify in Compass: careerpilot → users →", email);
