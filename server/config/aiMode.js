import { isGeminiEnabled } from "../services/geminiService.js";

/**
 * Static-first: core app uses local/DB fallbacks.
 * Set GEMINI_ENHANCE=true in server/.env to allow Gemini upgrades (optional).
 */
export function isGeminiEnhanceEnabled() {
  return isGeminiEnabled() && process.env.GEMINI_ENHANCE === "true";
}

export function isStaticFirstMode() {
  return process.env.STATIC_FIRST !== "false";
}
