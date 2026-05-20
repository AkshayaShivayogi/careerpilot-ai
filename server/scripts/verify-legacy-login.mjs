/**
 * Legacy user login — plain-text password migration test.
 * Run: npm run verify:legacy-login --prefix server
 */
import mongoose from "mongoose";
import { User } from "../models/User.js";

const API = process.env.API_URL || "http://127.0.0.1:5000/api";
const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/careerpilot";

async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
  });
  return { status: res.status, json: await res.json() };
}

const stamp = Date.now();
const legacyEmail = `Legacy.Mixed+${stamp}@Test.COM`;
const legacyPassword = "LegacyPlainPass1!";

await mongoose.connect(MONGO);

await User.deleteMany({ email: { $regex: new RegExp(`legacy.mixed\\+${stamp}@test.com$`, "i") } });
await User.create({
  fullName: "Legacy Plain User",
  email: legacyEmail,
  password: legacyPassword,
  authProvider: "local",
});

const login1 = await apiLogin(legacyEmail.toLowerCase(), legacyPassword);
if (login1.status !== 200) {
  console.error("FAIL legacy login", login1.status, login1.json?.message);
  process.exit(1);
}

const doc = await User.findOne({ email: legacyEmail.toLowerCase() }).select("+password");
if (!doc?.password?.startsWith("$2")) {
  console.error("FAIL password was not migrated to bcrypt");
  process.exit(1);
}

const login2 = await apiLogin(legacyEmail.toLowerCase(), legacyPassword);
if (login2.status !== 200) {
  console.error("FAIL login after migration", login2.status, login2.json?.message);
  process.exit(1);
}

await User.deleteOne({ _id: doc._id });
await mongoose.disconnect();

console.log("OK  legacy plain-text + mixed-case email login, bcrypt migration, re-login");
process.exit(0);
