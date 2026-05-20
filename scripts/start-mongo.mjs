/**
 * Ensure MongoDB is listening on 127.0.0.1:27017 before starting the API.
 * Tries: existing service, then mongod.exe from common Windows install paths.
 */
import net from "node:net";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = "127.0.0.1";
const port = 27017;
const dataDir = path.join(__dirname, "..", ".mongo-data");

function probe() {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    s.setTimeout(2000);
    s.once("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.once("error", () => resolve(false));
    s.once("timeout", () => resolve(false));
  });
}

function findMongod() {
  const roots = [
    "C:\\Program Files\\MongoDB\\Server",
    "C:\\Program Files\\MongoDB",
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const ver of fs.readdirSync(root)) {
      const exe = path.join(root, ver, "bin", "mongod.exe");
      if (fs.existsSync(exe)) return exe;
    }
  }
  return null;
}

if (await probe()) {
  console.log(`[mongo] Already running on ${host}:${port}`);
  process.exit(0);
}

const mongod = findMongod();
if (!mongod) {
  console.error(`
[mongo] MongoDB is not running and mongod.exe was not found.

Install MongoDB Community (Windows):
  winget install MongoDB.Server

Or start Docker:
  docker compose up -d

Then connect Compass to: mongodb://127.0.0.1:27017/careerpilot
`);
  process.exit(1);
}

fs.mkdirSync(dataDir, { recursive: true });
console.log("[mongo] Starting mongod:", mongod);
console.log("[mongo] Data directory:", dataDir);

const child = spawn(mongod, ["--dbpath", dataDir, "--bind_ip", "127.0.0.1", "--port", String(port)], {
  detached: true,
  stdio: "ignore",
  windowsHide: true,
});
child.unref();

for (let i = 0; i < 30; i += 1) {
  await new Promise((r) => setTimeout(r, 1000));
  if (await probe()) {
    console.log(`[mongo] Ready on ${host}:${port}`);
    process.exit(0);
  }
}

console.error("[mongo] mongod started but port 27017 did not become ready in 30s");
process.exit(1);
