import { InterviewSession } from "../models/InterviewSession.js";
import {
  createGuestInterviewSession,
  getGuestInterviewSession,
  saveGuestInterviewSession,
  isGuestSessionId,
} from "./guestSessionStore.js";
import { sessionToClient } from "./interviewSessionUtils.js";

export { isGuestSessionId };

export async function createInterviewSessionRecord(userId, payload) {
  if (userId) {
    const doc = await InterviewSession.create({ userId, ...payload });
    console.log("[interview] MongoDB session", doc._id.toString());
    return doc;
  }
  return createGuestInterviewSession(payload);
}

export async function loadInterviewSession(sessionId, userId) {
  const id = String(sessionId);
  if (isGuestSessionId(id)) {
    return getGuestInterviewSession(id);
  }
  const guest = getGuestInterviewSession(id);
  if (guest) return guest;
  if (userId) {
    const doc = await InterviewSession.findOne({ _id: id, userId });
    if (doc) return doc;
  }
  try {
    return await InterviewSession.findById(id);
  } catch {
    return null;
  }
}

export async function persistInterviewSession(session) {
  if (!session) return null;
  if (session.isGuest || isGuestSessionId(session.id || session._id)) {
    return saveGuestInterviewSession(session);
  }
  if (typeof session.markModified === "function") {
    await session.save();
    return session;
  }
  return session;
}

export function toClientSession(doc) {
  return sessionToClient(doc);
}
