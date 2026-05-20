import { useCallback, useEffect, useState } from "react";
import api, { safeApi } from "../services/api.js";
import { safeProgressUpdate } from "../utils/careerSafe.js";

const LIVE_FALLBACK = {
  xp: 0,
  level: 1,
  productivityScore: 0,
  focusScore: 0,
  consistencyLevel: "Building",
  dsa: { mastery: 0, solvedCount: 0, streak: 0, heatmap: [] },
  roadmaps: [],
  achievements: { unlocked: 0, total: 0, recent: [] },
};

export function useLiveProgress(pollMs = 0) {
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await safeApi.get("/progress/live", {}, { fallback: { live: LIVE_FALLBACK } });
    const payload = safeProgressUpdate(result.data?.live ?? LIVE_FALLBACK);
    setLive(payload);
    setLoading(false);
    return payload;
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return undefined;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const notifyUpdate = useCallback(
    async (event) => {
      const result = await safeApi.post("/progress/update", event, {}, { fallback: { live: live || LIVE_FALLBACK } });
      if (result.data?.live) setLive(safeProgressUpdate(result.data.live));
      else await refresh();
      return result.data;
    },
    [live, refresh]
  );

  return { live, loading, refresh, notifyUpdate };
}

export async function fetchLiveProgress() {
  const result = await safeApi.get("/progress/live", {}, { fallback: { live: LIVE_FALLBACK } });
  return safeProgressUpdate(result.data?.live ?? LIVE_FALLBACK);
}

export async function pushProgressEvent(event) {
  return api.post("/progress/update", event).catch(() => null);
}
