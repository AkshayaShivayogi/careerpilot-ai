import { useCallback, useEffect, useState } from "react";
import api from "../api/axios.js";
import { parseApiBody } from "../utils/parseApi.js";
import {
  CORE_TECHNOLOGIES_FALLBACK,
  MASTER_TECHNOLOGIES_FALLBACK,
  resolveTechnologyName,
} from "../data/technologyCatalog.js";

/**
 * Loads technology list from API with client fallback.
 * @param {{ coreOnly?: boolean }} options — coreOnly=true for interview/planner primary dropdown
 */
export function useTechnologyCatalog({ coreOnly = false } = {}) {
  const [technologies, setTechnologies] = useState(() =>
    coreOnly ? CORE_TECHNOLOGIES_FALLBACK : MASTER_TECHNOLOGIES_FALLBACK
  );
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const fallback = coreOnly ? CORE_TECHNOLOGIES_FALLBACK : MASTER_TECHNOLOGIES_FALLBACK;
    setLoading(true);
    setError("");
    try {
      const [catalogRes, interviewRes, aiRes] = await Promise.allSettled([
        api.get("/catalog/technologies"),
        api.get("/interview/technologies"),
        api.get("/ai/status"),
      ]);

      let list = [...fallback];

      if (catalogRes.status === "fulfilled") {
        const parsed = parseApiBody(catalogRes.value.data);
        const core = parsed.coreTechnologies;
        const master = parsed.technologies;
        if (coreOnly && core?.length) list = core;
        else if (master?.length) list = master;
        else if (core?.length) list = core;
      }

      if (interviewRes.status === "fulfilled") {
        const parsed = parseApiBody(interviewRes.value.data);
        const core = parsed.coreTechnologies;
        const merged = parsed.technologies || parsed.streams;
        if (coreOnly && core?.length) {
          list = core;
        } else if (merged?.length) {
          list = [...new Set([...list, ...merged])];
        }
      }

      setTechnologies([...new Set(list)].sort());

      if (aiRes.status === "fulfilled") {
        const p = parseApiBody(aiRes.value.data);
        setGeminiEnabled(Boolean(p.geminiEnabled ?? p.configured));
      } else if (interviewRes.status === "fulfilled") {
        const p = parseApiBody(interviewRes.value.data);
        setGeminiEnabled(Boolean(p.geminiEnabled));
      }
    } catch (e) {
      setError(e.message || "Could not load technologies");
      setTechnologies(fallback);
    } finally {
      setLoading(false);
    }
  }, [coreOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { technologies, geminiEnabled, loading, error, refresh, resolveTechnologyName };
}
