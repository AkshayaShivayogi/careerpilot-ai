const CACHE_KEY = "careerpilot_interview_session_v1";

export function cacheInterviewSession(session) {
  if (!session?.id && !session?._id) return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        session,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadCachedInterviewSession(maxAgeMs = 1000 * 60 * 60 * 12) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { session, savedAt } = JSON.parse(raw);
    if (!session || Date.now() - (savedAt || 0) > maxAgeMs) {
      clearCachedInterviewSession();
      return null;
    }
    if (session.status === "completed") return null;
    return session;
  } catch {
    return null;
  }
}

export function clearCachedInterviewSession() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
