import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../src/pages/Planner.jsx");
let s = fs.readFileSync(file, "utf8");

// Fix common bad closing tags: </motion.div> where it should be </motion.div> (html div)
// Only fix lines that esbuild flagged - replace </motion.div> with </div> globally except after motion.div opener from framer

// Safe approach: replace all </motion.div> with </div> then fix motion.div framer closers back
s = s.replace(/<\/motion\.motion\.motion\.motion\.div>/g, "</div>"); // noop safety
s = s.replace(/<\/motion\.div>/g, "</motion.div>");

// Framer motion.div components need </motion.div> - lines that open with <motion.div (with props animate/initial/layout/key)
s = s.replace(
  /<motion\.div(\s+(?:key|initial|animate|exit|layout|transition)[\s\S]*?)>([\s\S]*?)<\/motion\.div>/g,
  "<motion.div$1>$2</motion.div>"
);

fs.writeFileSync(file, s);
console.log("fixed", file);
