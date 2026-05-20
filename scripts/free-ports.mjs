/**
 * Frees dev ports before starting CareerPilot (Windows-friendly).
 * Usage: node scripts/free-ports.mjs [port ...]
 */
import { execSync } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devPortFile = path.join(rootDir, "server", ".dev-port");

try {
  fs.unlinkSync(devPortFile);
  console.log("[free-ports] Cleared server/.dev-port");
} catch {
  /* not present */
}

const DEFAULT_PORTS = [5000, 5001, 5173, 5174];
const ports = process.argv.slice(2).map(Number).filter(Boolean);
const targets = ports.length ? ports : DEFAULT_PORTS;

function freePortWin(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
    const pids = new Set();
    for (const line of out.split("\n")) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[free-ports] Killed PID ${pid} on port ${port}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

function freePortUnix(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split("\n")) {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      console.log(`[free-ports] Killed PID ${pid} on port ${port}`);
    }
  } catch {
    /* nothing listening */
  }
}

const free = process.platform === "win32" ? freePortWin : freePortUnix;

for (const port of targets) {
  free(port);
}

console.log(`[free-ports] Checked ports: ${targets.join(", ")}`);
