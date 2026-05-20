/**
 * Verify resume analyzer (text engine + API + MongoDB persistence).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const base = (process.argv[2] || "http://127.0.0.1:5000").replace(/\/$/, "");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAMPLE_RESUME = `
John Doe
john.doe@email.com | +1 555 0100 | github.com/johndoe | linkedin.com/in/johndoe

SUMMARY
Full Stack Developer with experience building MERN applications.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, HTML, CSS, Git, REST API

EXPERIENCE
Software Engineer Intern — Tech Corp (2024)
- Built React dashboard used by 500+ users
- Developed Node.js REST APIs with Express and MongoDB
- Improved page load time by 35%

PROJECTS
Career Tracker MERN App — React, Node, Express, MongoDB, JWT authentication
E-commerce API — Python, Flask, PostgreSQL

EDUCATION
B.Tech Computer Science — State University (2022-2026)

CERTIFICATIONS
AWS Cloud Practitioner (in progress)
`;

async function req(urlPath, opts = {}) {
  const { headers: extra, ...rest } = opts;
  const res = await fetch(`${base}${urlPath}`, {
    ...rest,
    headers: { ...extra },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function testEngine() {
  process.chdir(path.join(__dirname, "../server"));
  const { analyzeResumeText } = await import("../server/services/resumeAnalyzer.js");
  const result = await analyzeResumeText(SAMPLE_RESUME, "mern stack developer");
  if (result.overallScore < 1 || !result.extractedSkills?.length) {
    throw new Error("Analyzer engine failed — no score or skills");
  }
  console.log("✅ Analyzer engine — score:", result.overallScore, "skills:", result.extractedSkills.length);
  return result;
}

async function testApi() {
  const email = `resume_${Date.now()}@test.com`;
  const password = "TestPass123!";

  const signup = await req("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName: "Resume Tester", email, password }),
  });
  if (!signup.data.token) throw new Error("Signup failed for resume test");
  const token = signup.data.token;
  console.log("✅ Auth token for resume test");

  const tmpPath = path.join(__dirname, "tmp-sample-resume.docx");
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const doc = new Document({
    sections: [
      {
        children: SAMPLE_RESUME.split("\n")
          .filter(Boolean)
          .map((line) => new Paragraph({ children: [new TextRun(line)] })),
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(tmpPath, buffer);

  const form = new FormData();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  form.append("resume", blob, "sample-resume.docx");
  form.append("targetRole", "mern stack developer");

  const analyze = await fetch(`${base}/api/resume/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const analyzeData = await analyze.json();
  if (!analyze.ok || !analyzeData.overallScore) {
    throw new Error("Analyze API failed: " + JSON.stringify(analyzeData).slice(0, 200));
  }
  console.log("✅ POST /api/resume/analyze — score:", analyzeData.overallScore);

  const id = analyzeData.analysis?.id || analyzeData.id;
  const history = await req("/api/resume/history", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!history.data.history?.length) throw new Error("History empty");
  console.log("✅ GET /api/resume/history — count:", history.data.history.length);

  const one = await req(`/api/resume/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (one.status !== 200) throw new Error("GET by id failed");
  console.log("✅ GET /api/resume/:id — persisted");

  await fs.unlink(tmpPath).catch(() => {});
  console.log("\n✅ Resume module verification complete");
}

console.log("\n=== Resume Analyzer Verification ===\n");
await testEngine();
try {
  await testApi();
} catch (e) {
  if (e.message?.includes("Cannot find package 'docx'")) {
    console.log("⚠ API test skipped — install docx in root for full API test: npm install docx");
    console.log("✅ Engine test passed (core analyzer works)");
  } else {
    throw e;
  }
}
