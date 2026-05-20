import {
  getCoreTechnologies,
  getMasterTechnologies,
  resolveTechnologyName,
} from "../data/technologyCatalog.js";
import { isGeminiEnabled } from "../services/geminiService.js";
import { sendOk } from "../utils/apiResponse.js";

export async function getTechnologies(_req, res) {
  sendOk(res, {
    technologies: getMasterTechnologies(),
    coreTechnologies: getCoreTechnologies(),
    geminiEnabled: isGeminiEnabled(),
    provider: "gemini",
  });
}

export async function resolveTech(req, res) {
  const name = resolveTechnologyName(req.query.name || req.params.name);
  sendOk(res, { technology: name });
}
