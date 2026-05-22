import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import { getErrorMessage } from "../utils/httpError.js";
import { ButtonLoading } from "../components/Loader.jsx";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const linkInvalid = !token || !email;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email: email.trim().toLowerCase(),
        password,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Password updated. Sign in with your new password." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not reset password"));
    } finally {
      setLoading(false);
    }
  }

  if (linkInvalid) {
    return (
      <div>
        <h2 className="font-display text-2xl font-bold">Invalid reset link</h2>
        <p className="mt-2 text-sm text-slate-400">
          This link is missing or expired. Request a new password reset.
        </p>
        <Link to="/forgot-password" className="btn-glow mt-6 inline-block">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Reset password</h2>
      <p className="mt-1 text-sm text-slate-400">Choose a new password for {email}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400">New password (8+ chars)</span>
          <input
            className="input-field mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">Confirm password</span>
          <input
            className="input-field mt-1"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-glow w-full" disabled={loading} aria-busy={loading}>
          {loading ? <ButtonLoading>Updating password…</ButtonLoading> : "Update password"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to="/login" className="text-electric-400 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
