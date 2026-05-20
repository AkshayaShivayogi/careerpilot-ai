import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../utils/httpError.js";
import { resolveMediaUrl } from "../utils/mediaUrl.js";
import { useToast } from "../context/ToastContext.jsx";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function Profile() {
  const { fetchMe, user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: "",
    college: "",
    branch: "",
    graduationYear: "",
    github: "",
    linkedin: "",
    portfolio: "",
    targetRole: "",
    experienceLevel: "beginner",
    skills: "",
    bio: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  function applyUser(u) {
    if (!u) return;
    setCompletion(u.profileCompletion ?? 0);
    setForm({
      fullName: u.fullName || "",
      college: u.college || "",
      branch: u.branch || "",
      graduationYear: u.graduationYear || "",
      github: u.github || "",
      linkedin: u.linkedin || "",
      portfolio: u.portfolio || "",
      targetRole: u.targetRole || "",
      experienceLevel: u.experienceLevel || "beginner",
      skills: (u.skills || []).join(", "),
      bio: u.bio || "",
    });
    if (u.profilePhoto) setPreviewUrl(resolveMediaUrl(u.profilePhoto));
  }

  async function load() {
    if (user) applyUser(user);
    try {
      const { data } = await api.get("/profile");
      const u = data?.user ?? data;
      if (u?.email) applyUser(u);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load profile"));
    }
  }

  useEffect(() => {
    load();
  }, [user?.email]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.put("/auth/profile", {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await fetchMe();
      load();
      setMessage("Profile saved to MongoDB");
    } catch (err) {
      setError(getErrorMessage(err, "Save failed"));
    } finally {
      setLoading(false);
    }
  }

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Allowed formats: JPG, PNG, JPEG, WEBP (max 2MB)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    setMessage("");

    const fd = new FormData();
    fd.append("photo", file);
    try {
      await api.post("/profile/avatar", fd);
      await fetchMe();
      load();
      toast.success("Profile photo updated successfully");
      setMessage("Profile photo updated successfully");
    } catch (err) {
      const msg = getErrorMessage(err, "Upload failed");
      toast.error(msg);
      setError(msg);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setError("");
    try {
      await api.delete("/profile/avatar");
      setPreviewUrl(null);
      await fetchMe();
      setMessage("Profile photo removed");
    } catch (err) {
      setError(getErrorMessage(err, "Remove failed"));
    } finally {
      setUploading(false);
    }
  }

  const avatarUrl = previewUrl || resolveMediaUrl(user?.profileImage || user?.profilePicture);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass-card flex flex-wrap items-center gap-6 p-6">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-electric-500/40 bg-navy-800">
          {uploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-900/80">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-electric-500 border-t-transparent" />
            </div>
          )}
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-slate-500">
              {form.fullName?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Profile</h1>
          <p className="text-sm text-slate-400">Completion: {completion}%</p>
          <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-navy-800">
            <div
              className="h-full bg-gradient-to-r from-electric-500 to-cyan-400 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="btn-ghost inline-block cursor-pointer text-sm">
              {uploading ? "Uploading…" : "Upload photo"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={onAvatar}
              />
            </label>
            {avatarUrl && (
              <button type="button" className="btn-ghost text-sm text-red-300" disabled={uploading} onClick={removeAvatar}>
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={save} className="glass-card grid gap-4 p-6 sm:grid-cols-2">
        {[
          ["fullName", "Full name"],
          ["college", "College"],
          ["branch", "Branch"],
          ["graduationYear", "Graduation year"],
          ["targetRole", "Target role"],
          ["portfolio", "Portfolio URL"],
          ["github", "GitHub"],
          ["linkedin", "LinkedIn"],
        ].map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-sm text-slate-400">{label}</span>
            <input className="input-field mt-1" value={form[key]} onChange={(e) => update(key, e.target.value)} />
          </label>
        ))}
        <label className="block">
          <span className="text-sm text-slate-400">Experience level</span>
          <select className="input-field mt-1" value={form.experienceLevel} onChange={(e) => update("experienceLevel", e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-slate-400">Skills (comma-separated)</span>
          <input className="input-field mt-1" value={form.skills} onChange={(e) => update("skills", e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-slate-400">Bio</span>
          <textarea className="input-field mt-1 min-h-[100px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} />
        </label>
        {message && <p className="text-sm text-emerald-400 sm:col-span-2">{message}</p>}
        {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
        <button type="submit" className="btn-glow sm:col-span-2" disabled={loading}>
          {loading ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
