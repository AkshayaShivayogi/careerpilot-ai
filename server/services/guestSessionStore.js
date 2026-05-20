import crypto from "crypto";

const TTL_MS = 24 * 60 * 60 * 1000;
const store = new Map();

function prune() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.updatedAt > TTL_MS) store.delete(id);
  }
}

export function createGuestInterviewSession(payload) {
  prune();
  const id = `guest-${crypto.randomUUID()}`;
  const session = {
    ...payload,
    id,
    _id: id,
    isGuest: true,
    createdAt: new Date(),
    updatedAt: Date.now(),
  };
  store.set(id, session);
  console.log("[guest-session] created", id, payload.technology);
  return session;
}

export function getGuestInterviewSession(id) {
  prune();
  const entry = store.get(String(id));
  if (!entry) return null;
  entry.updatedAt = Date.now();
  return entry;
}

export function saveGuestInterviewSession(session) {
  if (!session?.id) return null;
  session.updatedAt = Date.now();
  store.set(String(session.id), session);
  return session;
}

export function isGuestSessionId(id) {
  return String(id || "").startsWith("guest-");
}
