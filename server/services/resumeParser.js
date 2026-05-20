/** Extract structured fields from raw resume text */
export function parseResumeSections(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const lower = normalized.toLowerCase();
  const lines = normalized.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const emailMatch = normalized.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = normalized.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{3,4}/);
  const githubMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const linkedinMatch = normalized.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);

  let name = "";
  const firstLines = lines.slice(0, 4);
  for (const line of firstLines) {
    if (line.length < 50 && !/@/.test(line) && !/http/i.test(line) && !/^\d/.test(line)) {
      if (/^[A-Za-z][A-Za-z\s.'-]{2,40}$/.test(line)) {
        name = line;
        break;
      }
    }
  }

  const sectionText = (headers) => {
    const pattern = new RegExp(`(${headers.join("|")})\\s*[:\\n]`, "i");
    const idx = normalized.search(pattern);
    if (idx === -1) return [];
    const rest = normalized.slice(idx);
    const nextHeader = rest.slice(1).search(/\n\s*(education|experience|skills|projects|certifications|summary|profile)\s*[:]?/i);
    const chunk = nextHeader > 0 ? rest.slice(0, nextHeader + 1) : rest.slice(0, 2500);
    return chunk
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && !headers.some((h) => l.toLowerCase() === h.toLowerCase()))
      .slice(0, 12);
  };

  const education = sectionText(["education", "academic", "qualification"]);
  const experience = sectionText(["experience", "work experience", "employment", "professional experience"]);
  const projects = sectionText(["projects", "personal projects", "academic projects"]);
  const certifications = sectionText(["certifications", "certificates", "licenses"]);

  const hasEducation = education.length > 0 || /education|b\.?tech|bachelor|master|university|degree/i.test(lower);
  const hasExperience = experience.length > 0 || /experience|internship|worked at|employed/i.test(lower);
  const hasProjects = projects.length > 0 || /project|built|developed|implemented/i.test(lower);
  const hasCertifications = certifications.length > 0 || /certified|certification|aws certified/i.test(lower);

  return {
    name,
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0]?.trim() || "",
    github: githubMatch?.[0] || "",
    linkedin: linkedinMatch?.[0] || "",
    education,
    experience,
    projects,
    certifications,
    hasEducation,
    hasExperience,
    hasProjects,
    hasCertifications,
    rawTextLength: normalized.length,
  };
}
