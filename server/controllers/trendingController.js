import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateTrendingTechnologies, isGeminiEnabled } from "../services/geminiService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "trendingTechnologies.json");

function loadStatic() {
  const raw = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(raw);
}

function mapGeminiToCatalog(items) {
  const catalog = {};
  for (const t of items) {
    const key = (t.category || "programming").toLowerCase().replace(/\s+/g, "_");
    if (!catalog[key]) catalog[key] = [];
    catalog[key].push({
      name: t.name,
      demand: t.demand ?? 70,
      hiringTrend: t.hiringTrend || "High",
      growth: t.growth || "+10% YoY",
      salaryLabel: t.salaryLabel || "₹8–15 LPA",
      difficulty: t.difficulty || "Medium",
      recommendedSkills: t.recommendedSkills || [],
      geminiGenerated: true,
    });
  }
  return catalog;
}

export async function getTrending(req, res) {
  try {
    const { category, q } = req.query;
    const targetRole = req.user?.targetRole || "software engineer";

    let data = loadStatic();
    let geminiGenerated = false;

    if (isGeminiEnabled()) {
      const ai = await generateTrendingTechnologies(targetRole, req.user?._id);
      if (ai.ok && ai.data?.technologies?.length) {
        const merged = mapGeminiToCatalog(ai.data.technologies);
        data = { ...data, ...merged, _geminiInsights: ai.data.technologies.slice(0, 12) };
        geminiGenerated = true;
      }
    }

    if (category || q) {
      const result = {};
      for (const [key, items] of Object.entries(data)) {
        if (key.startsWith("_")) continue;
        if (category && category !== "all" && key !== category) continue;
        result[key] = items.filter((item) => {
          if (!q) return true;
          return item.name.toLowerCase().includes(String(q).toLowerCase());
        });
      }
      return res.json({ ...result, geminiGenerated, geminiEnabled: isGeminiEnabled() });
    }

    res.json({ ...data, geminiGenerated, geminiEnabled: isGeminiEnabled() });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load trending data" });
  }
}
