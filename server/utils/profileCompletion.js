const FIELDS = [
  { key: "fullName", weight: 10 },
  { key: "email", weight: 5 },
  { key: "profileImage", weight: 15 },
  { key: "college", weight: 8 },
  { key: "branch", weight: 8 },
  { key: "graduationYear", weight: 5 },
  { key: "github", weight: 8 },
  { key: "linkedin", weight: 8 },
  { key: "portfolio", weight: 8 },
  { key: "targetRole", weight: 10 },
  { key: "experienceLevel", weight: 8 },
  { key: "skills", weight: 10, array: true },
  { key: "bio", weight: 7 },
];

export function calcProfileCompletion(user) {
  let score = 0;
  let max = 0;
  for (const f of FIELDS) {
    max += f.weight;
    const val = user[f.key];
    if (f.array) {
      if (Array.isArray(val) && val.length > 0) score += f.weight;
    } else if (val != null && String(val).trim() !== "") {
      score += f.weight;
    }
  }
  return Math.round((score / max) * 100);
}
