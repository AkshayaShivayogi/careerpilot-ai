/**
 * Multi-user auth verification — signup, login, duplicate rejection, JWT /me.
 */
const API = process.env.API_URL || "http://127.0.0.1:5000/api";

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const stamp = Date.now();
const users = [
  { fullName: "Akshaya Test", email: `akshaya+${stamp}@test.com`, password: "TestPass123!" },
  { fullName: "Shiva Test", email: `shiva+${stamp}@test.com`, password: "TestPass456!" },
];

let passed = 0;
let failed = 0;

function ok(msg) {
  passed += 1;
  console.log(`OK  ${msg}`);
}
function fail(msg) {
  failed += 1;
  console.log(`FAIL ${msg}`);
}

for (const u of users) {
  const signup = await request("POST", "/auth/signup", u);
  if (signup.status !== 201 || !signup.json?.user?.email) {
    fail(`signup ${u.email} → ${signup.status} ${signup.json?.message || ""}`);
    continue;
  }
  if (signup.json.user.email !== u.email) {
    fail(`signup email mismatch ${signup.json.user.email} vs ${u.email}`);
    continue;
  }
  ok(`signup ${u.email} id=${signup.json.user._id || signup.json.user.id || "?"}`);

  const dup = await request("POST", "/auth/signup", u);
  if (dup.status !== 409) fail(`duplicate ${u.email} expected 409 got ${dup.status}`);
  else ok(`duplicate rejected ${u.email}`);

  const bad = await request("POST", "/auth/login", { email: u.email, password: "wrong-password" });
  if (bad.status !== 401) fail(`wrong password ${u.email} expected 401`);
  else ok(`wrong password rejected ${u.email}`);

  const login = await request("POST", "/auth/login", { email: u.email, password: u.password });
  if (login.status !== 200 || !login.json?.token) {
    fail(`login ${u.email} → ${login.status}`);
    continue;
  }
  ok(`login ${u.email}`);

  const me = await request("GET", "/auth/me", null, login.json.accessToken || login.json.token);
  if (me.status !== 200 || me.json?.user?.email !== u.email) {
    fail(`/me ${u.email} mismatch`);
  } else {
    ok(`/me returns ${u.email}`);
  }
}

console.log(`\nAuth verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
