import net from "node:net";

const host = "127.0.0.1";
const port = 27017;

function probe() {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    s.setTimeout(2000);
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
    s.once("timeout", () => resolve(false));
  });
}

if (await probe()) {
  console.log("[mongo] OK on", `${host}:${port}`);
  process.exit(0);
}

console.error(`
[mongo] MongoDB is not running on ${host}:${port}

Start MongoDB (pick one):
  npm run mongo:start     (if MongoDB Community is installed)
  docker compose up -d
  winget install MongoDB.Server   (then restart terminal)

Compass URI: mongodb://127.0.0.1:27017/careerpilot
`);
process.exit(1);
