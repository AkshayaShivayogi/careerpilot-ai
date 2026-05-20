import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = fileURLToPath(new URL("../server/services/interviewQuestionFactory/concepts", import.meta.url));

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".js")) continue;
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  s = s.replace(/\.\)" \},/g, '." },');
  if (s !== before) {
    fs.writeFileSync(p, s);
    console.log("fixed", f);
  }
}
