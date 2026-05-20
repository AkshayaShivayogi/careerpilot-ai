import "dotenv/config";
import mongoose from "mongoose";
import {
  CORE_TECHNOLOGIES,
  ensureTechnologyQuestions,
  countForTechnology,
} from "../services/questionSeed.js";
import { CONTENT_VERSION } from "../services/interviewQuestionFactory/index.js";
import { InterviewQuestion } from "../models/InterviewQuestion.js";

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing — skip DB verify");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Upgrading interview bank to content v${CONTENT_VERSION}…`);
  for (const tech of CORE_TECHNOLOGIES) {
    await ensureTechnologyQuestions(tech);
    const count = await countForTechnology(tech);
    const v2 = await InterviewQuestion.countDocuments({
      technology: new RegExp(`^${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      contentVersion: CONTENT_VERSION,
    });
    console.log(`${tech}: ${count} total, ${v2} v${CONTENT_VERSION}`);
    if (count < 100) {
      console.error(`FAIL: ${tech} has only ${count} questions`);
      process.exit(1);
    }
  }
  console.log("AI INTERVIEW ENGINE FULLY OPERATIONAL");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
