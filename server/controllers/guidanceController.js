import { buildCareerGuidance } from "../services/guidanceService.js";
import { calcProfileCompletion } from "../utils/profileCompletion.js";

export async function getGuidance(req, res) {
  const user = req.user.toPublicJSON();
  user.profileCompletion = calcProfileCompletion(req.user);
  res.json({ guidance: buildCareerGuidance(user) });
}
