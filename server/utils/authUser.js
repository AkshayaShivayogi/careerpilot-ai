/** Safe user payload for auth responses (never includes password). */
export function toAuthUser(doc) {
  const u = typeof doc.toObject === "function" ? doc.toObject({ virtuals: true }) : { ...doc };
  delete u.password;

  const profilePicture = u.profilePicture || u.profileImage || "";
  const createdAt = u.createdAt || u.created_at;

  return {
    id: String(u._id || u.id),
    _id: String(u._id || u.id),
    fullName: u.fullName,
    email: u.email,
    profilePicture,
    profileImage: profilePicture,
    role: u.role || "user",
    createdAt,
  };
}
