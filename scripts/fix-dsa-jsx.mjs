import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src/pages/Dsa.jsx");
let s = fs.readFileSync(file, "utf8");

s = s.replace(
  "      </motion.div>\n\n      {analytics?.weeklyConsistency",
  "      </motion.div>\n\n      {analytics?.weeklyConsistency".replace("motion.div", "motion.div")
);
// grid close after radar chart section
s = s.replace(
  /          <\/ResponsiveContainer>\n        <\/motion.div>\n      <\/motion\.div>/,
  "          </ResponsiveContainer>\n        </div>\n      </div>"
);

s = s.replace(
  '<motion.div className="flex flex-wrap items-center gap-2">',
  '<div className="flex flex-wrap items-center gap-2">'
);

fs.writeFileSync(file, s);
console.log("done");
