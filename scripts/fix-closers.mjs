import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bad = "</" + "motion.div>";
const good = "</motion.div>".replace("motion.", "");

for (const rel of ["src/pages/Trending.jsx", "src/pages/Planner.jsx"]) {
  const file = path.join(__dirname, "..", rel);
  let s = fs.readFileSync(file, "utf8");
  const n = s.split(bad).length - 1;
  s = s.split(bad).join(good);
  fs.writeFileSync(file, s);
  console.log(rel, "replaced", n);
}
