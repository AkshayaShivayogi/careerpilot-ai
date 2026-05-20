import { User } from "../models/User.js";

/** Log activity without triggering full user validation (e.g. missing password on doc). */
export async function logActivity(user, type, message) {
  const entry = { type, message, at: new Date() };
  const activities = [{ ...entry }, ...(user.recentActivities || [])].slice(0, 25);

  await User.updateOne(
    { _id: user._id },
    { $set: { recentActivities: activities, lastActive: new Date() } }
  );

  user.recentActivities = activities;
  user.lastActive = new Date();
}
